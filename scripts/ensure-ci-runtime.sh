#!/usr/bin/env bash
# Use working runner tools first; APT is a bounded fallback, never a test bypass.
set -euo pipefail

install_chromium_dependencies() {
  local attempt
  for attempt in 1 2; do
    if timeout 180s npx --no-install playwright install-deps chromium; then
      return 0
    fi
    echo "Chromium system dependency installation failed (attempt $attempt/2)." >&2
    if [ "$attempt" = 1 ]; then sleep 5; fi
  done
  return 1
}

probe_chromium() {
  # Resolve the locked Playwright from the working snapshot, even when this
  # helper was preserved outside the checkout before fallback composition.
  node --input-type=module - <<'JS'
import { createRequire } from 'node:module'
import path from 'node:path'
const { chromium } = createRequire(path.join(process.cwd(), 'package.json'))('playwright')
let browser
try {
  browser = await chromium.launch({ headless: true, timeout: 30000 })
  const page = await browser.newPage()
  await page.setContent('<p>CI browser runtime</p>')
  if (await page.textContent('p') !== 'CI browser runtime') throw Error('Browser runtime probe failed')
} catch (error) {
  console.error(error)
  // Other failures (download, sandbox, permissions, page execution) must fail
  // directly instead of being disguised as missing system packages.
  process.exitCode = /Host system is missing dependencies|error while loading shared libraries/i.test(String(error)) ? 78 : 1
} finally {
  if (browser) await browser.close()
}
JS
}

case "${1:-}" in
  poppler)
    if pdftotext -v && pdfinfo -v; then
      echo 'Poppler is usable; no APT operation needed.'
      exit 0
    fi
    # APT may otherwise report success after failing to refresh an index.
    timeout 180s sudo apt-get -o Acquire::Retries=2 -o APT::Update::Error-Mode=any update
    timeout 180s sudo apt-get -o Acquire::Retries=2 install -y --no-install-recommends poppler-utils
    pdftotext -v
    pdfinfo -v
    ;;
  chromium)
    npx --no-install playwright install chromium
    if probe_chromium; then
      echo 'Chromium is usable; no system dependency installation needed.'
      exit 0
    else
      status=$?
    fi
    if [ "$status" != 78 ]; then exit "$status"; fi
    install_chromium_dependencies
    probe_chromium
    ;;
  *) echo 'Usage: ensure-ci-runtime.sh poppler|chromium' >&2; exit 2 ;;
esac
