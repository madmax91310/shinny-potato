import {anniversaryPriceComparisonIssue,requireAnniversaryPriceComparison} from '../src/data/anniversary-price-quality.js'
import {getValidYearsBackOptions,ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {buildAnniversaireText,buildAnniversaireComparatifText} from '../src/pages/tweet-midi/engines/anniversaire.js'
import {renderAnniversaryImage} from '../src/pages/tweet-midi/anniversaryImage.js'
import {cpSync,mkdtempSync,writeFileSync,rmSync,mkdirSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {inspectSeries} from './audit-investment-history-units.mjs'
import {validateHistoryUnitEvidence} from './lib/history-unit-proof.mjs'
import {ASSETS,ASSET_ORDER} from '../src/data/market-history.js'
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
import {computeComparativeSeries} from '../src/pages/investment-calculator/videoExport.js'
import {getHistoricalPrice,MARKET_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {getAnnualReturns} from '../src/pages/tweet-midi/data/performanceHistory.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {historyInCurrency} from '../src/data/history-currency.js'
const before=JSON.parse(gunzipSync(readFileSync('scripts/fixtures/investment-units-20261106/before.json.gz')))
const records=JSON.parse(readFileSync('src/data/automated-etf-monthly.json')),proofs=JSON.parse(readFileSync('scripts/source-snapshots/monthly-automated.json'))
for(const id of Object.keys(before)){
 assert(ASSET_ORDER.includes(id));const a=ASSETS[id],record=records[id];validateHistoryUnitEvidence(record,proofs[id])
 for(const [year,month]of [[2020,1],[2026,1],[2026,2],[2026,3]])for(const mode of ['lump','dca']){
 const s={assetId:id,startYear:year,startMonth:month,amountRaw:'1000',mode,currency:'native',overridePriceRaw:''}
 const d=derive(s),comp=computeComparativeSeries(id,d.startYm,d.endYm,1000,mode)
 assert.equal(comp.finalValue,d.result.finalValue);assert(buildTweetText(s,d).includes('Capital final'))
 assert(Number.isFinite(d.result.finalValue));assert.equal(d.result.totalInvested,mode==='lump'?1000:d.result.months.length*1000)
 }
 assert.equal(periodReturn(a,'2026-01','2026-10'),(a.points.at(-1).price/a.points.find(p=>p.date==='2026-01').price-1)*100)
 assert.equal(getHistoricalPrice(id,'2026-02'),dict(record.anniversaryPoints)['2026-02'])
 assert.equal(qualifyHistoryWindow(MARKET_ASSETS.find(a=>a.id===id),'2026-01','2026-10').qualified,true)
 const converted=historyInCurrency(a,'EUR','2026-01','2026-10');assert(qualifyHistoryWindow(converted,'2026-01','2026-10').qualified)
 // A quarantined observation refuses only windows using it, including DCA paths
 // whose endpoints look sound. A one-month anniversary outside it stays valid.
 const limited={...a,historyExcludedMonths:['2026-02'],historyExclusionReasons:{'2026-02':'Exact exchange close unavailable for February'}}
 assert.equal(qualifyHistoryWindow(limited,'2026-01','2026-10').reason,'Exact exchange close unavailable for February')
 assert(qualifyHistoryWindow(limited,'2026-03','2026-10').qualified)
 assert(qualifyHistoryWindow(limited,'2026-01','2026-01').qualified)
 assert.equal(qualifyHistoryWindow(historyInCurrency(limited,'EUR'),'2026-01','2026-10').qualified,false)
 const forged=structuredClone(record);if(forged.splitAdjustmentEvidence)forged.splitAdjustmentEvidence.ratio=40;else forged.historicalQuoteRepairEvidence.checks[0].officialClose=30
 assert.throws(()=>validateHistoryUnitEvidence(forged,proofs[id]))
}
function dict(p){return Object.fromEntries(p)}
const bank=ASSETS.etfLU1829219390,wood=ASSETS.etf_timber_ishares
const bankChecks=records[bank.id].splitAdjustmentEvidence.checks
const january=bankChecks.find(c=>c.date.startsWith('2020-01')),october=bankChecks.find(c=>c.date.startsWith('2026-10'))
const independentBank=1000*(october.providerValue/october.divisor)/(january.providerValue/january.divisor)
assert(Math.abs(1000*(1+periodReturn(bank,'2020-01','2026-10')/100)-independentBank)<.01)
const woodProof=records[wood.id].historicalQuoteRepairEvidence,woodRow=proofs[wood.id].proofRows.find(r=>r.date.startsWith('2026-02'))
assert(Math.abs(dict(records[wood.id].points)['2026-02']-woodRow.value)<1e-6)
assert.equal(dict(records[wood.id].anniversaryPoints)['2026-02'],woodProof.monthlyChecks[0].officialClose)
assert.equal(inspectSeries(records[wood.id].points).filter(a=>['scale-break','isolated-scale-point'].includes(a.kind)).length,0)
assert(inspectSeries(before[wood.id].points).some(a=>a.kind==='isolated-scale-point'&&a.month==='2026-02'))
const extreme=[['2024-01',10],['2024-02',40],['2024-03',18]],snapshot=structuredClone(extreme)
assert(inspectSeries(extreme).some(a=>a.kind==='large-variation'));assert.deepEqual(extreme,snapshot,'True crashes and rallies are never edited by detection')
assert(qualifyHistoryWindow({currency:'USD',priceMethod:'adjusted',points:extreme},'2024-01','2024-03').qualified,'Magnitude alone never refuses a real return')
const annual=getAnnualReturns(bank.id,2025);assert(annual.every(r=>Number.isFinite(r.pct)))
console.log('Unit repairs: exact primary proof, split once, historical prices, independent lump/DCA oracle, comparisons/video, rankings, anniversaries, FX, bounded refusals and true extreme moves preserved.')

// Exercise the real record adapters in a fresh module graph, including legacy
// baseline assets and equities, rather than trusting only the ETF projection.
const temporary=mkdtempSync(join(tmpdir(),'unit-qualification-'))
try{
 cpSync('src',join(temporary,'src'),{recursive:true});mkdirSync(join(temporary,'scripts'));for(const name of ['non-bond-expansion-sources.json','non-bond-qualified-sources.json','qualified-exposure-sources.json'])cpSync('scripts/'+name,join(temporary,'scripts',name));writeFileSync(join(temporary,'package.json'),'   {"type":"module"}')
 for(const [file,ids]of [['automated-monthly.json',['ethereum','reddit']],['automated-etf-monthly.json',['etfLU1829219390']]]){
  const path=join(temporary,'src/data',file),data=JSON.parse(readFileSync(path))
  for(const id of ids){assert(data[id]);data[id].historyExcludedMonths=['2026-02'];data[id].historyExclusionReasons={'2026-02':`Unverified isolated point: ${id}`}}
  writeFileSync(path,JSON.stringify(data))
 }
 execFileSync(process.execPath,['--input-type=module','-e',`
 import assert from 'node:assert/strict';import {ASSETS}from './src/data/market-history.js';import {qualifyHistoryWindow}from './src/data/history-window-quality.js';import {derive}from './src/pages/investment-calculator/lib.js';import {getHistoricalPrice}from './src/pages/tweet-midi/data/marketHistory.js';
 for(const id of ['ethereum','reddit','etfLU1829219390']){
  const reason='Unverified isolated point: '+id,a=ASSETS[id];assert.equal(qualifyHistoryWindow(a,'2026-01','2026-10').reason,reason);assert(qualifyHistoryWindow(a,'2026-03','2026-10').qualified);
  for(const mode of ['lump','dca'])assert.throws(()=>derive({assetId:id,startYear:2026,startMonth:1,amountRaw:'1000',mode}),{message:reason});assert.throws(()=>getHistoricalPrice(id,'2026-02'),{message:reason});
 }
 `],{cwd:temporary,stdio:'pipe',encoding:'utf8'})
}finally{rmSync(temporary,{recursive:true,force:true})}
console.log('Future isolated point restrictions reach ETF, equity and legacy baseline consumers; independently valid months remain available.')

assert.equal(getValidYearsBackOptions(bank.id,new Date('2026-11-06T12:00:00Z')).length,0,'Cross-split prices are excluded from anniversary choices only')
assert(!ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===bank.id))
assert.equal(anniversaryPriceComparisonIssue(bank,'2026-09','2026-10-26'),null)
assert.equal(anniversaryPriceComparisonIssue(bank,'2026-10','2027-10-31'),null,'Post-split historical prices remain comparable')
assert.equal(anniversaryPriceComparisonIssue(bank,'2025-09','2026-09'),null,'Two pre-split prices remain comparable')
assert.throws(()=>requireAnniversaryPriceComparison(bank,'2025-10','2026-10'),/division des parts par 80/)
assert.throws(()=>buildAnniversaireText({assetId:bank.id,yearsBack:1},'5'),/division des parts par 80/)
assert.throws(()=>buildAnniversaireComparatifText({assetIdA:bank.id,assetIdB:wood.id,yearsBack:1},'5','25'),/division des parts par 80/)
await assert.rejects(()=>renderAnniversaryImage({assetId:bank.id,yearsBack:1,mode:'simple'},'5'),/division des parts par 80/)
assert.equal(getHistoricalPrice(bank.id,'2026-09'),dict(records[bank.id].anniversaryPoints)['2026-09'],'Quoted history is retained; only incomparable price narratives are refused')
console.log('Anniversary: cross-split simple/comparative text and PNG refused; raw quotes, pre/pre and post/post windows and qualified performance retained.')

// Provider-declared corporate actions protect actual-quote uses only. No ratio
// from Yahoo declarations is used to rewrite observed prices or adjusted returns.
const allUnitProofs=Object.assign({},...['monthly-lifestrategy.json','monthly-automated-round4.json','monthly-automated.json','non-bond-monthly-active.json'].map(f=>JSON.parse(readFileSync('scripts/source-snapshots/'+f))))
for(const file of ['automated-monthly.json','automated-etf-monthly.json','non-bond-monthly-records.json'])for(const [id,r]of Object.entries(JSON.parse(readFileSync('src/data/'+file))))if(r.anniversaryPriceReview){
 const proof=allUnitProofs[id];validateHistoryUnitEvidence(r,proof)
 assert.deepEqual(ASSETS[id].points,r.points.map(([date,price])=>({date,price})))
 for(const month of r.anniversaryExcludedMonths)assert.throws(()=>getHistoricalPrice(id,month),{message:r.anniversaryExclusionReason})
 const recent=r.anniversaryPoints.filter(([month])=>!r.anniversaryExcludedMonths.includes(month)).at(-1)
 if(recent)assert.equal(getHistoricalPrice(id,recent[0]),recent[1])
}
assert.throws(()=>getHistoricalPrice('apple','2020-07'),/réellement coté non certifié/)
assert.equal(getHistoricalPrice('apple','2020-09'),ASSETS.apple.anniversaryPoints.find(p=>p.date==='2020-09').price)
console.log('Declared corporate actions: pre-event actual quote usage refused, recent quotes and all observed performance levels retained.')
for(const mode of ['lump','dca']){
 assert.throws(()=>derive({assetId:bank.id,startYear:2015,startMonth:1,amountRaw:'1000',mode}),/lancement officiel de LU1829219390 le 2018-11-08.*continuité du prédécesseur non qualifiée/)
 assert(Number.isFinite(derive({assetId:bank.id,startYear:2019,startMonth:1,amountRaw:'1000',mode}).result.finalValue))
}
assert.throws(()=>getHistoricalPrice(bank.id,'2018-10'),/continuité du prédécesseur non qualifiée/)
assert.equal(qualifyHistoryWindow(ASSETS[bank.id],'2018-11','2026-10').qualified,true)
console.log('BNKE launch boundary: prelaunch identity unconfirmed, raw observations preserved, subsequent lump/DCA and anniversary windows retained.')
