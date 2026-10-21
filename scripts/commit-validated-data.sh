#!/usr/bin/env bash
# Publish only the explicitly validated paths, without touching the caller's
# index or generated working files. Never force-push or resolve data conflicts.
set -euo pipefail
if (( $# < 2 )); then
  echo 'Usage: commit-validated-data.sh MESSAGE PATH...' >&2
  exit 2
fi
message=$1
shift
publication_helper="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/data_publication.py"
root=$(git rev-parse --show-toplevel)
cd "$root"
if [[ -f .refresh-rehearsal.json ]]; then
  echo "Synthetic rehearsal data cannot be published." >&2
  exit 1
fi
base=$(git rev-parse HEAD)
task_dir=$(mktemp -d)
cleanup() {
  git worktree remove --force "$task_dir/checkout" 2>/dev/null || true
  rm -rf "$task_dir"
}
trap cleanup EXIT
GIT_INDEX_FILE="$task_dir/index" git read-tree "$base"
GIT_INDEX_FILE="$task_dir/index" git add -- "$@"
tree=$(GIT_INDEX_FILE="$task_dir/index" git write-tree)
changed=false
if [[ "$tree" == "$(git rev-parse "$base^{tree}")" ]]; then
  result=$base
else
  commit=$(printf '%s\n' "$message" | git commit-tree "$tree" -p "$base")
  git worktree add --detach "$task_dir/checkout" "$commit"
  result=''
  for attempt in 1 2 3; do
    git -C "$task_dir/checkout" fetch origin master
    remote_head=$(git -C "$task_dir/checkout" rev-parse FETCH_HEAD)
    if [[ "$remote_head" != "$base" && -z "${VALIDATED_DATA_CHECK:-}" ]]; then
      echo 'Remote inputs changed after collection. Rerun the collector from current master; no unvalidated rebase will be published.' >&2
      exit 1
    fi
    git -C "$task_dir/checkout" rebase FETCH_HEAD
    if [[ -n "${VALIDATED_DATA_CHECK:-}" ]]; then
      (cd "$task_dir/checkout" && VALIDATED_DATA_ORIGINAL_BASE="$base" bash -e -c "$VALIDATED_DATA_CHECK")
    fi
    if git -C "$task_dir/checkout" push origin HEAD:master; then
      result=$(git -C "$task_dir/checkout" rev-parse HEAD)
      changed=true
      break
    fi
    echo "Push refused (attempt $attempt/3); checking the new remote head." >&2
  done
  if [[ -z "$result" ]]; then
    echo 'Validated data could not be recorded after three attempts.' >&2
    exit 1
  fi
fi
printf 'commit_sha=%s\n' "$result" >> "${GITHUB_OUTPUT:-/dev/stdout}"
printf 'changed=%s\n' "$changed" >> "${GITHUB_OUTPUT:-/dev/stdout}"
# Proof is generated from the committed tree, including rebases, never from uncommitted files.
python3 "$publication_helper" receipt --commit "$result" --output "${RUNNER_TEMP:-/tmp}/data-publication-receipt.json" -- "$@"

