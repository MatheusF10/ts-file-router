#!/usr/bin/env bash
# Fails when a workspace package has code changes but no version bump.
# Usage: check-version-bump.sh <baseRef> [headRef]
set -euo pipefail

BASE="${1:-}"
HEAD_REF="${2:-HEAD}"
PACKAGE_JSON="src/packages/core/package.json"

# Paths that never require a release.
IGNORED_REGEX='(^|/)(tests?/|docs?/|__tests__/)|(LICENSE|CHANGELOG)(/|$)|(^|/)(jest|vitest)\.config\.|(^|/)\.[^/]+$|\.(test|spec)\.[cm]?[jt]sx?$|\.mdx?$'

json_field() { sed -n "s/^[[:space:]]*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -n 1; }

# Prints 1 if $1 > $2, otherwise 0 (semver, including pre-releases).
version_gt() {
  local a="$1" b="$2" ca cb pa pb
  ca="${a%%-*}"; cb="${b%%-*}"
  pa=""; pb=""
  [[ "$a" == *-* ]] && pa="${a#*-}"
  [[ "$b" == *-* ]] && pb="${b#*-}"
  if [[ "$ca" != "$cb" ]]; then
    [[ "$(printf '%s\n%s\n' "$ca" "$cb" | sort -V | tail -n 1)" == "$ca" ]] && echo 1 || echo 0
    return
  fi
  if [[ "$pa" == "$pb" ]]; then echo 0
  elif [[ -z "$pa" ]]; then echo 1
  elif [[ -z "$pb" ]]; then echo 0
  else [[ "$(printf '%s\n%s\n' "$pa" "$pb" | sort -V | tail -n 1)" == "$pa" ]] && echo 1 || echo 0
  fi
}

if [[ -z "$BASE" || "$BASE" =~ ^0+$ ]]; then
  BASE="$(git rev-parse --verify -q 'origin/master^{commit}' || true)"
fi
if [[ -z "$BASE" ]]; then
  echo "No base ref to compare against; skipping version check."
  exit 0
fi

MERGE_BASE="$(git merge-base "$BASE" "$HEAD_REF" 2>/dev/null || echo "$BASE")"
CHANGED="$(git diff --name-only "$MERGE_BASE" "$HEAD_REF")"

code_changes=""
while IFS= read -r file; do
  [[ "$file" == src/packages/* ]] || continue
  rel="${file#src/packages/}"
  [[ "$rel" == */package.json ]] && continue
  [[ "$rel" =~ $IGNORED_REGEX ]] && continue
  code_changes+="    - $file"$'\n'
done <<< "$CHANGED"
[[ -z "$code_changes" ]] && { echo "No package code changes; version check passed."; exit 0; }

previous_json="$(git show "$MERGE_BASE:$PACKAGE_JSON" 2>/dev/null || true)"
[[ -z "$previous_json" ]] && { echo "No previous package version to compare; skipping version check."; exit 0; }

name="$(json_field name < "$PACKAGE_JSON")"
current="$(json_field version < "$PACKAGE_JSON")"
previous="$(printf '%s' "$previous_json" | json_field version)"
failed=0
if [[ "$(version_gt "$current" "$previous")" != "1" ]]; then
  failed=1
  printf '\nVersion bump required\n\n  %s is still at %s but has package code changes:\n%s' "$name" "$current" "$code_changes" >&2
fi

if [[ $failed -ne 0 ]]; then
  printf '\nUpdate the version in %s (semver).\nChanges to tests, docs (*.md) and test configs do not require a bump.\n\n' "$PACKAGE_JSON" >&2
  exit 1
fi
echo "Version check passed."
