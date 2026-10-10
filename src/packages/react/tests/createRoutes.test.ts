import { describe, expect, it } from 'vitest';
import { createRouteObjects, toSegment } from '../src/createRoutes.js';

const page = { default: () => null };
const leaf = () => ({ path: '', import: async () => page });

describe('toSegment', () => {
  it.each([
    ['index', ''],
    ['$', '*'],
    ['$id', ':id'],
    ['about', 'about'],
  ])('%s -> %s', (key, expected) => {
    expect(toSegment(key)).toBe(expected);
  });
});

describe('createRouteObjects', () => {
  it('maps index to an index route', () => {
    const [route] = createRouteObjects({ index: leaf() });

    expect(route.index).toBe(true);
    expect(route.path).toBeUndefined();
  });

  it('maps dynamic and splat segments', () => {
    const routes = createRouteObjects({ $id: leaf(), $: leaf() });

    expect(routes.map((r) => r.path)).toEqual([':id', '*']);
  });

  it('nests directories as children and uses _layout as the parent element', () => {
    const [users] = createRouteObjects({
      users: { _layout: leaf(), index: leaf(), $id: leaf() },
    });

    expect(users.path).toBe('users');
    expect(users.element).toBeTruthy();
    expect(users.children).toHaveLength(2);
    expect(users.children?.[0].index).toBe(true);
  });

  it('wraps everything in a pathless layout route for a root _layout', () => {
    const routes = createRouteObjects({ _layout: leaf(), about: leaf() });

    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBeUndefined();
    expect(routes[0].children?.[0].path).toBe('about');
  });

  it('does not emit _layout as a route', () => {
    const routes = createRouteObjects({ users: { _layout: leaf(), a: leaf() } });

    expect(routes[0].children?.map((c) => c.path)).toEqual(['a']);
  });

  it('returns an empty list for empty routes', () => {
    expect(createRouteObjects({})).toEqual([]);
  });
});
