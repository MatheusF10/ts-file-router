import path from 'node:path';

// Compare by basename: matching on the full path wrongly ignored any file inside a folder containing the word
const getIgnoredOutputFile = (file: string, output: string) =>
  path.basename(file) === path.basename(output);

// `index` and `_layout` are meaningful route files, so only the generated output is ignored
const getIgnoredFiles = (file: string, output: string) =>
  getIgnoredOutputFile(file, output);

export const FileHelper = {
  getIgnoredFiles,
  getIgnoredOutputFile,
} as const;
