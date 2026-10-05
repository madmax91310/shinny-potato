import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getIndexFacts } from '../src/data/index-facts.js'
import { INDEX_RETURNS } from '../src/data/index-returns.js'
import { FAMILIES } from '../src/data/index-comparisons.js'
import { getIndexComparisonPerformance } from '../src/data/index-comparison-performance.js'
import { SHEETS } from '../src/data/index-factsheets.js'
import { buildFactsheetTweet } from '../src/pages/factsheet-tweets/lib.js'
import { buildTweetText } from '../src/pages/index-comparator/lib.js'
import { getIndexArt } from '../src/pages/factsheet-tweets/visualIdentity.js'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { ASSETS } from '../src/data/market-history.js'
const proof = JSON.parse(readFileSync(new URL('./source-snapshots/property-infrastructure-2026-10-05.json', import.meta.url)))
const ids = ['ftse-epra-nareit-developed-dividend-plus', 'ftse-global-core-infrastructure']
const dates = ['2026-08-31','2026-09-30']
for (const [i,id] of ids.entries()) {
 const date = dates[i], facts = getIndexFacts(id,date), captured = proof.compositions[id][date]
 for (const key of ['index','constituents','countries','sectors','holdings','topWeight','source','sectorClassification']) assert.deepEqual(facts[key],captured[key],`${id}/${key}: écart au relevé officiel`)
 assert(Object.isFrozen(facts)); assert.equal(facts.metadata.asOf,date)
 const sheet = SHEETS.find(s=>s.id===id), series = INDEX_RETURNS[id]['2025-12-31']
 assert.equal(sheet.indexFacts,facts); assert.equal(sheet.returns,series.values)
 assert.deepEqual(series.values,proof.returns[id]['2025-12-31'].values)
 assert.equal(series.currency,'USD'); assert.equal(series.method,'dividendes réinvestis (Total Return FTSE)')
 const text = buildFactsheetTweet(sheet)
 assert.match(text,/performances de l’indice/); assert.doesNotMatch(text,/undefined|NaN|performances de l’ETF/)
 assert.equal(getIndexArt(sheet).scene,i===0?'property':'infrastructure')
 assert.equal(ASSETS[id],undefined,'Pas de série mensuelle inventée à partir des années calendaires')
 const record = DATA_CATALOG.find(r=>r.id===id)
 assert(record.fields.some(f=>f.value===series),'Rendements indépendants visibles au catalogue')
 assert(record.consumers.some(c=>c.path==='/tweets-factsheets'))
 // Recoupement des valeurs structurées avec la ligne exacte du tableau brut capturé ; pas la ligne de l’autre indice.
 const table = proof.capturedDocuments[i===0?'property':'infra'].annualTable
 const row = i===0 ? table.match(/FTSE EPRA Nareit Developed\s*\n([^\n]+)/)?.[1] : table.match(/FTSE Global Core Infrastructure\s+([^\n]+)/)?.[1]
 assert(row,`Ligne exacte absente du PDF : ${id}`)
 const annual = row.match(/-?\d+\.\d+/g).map(Number).slice(-5)
 assert.deepEqual(annual,[...series.values].reverse().map(([,v])=>v),'TR FTSE annuel altéré')
}
const property = SHEETS.find(s=>s.id===ids[0]), infra = SHEETS.find(s=>s.id===ids[1])
assert.match(buildFactsheetTweet(property),/3 % pour entrer, ≥ 1 % pour rester/)
assert.match(buildFactsheetTweet(property),/31\/08\/2026.*2 %.*contrairement aux règles/)
assert.match(buildFactsheetTweet(infra),/65 %.*55 %/)
assert.match(buildFactsheetTweet(infra),/variante 50\/50/)
const family = FAMILIES.find(f=>f.id==='immobilier-infrastructures'), rows = getIndexComparisonPerformance(family)
assert.deepEqual(family.indices.map(i=>i.indexFacts.asOf),dates)
assert.deepEqual(rows.map(r=>r.key),ids)
assert(rows.every(r=>r.kind==='indice' && r.currency==='USD' && r.method===rows[0].method))
assert.deepEqual(family.etfGroups.map(g=>g.funds[0].isin),['IE00B1FZS350','IE00B1FZS467'])
assert.equal(family.etfGroups[1].pea,undefined,'Statut PEA inconnu ne devient pas false')
assert.equal(family.perfFunds.length,0)
const tweet = buildTweetText(family)
assert.match(tweet,/31\/08\/2026.*30\/09\/2026/s); assert.match(tweet,/classifications diffèrent|classifications/i)
assert.equal(tweet,buildTweetText({...family,perfFunds:[{key:'fake',y2025:999}]}),'Rendements indépendants de ceux des ETF')
console.log('Immobilier / infrastructures : indices exacts, dates distinctes, TR USD, relevés PDF, règles divergentes explicites, ETF existants et périmètre ciblé vérifiés.')
