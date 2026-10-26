import assert from'node:assert/strict'
import fs from'node:fs'
import{gunzipSync}from'node:zlib'
import{ASSETS}from'../src/data/market-history.js'
import{getHistoricalPrice,ANNIVERSAIRE_ELIGIBLE_ASSETS}from'../src/pages/tweet-midi/data/marketHistory.js'
import{resolveAnniversaryLevel}from'../src/data/anniversary-levels.js'
import{buildAnniversaireText,FORMATS,MODES}from'../src/pages/tweet-midi/lib.js'
import{periodReturn}from'../src/pages/performance-rankings/engine.js'
import FX from'../src/data/monthly-fx.json'with{type:'json'}
import BASE_LEVELS from'../src/data/anniversary-levels.json'with{type:'json'}
import NON_BOND_LEVELS from'../src/data/non-bond-levels.json'with{type:'json'}
const currentLevels={...BASE_LEVELS,...NON_BOND_LEVELS}
const folder='reports/donnees-consolidees-2026-10-24/preuves/ishares-reprise-20261025'
const report=JSON.parse(fs.readFileSync(folder+'/nav.json'))
for(const{record:r}of report.series){
 const a=ASSETS[r.id],url=Object.keys(r.rawSourceHashes).find(u=>u.includes('blackrock.com')),body=JSON.parse(gunzipSync(fs.readFileSync(folder+'/sources/'+r.rawSourceHashes[url]+'.json.gz'))),performance=body.componentsByNameMap.performance.containersByNameMap
 const chart=performance.chart.dataPointsByNameMap,calendar=performance.returns.subContainersByNameMap.calendar.dataPointsByNameMap
 assert.equal(chart.currencySymbol.value,r.navCurrency)
 const date=(value)=>`${String(value).slice(0,4)}-${String(value).slice(4,6)}-${String(value).slice(6,8)}`
 const rawNav=Object.fromEntries(chart.navData.asOfDate.map((d,i)=>[date(d),chart.navData.value[i]]))
 const factor=month=>FX.months[month].rates[r.currency]/FX.months[month].rates[r.navCurrency]
 const year=r.distributionValidationYears[0]??2025
 const column=calendar.returnTypes.value.indexOf('annualNav'),annual=Object.values(calendar).find(v=>v?.active&&String(v.asOfDate)===`${year}1231`)
 assert(annual)
 const expected=((1+Number(annual.value[column])/100)*factor(`${year}-12`)/factor(`${year-1}-12`)-1)*100
 assert(Math.abs(periodReturn(a,`${year-1}-12`,`${year}-12`)-expected)<(.005*factor(`${year}-12`)/factor(`${year-1}-12`)+.0001),'The calculation uses the issuer income-reinvested return, once, in the correct currency')
 // The archived raw-source oracle and its observation share the same dated snapshot.
 // A later live observation is correctly refused at this historical clock.
 const latest=resolveAnniversaryLevel(r.id,'',new Date(r.latestLevel.asOf+'T12:00:00Z'),{[r.id]:r.latestLevel})
 assert(latest);assert.equal(latest.currency,a.currency)
 const live=currentLevels[r.id];assert(live,'The current registry retains the exact part')
 const liveDate=new Date(live.asOf+(live.asOf.length===7?'-01':'')+'T12:00:00Z')
 const current=resolveAnniversaryLevel(r.id,'',liveDate)
 assert(current);assert.equal(current.asOf,live.asOf);assert.equal(current.currency,a.currency)
 assert.equal(current.valuationBasis,r.anniversaryValuationBasis??'fund-nav-total-return')
 assert.equal(resolveAnniversaryLevel(r.id,'',new Date(liveDate.getTime()-86400000)),null,'A live observation cannot be used before its observation date')
 if(r.anniversaryValuationBasis){
  assert.equal(r.anniversaryValuationBasis,'fund-nav-price');assert.equal(latest.valuationBasis,'fund-nav-price')
  assert.equal(latest.nativeValue,rawNav[latest.asOf])
  const ym=`${year}-12`,last=Object.keys(rawNav).filter(d=>d.startsWith(ym)).sort().at(-1)
  assert(Math.abs(getHistoricalPrice(r.id,ym)-rawNav[last]*factor(ym))<1e-7,'Anniversary uses actual published NAV, not the rebased income index')
  assert.notEqual(getHistoricalPrice(r.id,ym),a.points.find(p=>p.date===ym).price)
  const selected=ANNIVERSAIRE_ELIGIBLE_ASSETS.find(x=>x.id===r.id);assert(selected?.anniversaryVariant.includes('hors distributions'))
  const text=buildAnniversaireText({format:FORMATS.ANNIVERSAIRE,mode:MODES.SIMPLE,assetId:r.id,yearsBack:1},'100')
  assert(text.includes('hors distributions'));assert(!/NaN|undefined/.test(text))
 }else assert.equal(latest.valuationBasis,'fund-nav-total-return')
}
console.log('Five exact iShares parts: issuer income-return oracle, explicit FX, no double cash, and separate unadjusted anniversary NAV verified.')

const {historyAlerts,historyConsumerTools}=await import('./history-alerts.mjs')
const checks={},alerts=historyAlerts('2026-10-25',[],checks)
const key='automated-etf-monthly:etcPalladium'
assert.deepEqual(alerts.find(r=>r.id===key+':qualification').invalidPeriods,['2014-12'])
assert(!checks[key].periods.includes('2014-12'))
assert(checks[key].periods.includes('2015-12'))
console.log('The unresolved December 2014 palladium component remains an explicit monitoring incident after a successful source control.')
const entities=[{aliases:['history:etcPalladium','etcPalladium'],tools:['Calculateur','Performance depuis','Il y a X ans'],to:'/bibliotheque-donnees?id=history%3AetcPalladium'},
 {aliases:['IE00B4556L06'],tools:['Présentation ETF','Duels de portefeuilles','Générateur de portefeuilles']}]
const targeted=historyAlerts('2026-10-25',entities).find(r=>r.id===key+':qualification')
assert.deepEqual(targeted.tools,['Calculateur','Performance depuis','Qui a vraiment gagné ?'])
assert.equal(targeted.to,entities[0].to)
const scope={id:key,dataId:'IE00B4556L06',record:report.series.find(r=>r.id==='etcPalladium').record,cadence:'monthly',entities,today:'2026-10-25'}
assert(historyConsumerTools({...scope,excludedMonths:['2025-10']}).includes('Il y a X ans'))
for(const months of [['2014-10'],['2025-09'],['2026-10']])assert(!historyConsumerTools({...scope,excludedMonths:months}).includes('Il y a X ans'))
assert.deepEqual(historyConsumerTools({...scope,cadence:'annual'}),['Duels de portefeuilles','Générateur de portefeuilles','Présentation ETF'])
console.log('The monthly qualification targets its actual series consumers; independent annual tools and unused anniversary months are preserved.')
