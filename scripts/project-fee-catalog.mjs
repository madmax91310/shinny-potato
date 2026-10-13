import { FEE_COMPARISON_ASSETS } from '../src/data/fee-comparison-assets.js'

// Pure projection of the authoritative registries at build/dev startup.
// Node audits keep importing the original module; the browser receives only
// the values this tool consumes, never the holdings or market histories.
export function projectFeeCatalog() {
  return {
    name: 'project-fee-catalog', enforce: 'pre',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/src/data/fee-comparison-assets.js')) return
      return { code: `export const FEE_COMPARISON_ASSETS = ${JSON.stringify(FEE_COMPARISON_ASSETS)};`, map: null }
    },
  }
}
