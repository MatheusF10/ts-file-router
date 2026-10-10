import fs from 'node:fs/promises';
import path from 'node:path';

export type TRouteEntry =
  | { key: string; routePath: string; importPath: string }
  | { key: string; children: TRouteEntry[] };

const INDENT = '    ';
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const _formatKey = (key: string) =>
  IDENTIFIER.test(key) ? key : JSON.stringify(key);

const _serializeEntries = (entries: TRouteEntry[], depth: number): string => {
  if (!entries.length) {
    return '{}';
  }

  const inner = INDENT.repeat(depth + 1);

  const lines = entries.map((entry) => {
    const key = _formatKey(entry.key);

    if ('children' in entry) {
      return `${inner}${key}: ${_serializeEntries(entry.children, depth + 1)}`;
    }

    return [
      `${inner}${key}: {`,
      `${inner}${INDENT}path: ${JSON.stringify(entry.routePath)},`,
      `${inner}${INDENT}import: () => import(${JSON.stringify(entry.importPath)})`,
      `${inner}}`,
    ].join('\n');
  });

  return `{\n${lines.join(',\n')}\n${INDENT.repeat(depth)}}`;
};

const createRoutesFile = (entries: TRouteEntry[]) =>
  `// GENERATED WITH TS-FILE-ROUTER DO NOT EDIT\nexport const routes = ${_serializeEntries(entries, 0)} as const;\n`;

const serializeOutputFile = async (
  entries: TRouteEntry[],
  outputPath: string,
) => {
  const filePath = path.resolve(outputPath);

  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, createRoutesFile(entries), 'utf8');

    console.log('✨ File was parsed succesfully\n');
  } catch (err) {
    console.error('❌ Error parsing file:\n', err);
  }
};

export const SerializeHelper = {
  serializeOutputFile,
} as const;
