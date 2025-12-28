import { generateRoutes } from './generator.js';
import { TWatcherConfig } from './types.js';

export const generateRoutesWithWatcher = async ({
  input,
  options = { debounce: 500 },
}: TWatcherConfig) => {
  const { watch } = await import('chokidar');

  let timeoutId: NodeJS.Timeout | null;

  const runFromWatcher = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      generateRoutes(input);
    }, options.debounce);
  };

  const watcher = watch(input.baseFolder, {
    ignoreInitial: true,
    ignored: `${input.baseFolder}/${input.outputFile}`,
    persistent: true,
  });

  console.log(`👀 Watching folder: ${input.baseFolder} for changes...`);

  watcher.on('add', runFromWatcher);

  return () => watcher.close();
};
