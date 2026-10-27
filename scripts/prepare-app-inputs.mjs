import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Local derivation only: these steps do not collect or publish financial data.
// Keep the existing order; each process reads the preceding producer's outputs.
const node = (script, ...args) => [process.execPath, `scripts/${script}`, ...args]
const projections = [
  node('build-index-company-compositions.mjs'),
  node('build-equity-history-links.mjs'),
  node('build-ranking-annual.mjs'),
  node('build-etf-completeness.mjs'),
  node('build-dca-exposures.mjs'),
]
const linksAndDuels = [
  node('build-performance-links.mjs'),
  node('build-monthly-duel-returns.mjs'),
  node('build-equity-duel-returns.mjs'),
]
const plans = {
  dev: [...projections, ...linksAndDuels, node('build-tool-links.mjs'), node('build-data-review-inbox.mjs')],
  build: [
    ...projections, node('report-exposure-coverage.mjs'), ...linksAndDuels,
    // All public producers must finish before inventory and the final manifest.
    node('build-tweet-bank-catalog.mjs'),
    node('build-app-inventory.mjs'), node('build-tool-links.mjs'),
    node('build-automation-targets.mjs'), node('report-asset-fields.mjs', '--write'),
    node('build-review-reconciliation.mjs'), node('audit-asset-tool-routing.mjs', '--write'),
    node('report-shared-market-data.mjs'), node('data-automation-inventory.mjs', '--write'),
    node('build-data-review-inbox.mjs'),
    ['python3', 'scripts/data_publication.py', 'manifest', '--output', 'public/data/publication-manifest.json'],
  ],
}
const [mode = 'build', flag, ...extra] = process.argv.slice(2)
if (!Object.hasOwn(plans, mode) || flag && flag !== '--list' || extra.length) {
  throw Error('Usage: node scripts/prepare-app-inputs.mjs <dev|build> [--list]')
}
for (const [command, ...args] of plans[mode]) {
  const label = [command === process.execPath ? 'node' : command, ...args].join(' ')
  if (flag === '--list') console.log(label)
  else {
    console.log(`Preparing app inputs: ${label}`)
    execFileSync(command, args, { cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'inherit' })
  }
}
