type TWatcherConfig = {
  debounce?: number;
};

type TGenerateRoutesOptions = {
  watcher?: TWatcherConfig;
  exitCodeOnResolution?: boolean;
};

export type TGenerateRoutesConfig = {
  baseFolder: string;
  outputFile: string;
  routeFileName?: string;
  options?: TGenerateRoutesOptions;
};

export type TRoute = {
  path: string;
  import: string;
};

export type TRoutesTree = {
  [key: string]: TRoute | TRoutesTree;
};
