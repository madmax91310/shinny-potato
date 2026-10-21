#!/usr/bin/env bash
# Revalidate on the actual rebased tree; never publish an unvalidated data merge.
set -euo pipefail
if [[ -n "${VALIDATED_DATA_ORIGINAL_BASE:-}" && "$(git rev-parse HEAD^)" == "$VALIDATED_DATA_ORIGINAL_BASE" ]]; then
  echo 'Original market validation still applies; no upstream input changed.'
  exit 0
fi
npm ci --ignore-scripts
python -m unittest discover -s scripts -p 'test_monthly_automation.py'
python -m unittest discover -s scripts -p 'test_ranking_sources.py'
python -m unittest discover -s scripts -p 'test_cross_fx_fallback.py'
python -m unittest discover -s scripts -p 'test_market_transport.py'
node scripts/build-equity-history-links.mjs
node scripts/build-ranking-annual.mjs
node scripts/build-monthly-duel-returns.mjs
node scripts/build-equity-duel-returns.mjs
npm run audit:calculator-series
node scripts/test-monthly-consumers.mjs
node scripts/test-market-calendar-performance.mjs
node scripts/test-performance-rankings.mjs
node scripts/build-performance-links.mjs
node scripts/test-etf-tool-connections.mjs
npm run audit:data-catalog
npm run audit:data-provenance
npm run verify:tweet-midi
npm run build
node scripts/build-dca-exposures.mjs
node scripts/audit-portfolio-routing.mjs
# Regeneration must agree with the exact files already committed for publication.
git diff --exit-code HEAD -- src/data/equity-history-links.json src/data/ranking-annual.json src/data/monthly-duel-returns.json src/data/equity-duel-returns.json src/data/performance-links.json
