import type { TRoutesTree, TGenerateRoutesConfig } from './types.js';
import { FileHelper, SerializeHelper } from './helpers/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';

let _config: TGenerateRoutesConfig | null = null;
const _configFileRouter = (config: TGenerateRoutesConfig) => {
  _config = config;
};

const _mapRoutes = async (
  dir: string,
  output: string,
  root: boolean = true,
) => {
  const routes: TRoutesTree = {};

  const baseDir = path.resolve(process.cwd(), dir);

  try {
    const directory = await fs.readdir(baseDir);

    if (!directory.length) {
      console.error(
        `Invalid pages structure: The folder "${baseDir}" must contain at least one valid file.`,
      );

      if (!!_config?.options?.exitCodeOnResolution) {
        process.exit(1);
      }
    }

    for (const subDirectory of directory) {
      const fullPath = path.join(baseDir, subDirectory);

      // Skip the processing with ignored files
      if (FileHelper.getIgnoredFiles(fullPath, output)) {
        continue;
      }

      // Get subDirectories info to control recursive paths with folders or build the object in file case
      const subDirectoryInfo = await fs.stat(fullPath);

      if (subDirectoryInfo.isDirectory()) {
        routes[subDirectory] = await _mapRoutes(fullPath, output, false);

        // If directory skip the current loop
        continue;
      }

      const key = path.basename(subDirectory, path.extname(subDirectory));

      const pathForBrowserSync = root ? '/' : `/${key}`;

      routes[key] = {
        path: pathForBrowserSync,
        import: `./${key}`,
      };
    }
  } catch (err) {
    console.error(`Error mapping routes ${baseDir}:`, err);

    // Stop the process immediatelly
    process.exit(1);
  }

  return routes;
};

const _serializer = async (dir: string, output: string) => {
  const exitCodeOnResolution = !!_config?.options?.exitCodeOnResolution;

  try {
    SerializeHelper.serializeOutputFile(
      await _mapRoutes(dir, output),
      path.resolve(dir, output),
    );

    // Promise writeFile was successfully resolved
    console.log('🚀 Routes generated successfully!\n');

    if (exitCodeOnResolution) {
      // Code 0 to finish the process as success
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Error generating routes:\n', err);

    if (exitCodeOnResolution) {
      // Code 1 to finish the process as error
      process.exit(1);
    }
  }
};

const _watcher = async (
  dir: string,
  output: string,
  active: boolean,
  debounce: number,
) => {
  if (!active) {
    return;
  }

  const { watch } = await import('chokidar');

  let timeoutId: NodeJS.Timeout | null;

  const watcher = watch(dir, {
    ignoreInitial: true,
    persistent: true,
  });

  console.log(`👀 Watching folder: "${dir}" for changes...`);

  const runFromWatcher = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(async () => {
      await _serializer(dir, output);
    }, debounce);
  };

  watcher.on('all', (ev, file) => {
    const ignoredOuput = FileHelper.getIgnoredOutputFile(file, output);

    // If output file as deleted regenerate it
    if (ignoredOuput && ev === 'unlink') {
      console.log(`🚨 ${output} was deleted, regenerating...`);

      runFromWatcher();

      return;
    }

    const watchOnEvents: (typeof ev)[] = [
      'add',
      'addDir',
      'unlink',
      'unlinkDir',
    ];

    const ignoredGeneralFiles = FileHelper.getIgnoredFiles(file, output);

    // If added, or change (renamed) or deleted, update routes
    if (watchOnEvents.includes(ev) && !ignoredGeneralFiles) {
      console.log(
        `🔎 Detected new files from path: "${file}" creating new routes...\n`,
      );

      runFromWatcher();
    }
  });

  const cleanup = async () => {
    console.log('🛑 Stopping watcher...');

    await watcher.close();
    // Code 0 to finish the process as success
    process.exit(0);
  };

  // If CRTL + C was pressed
  process.on('SIGINT', cleanup);
  // If Script or container treatment
  process.on('SIGTERM', cleanup);
};

export const generateFileRouter = (config: TGenerateRoutesConfig) => {
  _configFileRouter(config);

  if (!_config || !_config.dir) {
    throw Error('To generate file router you must define a valid config');
  }

  if (!_config.outputFilename) {
    _config.outputFilename = 'routes.ts';
  }

  _serializer(_config.dir, _config.outputFilename);

  _watcher(
    _config.dir,
    _config.outputFilename,
    !!_config.options?.watcher?.watch,
    _config.options?.watcher?.debounce ?? 500,
  );
};
