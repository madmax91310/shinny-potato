#!/usr/bin/env bash
# The initial validation and rebased publication use the same financial contract.
set -euo pipefail
mode=${1:-}
case "$mode" in
  validate|project) ;;
  prepare|check)
    if [[ "$(git rev-parse HEAD^)" == "${VALIDATED_DATA_ORIGINAL_BASE:?Missing collection base}" ]]; then
      echo 'Original ETF validation still applies; no upstream input changed.'
      exit 0
    fi
    python3 scripts/market_reader_revalidation.py --kind etf --base "$VALIDATED_DATA_ORIGINAL_BASE"
    ;;
  *) echo 'Usage: validate-etf-publication.sh validate|project|prepare|check' >&2; exit 2 ;;
esac
if [[ "$mode" == prepare ]]; then
  npm ci --ignore-scripts
fi
if [[ "$mode" == project || "$mode" == prepare ]]; then
  # Coverage and targets both read the native top tens. Derive those from the
  # same holdings and identities as the build before preparing publication.
  node scripts/build-native-fund-details.mjs
  node scripts/build-automation-targets.mjs
  node scripts/report-automation-coverage.mjs --write
  node scripts/build-app-inventory.mjs
  exit 0
fi
node scripts/test-asset-field-coverage.mjs
node scripts/test-data-qualification.mjs
node scripts/test-field-diagnostics.mjs
node scripts/test-automation-gap-inventory.mjs
node scripts/test-priority-issuer-consumers.mjs
npm run audit:data-review
npm run audit:index-facts
npm run audit:index-completeness
node scripts/test-automated-indices.mjs
node scripts/test-automated-index-sheets.mjs
npm run audit:etf-annual-performance
npm run audit:etf-completeness
npm run audit:etf-consistency
node scripts/test-four-issuer-consumers.mjs
npm run audit:calculator-series
node scripts/test-comparison-etf-details.mjs
npm run build
if [[ "$mode" == check ]]; then
  # Build generators must agree with the exact prepared publication tree.
  git diff --exit-code HEAD --name-only -- src/data/annual-fx.json src/data/official-performance-currencies.json src/data/automated-etf.json src/data/automated-indices.json src/data/native-fund-details.json docs/automation-coverage.md docs/automation-gaps.md docs/automation-gaps.json docs/asset-field-coverage.md public/data/asset-field-coverage.json docs/app-inventory.md scripts/instrument-metadata-sources.json scripts/generated-holdings-sources.json
fi
