const getIgnoredOutputFile = (file: string, output: string) =>
  file.includes(output);

const getIgnoredFiles = (file: string, output: string) =>
  file.includes('index') ||
  file.startsWith('_') ||
  getIgnoredOutputFile(file, output);

const cleanPaths = (path: string) =>
  path.replaceAll(/\\/gi, '/').replaceAll(/.(tsx|ts|jsx|js)/gi, '');

export const FileHelper = {
  cleanPaths,
  getIgnoredFiles,
  getIgnoredOutputFile,
} as const;
