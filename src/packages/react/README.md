# ts-file-router/react

React Router integration for `ts-file-router`: lazy pages, type-safe paths, a provider and a Vite plugin.

```ts
// vite.config.ts
import { reactFileRouter } from 'ts-file-router/react/vite';
export default { plugins: [reactFileRouter({ dir: 'src/pages' })] };
```

```tsx
// main.tsx
import { FileRouterProvider, createTypedRouter } from 'ts-file-router/react';
import { routes } from './pages/routes';

export const { Link, useNavigate, buildPath } =
  createTypedRouter<typeof routes>();

<FileRouterProvider
  routes={routes}
  fallback={<p>Loading...</p>}
  notFound={<p>404</p>}
/>;
```

## Any bundler (CLI)

The generator is plain Node, so webpack, Rspack, Parcel, esbuild, etc. only need to run it before/along the dev server:

```json
{
  \"dev\": \"ts-file-router generate --dir src/pages --watch & webpack serve\",
  \"build\": \"ts-file-router generate --dir src/pages && webpack\"
}
```

Flags: `--dir <pages>`, `--out <file>` (default routes.ts), `--watch`, `--debounce <ms>`. The Vite plugin above is just a convenience wrapper.

File conventions (file name = key): `index` -> directory root, `$id` -> `:id`, `$` -> splat `*`,
`_layout` -> layout rendered around the directory (must render `<Outlet />`).
Pages must `export default` a component.

```tsx
<Link to="/users/:id" params={{ id: 1 }} />;
buildPath('/users/:id', { id: 1 });
```
