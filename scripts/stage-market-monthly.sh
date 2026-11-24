#!/usr/bin/env bash
# Use one allowlist for staging, transport and the final writer.
set -euo pipefail
if [[ "${1:?Specify listings or monthly}" == listings ]]; then
  market_paths=(src/data/shared-listing-identities.json)
elif [[ "$1" == monthly ]]; then
  market_paths=(
    src/data/equity-history-links.json
    docs/equity-identity-gaps.json
    src/data/performance-links.json
    src/data/simulation-links.json
    src/data/tool-links.json
    docs/asset-tool-routing.json
    docs/asset-tool-routing.md
    docs/distinct-asset-routing.json
    src/data/equity-duel-returns.json
    src/data/monthly-duel-returns.json
    src/data/automated-indices.json
    src/data/automated-monthly.json
    src/data/automated-etf-monthly.json
    scripts/source-snapshots/monthly-automated.json
    scripts/source-snapshots/monthly-collection-status.json
    src/data/anniversary-levels.json
    scripts/monthly-automation.json
    scripts/source-snapshots/monthly-qualification-status.json
    src/data/auto-history-identities.json
    src/data/qualified-listing-records.json
    src/data/shared-listing-identities.json
    src/data/ranking-histories.json
    src/data/monthly-fx.json
    src/data/ranking-annual.json
    src/data/ranking-index-annual.json
    src/data/ranking-ftse.json
    scripts/source-snapshots/ranking-histories.json
    scripts/source-snapshots/ranking-collection-status.json
    docs/asset-field-coverage.md
    public/data/asset-field-coverage.json
  )
else
  echo "Unknown monthly publication scope: $1" >&2
  exit 1
fi
if [[ "${2:-}" == stage ]]; then
  git add -- "${market_paths[@]}"
fi
