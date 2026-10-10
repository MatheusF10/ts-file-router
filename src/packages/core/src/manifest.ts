import fs from 'node:fs/promises';
import path from 'node:path';
import type { TManifestConfig } from './types.js';

export type TManifestNode = {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: TManifestNode[];
};

const DEFAULT_IGNORE = ['node_modules', '.git', 'dist', 'build', 'coverage'];

const _scan = async (
  dir: string,
  root: string,
  ignore: Set<string>,
): Promise<TManifestNode[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nodes: TManifestNode[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (ignore.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    const node: TManifestNode = {
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.relative(root, fullPath).split(path.sep).join('/'),
    };

    if (entry.isDirectory()) {
      node.children = await _scan(fullPath, root, ignore);
    }

    nodes.push(node);
  }

  return nodes;
};

// Intentionally has no file paths: agents must query the CLI flags instead
const _agentDoc = (manifestName: string) => `# Project routes (generated)

Do not hardcode file paths. Query the router through the CLI, which always reflects the current project:

| Flag | Returns |
| --- | --- |
| \`npx ts-file-router --manifest\` | Full manifest: every folder/file as a tree (\`name\`, \`type\`, \`path\`, \`children\`) |
| \`npx ts-file-router --routes\` | The generated routes tree (route \`path\` and lazy \`import\`) |
| \`npx ts-file-router --tree <folder>\` | Only the children of a folder, using a \`path\` taken from \`--manifest\` |
| \`--file <manifest>\` | Optional: manifest filename if customised (default \`${manifestName}\`) |

Run \`--manifest\` first, then use the \`path\` values it returns. Regenerate by running the project's router generation step.
`;

export const getManifestFilename = (manifest?: TManifestConfig) =>
  manifest?.filename ?? 'routes.manifest.json';

export const generateManifest = async (
  defaultDir: string,
  routesFile: string,
  manifest: TManifestConfig,
) => {
  const root = path.resolve(process.cwd(), manifest.root ?? defaultDir);

  const filename = getManifestFilename(manifest);

  const ignore = new Set([
    ...DEFAULT_IGNORE,
    ...(manifest.ignore ?? []),
    filename,
  ]);

  const content = {
    root: path.relative(process.cwd(), root).split(path.sep).join('/') || '.',
    // Relative to the manifest location so the CLI works from any cwd
    routes: routesFile.split(path.sep).join('/'),
    tree: await _scan(root, root, ignore),
  };

  await fs.writeFile(
    path.resolve(defaultDir, filename),
    JSON.stringify(content, null, 2),
    'utf8',
  );

  if (manifest.agentDoc) {
    const docName =
      typeof manifest.agentDoc === 'string'
        ? manifest.agentDoc
        : 'ROUTES.agents.md';

    await fs.writeFile(
      path.resolve(defaultDir, docName),
      _agentDoc(filename),
      'utf8',
    );
  }

  console.log('🧭 Manifest generated successfully!\n');
};
