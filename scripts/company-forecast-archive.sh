#!/usr/bin/env bash
# Invoked only by the production refresh, after model and source validation.
set -euo pipefail
root=$(git rev-parse --show-toplevel)
archive=$(mktemp -d)
trap 'git -C "$root" worktree remove --force "$archive" >/dev/null 2>&1 || rm -rf "$archive"' EXIT
branch=company-forecast-history
if git ls-remote --exit-code --heads origin "$branch" >/dev/null; then
  git fetch origin "$branch"
  git worktree add --detach "$archive" FETCH_HEAD
else
  git worktree add --detach "$archive" HEAD
  git -C "$archive" checkout --orphan "$branch"
  git -C "$archive" rm -rf . >/dev/null
fi
node scripts/company-forecast-ledger.mjs "$archive" "$root/src/data/company-forecast-evaluation.json" "$(git rev-parse HEAD)"
git -C "$archive" config user.name 'github-actions[bot]'
git -C "$archive" config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git -C "$archive" add forecasts evaluation.json
# Original forecast files must never be changed or removed.
if git -C "$archive" rev-parse --verify HEAD >/dev/null 2>&1; then
  if [ -n "$(git -C "$archive" diff --cached --name-only --diff-filter=DM -- forecasts/)" ]; then
    echo 'Refusing to alter an existing forecast' >&2
    exit 1
  fi
fi
if ! git -C "$archive" diff --cached --quiet; then
  git -C "$archive" commit -m "Archive automatic company forecasts $(date -u +%F)"
  git -C "$archive" push origin "HEAD:$branch"
fi
