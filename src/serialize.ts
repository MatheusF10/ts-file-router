import type { TRoutesTree } from './types.js';

import * as fs from 'node:fs';
import * as path from 'node:path';

const stringifyTS = (obj: any, indent = 0): string => {
  const spaces = ' '.repeat(indent);
  const innerSpaces = ' '.repeat(indent + 2);

  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }

  const entries = Object.entries(obj).map(([key, value]) => {
    const validKey = /^[a-z_$][a-z0-9_$]*$/i.test(key)
      ? key
      : JSON.stringify(key);
    return `${innerSpaces}${validKey}: ${stringifyTS(value, indent + 2)}`;
  });

  return `{\n${entries.join(',\n')}\n${spaces}}`;
};

export const serialize = (routes: TRoutesTree, outputPath: string) => {
  const content = `export const routes = ${stringifyTS(routes)} as const;\n`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  fs.writeFileSync(outputPath, content, 'utf8');
};
