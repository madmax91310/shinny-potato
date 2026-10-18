import assert from 'node:assert/strict'
import { ASSETS } from '../src/data/calculator-history.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
import { historyInCurrency } from '../src/data/history-currency.js'
import { derive, computeAssetSeries } from '../src/pages/investment-calculator/lib.js'
import { computeComparison } from '../src/pages/investment-calculator/comparison.js'
import { convertAsset } from '../src/pages/performance-rankings/series.js'
import engine from '../src/pages/tweet-midi/engines/performance.js'
import { convertCalendarReturn } from '../src/data/calendar-fx.js'
import { SHEETS } from '../src/data/index-factsheets.js'
import { factsheetInCurrency, factsheetInVariant } from '../src/pages/factsheet-tweets/performanceCurrency.js'
import { annualPerformanceInCurrency } from '../src/data/annual-performance-currency.js'
import { ETFS } from '../src/pages/etf-sheets/records.js'
import { getAnnualPerformance } from '../src/pages/etf-sheets/annualPerformance.js'
import { getComparisonPerformance, getComparisonYears } from '../src/pages/tweet-midi/comparisonPerformance.js'
import { assetReturn } from '../src/pages/portfolio-generator/performance.js'
import { euroReturn } from '../src/data/duel-assets.js'
const close = (a,b,message) => assert.ok(Math.abs(a-b) < 1e-8, `${message}: ${a} != ${b}`)
const [acwi] = engine.getPerformanceEntries({assetId:'msciAcwi',year:2020,currency:'EUR'})
assert.notEqual(acwi.asset.currencyMethod,'official')
assert.match(engine.buildPerformanceDepuisText({assetId:'msciAcwi',year:2020,currency:'EUR'}),/Net Return · EUR · dividendes nets/)
const netSheet = factsheetInCurrency(factsheetInVariant(SHEETS.find(s=>s.id==='acwi'),'NETR'),'EUR')
for (const [year,value] of netSheet.returns) close(value, acwi.returns.find(r=>r.year===year).pct, 'ACWI net, Coulisses / Performance depuis')
const emSheet = factsheetInCurrency(SHEETS.find(s=>s.id==='em-standard'),'EUR')
assert.match(emSheet.performance.detail,/nets/)
assert.throws(()=>engine.getPerformanceEntries({mode:'comparatif',assetIdA:'msciWorld',assetIdB:'msciAcwi',year:2020,currency:'EUR'}),/convention/)
assert.throws(()=>engine.pickForSelection({format:'performance-depuis',mode:'comparatif',subjectId:'msciWorld',subjectIdB:'msciAcwi',history:[]}),/convention/)
// Every investment buys units at that month's EUR price, not at the final FX rate.
for (const id of ['apple','msciAcwi','toyota','nestle'].filter(id=>ASSETS[id])) {
  for (const currency of ['EUR','USD']) for (const mode of ['lump','dca']) {
    const state={assetId:id,startYear:2020,startMonth:12,amountRaw:'100',mode,overridePriceRaw:'',currency}
    const d=derive(state), native=ASSETS[id]
    const selected=native.points.filter(p=>p.date>=d.startYm && p.date<=d.endYm)
    // EUR is the base unit and deliberately has no required stored rate.
    const rate=(date,c)=>c==='EUR'?1:FX.months[date].rates[c]
    const price=p=>p.price*rate(p.date,currency)/rate(p.date,native.currency)
    const units=mode==='dca'?selected.reduce((n,p)=>n+100/price(p),0):100/price(selected[0])
    close(d.result.finalValue,units*price(selected.at(-1)),`${id} ${mode} independent FX`)
    assert.equal(d.currency,currency)
    const ranked=convertAsset({...native,basis:native.priceUnit==='points'?'index-net':'adjusted'},currency,FX)
    const other=computeAssetSeries(ranked.points,d.startYm,d.endYm,100,mode)
    close(d.result.finalValue,other.finalValue,`${id} calculator / ranking series`)
    const video=computeComparison({amount:100,startYm:d.startYm,endYm:d.endYm,mode,currency},id,id,mode,mode)
    close(video.sides[0].result.finalValue,d.result.finalValue,`${id} calculator / export`)
    assert.equal(video.sides[0].asset.currency,currency)
  }
}
const sample={currency:'USD',points:[{date:'2024-12',price:100},{date:'2025-01',price:110}]}
assert.throws(()=>historyInCurrency(sample,'EUR',undefined,undefined,{months:{'2025-01':{rates:{USD:1.1}}}}),/Change BCE absent/)
const annual={currency:'USD',calendarYears:[2024,2025],values:[10,20]}
const changed=annualPerformanceInCurrency(annual,'EUR')
close(changed.values[1],convertCalendarReturn(20,2025,'USD','EUR'),'annual conversion')
assert.deepEqual(annual.values,[10,20])
assert.throws(()=>annualPerformanceInCurrency({currency:'USD',values:[],observations:[{label:'YTD',value:10}]},'EUR'),/calendrier annuel/)
let checked=0
for (const etf of ETFS) {
  const p=getAnnualPerformance(etf), years=getComparisonYears([etf.isin])
  if (!p?.values?.some(Number.isFinite) || !years.length) continue
  for (const currency of ['EUR','USD']) {
    let sheet, comparison
    try { sheet=getAnnualPerformance({...etf,performanceCurrency:currency}); comparison=getComparisonPerformance(etf.isin,years,currency) } catch { continue }
    for(const row of comparison?.rows ?? []) {
      const i=(sheet.calendarYears??[2020,2021,2022,2023,2024,2025]).indexOf(row.year)
      if(i>=0 && Number.isFinite(sheet.values[i])) close(sheet.values[i],row.pct,`${etf.isin} sheet/comparison ${row.year}`)
    }
    checked++
  }
}
for(const currency of ['EUR','USD','JPY','CHF']) {
  const asset={returnCurrency:currency,calendarReturns:{2024:12,2025:-4},currency}
  for(const year of [2024,2025]) close(assetReturn(asset,year),euroReturn(asset,year),`generator/duel ${currency}`)
}
console.log(`Cross-tool currency: ACWI net preserved, explicit variants, mixed conventions blocked, monthly DCA/lump, exports, missing FX, ${checked} ETF currency comparisons and generator/duels passed.`)
