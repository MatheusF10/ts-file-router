import fs from 'fs/promises';
import path from 'path';
import { TRoutesTree, TGenerateRoutesConfig } from './types';
import { serializeTs } from './utils';

export const generateRoutes = ({
  baseFolder,
  outputFile,
  routeFileName = 'page.tsx',
}: TGenerateRoutesConfig) => {
  // Get the pages dir to resolve routes
  const basePath = path.resolve(process.cwd(), baseFolder);
  // Output file for routes
  const output = path.resolve(basePath, outputFile);

  const createRoutes = async () => {
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
        // Normalize import path to esm pattern
        const importPath =
          './' + path.relative(basePath, fullPath).replaceAll(/\\/g, '/');

        const relativePath =
          '/' + path.relative(basePath, dir).replaceAll(/\\/g, '/');

        // Remove extension from file to naming the route
        const key = path.basename(file, path.extname(file));

        if (dirInfo.isDirectory()) {
          // Dev friendly when enter in this conditional file is a directory(folder)
          const directory = file;
          // Recursion for sub directories
          routes[directory] = await mapRoutes(fullPath);
          // Skip this directory iteration
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

    try {
      // Create routes
      const routes = await mapRoutes(basePath);
      // Serialize object to typescript format
      const ts = serializeTs(routes);
      // Cria arquivo TS exportando JSON
      const tsContent = `// GENERATED-ROUTES-FROM-TS-FILE-ROUTER\n\nexport const routes = ${ts};\n`;
      // Write .ts file
      await fs.writeFile(output, tsContent, 'utf-8');
      // Promise writeFile was successfully resolved
      console.log('🚀 Routes generated successfully!\n', output);
      // Code 0 to finish the process as success
      process.exit(0);
    } catch (err) {
      console.error('❌ Error generating routes:', err);
      // Code 1 to finish the process as error
      process.exit(1);
    }
  };

  createRoutes();
};
