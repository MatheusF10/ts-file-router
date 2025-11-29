import path from 'path';
import fs from 'fs/promises';
import { TStartConfigs, TRoutesTree } from './types';

// Serialize routes objects to TS file output
const serializeRoutes = (obj: any, ident = 2): string => {
  const pad = ' '.repeat(ident);

  let str = '{\n';

  for (const key in obj) {
    const value = obj[key];
    // Manipulate JS keys
    const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;

    if (
      typeof value === 'object' &&
      value !== null &&
      !('path' in value && 'import' in value)
    ) {
      // Create sub folders
      str += `${pad}${keyStr}: ${serializeRoutes(value, ident + 2)},\n`;
    } else {
      // Routes
      str += `${pad}${keyStr}: { path: "${value.path}", import: "${value.import}" },\n`;
    }
  }

  str += ' '.repeat(ident - 2) + '}';

  return str;
};

export const start = ({
  baseFolder,
  outputFile,
  routeFileName = 'page.ts',
}: TStartConfigs) => {
  // Get the pages dir to resolve routes
  const basePath = path.resolve(__dirname, baseFolder);
  // Output file for routes
  const output = path.resolve(__dirname, outputFile);

  const generateRouter = async () => {
    const mapRoutes = async (dir: string) => {
      const routes: TRoutesTree = {};
      const directory = await fs.readdir(dir);

      if (!directory.includes(routeFileName)) {
        throw new Error(
          `Invalid pages structure: The folder "${dir}" must contain a ${routeFileName} file.`
        );
      }

      for (const file of directory) {
        const fullPath = path.join(dir, file);
        // Get directory info to control file or folder
        const dirInfo = await fs.stat(fullPath);
        // Normalize import path to esm pattern
        const importPath =
          './' + path.relative(basePath, fullPath).replaceAll(/\\/g, '/');

        const relativePath =
          './' + path.relative(basePath, dir).replaceAll(/\\/g, '/');

        // Remove extension from file to naming the route
        const key = file.replace(/\.ts$/, '');

        if (dirInfo.isDirectory()) {
          // Dev friendly when enter in this conditional file is a directory(folder)
          const directory = file;
          // Recursion for sub directories
          routes[directory] = await mapRoutes(fullPath);
          // Skip this directory iteration
          continue;
        }

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
      // Cria arquivo TS exportando JSON
      const tsContent = `// AUTO-GENERATED ROUTES\n\nconst routes = ${serializeRoutes(
        routes
      )};\n\nexport default routes;\n`;
      // Write .ts file
      await fs.writeFile(output, tsContent, 'utf-8');

      console.log('🚀 Routes generated successfully!\n', output);

      process.exit(0);
    } catch (err) {
      console.error('❌ Error generating routes:', err);

      process.exit(1);
    }
  };

  generateRouter();
};
