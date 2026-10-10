import type { Plugin } from 'vite';
import type { TGenerateRoutesConfig } from 'ts-file-router/core';
import { generateFileRouter } from 'ts-file-router/core';

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
    async buildStart() {
      await generateFileRouter({
        dir,
        options,
        outputFilename,
      });
    },
  };
};
