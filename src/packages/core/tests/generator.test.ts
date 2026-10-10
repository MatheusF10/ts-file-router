import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateFileRouter } from '../src/generator.js';
import { FileHelper } from '../src/helpers/fileHelper.js';

describe('FileHelper', () => {
  it('only ignores the generated output file', () => {
    expect(FileHelper.getIgnoredFiles('/a/routes.ts', 'routes.ts')).toBe(true);
    expect(FileHelper.getIgnoredFiles('/a/index.tsx', 'routes.ts')).toBe(false);
    expect(FileHelper.getIgnoredFiles('/a/_layout.tsx', 'routes.ts')).toBe(
      false,
    );
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

  it('includes index and _layout files', async () => {
    write('index.tsx');
    write('_layout.tsx');

    const out = await generate();

    expect(out).toContain('index: {');
    expect(out).toContain('_layout: {');
    expect(out).toContain('GENERATED WITH TS-FILE-ROUTER');
  });

  it('resolves nested imports relative to the routes file', async () => {
    write('users/$id.tsx');
    write('users/deep/page.tsx');

    const out = await generate();

    expect(out).toContain('import("./users/$id.tsx")');
    expect(out).toContain('import("./users/deep/page.tsx")');
  });

  it('never lists the generated file itself and is stable across runs', async () => {
    write('home.tsx');

    const first = await generate();
    const second = await generate();

    expect(second).toBe(first);
    expect(first).not.toContain('routes.ts"');
  });

  it('supports a custom output filename', async () => {
    write('home.tsx');

    const out = await generate('pages.gen.ts');

    expect(out).toContain('home: {');
  });

  it('keeps folders containing "index" in their name', async () => {
    write('reindex/page.tsx');

    expect(await generate()).toContain('import("./reindex/page.tsx")');
  });

  it('throws without a dir', async () => {
    await expect(generateFileRouter({ dir: '' })).rejects.toThrow();
  });
});
