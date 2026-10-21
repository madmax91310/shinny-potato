#!/usr/bin/env bash
# Repeat the producer's financial checks on the actual combined tree.
set -euo pipefail
if [[ -n "${VALIDATED_DATA_ORIGINAL_BASE:-}" && "$(git rev-parse HEAD^)" == "$VALIDATED_DATA_ORIGINAL_BASE" ]]; then
  echo 'Original producer validation still applies; no upstream input changed.'
  exit 0
fi
case "${1:-}" in
  regulatory|holdings|non-bond) ;;
  *) echo 'Unknown producer revalidation contract' >&2; exit 2 ;;
esac
npm ci --ignore-scripts
case "$1" in
  regulatory)
    python -m unittest discover -s scripts -p 'test_regulatory*.py'
    python -m unittest discover -s scripts -p 'test_broker_tariff*.py'
    node scripts/test-regulatory-consumers.mjs
    node scripts/test-broker-automation.mjs
    ;;
  holdings)
    python -m unittest discover -s scripts -p 'test_dca*py'
    python -m unittest discover -s scripts -p 'test_physical_holdings.py'
    python -m unittest discover -s scripts -p 'test_lifestrategy_holdings.py'
    python -m unittest discover -s scripts -p 'test_wisdomtree*py'
    python -m unittest discover -s scripts -p 'test_lg_discovery.py'
    ;;
  non-bond)
    python -m unittest discover -s scripts -p 'test_non_bond_expansion.py'
    python -m unittest discover -s scripts -p 'test_support_expansion.py'
    npm run audit:calculator-series
    node scripts/test-data-reuse.mjs
    ;;
esac
npm run build
node scripts/test-consumer-usage.mjs
npm run audit:data-catalog
npm run audit:data-provenance
if [[ "$1" == holdings ]]; then node scripts/test-dca-profiles.mjs; fi
case "$1" in
  regulatory) git diff --exit-code HEAD -- src/data/automated-regulatory.json src/data/automated-broker-tariffs.json ;;
  holdings) git diff --exit-code HEAD -- src/data/dca-complete-holdings.json src/data/dca-holdings-status.json ;;
  non-bond) git diff --exit-code HEAD -- src/data/non-bond-etf-records.json src/data/non-bond-qualified-records.json ;;
esac
