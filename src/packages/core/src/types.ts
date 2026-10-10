type TWatcherConfig = {
  watch: boolean;
  debounce?: number;
};

/** A lazily imported route module in the generated routes tree. */
export type TRouteLeaf<TModule = unknown> = {
  path: string;
  import: () => Promise<TModule>;
};

/** The framework-agnostic shape generated for a file-based routes directory. */
export type TRouteTree<TModule = unknown> = {
  [key: string]: TRouteLeaf<TModule> | TRouteTree<TModule>;
};

export type TManifestConfig = {
  /** Folder to scan. Defaults to `dir`; use '.' for a full project scan. */
  root?: string;
  /** Output filename (written inside `dir`). Defaults to routes.manifest.json */
  filename?: string;
  /** Extra file/folder names to ignore (node_modules, .git, dist... are always ignored) */
  ignore?: string[];
  /** Also write a markdown guide for AI agents (no paths, only CLI flags). true = ROUTES.agents.md, or a custom filename */
  agentDoc?: boolean | string;
};

type TGenerateRoutesOptions = {
  manifest?: TManifestConfig;
  watcher?: TWatcherConfig;
  exitCodeOnResolution?: boolean;
};

export type TGenerateRoutesConfig = {
  dir: string;
  outputFilename?: string;
  options?: TGenerateRoutesOptions;
};