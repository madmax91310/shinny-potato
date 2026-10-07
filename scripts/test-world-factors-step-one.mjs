import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getIndexFacts, getCurrentIndexFacts } from '../src/data/index-facts.js'
import { INDEX_RETURNS, getCurrentIndexReturnSeries } from '../src/data/index-returns.js'
import { FAMILIES } from '../src/data/index-comparisons.js'
import { getIndexComparisonPerformance } from '../src/data/index-comparison-performance.js'
import { SHEETS } from '../src/data/index-factsheets.js'
import { buildFactsheetTweet } from '../src/pages/factsheet-tweets/lib.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { getComparisonPerformance } from '../src/pages/tweet-midi/comparisonPerformance.js'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { buildDuel } from '../src/pages/portfolio-duels/lib.js'
import { ASSETS as HISTORY } from '../src/data/market-history.js'
const proof = JSON.parse(readFileSync(new URL('./source-snapshots/world-factors-2026-10-05.json', import.meta.url)))
const ids = ['msci-world-momentum', 'msci-world-minimum-volatility-usd']
for (const id of ids) {
 const facts = getIndexFacts(id,'2026-09-30'), captured = proof.compositions[id]['2026-09-30']
 for (const key of ['index','constituents','countries','sectors','holdings','topWeight','source']) assert.deepEqual(facts[key],captured[key],`${id}: ${key} diverge du relevé officiel`)
 const series = INDEX_RETURNS[id]['2025-12-31']
 assert.deepEqual(series.values,proof.returns[id]['2025-12-31'].values)
 assert.equal(series.currency,'USD'); assert.equal(series.method,'dividendes nets réinvestis')
 const sheet = SHEETS.find(x => x.id === id), text = buildFactsheetTweet(sheet)
 assert.equal(sheet.indexFacts,getCurrentIndexFacts(id,'2026-09-30')); assert.deepEqual(sheet.returns,getCurrentIndexReturnSeries(id,'2025-12-31').values)
 assert.match(text,/performances de l’indice/); assert.doesNotMatch(text,/undefined|NaN|performances de l’ETF/)
 assert.equal(HISTORY[id],undefined,'Aucun historique mensuel créé à partir de rendements annuels')
 const levels = id === ids[0] ? proof.momentumNetYearEnds : proof.minvolNetYearEnds
 const annual = levels.slice(1).map((point,i)=>[Number(String(point.calc_date).slice(0,4)),Number(((point.level_eod/levels[i].level_eod-1)*100).toFixed(2))])
 assert.deepEqual(annual,[...series.values].reverse(),'Les rendements publiés doivent se recalculer à partir des clôtures NETR officielles')
}
const minvol = INDEX_RETURNS[ids[1]]['2025-12-31']
assert.deepEqual([...minvol.values].reverse().map(([,v])=>v),proof.minvolBenchmarkValues,'Recoupement indépendant : ligne Benchmark, pas Share Class')
assert.notDeepEqual([...minvol.values].reverse().map(([,v])=>v),proof.minvolGrossValues,'Ne jamais mélanger GROSS et NETR')
assert.match(minvol.source.url,/index_variant=NETR/)
assert.match(buildFactsheetTweet(SHEETS.find(s=>s.id===ids[1])),/corrélations|optimisation/)
assert.match(buildFactsheetTweet(SHEETS.find(s=>s.id===ids[1])),/pas une couverture en euros/)
const family = FAMILIES.find(f=>f.id==='monde-facteurs'), rows = getIndexComparisonPerformance(family)
assert.equal(family.indices.length,4)
assert(family.indices.every(i=>i.indexFacts.asOf==='2026-09-30'))
assert(rows.every(r=>r.kind==='indice' && r.currency==='USD' && r.method==='dividendes nets réinvestis'))
assert.deepEqual(family.etfGroups.map(g=>g.funds[0].isin),['IE0002XZSHO1','IE00BP3QZ601','IE00BP3QZ825','IE00B8FHGS14'])
const theme = DEFAULT_THEMES.find(t=>t.id==='world-minvol')
assert.deepEqual(theme.etfs.map(f=>f.isin),['IE0002XZSHO1','IE00B8FHGS14'])
for (const fund of theme.etfs) {
 const perf = getComparisonPerformance(fund.isin)
 assert.equal(perf.label,'ETF'); assert.equal(perf.referenceIsin,fund.isin)
}
const duel = DUELS.find(d=>d.id==='world-quality-momentum')
assert.deepEqual(duel.left,[{id:'msci_world_ishares',pct:80},{id:'world_quality_ishares',pct:20}])
assert.deepEqual(duel.right,[{id:'msci_world_ishares',pct:80},{id:'world_momentum_ishares',pct:20}])
assert.deepEqual(buildDuel(duel).years,[2020,2021,2022,2023,2024,2025])
for (const id of ['gaming_vaneck','medical_innovation_ishares']) assert.equal(HISTORY[id],undefined)
console.log('Facteurs mondiaux : relevés officiels, NETR/GROSS, compositions communes, fonds distincts, duel 80/20 et périmètre historique vérifiés.')
