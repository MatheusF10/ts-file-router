export type TGenerateRoutesConfig = {
  baseFolder: string;
  outputFile: string;
  routeFileName?: string;
};

export type TRoute = {
  path: string;
  import: string;
};

export type TRoutesTree = {
  [key: string]: TRoute | TRoutesTree;
};
