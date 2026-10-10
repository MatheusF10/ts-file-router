#!/usr/bin/env bash
# Publishes the public workspace package if its version is not yet on npm.
# Usage: publish-changed.sh [--dry-run]
set -euo pipefail

PACKAGE_DIR="src/packages/core"
DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

json_field() { sed -n "s/^[[:space:]]*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -n 1; }

name="$(json_field name < "$PACKAGE_DIR/package.json")"
version="$(json_field version < "$PACKAGE_DIR/package.json")"
spec="$name@$version"

if [[ -n "$(npm view "$spec" version 2>/dev/null || true)" ]]; then
  echo "$spec already published, skipping."
  exit 0
fi

echo "Publishing $spec..."
args=(publish --workspace "$name" --access public --provenance)
[[ $DRY_RUN -eq 1 ]] && args+=(--dry-run)
npm "${args[@]}"
[[ $DRY_RUN -eq 0 ]] && git tag "$spec"
