import type { Plugin } from 'vite';
import { TGenerateRoutesConfig } from '../types.js';
import { generateFileRouter } from '../generator.js';

export const generateViteFileRouter = ({
  dir,
  outputFilename,
  options = {
    exitCodeOnResolution: false,
    watcher: { watch: true, debounce: 500 },
  },
}: TGenerateRoutesConfig): Plugin => {
  return {
    apply: 'serve',
    name: 'generate-vite-file-router',
    buildStart() {
      generateFileRouter({
        dir,
        options,
        outputFilename,
      });
    },
  };
};
