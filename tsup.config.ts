import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  shims: true,
  clean: true,
  minify: true,
  external: [
    '@biomejs/js-api',
    '@biomejs/wasm-nodejs',
    'typescript',
    'chokidar',
    'node:fs',
    'node:fs/promises',
    'node:path',
    'fs',
    'fs/promises',
    'path',
  ],
  platform: 'node',
  target: 'node18',
});
