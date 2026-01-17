import type { Plugin } from 'vite';
import { TGenerateRoutesConfig } from '../types.js';
import { generateRoutes } from '../generator.js';

export const generateRoutesPlugin = ({
  baseFolder,
  outputFile,
  options = {
    watcher: { watch: true, debounce: 500 },
    exitCodeOnResolution: false,
  },
}: TGenerateRoutesConfig): Plugin => {
  return {
    name: 'file-router-plugin',
    apply: 'serve',
    buildStart() {
      generateRoutes({
        baseFolder,
        outputFile,
        options,
      });
    },
  };
};
