#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import type { TManifestNode } from './manifest.js';

type TManifestFile = {
  root: string;
  routes: string;
  tree: TManifestNode[];
};

const DEFAULT_MANIFEST = 'routes.manifest.json';

const SKIP = new Set(['node_modules', '.git', 'dist']);

const _findFile = (dir: string, name: string): string | null => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) {
      continue;
    }

    const full = path.join(dir, entry.name);

    if (entry.isFile() && entry.name === name) {
      return full;
    }

    if (entry.isDirectory()) {
      const found = _findFile(full, name);

      if (found) {
        return found;
      }
    }
  }

  return null;
};

const _flag = (args: string[], name: string) => {
  const index = args.indexOf(name);

  return index === -1 ? undefined : (args[index + 1] ?? '');
};

const _findNode = (
  nodes: TManifestNode[],
  target: string,
): TManifestNode | undefined => {
  for (const node of nodes) {
    if (node.path === target) {
      return node;
    }

    const found = node.children && _findNode(node.children, target);

    if (found) {
      return found;
    }
  }
};

const _fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const generate = async (args: string[]) => {
  const dir = _flag(args, '--dir');

  if (!dir) {
    return _fail(
      'Usage: ts-file-router generate --dir <pages> [--out <file>] [--watch] [--debounce <ms>]',
    );
  }

  const watch = args.includes('--watch');
  const debounce = Number(_flag(args, '--debounce')) || 500;
  const { generateFileRouter } = await import('./generator.js');

  await generateFileRouter({
    dir,
    outputFilename: _flag(args, '--out') || undefined,
    options: { exitCodeOnResolution: false, watcher: { watch, debounce } },
  });
}

const run = (args: string[]) => {
  const name = _flag(args, '--file') || DEFAULT_MANIFEST;
  const manifestPath = _findFile(process.cwd(), name);

  if (!manifestPath) {
    return _fail(`Manifest "${name}" not found. Generate it first.`);
  }

  const manifest: TManifestFile = JSON.parse(
    fs.readFileSync(manifestPath, 'utf8'),
  );

  if (args.includes('--manifest')) {
    return console.log(JSON.stringify(manifest, null, 2));
  }

  if (args.includes('--routes')) {
    return console.log(
      fs.readFileSync(
        path.resolve(path.dirname(manifestPath), manifest.routes),
        'utf8',
      ),
    );
  }

  const folder = _flag(args, '--tree');

  if (folder !== undefined) {
    const target = folder.replace(/\\/g, '/').replace(/^\.?\/|\/$/g, '');
    const node = target ? _findNode(manifest.tree, target) : undefined;

    if (target && !node) {
      return _fail(`Folder "${folder}" not found in the manifest.`);
    }

    return console.log(
      JSON.stringify(node ? (node.children ?? [node]) : manifest.tree, null, 2),
    );
  }

  _fail(
    'Usage: ts-file-router generate --dir <pages> [--out <file>] [--watch] | --manifest | --routes | --tree <folder> [--file <manifest>]',
  );
};

const [command, ...rest] = process.argv.slice(2);

if (command === 'generate') {
  generate(rest).catch((err) => _fail(String(err)));
} else {
  run(process.argv.slice(2));
}

