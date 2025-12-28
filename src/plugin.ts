import type { Plugin } from 'vite';
import { TGenerateRoutesConfig } from './types.js';
import { generateRoutesWithWatcher } from './generatorWatcher.js';

export const generateRoutesPlugin = ({
  baseFolder,
  outputFile,
  exitCodeOnResolution = false,
}: TGenerateRoutesConfig): Plugin => {
  return {
    name: 'file-router-plugin',
    apply: 'serve',
    buildStart() {
      generateRoutesWithWatcher({
        input: { baseFolder, outputFile, exitCodeOnResolution },
        options: { debounce: 500 },
      });
    },
  };
};
