import { writeFile } from 'node:fs/promises'
import { ETFS } from '../src/data/etf-cards.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { buildDuel, CATALOG } from '../src/pages/portfolio-duels/lib.js'
import { ASSETS } from '../src/data/market-history.js'
import { getAnnualReturnStartYears, getValidYearsBackOptions } from '../src/pages/tweet-midi/data/marketHistory.js'
import simulationIds from '../src/data/simulation-links.json' with {type:'json'}
import { TOPICS } from '../src/data/practical-sheet-topics.js'
import { references } from '../src/pages/dca-profiles/engine.js'
import { ASSETS as PORTFOLIO_ASSETS } from '../src/data/portfolio-assets.js'

// Identity and availability only. Values remain in their canonical registries.
const links = {}
const add = (isin, kind, label, href) => {
  if (!isin) return
  const rows = links[isin] ??= []
  if (!rows.some(row => row.href === href)) rows.push({kind,label,href})
}
for (const etf of ETFS) add(etf.isin,'sheet','Présentation ETF',`/fiches-etf?isin=${encodeURIComponent(etf.isin)}`)
for (const topic of TOPICS) for (const isin of topic.products ?? [])
  add(isin,'practical',topic.title,`/fiches-pratiques?fiche=${encodeURIComponent(topic.id)}`)
for (const asset of Object.values(references)) if (asset.isin)
  add(asset.isin,'dca','Actifs et expositions',`/le-dca-de?isin=${encodeURIComponent(asset.isin)}`)
for(const asset of PORTFOLIO_ASSETS) add(asset.isin,'portfolio','Composition manuelle',`/generateur-portefeuilles?asset=${encodeURIComponent(asset.id)}`)
for(const asset of CATALOG) add(asset.isin,'duel','Composer un duel',`/duels-portefeuilles?asset=${encodeURIComponent(asset.id)}`)
for (const theme of DEFAULT_THEMES) for (const etf of theme.etfs)
  add(etf.isin,'comparison',theme.nom,`/comparatif-etf?subject=${encodeURIComponent(theme.id)}`)
for (const definition of DUELS) {
  const duel = buildDuel(definition) // fail the build if a prepared duel loses its common history
  for (const asset of [...duel.a.assets,...duel.b.assets])
    add(asset.isin,'duel',duel.title,`/duels-portefeuilles?duel=${encodeURIComponent(duel.id)}`)
}
for (const [id,asset] of Object.entries(ASSETS)) {
  if (getAnnualReturnStartYears(id).length) add(asset.isin,'performance','Performance depuis',`/performance-depuis?isin=${encodeURIComponent(asset.isin)}`)
  if (simulationIds.includes(id)) add(asset.isin,'simulation','Et si tu avais investi',`/calculateur-investissement?asset=${encodeURIComponent(id)}`)
  if (asset.anniversaryPoints?.length && getValidYearsBackOptions(id, new Date()).length)
    add(asset.isin,'anniversary','Il y a X ans',`/il-y-a-x-ans?asset=${encodeURIComponent(id)}`)
}
await writeFile(new URL('../src/data/tool-links.json',import.meta.url),JSON.stringify(links,null,2)+'\n')
console.log(`Tool links: ${Object.keys(links).length} exact ISINs, ${Object.values(links).flat().length} available destinations (${CATALOG.length} duel choices).`)
