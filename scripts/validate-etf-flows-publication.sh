#!/usr/bin/env bash
set -euo pipefail

# Replaying a registry write is safe only if the exact acquisition inputs and
# publication readers agree with the checkout that performed the collection.
base=${VALIDATED_DATA_ORIGINAL_BASE:?Missing weekly ETF flows collection base}
if ! git diff --quiet "$base" HEAD^ -- \
    .github/workflows/update-etf-flows.yml \
    'scripts/*etf-flows*' scripts/fixtures/etf-flows \
    src/lib/etf-flows.js src/data/etf-flows.json \
    src/data/etf-flows-weekly.json src/data/freshness-policy.json \
    src/pages/etf-flows; then
  echo 'Weekly ETF flows inputs changed after collection; acquire from current master.' >&2
  exit 1
fi
node scripts/test-etf-flows.mjs
node scripts/test-etf-flows-weekly.mjs
