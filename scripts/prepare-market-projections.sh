#!/usr/bin/env bash
# Recompute from the combined canonical sources. No network and no source edits.
set -euo pipefail
python3 scripts/market_reader_revalidation.py --base "${VALIDATED_DATA_ORIGINAL_BASE:?Missing collection base}"
python3 -m unittest discover -s scripts -p 'test_market_reader_revalidation.py'
python3 -m unittest discover -s scripts -p 'test_audit_workflows.py'
node scripts/build-equity-history-links.mjs
node scripts/build-monthly-duel-returns.mjs
node scripts/build-equity-duel-returns.mjs
node scripts/build-ranking-annual.mjs
node scripts/build-performance-links.mjs
