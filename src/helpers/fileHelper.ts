const getIgnoredOutputFile = (file: string, output: string) =>
  file.includes(output);

const getIgnoredFiles = (file: string, output: string) =>
  file.includes('index') ||
  file.startsWith('_') ||
  getIgnoredOutputFile(file, output);

export const FileHelper = {
  getIgnoredFiles,
  getIgnoredOutputFile,
} as const;
