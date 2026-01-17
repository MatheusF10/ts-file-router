import { Biome, Distribution } from '@biomejs/js-api';
import type { TRoutesTree } from './types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const stringifyRoutes = (obj: TRoutesTree): string => {
  const entries = Object.entries(obj).map(([key, value]) => {
    if (
      typeof value === 'object' &&
      value !== null &&
      'path' in value &&
      'import' in value
    ) {
      return `'${key}': { 
          path: '${value.path}', 
          import: () => import('${value.import}')
        }`;
    }

    return `'${key}': ${stringifyRoutes(value as TRoutesTree)}`;
  });

  return `{ ${entries.join(',\n')} }`;
};

let biome: Biome | null = null;

const format = async (filePath: string, content: string) => {
  if (biome === null) {
    biome = await Biome.create({ distribution: Distribution.NODE });
  }

  const project = biome.openProject();

  biome.applyConfiguration(project.projectKey, {
    formatter: { enabled: true, indentStyle: 'space', lineWidth: 100 },
    javascript: { formatter: { quoteStyle: 'single' } },
  });

  const formatted = biome.formatContent(project.projectKey, content, {
    filePath: path.basename(filePath),
  });

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(filePath, formatted.content, 'utf8');
};

export const serialize = async (routes: TRoutesTree, outputPath: string) => {
  const rawCode = `
  // GENERATED WITH TS-FILE-ROUTER DO NOT EDIT

  export const routes = ${stringifyRoutes(routes)} as const;
  \n`;

  try {
    await format(path.resolve(outputPath), rawCode);

    console.log('✨ File was parsed succesfully');
  } catch (err) {
    console.error('❌ Error parsing file:\n', err);
  }
};
