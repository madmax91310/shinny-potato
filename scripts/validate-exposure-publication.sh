#!/usr/bin/env bash
# Same financial checks initially and after the two qualified independent writes.
set -euo pipefail
mode=${1:?Missing mode}
case "$mode" in
  validate) base=$(git rev-parse HEAD) ;;
  prepare|check) base=${VALIDATED_DATA_ORIGINAL_BASE:?Missing collection base} ;;
  *) echo 'Usage: validate-exposure-publication.sh validate|prepare|check' >&2; exit 2 ;;
esac
if [[ "$mode" != validate ]]; then
  python3 scripts/validate_exposure_publication.py inputs --base "$base"
fi
if [[ "$mode" == prepare ]]; then
  npm ci --ignore-scripts
  node scripts/build-dca-exposures.mjs
  exit 0
fi
python3 scripts/validate_exposure_publication.py validate --base "$base" \
  --report "$RUNNER_TEMP/exposure-expansion.json" \
  --plan "$RUNNER_TEMP/exposure-expansion.contract-plan.json"
if [[ "$mode" == check && "$(git rev-parse HEAD^)" == "$base" ]]; then
  echo 'Original financial checks apply: no upstream input changed.'
  exit 0
fi
npm run build
node scripts/test-exposure-expansion.mjs
if [[ "$mode" == check ]]; then
  git diff --exit-code HEAD -- src/data/exposure-etf-expansion-records.json \
    src/pages/dca-profiles/catalog.json src/pages/dca-profiles/exposures*.json \
    src/pages/dca-profiles/holdings*.json
fi
