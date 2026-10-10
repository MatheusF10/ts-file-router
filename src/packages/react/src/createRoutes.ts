import { Suspense, lazy, createElement, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { TRouteLeaf, TRouteTree } from './types.js';

const isLeaf = (node: TRouteLeaf | TRouteTree): node is TRouteLeaf =>
  typeof (node as TRouteLeaf).import === 'function';

export const toSegment = (key: string) => {
  if (key === 'index') return '';
  if (key === '$') return '*';
  if (key.startsWith('$')) return `:${key.slice(1)}`;

  return key;
};

const lazyElement = (leaf: TRouteLeaf, fallback: ReactNode) =>
  createElement(
    Suspense,
    { fallback },
    createElement(lazy(leaf.import as () => Promise<{ default: any }>)),
  );

const build = (tree: TRouteTree, fallback: ReactNode): RouteObject[] => {
  const routes: RouteObject[] = [];

  for (const [key, node] of Object.entries(tree)) {
    if (key === '_layout') {
      continue;
    }

    if (isLeaf(node)) {
      routes.push(
        key === 'index'
          ? { index: true, element: lazyElement(node, fallback) }
          : { path: toSegment(key), element: lazyElement(node, fallback) },
      );

      continue;
    }

    const layout = node._layout;
    const children = build(node, fallback);

    routes.push({
      path: toSegment(key),
      ...(layout && isLeaf(layout)
        ? { element: lazyElement(layout, fallback) }
        : {}),
      children,
    });
  }

  return routes;
};

/** Converts the generated routes object into React Router route objects */
export const createRouteObjects = (
  routes: TRouteTree,
  fallback: ReactNode = null,
): RouteObject[] => {
  const children = build(routes, fallback);
  const layout = routes._layout;

  if (layout && isLeaf(layout)) {
    return [{ element: lazyElement(layout, fallback), children }];
  }

  return children;
};
