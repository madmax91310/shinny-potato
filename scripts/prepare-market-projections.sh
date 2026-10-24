#!/usr/bin/env bash
# Recompute from the combined canonical sources. No network and no source edits.
set -euo pipefail
python3 scripts/observation_rebase_guard.py --kind market --base "${VALIDATED_DATA_ORIGINAL_BASE:?Missing collection base}"
node scripts/build-equity-history-links.mjs
node scripts/build-monthly-duel-returns.mjs
node scripts/build-equity-duel-returns.mjs
node scripts/build-ranking-annual.mjs
node scripts/build-performance-links.mjs
