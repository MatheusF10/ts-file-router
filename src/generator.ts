import type { TRoutesTree, TGenerateRoutesConfig } from './types.js';
import { FileHelper, SerializeHelper } from './helpers/index.js';
import fs from 'fs/promises';
import path from 'path';

export const generateRoutes = ({
  baseFolder,
  outputFile,
  options = { exitCodeOnResolution: true },
}: TGenerateRoutesConfig) => {
  // Get the pages dir to resolve routes
  const basePath = path.resolve(process.cwd(), baseFolder);
  // Output file for routes
  const output = path.resolve(basePath, outputFile);

  const mapRoutes = async (dir: string) => {
    const routes: TRoutesTree = {};

    try {
      const directory = await fs.readdir(dir);

      if (!directory || !directory.length || directory.length === 0) {
        throw new Error(
          `Invalid pages structure: The folder "${dir}" must contain at least one valid file.`,
        );
      }

      for (const file of directory) {
        // ignore index files, underscore marked, or route file generated
        if (FileHelper.getIgnoredFiles(file, outputFile)) {
          continue;
        }

        const fullPath = path.join(dir, file);

        // Get directory info to control file or folder
        const dirInfo = await fs.stat(fullPath);

        // Path to browser sync if necessary
        const relativePath = '/' + path.relative(basePath, dir);

        const importPath = './' + path.relative(basePath, fullPath);

        // Remove extension from file to naming the route
        const key = path.basename(file, path.extname(file));

        if (dirInfo.isDirectory()) {
          // Dev friendly when enter in this conditional file is a directory(folder)
          const directory = file;
          // Recursively for sub directories
          routes[directory] = await mapRoutes(fullPath);

          continue;
        }

        // Mount the route object with path like "/folder" and import
        // import will be like "import((./baseFolder/file or ./baseFolder/folders).extension)"
        routes[key] = {
          // Normalize path
          path: FileHelper.cleanPaths(relativePath),
          // Normalize import path to esm pattern
          import: FileHelper.cleanPaths(importPath),
        };
      }
    } catch (err) {
      console.error(`Error mapping routes ${dir}:`, err);

      // Stop the process immediatelly
      process.exit(1);
    }

    return routes;
  };

  const createRoutes = async () => {
    try {
      // Create routes
      const routes = await mapRoutes(basePath);
      // Create ts file
      await SerializeHelper.serializeOutputFile(routes, output);
      // Promise writeFile was successfully resolved
      console.log('🚀 Routes generated successfully!\n');

      if (options.exitCodeOnResolution) {
        // Code 0 to finish the process as success
        process.exit(0);
      }
    } catch (err) {
      console.error('❌ Error generating routes:\n', err);

      if (options.exitCodeOnResolution) {
        // Code 1 to finish the process as error
        process.exit(1);
      }
    }
  };

  const watcher = async ({ debounce = 500 }) => {
    const { watch } = await import('chokidar');

    let timeoutId: NodeJS.Timeout | null;

    const watcher = watch(baseFolder, {
      ignoreInitial: false,
      persistent: true,
    });

    console.log(`👀 Watching folder: "${baseFolder}" for changes...`);

    const runFromWatcher = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        createRoutes();
      }, debounce);
    };

    runFromWatcher();

    watcher.on('all', (ev, file) => {
      const ignoredOuput = FileHelper.getIgnoredOutputFile(file, outputFile);

      // If output file as deleted regenerate it
      if (ignoredOuput && ev === 'unlink') {
        console.log(`🚨 ${outputFile} was deleted, regenerating...`);

        runFromWatcher();

        return;
      }

      const watchOnEvents: (typeof ev)[] = [
        'add',
        'addDir',
        'change',
        'unlink',
        'unlinkDir',
      ];

      const ignoredGeneralFiles = FileHelper.getIgnoredFiles(file, outputFile);

      // If added, or change (renamed) or deleted, update routes
      if (watchOnEvents.includes(ev) && !ignoredGeneralFiles) {
        console.log(`🔎 Watching files from path: "${file}" for changes...`);

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

  if (!!options.watcher) {
    watcher(options.watcher);

    return;
  }

  createRoutes();
};

generateRoutes({
  baseFolder: 'src/screens',
  outputFile: 'routes.ts',
  options: {
    exitCodeOnResolution: false,
    watcher: { watch: true, debounce: 1000 },
  },
});
