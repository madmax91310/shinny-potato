#!/usr/bin/env bash
# Use one allowlist for staging, transport, recording and Pages classification.
set -euo pipefail
scope=${1:?Specify listings or monthly}
market_paths_text=$(node --input-type=commonjs -e '
  const fs = require("node:fs")
  const paths = JSON.parse(fs.readFileSync(".github/workflows/monthly-market-publication-paths.json", "utf8"))
  const mode = process.argv[1]
  if (mode !== "listings" && mode !== "monthly") throw Error("Unknown monthly publication scope")
  const selected = paths[mode]
  if (!Array.isArray(selected) || !selected.length) throw Error("Missing monthly publication paths")
  process.stdout.write(selected.join("\n"))
' "$scope")
mapfile -t market_paths <<< "$market_paths_text"
if [[ "${2:-}" == stage ]]; then
  git add -- "${market_paths[@]}"
fi
