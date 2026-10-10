# ts-file-router

A TypeScript file-system route generator with optional integrations for Vite and React Router. It scans a pages directory and generates a typed `routes.ts` tree with lazy `import()` functions.

## Package entry points

All features are published in the [`ts-file-router`](https://www.npmjs.com/package/ts-file-router) package:

| Import path                 | Purpose                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| `ts-file-router/core`       | Route generation, optional file watching, route manifest, and CLI |
| `ts-file-router/vite`       | Vite dev-server plugin                                            |
| `ts-file-router/react`      | React Router provider and route helpers                           |
| `ts-file-router/react/vite` | React-aware Vite plugin                                            |

## Installation

Install the core package:

```bash
npm install ts-file-router
```

Install the optional watcher dependency only if you enable watching:

```bash
npm install chokidar
```

Install the optional integration peers only if you use them:

```bash
npm install react react-router-dom
npm install -D vite
```

## Generate routes

Call `generateFileRouter` with the pages directory. The output defaults to `routes.ts` inside that directory.

```ts
// scripts/generate-routes.ts
import { generateFileRouter } from 'ts-file-router/core';

await generateFileRouter({
  dir: './src/pages',
});
```

Run the script with your preferred TypeScript runner, or use a JavaScript module:

```js
// scripts/generate-routes.mjs
import { generateFileRouter } from 'ts-file-router/core';

await generateFileRouter({
  dir: './src/pages',
  outputFilename: 'routes.ts',
});
```

Add a generation step before starting or building your app:

```json
{
  "scripts": {
    "generate:routes": "node scripts/generate-routes.mjs",
    "dev": "npm run generate:routes && vite",
    "build": "npm run generate:routes && vite build"
  }
}
```

The generated module exports `routes` as a const object. Each file becomes a lazy import, and its filename becomes the key:

```ts
export const routes = {
  index: {
    path: '/index.tsx',
    import: () => import('./index.tsx'),
  },
  users: {
    $id: {
      path: '/$id.tsx',
      import: () => import('./users/$id.tsx'),
    },
  },
} as const;
```

`path` is generated file-path metadata; route paths in the React integration are derived from the tree's keys, not these values. See [React Router integration](#react-router-integration).

## Configuration

```ts
type TGenerateRoutesConfig = {
  dir: string;
  outputFilename?: string; // Defaults to "routes.ts", written inside dir
  options?: {
    watcher?: {
      watch: boolean;
      debounce?: number; // Defaults to 500 ms
    };
    exitCodeOnResolution?: boolean; // Defaults to false
    manifest?: {
      root?: string; // Defaults to dir; use "." to scan the project root
      filename?: string; // Defaults to "routes.manifest.json"
      ignore?: string[]; // Extra names to ignore when scanning the manifest
      agentDoc?: boolean | string; // Write ROUTES.agents.md or a custom filename
    };
  };
};
```

- `dir` and `outputFilename` are resolved from the current working directory; the output file is written inside `dir`.
- Enable `options.watcher.watch` to regenerate routes when files or directories are added or removed. The optional `chokidar` package is required. `debounce` controls the delay before regeneration.
- `exitCodeOnResolution` exits with status `0` after successful generation or `1` on generation failure. Leave it disabled when the process should continue running, such as when using a watcher.
- Set `options.manifest` to also generate a JSON project manifest. Manifest scans always skip `node_modules`, `.git`, `dist`, `build`, and `coverage`; `ignore` adds more names to that list. Set `root` to scan a different folder than `dir`.
- Set `agentDoc: true` to generate `ROUTES.agents.md` alongside the routes and manifest files, or pass a filename to customize it. The guide explains how to query the manifest through the CLI.

## File watcher

```ts
import { generateFileRouter } from 'ts-file-router/core';

await generateFileRouter({
  dir: './src/pages',
  options: {
    watcher: {
      watch: true,
      debounce: 500,
    },
  },
});
```

The watcher regenerates routes for added or removed files and directories. It also recreates the generated routes file if it is deleted. `SIGINT` and `SIGTERM` close the watcher cleanly.

## Vite integration

### Standalone Vite plugin

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { generateViteFileRouter } from 'ts-file-router/vite';

export default defineConfig({
  plugins: [
    generateViteFileRouter({
      dir: './src/pages',
      outputFilename: 'routes.ts',
    }),
  ],
});
```

The plugin runs in Vite's dev server and, by default, watches the pages directory with a 500 ms debounce. Pass `options` to `generateViteFileRouter` to configure generation.

### React Vite plugin

The React entry point also exports a Vite plugin with simpler watcher options:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { reactFileRouter } from 'ts-file-router/react/vite';

export default defineConfig({
  plugins: [
    reactFileRouter({
      dir: './src/pages',
      watch: true, // Defaults to true in the dev server
      debounce: 500,
    }),
  ],
});
```

It generates routes at startup and watches for changes during `vite dev` by default. Watching is disabled for production builds.

## React Router integration

Install `react` and `react-router-dom`, then make each page file default-export a React component. The generated tree can be passed directly to `FileRouterProvider`:

```tsx
// src/main.tsx
import { FileRouterProvider } from 'ts-file-router/react';
import { routes } from './pages/routes';

export function App() {
  return (
    <FileRouterProvider
      routes={routes}
      fallback={<p>Loading...</p>}
      notFound={<p>Page not found</p>}
      errorElement={<p>Something went wrong</p>}
    />
  );
}
```

`FileRouterProvider` uses a browser router by default. Set `mode` to `'hash'` or `'memory'` to use those router types; `initialEntries` applies to memory mode, and `basename` is forwarded to the router.

### File conventions

| File or folder name | React Router behavior                                             |
| ------------------- | ----------------------------------------------------------------- |
| `index.tsx`         | Index route for its directory                                     |
| `$id.tsx`           | Dynamic `:id` segment                                             |
| `$`                 | Splat `*` segment                                                 |
| `_layout.tsx`       | Layout for the directory; render an `<Outlet />` for child routes |
| Directory           | Nested route segment containing child routes                      |

For example, `src/pages/users/$id.tsx` maps to `/users/:id`. `_layout` files are used as layouts and are not emitted as separate routes. Unlike earlier versions, `index` and underscore-prefixed files are not automatically ignored by the core generator.

### Type-safe links and navigation

`createTypedRouter` derives valid path patterns and required parameters from the generated route tree:

```tsx
import { createTypedRouter } from 'ts-file-router/react';
import { routes } from './pages/routes';

const { Link, useNavigate, buildPath } = createTypedRouter<typeof routes>();

function UserLink() {
  const navigate = useNavigate();

  return (
    <>
      <Link to="/users/:id" params={{ id: 42 }}>
        View user
      </Link>

      <button onClick={() => navigate('/users/:id', { id: 42 })}>
        Navigate
      </button>

      <code>{buildPath('/users/:id', { id: 42 })}</code>
    </>
  );
}
```

The helpers accept only paths present in the route tree, require the parameters used by dynamic segments, and accept string or numeric parameter values.

## Route manifest and CLI

Enable manifest generation through the `manifest` option:

```ts
await generateFileRouter({
  dir: './src/pages',
  options: {
    manifest: {
      root: '.',
      filename: 'routes.manifest.json',
      ignore: ['.cache'],
      agentDoc: true,
    },
  },
});
```

The manifest records the scanned root and a sorted tree of files and directories, with paths relative to that root. The `ts-file-router` package includes a CLI for generating routes and inspecting the generated manifest:

```bash
npx ts-file-router generate --dir ./src/pages
npx ts-file-router generate --dir ./src/pages --out routes.ts --watch --debounce 500
npx ts-file-router --manifest
npx ts-file-router --routes
npx ts-file-router --tree src/pages
npx ts-file-router --manifest --file custom.manifest.json
```

`generate --dir <pages>` creates `routes.ts` in the pages directory. Use `--out <file>` to choose another output filename, or `--watch` to regenerate when files or directories are added or removed; watching requires the optional `chokidar` dependency. `--debounce <ms>` sets the watch delay and defaults to 500 ms.

For manifest inspection, `--manifest` prints the full manifest, `--routes` prints the generated routes file, and `--tree <folder>` prints the children of the requested folder. Use a folder `path` reported by `--manifest` for `--tree`. The CLI looks for `routes.manifest.json` by default; use `--file` when the manifest has another filename. Generate the manifest before running these inspection commands.

## Package versioning and publishing

All entry points share one published package version, stored in `src/packages/core/package.json`. Bump it in the same pull request when changing package code, choosing `patch`, `minor`, or `major` according to the change. For example:

```bash
npm version minor --workspace=ts-file-router --no-git-tag-version
```

React and Vite are entry points of `ts-file-router`, not separately published packages, so they do not have independent versions. Changes limited to tests, Markdown documentation, or test configuration do not require a version bump.

Before opening or updating the pull request, verify the bumps with:

```bash
npm run check:version
```

The version check also runs in CI and blocks code changes without a bump. After a pull request is merged, CI builds and publishes the package version if it is not already on npm, then creates a `ts-file-router@<version>` Git tag. There is no need to publish manually.

## Contributing

Found a bug or have a feature request? Open an issue or submit a pull request.

## License

ISC © MatheusF10
