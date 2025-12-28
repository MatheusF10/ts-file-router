type TWatcherOptions = {
  debounce?: number;
};

export type TWatcherConfig = {
  input: TGenerateRoutesConfig;
  options?: TWatcherOptions;
};

export type TGenerateRoutesConfig = {
  baseFolder: string;
  outputFile: string;
  routeFileName?: string;
  exitCodeOnResolution?: boolean;
};

export type TRoute = {
  path: string;
  import: string;
};

export type TRoutesTree = {
  [key: string]: TRoute | TRoutesTree;
};
