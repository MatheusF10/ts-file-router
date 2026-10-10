import type { ComponentType } from 'react';
import type {
  TRouteLeaf as TCoreRouteLeaf,
  TRouteTree as TCoreRouteTree,
} from 'ts-file-router/core';

export type TRouteComponentModule = { default: ComponentType<any> };

export type TRouteLeaf = TCoreRouteLeaf<TRouteComponentModule>;
export type TRouteTree = TCoreRouteTree<TRouteComponentModule>;

type TJoin<A extends string, B extends string> = B extends ''
  ? A
  : `${A}/${B}`;

// index -> '' | $id -> ':id' | $ -> '*'
type TSegment<K extends string> = K extends 'index'
  ? ''
  : K extends '$'
    ? '*'
    : K extends `$${infer P}`
      ? `:${P}`
      : K;

type TNormalize<P extends string> = P extends '' ? '/' : P;

type TCollect<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends { import: unknown }
    ? K extends '_layout'
      ? never
      : TJoin<Prefix, TSegment<K>>
    : TCollect<T[K], TJoin<Prefix, TSegment<K>>>;
}[keyof T & string];

/** Union of every URL pattern generated from the routes object, e.g. '/users/:id' */
export type TRoutePaths<T extends TRouteTree> = TNormalize<
  TCollect<T> extends infer P extends string ? `/${P}` | P : never
> extends infer R
  ? R extends '/' | `/${string}`
    ? R extends `//${string}`
      ? never
      : R
    : never
  : never;

type TParamNames<P extends string> =
  P extends `${string}:${infer Name}/${infer Rest}`
    ? Name | TParamNames<`/${Rest}`>
    : P extends `${string}:${infer Name}`
      ? Name
      : P extends `${string}/*`
        ? '*'
        : never;

/** Params object required by a path pattern */
export type TRouteParams<P extends string> = [TParamNames<P>] extends [never]
  ? Record<string, never>
  : { [K in TParamNames<P>]: string | number };

export type TRouteArgs<P extends string> = [TParamNames<P>] extends [never]
  ? [params?: undefined]
  : [params: TRouteParams<P>];
