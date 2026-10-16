import assert from 'node:assert/strict'
import {buildCustomDuel, buildTweet} from '../src/pages/portfolio-duels/lib.js'
import {euroReturn, ITEM_BY_ID} from '../src/data/duel-assets.js'
const world=[{id:'msci_world_ishares',pct:100}]
const stocks=['apple','microsoft','broadcom','tesla','berkshire','asml'].map(id=>`equity-${id}`)
for (const n of [1,5,6]) {
  const right=stocks.slice(0,n).map((id,i)=>({id,pct:Math.floor(100/n)+(i<100%n?1:0)}))
  const duel=buildCustomDuel({left:world,right})
  assert.equal(duel.b.assets.length,n)
  const text=buildTweet(duel)
  assert.doesNotMatch(text,/\bundefined\b|\bNaN\b|leur base|leurs compléments/i)
  for (const row of right) assert(text.includes(ITEM_BY_ID.get(row.id).name))
  for (const y of duel.years) {
    const expected=right.reduce((sum,row)=>sum+euroReturn(ITEM_BY_ID.get(row.id),y)*row.pct/100,0)
    assert(Math.abs(duel.b.annual[y]-expected)<1e-9)
    assert(Math.abs(duel.a.annual[y]-euroReturn(ITEM_BY_ID.get(world[0].id),y))<1e-9)
  }
  const reversed=buildCustomDuel({left:right,right:world})
  assert.equal(reversed.a.final,duel.b.final)
  assert.equal(reversed.b.final,duel.a.final)
}
const identical=buildCustomDuel({left:world,right:world})
assert(!identical.hook.includes('avec  ou'))
assert.match(buildTweet(identical),/même montant/)
const multiETF=buildCustomDuel({left:world,right:[{id:'msci_world_ishares',pct:50},{id:'msci_acwi_ishares',pct:50}]})
assert.equal(multiETF.b.assets.length,2)
const original=ITEM_BY_ID.get(stocks[5]).calendarReturns
try {
  ITEM_BY_ID.get(stocks[5]).calendarReturns={2025:10}
  assert.throws(()=>buildCustomDuel({left:world,right:stocks.map((id,i)=>({id,pct:i<4?17:16}))}),/trois années/)
} finally {ITEM_BY_ID.get(stocks[5]).calendarReturns=original}
console.log('Manual duels: ETF alone vs 1/5/6 stocks, reversed sides, mixed ETFs, exact weighted EUR returns, missing history and copy verified.')
