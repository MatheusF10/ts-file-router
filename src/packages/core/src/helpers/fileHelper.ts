import path from 'node:path';

const ROUTE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.mjs',
  '.cts',
  '.cjs',
]);

// Compare by basename: matching on the full path wrongly ignored any file inside a folder containing the word
const getIgnoredOutputFile = (file: string, output: string) =>
  path.basename(file) === path.basename(output);

const getIgnoredFiles = (file: string, output: string) =>
  getIgnoredOutputFile(file, output);

const getRouteFileType = (file: string): 'page' | 'layout' | null => {
  const extension = path.extname(file);
  const name = path.basename(file, extension);

  if (!ROUTE_EXTENSIONS.has(extension)) {
    return null;
  }

  if (name === 'page' || name === 'layout') {
    return name;
  }

  return null;
};

export const FileHelper = {
  getIgnoredFiles,
  getIgnoredOutputFile,
  getRouteFileType,
} as const;
