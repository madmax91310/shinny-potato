import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { annualEquityReturns } from './lib/equity-duel-returns.mjs'
import { convertCalendarReturn } from '../src/data/calendar-fx.js'
import records from '../src/data/automated-monthly.json' with {type:'json'}
import items from '../src/data/equity-duel-returns.json' with {type:'json'}
import { CATALOG, euroReturn } from '../src/data/duel-assets.js'
import { buildCustomDuel, buildTweet } from '../src/pages/portfolio-duels/lib.js'
const reference = [{id:'msci_world_ishares',pct:80},{id:'msci_em',pct:20}]
assert(items.length > 80)
for (const item of items) {
  const record = records[item.historyId]
  for (const [year,value] of Object.entries(item.calendarReturns)) assert.equal(value, annualEquityReturns(record)[year])
  assert(CATALOG.some(a=>a.id===item.id))
  assert(existsSync(`public/asset-art/${item.art.scene}`))
  const duel = buildCustomDuel({left:[reference[0],{id:item.id,pct:20}],right:reference})
  assert.match(buildTweet(duel),/une seule entreprise/)
  for (const year of duel.years) {
    const p = new Map(record.points)
    const ratio = p.get(`${year}-12`)/p.get(`${year-1}-12`)
    const expected = convertCalendarReturn((ratio-1)*100,year,item.currency)
    assert(Math.abs(euroReturn(item,year)-expected)<1e-9)
  }
}
const sample=records.apple
assert.deepEqual(annualEquityReturns({...sample,field:'close'}),{})
assert.deepEqual(annualEquityReturns({...sample,currency:null}),{})
assert.deepEqual(annualEquityReturns({...sample,responseSha256:null}),{})
const missing=annualEquityReturns({...sample,points:sample.points.filter(([m])=>m!=='2023-06')})
assert.equal(missing[2023],undefined)
assert.equal(annualEquityReturns(sample)[2026],undefined)
console.log(`${items.length} equity duels: adjusted returns, FX, complete years, sources, art and copy verified.`)
