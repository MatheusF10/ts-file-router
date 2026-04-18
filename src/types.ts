type TWatcherConfig = {
  watch: boolean;
  debounce?: number;
};

type TGenerateRoutesOptions = {
  watcher?: TWatcherConfig;
  exitCodeOnResolution?: boolean;
};

export type TGenerateRoutesConfig = {
  dir: string;
  outputFilename?: string;
  options?: TGenerateRoutesOptions;
};

export type TRouteLeaf = {
  path: string;
  import: string;
};

export type TRoutesTree = {
  [key: string]: TRouteLeaf | TRoutesTree;
};
