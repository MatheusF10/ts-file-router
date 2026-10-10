import { describe, expect, expectTypeOf, it } from 'vitest';
import { createTypedRouter } from '../src/typed.js';
import type { TRoutePaths } from '../src/types.js';

const l = { default: () => null };
const leaf = { path: '', import: async () => l };
const routes = {
  index: leaf,
  _layout: leaf,
  users: { index: leaf, $id: leaf, posts: { $postId: leaf } },
  files: { $: leaf },
} as const;

type Paths = TRoutePaths<typeof routes>;

describe('types', () => {
  it('computes the path union', () => {
    expectTypeOf<Paths>().toEqualTypeOf<
      '/' | '/users' | '/users/:id' | '/users/posts/:postId' | '/files/*'
    >();
  });
});

describe('buildPath', () => {
  const { buildPath } = createTypedRouter<typeof routes>();

  it('fills params', () => {
    expect(buildPath('/users/:id', { id: 7 })).toBe('/users/7');
    expect(buildPath('/users/posts/:postId', { postId: 'a b' })).toContain('a');
  });

  it('keeps static paths', () => {
    expect(buildPath('/users')).toBe('/users');
    expect(buildPath('/')).toBe('/');
  });
});
