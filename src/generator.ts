import type { TRoutesTree, TGenerateRoutesConfig } from './types.js';
import fs from 'fs/promises';
import path from 'path';

import { serialize } from './serialize.js';

export const generateRoutes = ({
  baseFolder,
  outputFile,
  routeFileName = 'page.tsx',
  options = { exitCodeOnResolution: true },
}: TGenerateRoutesConfig) => {
  // Get the pages dir to resolve routes
  const basePath = path.resolve(process.cwd(), baseFolder);
  // Output file for routes
  const output = path.resolve(basePath, outputFile);

  const mapRoutes = async (dir: string) => {
    const routes: TRoutesTree = {};
    const directory = await fs.readdir(dir);

    if (!directory.includes(routeFileName)) {
      throw new Error(
        `Invalid pages structure: The folder "${dir}" must contain a ${routeFileName} file.`
      );
    }

    for (const file of directory) {
      // ignore index files, underscore marked, or route file generated
      if (
        file.includes('index') ||
        file.startsWith('_') ||
        file.includes(outputFile)
      ) {
        continue;
      }

      const fullPath = path.join(dir, file);
      // Get directory info to control file or folder
      const dirInfo = await fs.stat(fullPath);

      // Path to browser sync if necessary
      const relativePath =
        '/' + path.relative(basePath, dir).replaceAll(/\\/g, '/');

      // Normalize import path to esm pattern
      const importPath =
        './' + path.relative(basePath, fullPath).replaceAll(/\\/g, '/');

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
      // import will be like "(./baseFolder/file or ./baseFolder/folders).extension"
      routes[key] = {
        path: relativePath,
        import: importPath,
      };
    }

    return routes;
  };

  const createRoutes = async () => {
    try {
      // Create routes
      const routes = await mapRoutes(basePath);
      // Create ts file
      serialize(routes, output);
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
      ignoreInitial: true,
      ignored: `${baseFolder}/${outputFile}`,
      persistent: true,
    });

    console.log(`👀 Watching folder: ${baseFolder} for changes...`);

    const runFromWatcher = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        createRoutes();
      }, debounce);
    };

    watcher.on('add', runFromWatcher);
    watcher.on('unlink', runFromWatcher);
    watcher.on('unlinkDir', runFromWatcher);

    return () => watcher.close();
  };

  if (!!options.watcher) {
    watcher(options.watcher);

    return;
  }

  createRoutes();
};
