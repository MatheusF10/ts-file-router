import type { TGenerateRoutesConfig } from './types.js';
import { generateManifest, getManifestFilename } from './manifest.js';
import { FileHelper, SerializeHelper } from './helpers/index.js';
import type { TRouteEntry } from './helpers/serializeHelper.js';
import fs from 'node:fs/promises';
import path from 'node:path';

let _config: TGenerateRoutesConfig | null = null;

const _configFileRouter = (config: TGenerateRoutesConfig) => {
  _config = config;
};

const _mapRoutes = async (
  dir: string,
  output: string,
  config: TGenerateRoutesConfig,
  root?: string,
): Promise<TRouteEntry[]> => {
  const entries: TRouteEntry[] = [];
  const baseDir = path.resolve(process.cwd(), dir);
  // Imports must be relative to the generated routes file (the root dir)
  const rootDir = root ?? baseDir;
  const manifestFilename = config.options?.manifest
    ? getManifestFilename(config.options.manifest)
    : null;

  try {
    const directory = (await fs.readdir(baseDir, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    );

    for (const dirent of directory) {
      const fullPath = path.join(baseDir, dirent.name);

      if (
        FileHelper.getIgnoredFiles(fullPath, output) ||
        dirent.name === manifestFilename
      ) {
        continue;
      }

      if (dirent.isDirectory()) {
        const children = await _mapRoutes(fullPath, output, config, rootDir);

        if (children.length) {
          entries.push({ key: dirent.name, children });
        }
        continue;
      }

      const routeFileType = FileHelper.getRouteFileType(dirent.name);

      if (routeFileType) {
        entries.push({
          key: routeFileType === 'page' ? 'index' : '_layout',
          routePath: `/${path.relative(baseDir, fullPath)}`,
          importPath: `./${path.relative(rootDir, fullPath).split(path.sep).join('/')}`,
        });
      }
    }

    if (baseDir === rootDir && !entries.length) {
      console.error(
        `Invalid pages structure: The folder "${baseDir}" must contain at least one valid route file.`,
      );

      if (config.options?.exitCodeOnResolution) {
        process.exit(1);
      }
    }
  } catch (err) {
    console.error(`Error mapping routes ${baseDir}:`, err);

    // Stop the process immediatelly
    process.exit(1);
  }

  return entries;
};

const WATCH_EVENTS = new Set<string>(['add', 'addDir', 'unlink', 'unlinkDir']);

const _serializer = async (dir: string, output: string) => {
  const exitCodeOnResolution = !!_config?.options?.exitCodeOnResolution;
  try {
    await SerializeHelper.serializeOutputFile(
      await _mapRoutes(dir, output, _config!),
      path.resolve(dir, output),
    );

    const manifest = _config?.options?.manifest;

    if (manifest) {
      await generateManifest(dir, output, manifest);
    }

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

  const manifestRoot = _config?.options?.manifest?.root;

  const watcher = watch(manifestRoot ? [dir, manifestRoot] : dir, {
    ignoreInitial: true,
    persistent: true,
    ignored: /(^|[\\/])(node_modules|\.git|dist)([\\/]|$)/,
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
    const ignoredGeneralFiles =
      FileHelper.getIgnoredFiles(file, output) ||
      (!!_config?.options?.manifest &&
        path.basename(file) === getManifestFilename(_config.options.manifest));

    // If added, or change (renamed) or deleted, update routes
    if (WATCH_EVENTS.has(ev) && !ignoredGeneralFiles) {
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

/** Resolves once the routes file exists; the watcher (if enabled) keeps running afterwards. */
export const generateFileRouter = async (config: TGenerateRoutesConfig) => {
  _configFileRouter(config);

  if (!_config || !_config.dir) {
    throw Error('To generate file router you must define a valid config');
  }

  if (!_config.outputFilename) {
    _config.outputFilename = 'routes.ts';
  }

  await _serializer(_config.dir, _config.outputFilename);

  await _watcher(
    _config.dir,
    _config.outputFilename,
    !!_config.options?.watcher?.watch,
    _config.options?.watcher?.debounce ?? 500,
  );
};
