# 📦 ts-file-router

A lightweight **filesystem router generator** for TypeScript projects. Automatically scans your folder structure and generates a clean, typed `routes.ts` tree ready for dynamic imports (e.g., `React.lazy`).

---

## ✨ Features

- 🔍 **Automatic folder scanning** - Automatically scans your configured directory to build a complete route tree manifest.
- 📄 **Generated TypeScript routes** - Fully typed `routes.ts` file with `as const` assertions
- ⚛️ **Framework agnostic** - Works with React.lazy, Vue, Solid, or any framework with dynamic imports
- 🪶 **Zero runtime dependencies** - The generated routes file is plain TypeScript/JavaScript; your final bundle won't include any extra library code.
- 🔄 **File watcher support** - Auto-regenerate routes when files change (powered by Chokidar)
- 🎨 **Biome formatting** - Output files are automatically formatted with Biome
- 🧩 **Vite plugin** - Seamless integration with Vite dev server
- 🚫 **Smart file filtering** - Ignores `index` files, `_` prefixed files (private routes), and output files
- 📘 **Full TypeScript support** - Complete `.d.ts` definitions included

---

## 📥 Installation

```bash
npm install ts-file-router
```

**Optional dependencies:**

```bash
# For file watcher support
npm install chokidar

# Vite is automatically supported as a peer dependency
```

---

## 🚀 Quick Start

### 1. Basic Usage (One-time generation)

Create a script to generate your routes:

```js
// scripts/generate-routes.mjs
import { generateFileRouter } from 'ts-file-router';

generateFileRouter({
  baseFolder: './src/screens',
  outputFile: 'routes.ts',
});
```

Run it:

```bash
node scripts/generate-routes.mjs
```

### 2. With File Watcher (Auto-regenerate on changes)

```js
// scripts/generate-routes.mjs
import { generateFileRouter } from 'ts-file-router';

generateFileRouter({
  dir: './src/screens',
  outputFilename: 'routes.ts',
  options: {
    watcher: {
      watch: true,
      debounce: 500, // Wait 500ms after changes before regenerating
    },
    exitCodeOnResolution: false, // Don't exit process after generation
  },
});
```

This will keep running and regenerate routes whenever you add, remove, or modify files in the `src/screens` folder.

### 3. With Vite Plugin

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { generateViteFileRouter } from 'ts-file-router';

export default defineConfig({
  plugins: [
    generateViteFileRouter({
      dir: './src/screens',
      outputFilename: 'routes.ts',
      // Optional: customize watcher behavior
      options: {
        watcher: { watch: true, debounce: 500 },
        exitCodeOnResolution: false,
      },
    }),
  ],
});
```

The plugin automatically runs during Vite's dev server (`vite dev`) and regenerates routes on file changes.

---

## 📂 How It Works

Given this folder structure:

```
src/screens/                  # Home page
├── about/
│   └── page.tsx               # About page
├── users/
│   ├── page.tsx               # Users list
│   ├── profile/
│   │   └── page.tsx          # User profile
│   └── _private/
│       └── page.tsx          # Ignored (starts with _)
└── index.tsx                  # Ignored (index file)
```

Generates:

```ts
// GENERATED WITH TS-FILE-ROUTER DO NOT EDIT
export const routes = {
  about: {
    path: '/about',
    import: () => import('./about/page'),
  },
  users: {
    page: {
      path: '/users',
      import: () => import('./users/page'),
    },
    profile: {
      path: '/users/profile',
      import: () => import('./users/profile/page'),
    },
  },
} as const;
```

---

## 🔧 Configuration Options

### `generateFileRouter()` Parameters

| Parameter        | Type                     | Required | Description                        |
| ---------------- | ------------------------ | -------- | ---------------------------------- |
| `dir`            | `string`                 | ✅ Yes   | Root directory to scan for routes  |
| `outputFilename` | `string`                 | ✅ Yes   | Path for the generated routes file |
| `options`        | `TGenerateRoutesOptions` | ❌ No    | Additional configuration           |

### Options Object

```ts
interface TGenerateRoutesOptions {
  watcher?: {
    watch: boolean; // Enable file watching
    debounce?: number; // Debounce delay in ms (default: 500)
  };
  exitCodeOnResolution?: boolean; // Exit process after generation (default: true)
}
```

### `exitCodeOnResolution`

- **`true`** (default for CLI): Process exits with code `0` on success or `1` on error
- **`false`** (default for Vite/plugin): Process keeps running (required for watchers)

---

## 🎯 Usage Examples

### With React Router And React Lazy Using

```tsx
import { routes } from './screens/routes';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

const About = lazy(() =>
  routes.about.import().then((r) => ({ default: res.About })),
);

const Profile = lazy(() =>
  routes.users.profile.import().then((r) => ({ default: res.Profile })),
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={routes.about.path} element={<About />} />
        <Route path={routes.users.profile.path} element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🚫 File Filtering Rules

The following files/folders are **automatically ignored**:

- **`index.*`** files - Index files are skipped
- **`_` prefixed** files/folders - Files starting with underscore are treated as private
- **Output file** - The generated routes file is ignored to prevent infinite loops

This allows you to have helper files, components, or private routes alongside your page files without polluting the routes tree.

---

## 📦 Output File Structure

The generated file is a TypeScript module with:

- ✅ `export const routes` - Named export with all routes
- ✅ `as const` assertion - Full type inference for route paths and imports

## 🛠 Advanced Usage

### Custom Route File Names

By default, any file (except ignored ones) becomes a route. You can control this by:

1. Using a consistent naming convention (e.g., all pages named `page.tsx`)
2. Using `_` prefix for non-route files: `_components.tsx`, `_utils.ts`

### Watcher Events

When using the watcher, routes regenerate on:

- `add` - New file added
- `addDir` - New directory added
- `unlink` - File deleted
- `unlinkDir` - Directory deleted

If the output file is deleted, it's automatically regenerated.

### Graceful Shutdown

The watcher listens for:

- `SIGINT` (Ctrl+C) - Graceful cleanup
- `SIGTERM` - Container/process termination

Both trigger proper watcher cleanup before exit.

---

## 📝 Tips

1. **Add to `package.json`**:

```json
{
  "scripts": {
    "generate:routes": "node scripts/generate-routes.mjs",
    "dev": "npm run generate:routes && vite",
    "dev:watch": "node scripts/generate-routes.mjs --watch"
  }
}
```

2. **Use relative paths in output**: The `outputFilename` path is relative to `dir`.

---

## 🤝 Contributing

Found a bug or have a feature request? Open an issue or submit a PR!

---

## 📄 License

ISC © MatheusF10
