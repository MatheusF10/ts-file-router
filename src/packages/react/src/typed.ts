import { createElement, type ComponentProps } from 'react';
import {
  Link as RouterLink,
  generatePath,
  useNavigate as useRouterNavigate,
  type NavigateOptions,
} from 'react-router-dom';
import type { TRouteArgs, TRoutePaths, TRouteTree } from './types.js';

type TLinkProps<P extends string> = Omit<
  ComponentProps<typeof RouterLink>,
  'to'
> & {
  to: P;
} & (TRouteArgs<P> extends [params?: undefined]
    ? { params?: undefined }
    : { params: TRouteArgs<P>[0] });

const fill = (path: string, params?: object) =>
  (generatePath as (p: string, v?: object) => string)(path, params ?? {});

/**
 * Creates type-safe helpers bound to your generated routes:
 *   const { Link, useNavigate, buildPath } = createTypedRouter<typeof routes>();
 */
export const createTypedRouter = <T extends TRouteTree>() => {
  type Path = TRoutePaths<T>;

  const buildPath = <P extends Path>(path: P, ...args: TRouteArgs<P>) =>
    fill(path, args[0]);

  const Link = <P extends Path>({ to, params, ...rest }: TLinkProps<P>) =>
    createElement(RouterLink, {
      ...rest,
      to: fill(to, params),
    });

  const useNavigate = () => {
    const navigate = useRouterNavigate();

    return <P extends Path>(
      path: P,
      ...args: [...TRouteArgs<P>, options?: NavigateOptions]
    ) => {
      const params = (args[0] ?? {}) as Record<string, string>;
      const options = args[1] as NavigateOptions | undefined;

      return navigate(fill(path, params), options);
    };
  };

  return { Link, useNavigate, buildPath };
};
