#!/usr/bin/env bash
set -euo pipefail
# Keep Playwright's own dependency list for the exact lockfile version.
# A browser download cache alone does not cover system packages.
if npx --no-install playwright install-deps --dry-run "$@"; then
  npx --no-install playwright install "$@"
else
  npx --no-install playwright install --with-deps "$@"
fi
