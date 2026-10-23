import assert from 'node:assert/strict'
import fs from 'node:fs'
import {ASSETS,ASSET_ORDER} from '../src/data/market-history.js'
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
import {periodReturn,basisLabel,commonCoverage} from '../src/pages/performance-rankings/engine.js'
import {getAnnualReturns,MARKET_ASSETS,ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {resolveAnniversaryLevel} from '../src/data/anniversary-levels.js'
import {monthlyCurrencyFactor} from '../src/data/history-currency.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
const sources=JSON.parse(fs.readFileSync('scripts/official-nav-remainder-sources.json'))
const proofs=[...JSON.parse(fs.readFileSync('reports/reliquat-79-2026-10-23/preuves/github-nav11/nav.json')).series,...JSON.parse(fs.readFileSync('reports/vaneck-nav-remainder-2026-10-23/github/nav.json')).series.filter(r=>r.status==='validated')]
for(const s of sources){
 const a=ASSETS[s.id],r=proofs.find(r=>r.id===s.id).record
 assert(ASSET_ORDER.includes(s.id)&&MARKET_ASSETS.some(a=>a.id===s.id)&&ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===s.id))
 assert.equal(RANKING_ASSETS[s.id].basis,'fund-nav-total-return');assert.equal(commonCoverage([RANKING_ASSETS[s.id],{...RANKING_ASSETS[s.id],id:'same-nav-fixture'}]).basis,'fund-nav-total-return');assert.equal(basisLabel(RANKING_ASSETS[s.id].basis),'Valeurs liquidatives · revenus réinvestis');
 assert.equal(a.isin,s.isin);assert.equal(a.historyConvention,'fund-nav-total-return');assert(!a.ticker&&!a.mic)
 for(const mode of ['lump','dca']){
  const state={assetId:s.id,amountRaw:'100',startYear:Number(s.periodStart.slice(0,4)),startMonth:Number(s.periodStart.slice(5)),mode,overridePriceRaw:''}
  const d=derive(state),p=a.points,expected=mode==='lump'?100*p.at(-1).price/p[0].price:p.reduce((n,p)=>n+100/p.price,0)*p.at(-1).price
  assert(Math.abs(d.result.finalValue-expected)<1e-6);assert(buildTweetText(state,d).includes('VL'))
 }
 // Reconcile the engine to official daily calendar bounds and the existing monthly ECB convention.
 for(const c of r.calendarProof.checks){
  const year=Number(c.year),start=`${year-1}-12`,end=`${year}-12`
  if(start<a.points[0].date)continue
  const p0=r.proofRows.find(p=>p.date.startsWith(start)),p1=r.proofRows.find(p=>p.date.startsWith(end));if(!p0||!p1)continue
  const expected=(p1.value/p0.value-1)*100
  assert(Math.abs(periodReturn(RANKING_ASSETS[s.id],start,end)-expected)<1e-5)
 }
 assert(getAnnualReturns(s.id,2025).length)
 const l=resolveAnniversaryLevel(s.id,'',new Date(r.latestLevel.asOf+'T12:00:00Z'))
 assert(l&&l.valuationBasis==='fund-nav-total-return')
 if(s.currency!==s.navCurrency)assert.notEqual(monthlyCurrencyFactor('2025-12',s.navCurrency,s.currency,FX),1)
}
console.log(`${sources.length} existing shares: selectors, lump/DCA, text, annual/ranking calculations, EUR conversion and matching current NAV levels passed.`)
