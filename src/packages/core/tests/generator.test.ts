import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateFileRouter } from '../src/generator.js';
import { FileHelper } from '../src/helpers/fileHelper.js';

describe('FileHelper', () => {
  it('only ignores the generated output file', () => {
    expect(FileHelper.getIgnoredFiles('/a/routes.ts', 'routes.ts')).toBe(true);
    expect(FileHelper.getIgnoredFiles('/a/page.tsx', 'routes.ts')).toBe(false);
  });

  it('does not ignore files inside folders named like the output', () => {
    expect(
      FileHelper.getIgnoredFiles('/a/routes.ts.d/page.tsx', 'routes.ts'),
    ).toBe(false);
  });
});

describe('generateFileRouter', () => {
  let dir: string;

  const write = (rel: string) => {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'export default () => null;');
  };

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fr-'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const generate = async (outputFilename?: string) => {
    await generateFileRouter({ dir, outputFilename });

    return fs.readFileSync(
      path.join(dir, outputFilename ?? 'routes.ts'),
      'utf8',
    );
  };

  it('maps page and layout files to their semantic route keys', async () => {
    write('page.tsx');
    write('layout.tsx');

    const out = await generate();

    expect(out).toContain('index: {');
    expect(out).toContain('_layout: {');
    expect(out).toContain('GENERATED WITH TS-FILE-ROUTER');
  });

  it('uses directories as route segments and maps their page files to index routes', async () => {
    write('users/page.tsx');
    write('users/$id/page.tsx');
    write('users/$id/layout.tsx');

    const out = await generate();

    expect(out).toContain('import("./users/page.tsx")');
    expect(out).toContain('import("./users/$id/page.tsx")');
    expect(out).toContain('import("./users/$id/layout.tsx")');
    expect(out).toContain('$id: {');
    expect(out).not.toContain('$id.tsx');
  });

  it('ignores index barrels, hooks, and non-semantic files', async () => {
    write('page.tsx');
    write('index.tsx');
    write('users/index.tsx');
    write('users/page.hook.ts');
    write('users/use-user.hook.ts');
    write('users/helpers.ts');
    write('users/styles.css');

    const out = await generate();

    expect(out).not.toContain('index.tsx');
    expect(out).not.toContain('.hook.ts');
    expect(out).not.toContain('helpers.ts');
    expect(out).not.toContain('styles.css');
    expect(out).not.toContain('users:');
  });

  it('ignores dynamic-looking files because dynamic segments are folders', async () => {
    write('$id.tsx');

    const out = await generate();

    expect(out).not.toContain('$id.tsx');
  });

  it('never lists the generated file itself and is stable across runs', async () => {
    write('page.tsx');

    const first = await generate();
    const second = await generate();

    expect(second).toBe(first);
    expect(first).not.toContain('routes.ts"');
  });

  it('supports a custom output filename', async () => {
    write('page.tsx');

    const out = await generate('pages.gen.ts');

    expect(out).toContain('index: {');
  });

  it('keeps folders containing "index" in their name', async () => {
    write('reindex/page.tsx');

    expect(await generate()).toContain('import("./reindex/page.tsx")');
  });

  it('throws without a dir', async () => {
    await expect(generateFileRouter({ dir: '' })).rejects.toThrow();
  });
});
