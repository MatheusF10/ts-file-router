# 📦 ts-file-router

A lightweight TypeScript filesystem router generator.  
Automatically scans folders and outputs a clean, structured `routes.ts` tree ready for dynamic imports (e.g., `React.lazy`).

---

## ✨ Features

- 🔍 Recursive folder scanning
- 📄 Auto-generated `routes.ts` (TypeScript code, no `resolveJsonModule` required)
- ⚛️ Works perfectly with `React.lazy()` and dynamic imports
- 📘 Full TypeScript `.d.ts` definitions included
- 🧩 Custom route file name (default: `page.ts`)
- 🪶 Zero runtime dependencies
- 🎯 Clean, formatted output with readable keys

---

## 📥 Installation

```bash
npm install ts-file-router
# or
yarn add ts-file-router

```

---

## 🎯 Usage

Create a script to generate your routes. Example:

```js
// scripts/generate-routes.mjs
import { generateRoutes } from 'ts-file-router';

generateRoutes({
  baseFolder: 'src/screens',
  outputFile: 'src/screens/routes.ts',
  routeFileName: 'page.tsx',
});
```

## What this does

- baseFolder: Root directory where your screens/pages live

- routeFileName: File that represents a route (e.g. page.tsx)

- outputFile: Generated routes file (fully typed)

Run the script with:

node scripts/generate-routes.mjs
