import { defineConfig } from 'tsup';

const external = [
  'chokidar',
  'react',
  'react-router-dom',
  'vite',
  'node:fs',
  'node:fs/promises',
  'node:path',
  'fs',
  'fs/promises',
  'path',
];

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      react: '../react/src/index.ts',
      vite: '../vite/src/index.ts',
      'react/vite': '../react/src/vite.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    shims: true,
    clean: true,
    minify: true,
    external,
    platform: 'node',
    target: 'node18',
  },
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    minify: true,
    external,
    platform: 'node',
    target: 'node18',
  },
]);
