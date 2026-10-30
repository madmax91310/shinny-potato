#!/usr/bin/env bash
# Repeat the producer's financial checks on the actual combined tree.
set -euo pipefail
if [[ -n "${VALIDATED_DATA_ORIGINAL_BASE:-}" && "$(git rev-parse HEAD^)" == "$VALIDATED_DATA_ORIGINAL_BASE" ]]; then
  echo 'Original producer validation still applies; no upstream input changed.'
  exit 0
fi
case "${1:-}" in
  actors|regulatory|holdings|non-bond|scpi|publication|insurance|indices) ;;
  *) echo 'Unknown producer revalidation contract' >&2; exit 2 ;;
esac
if [[ "$1" == actors || "$1" == scpi || "$1" == publication || "$1" == insurance || "$1" == indices ]]; then
  python3 scripts/observation_rebase_guard.py --kind "$1" --base "${VALIDATED_DATA_ORIGINAL_BASE:?Missing collection base}"
fi
npm ci --ignore-scripts
case "$1" in
  actors)
    python3 -m unittest discover -s scripts -p 'test_presentation_actors.py'
    node scripts/test-presentations.mjs
    ;;
  indices)
    for pattern in test_complete_index_sheets.py test_world_sector_indices.py test_index_composition_gate.py test_index_companies.py test_korea_companies.py; do
      python3 -m unittest discover -s scripts -p "$pattern"
    done
    node scripts/build-index-company-compositions.mjs
    node scripts/test-index-proxy-identity.mjs
    node scripts/test-index-concentration.mjs
    node scripts/test-automated-index-sheets.mjs
    node scripts/test-automated-indices.mjs
    npm run audit:index-facts
    ;;
  insurance)
    python3 -m unittest discover -s scripts -p 'test_insurance.py'
    python3 -m unittest discover -s scripts -p 'test_publication_periods.py'
    node scripts/test-insurance.mjs
    ;;
  scpi)
    for pattern in test_scpi.py test_iroko_snapshot.py 'test_corum*.py' test_extended_scpi.py test_publication_periods.py; do
      python3 -m unittest discover -s scripts -p "$pattern"
    done
    node scripts/test-scpi.mjs
    ;;
  publication)
    python3 -m unittest discover -s scripts -p 'test_publication*.py'
    node scripts/test-anniversary-indices.mjs
    node scripts/test-publication-consumers.mjs
    node scripts/test-household-benchmarks.mjs
    node scripts/test-purchasing-power-editorial.mjs
    ;;
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
    python -m unittest discover -s scripts -p 'test_security_candidate_names.py'
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
  actors) git diff --exit-code HEAD -- src/data/automated-presentation-actors.json ;;
  indices) git diff --exit-code HEAD -- src/data/automated-indices.json src/data/index-company-observations.json src/data/index-company-qualified.json ;;
  insurance) git diff --exit-code HEAD -- src/data/automated-insurance.json ;;
  scpi) git diff --exit-code HEAD -- src/data/automated-scpi.json ;;
  publication) git diff --exit-code HEAD -- src/data/purchasing-power-observations.json src/data/anniversary-levels.json src/data/anniversary-index-history.json scripts/source-snapshots/anniversary-indices.json ;;
  regulatory) git diff --exit-code HEAD -- src/data/automated-regulatory.json src/data/automated-broker-tariffs.json ;;
  holdings) git diff --exit-code HEAD -- src/data/dca-complete-holdings.json src/data/dca-holdings-status.json ;;
  non-bond) git diff --exit-code HEAD -- src/data/non-bond-etf-records.json src/data/non-bond-qualified-records.json ;;
esac
