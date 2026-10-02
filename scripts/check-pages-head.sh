#!/usr/bin/env bash
# Run inside the serialized Pages deployment job, immediately before publishing.
set -euo pipefail

built_sha=$(git rev-parse HEAD)
master_sha=$(git ls-remote --exit-code origin refs/heads/master | cut -f1)
if [[ "$built_sha" == "$master_sha" ]]; then
  echo 'current=true' >> "$GITHUB_OUTPUT"
else
  echo 'current=false' >> "$GITHUB_OUTPUT"
  echo "::notice::Skipping superseded Pages snapshot $built_sha; master is $master_sha"
fi
