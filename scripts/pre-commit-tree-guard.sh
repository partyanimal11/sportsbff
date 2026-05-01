#!/usr/bin/env bash
#
# pre-commit hook — refuse to commit if the resulting tree would be
# drastically smaller than HEAD's. Catches the "sandbox-corrupted index"
# bug where a commit ships only 2-3 files and Vercel fails with
# "page.tsx doesn't have a root layout."
#
# Install: `bash scripts/install-git-hooks.sh` (run once after cloning).
#
# Tunable: TOLERANCE = max % of files we're willing to lose in one commit.

set -euo pipefail

TOLERANCE_PCT=20  # refuse if tree shrinks by more than this %

# Count files in current HEAD tree
head_count=$(git ls-tree -r HEAD 2>/dev/null | wc -l | tr -d ' ')

# Count files that would be in the new tree (= staged index)
# `git ls-files -s` lists every entry in the index — that's exactly what
# `git write-tree` would persist into the next commit.
staged_count=$(git ls-files -s | wc -l | tr -d ' ')

if [[ "$head_count" -eq 0 ]]; then
  # Initial commit — nothing to compare against, allow it
  exit 0
fi

# Compute % of files retained
pct_retained=$(( staged_count * 100 / head_count ))
min_pct=$(( 100 - TOLERANCE_PCT ))

if [[ "$pct_retained" -lt "$min_pct" ]]; then
  echo ""
  echo "✗ pre-commit BLOCKED: tree would shrink from $head_count → $staged_count files"
  echo "  (only $pct_retained% retained, threshold is $min_pct%)"
  echo ""
  echo "  This is the 'sandbox-corrupted index' bug. To recover:"
  echo ""
  echo "    git rm --cached -r ."
  echo "    git add -A"
  echo "    git status | head"
  echo "    # confirm ~$head_count files are staged again, then re-run your commit"
  echo ""
  echo "  If you really mean to delete this many files, bypass with:"
  echo "    git commit --no-verify ..."
  echo ""
  exit 1
fi

# Healthy commit — pass
exit 0
