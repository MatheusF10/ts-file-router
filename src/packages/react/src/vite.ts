import type { Plugin } from 'vite';
import { generateFileRouter } from 'ts-file-router/core';

export type TReactFileRouterPluginOptions = {
  /** Pages folder */
  dir: string;
  /** Defaults to routes.ts */
  outputFilename?: string;
  /** Regenerate routes on file changes while `vite dev` runs. Defaults to true */
  watch?: boolean;
  debounce?: number;
};

export const reactFileRouter = ({
  dir,
  outputFilename,
  watch = true,
  debounce = 500,
}: TReactFileRouterPluginOptions): Plugin => {
  let isServe = true;

  return {
    name: 'ts-file-router-react',
    configResolved(config) {
      isServe = config.command === 'serve';
    },
    async buildStart() {
      await generateFileRouter({
        dir,
        outputFilename,
        options: {
          exitCodeOnResolution: false,
          watcher: { watch: watch && isServe, debounce },
        },
      });
    },
  };
};
