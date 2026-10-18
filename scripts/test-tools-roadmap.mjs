import { INVESTORS } from '../src/data/investor-roster.js'
import { ASSETS as PORTFOLIO_ASSETS } from '../src/data/portfolio-assets.js'
import { TOOLS } from '../src/tools.js'
import assert from 'node:assert/strict'
import { projectToolData } from './project-tool-data.mjs'
import * as facts from '../src/pages/market-facts/data.js'
import * as duel from '../src/data/duel-assets.js'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { buildDuel, buildCustomDuel, buildTweet, resultReading } from '../src/pages/portfolio-duels/lib.js'
import { ETFS } from '../src/data/etf-cards.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { ASSETS } from '../src/data/market-history.js'
import { getAnnualReturnStartYears, getValidYearsBackOptions } from '../src/pages/tweet-midi/data/marketHistory.js'
import simulationIds from '../src/data/simulation-links.json' with {type:'json'}
import links from '../src/data/tool-links.json' with {type:'json'}
import { TOPICS } from '../src/data/practical-sheet-topics.js'
import { references } from '../src/pages/dca-profiles/engine.js'

const {plugin} = projectToolData()
const toUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
async function projected(path) {
  const code=plugin.transform('',path).code.replace(/'virtual:tool-data:[^']+'/g, match => JSON.stringify(toUrl(plugin.load(plugin.resolveId(match.slice(1,-1))))))
    .replace("'./calendar-fx.js'", JSON.stringify(new URL('../src/data/calendar-fx.js', import.meta.url).href))
  return import(toUrl(code))
}
const projectedFacts=await projected('/app/src/pages/market-facts/data.js')
assert.deepEqual(projectedFacts.FACTS, JSON.parse(JSON.stringify(facts.FACTS)))
assert.deepEqual(projectedFacts.FAMILIES, facts.FAMILIES)
const projectedDuel=await projected('/app/src/data/duel-assets.js')
assert.deepEqual(projectedDuel.CATALOG, JSON.parse(JSON.stringify(duel.CATALOG)))
for(const asset of duel.CATALOG) {
  assert.equal(projectedDuel.ITEM_BY_ID.get(asset.id).isin,asset.isin)
  for(const year of [2018,...Object.keys(asset.calendarReturns).map(Number),2030])
    assert.equal(projectedDuel.euroReturn(projectedDuel.ITEM_BY_ID.get(asset.id),year),duel.euroReturn(asset,year))
}
for(const [isin,rows] of Object.entries(links)) for(const row of rows) {
  const url=new URL(row.href,'https://test.invalid')
  if(row.kind==='sheet') assert(ETFS.some(e=>e.isin===isin) && url.searchParams.get('isin')===isin)
  else if(row.kind==='comparison') assert(DEFAULT_THEMES.find(t=>t.id===url.searchParams.get('subject'))?.etfs.some(e=>e.isin===isin))
  else if(row.kind==='practical') assert(TOPICS.find(t=>t.id===url.searchParams.get('fiche'))?.products?.includes(isin))
  else if(row.kind==='dca') assert(url.pathname==='/le-dca-de' && Object.values(references).some(r=>r.isin===isin))
  else if(row.kind==='duel') {
    if(url.searchParams.has('asset')) assert.equal(duel.ITEM_BY_ID.get(url.searchParams.get('asset'))?.isin,isin)
    else {const d=buildDuel(DUELS.find(d=>d.id===url.searchParams.get('duel')));assert([...d.a.assets,...d.b.assets].some(a=>a.isin===isin))}
  } else if(row.kind==='portfolio') assert.equal(PORTFOLIO_ASSETS.find(a=>a.id===url.searchParams.get('asset'))?.isin,isin)
  else if(row.kind==='performance') assert(Object.entries(ASSETS).some(([id,a])=>a.isin===isin && getAnnualReturnStartYears(id).length))
  else {
    const id=url.searchParams.get('asset')
    assert.equal(ASSETS[id]?.isin,isin)
    if(row.kind==='simulation') assert(simulationIds.includes(id))
    else {assert.equal(row.kind,'anniversary');assert(getValidYearsBackOptions(id,new Date()).length)}
  }
}
const china=buildDuel(DUELS.find(d=>d.id==='acwi-em-china'))
assert.match(china.readings[1],/portefeuille entier n’est pas sans Chine/)
const weights=buildCustomDuel({left:[{id:'msci_world_ishares',pct:80},{id:'msci_em',pct:20}],right:[{id:'msci_world_ishares',pct:70},{id:'msci_em',pct:30}]})
assert.match(weights.readings[1],/80 % dans A à 70 % dans B/)
assert.match(resultReading(weights),/base ou son poids change/)
for(const definition of DUELS) {
  const d=buildDuel(definition),text=buildTweet(d)
  assert.doesNotMatch(text,/undefined|NaN|prix des actions, les critères/)
  assert.equal((text.match(/de plus pour le portefeuille/g)??[]).length,Math.abs(d.a.final-d.b.final)<.5?0:1)
  if(d.years.length<6) assert.match(resultReading(d),/seulement \d années communes/)
  for(const portfolio of [d.a,d.b]) {
    const theme=portfolio.assets.find(a=>a.role==='theme')
    if(theme) assert(text.includes(`peut donc dépasser ${theme.pct} %`))
  }
}
console.log(`Roadmap: lossless fact/catalog projections, FX parity, ${Object.values(links).flat().length} exact-support destinations, ${DUELS.length} duel texts and weighting/China/history edge cases passed.`)

assert(TOOLS.find(tool => tool.to === '/portefeuilles-investisseurs').description.includes(`${INVESTORS.length} profils 13F`))
