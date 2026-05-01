#!/usr/bin/env bash
#
# One-time setup: copy the tree-guard hook into .git/hooks/pre-commit.
# Run from repo root: `bash scripts/install-git-hooks.sh`
#
# .git/hooks/ is NOT version-controlled, so each clone needs this run once.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SRC="$REPO_ROOT/scripts/pre-commit-tree-guard.sh"
DST="$REPO_ROOT/.git/hooks/pre-commit"

if [[ ! -f "$SRC" ]]; then
  echo "✗ Source hook not found: $SRC"
  exit 1
fi

cp "$SRC" "$DST"
chmod +x "$DST"

echo "✓ Installed pre-commit hook → $DST"
echo "  Tree-shrink guard active. Commits that drop more than 20% of files will be blocked."
