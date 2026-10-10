# Copilot Instructions

## Package naming

- Prefer package entry-point subpaths in the `ts-file-router/<platform>` format, such as `ts-file-router/react`, `ts-file-router/vite`, and `ts-file-router/node`.
- Use this format for new platform-specific entry points and when referring to these entry points in code or documentation; avoid hyphenated variants such as `ts-file-router-react` or `ts-file-router-vite`.
- Treat these names as import/export subpaths, not as standalone npm package names.

## Agentic rules

### Bundle size

- Keep the bundle small: avoid adding dependencies unless clearly justified, and prefer small or native alternatives.
- Keep modules tree-shakeable: use named exports, avoid side effects at module top level, and avoid barrel files that pull in unrelated code.
- Keep platform-specific code (`react`, `vite`, `node`) out of the core entry point so consumers only pay for what they import.

### Performance

- Prioritize O(n) solutions and avoid O(n^2) or worse; use `Map`/`Set` for lookups instead of nested loops or repeated `find`/`includes` on arrays.
- Avoid redundant traversals, repeated filesystem reads, and unnecessary allocations in hot paths (route scanning, matching).

### Clean code

- Write small, single-purpose functions with clear names; prefer readability over cleverness.
- Avoid dead code, duplication, and magic values; comment only where intent is not obvious.

### Architecture and coupling

- Avoid tight coupling: depend on small interfaces and pass dependencies explicitly.
- Never introduce cyclic dependencies between modules or entry points.
- Avoid interdependence between packages/entry points (`ts-file-router/react`, `ts-file-router/vite`, `ts-file-router/node`): each platform entry point may depend on the core, but never on another platform entry point. Share code only via the core.
