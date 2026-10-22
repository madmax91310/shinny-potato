import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {ASSETS,ASSET_ORDER} from '../src/data/market-history.js'
import {derive} from '../src/pages/investment-calculator/lib.js'
import {monthlyCurrencyFactor} from '../src/data/history-currency.js'
import {RANKING_ASSETS,CATEGORIES} from '../src/pages/performance-rankings/data.js'
import {convertAsset} from '../src/pages/performance-rankings/series.js'
import {commonCoverage,buildRanking,periodReturn} from '../src/pages/performance-rankings/engine.js'
import {annualRankingError} from '../src/pages/performance-rankings/annualRanking.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
execFileSync(process.execPath,['scripts/report-ai-tool-reuse.mjs'],{stdio:'inherit'})
const report=JSON.parse(readFileSync('docs/ai-tools-matrix.json'))
const proof=JSON.parse(readFileSync('scripts/source-snapshots/monthly-automated.json'))
assert.equal(report.matrix.length,29)
assert.equal(new Set(report.matrix.map(r=>r.identity.isin)).size,29)
assert.equal(new Set(ASSET_ORDER).size,ASSET_ORDER.length)
for(const row of report.matrix){
 const h=row.after.history[0],asset=ASSETS[h.id],source=row.automation.monthly
 assert(source && asset && RANKING_ASSETS[h.id],row.identity.name)
 assert.equal(source.isin,row.identity.isin)
 assert.equal(source.currency,asset.currency)
 assert.equal(source.field,'adjclose')
 assert.equal(asset.points.length,h.months)
 // Independent source proof, rather than a calculation on the implementation's input alone.
 const observed=proof[h.id].proofRows
 assert.equal(observed.length,asset.points.length)
 for(let i=0;i<observed.length;i++){
  const p=asset.points[i],r=observed[i]
  assert.equal(r.date.slice(0,7),p.date)
  assert(Math.abs(p.price-r.value)<.000001)
  assert(Math.abs(r.close-(r.windowClose??r.monthlyClose))<=Math.max(.02,r.close*1e-7))
 }
 const first=observed[0],last=observed.at(-1)
 const inputs={assetId:h.id,amountRaw:'1000',startYear:+h.start.slice(0,4),startMonth:+h.start.slice(5),overridePriceRaw:''}
 const lump=derive({...inputs,mode:'lump'})
 assert(Math.abs(lump.result.finalValue-1000*last.value/first.value)<.03)
 const dca=derive({...inputs,mode:'dca'})
 const expected=observed.reduce((total,r)=>total+1000/r.value,0)*last.value
 assert(Math.abs(dca.result.finalValue-expected)<Math.max(.1,expected*1e-6))
 for(const before of row.before.history)assert(h.start<=before.start && h.end>=before.end,'A qualified long history must not shrink')
 for(const cell of Object.values(row.tools))assert(['déjà raccordé','raccordable','raccordé dans cette PR','bloqué','hors périmètre'].includes(cell.status)&&cell.reason)
 // Same two historical fixes, computed directly from ECB observations.
 const converted=convertAsset(RANKING_ASSETS[h.id],'EUR',FX)
 const start=converted.points[0],end=converted.points.at(-1)
 const from=asset.points.find(p=>p.date===start.date),to=asset.points.find(p=>p.date===end.date)
 const rate=date=>asset.currency==='EUR'?1:FX.months[date].rates[asset.currency]
 const reference=(to.price/from.price*rate(start.date)/rate(end.date)-1)*100
 assert(Math.abs(periodReturn(converted,start.date,end.date)-reference)<1e-8)
 assert.equal(monthlyCurrencyFactor(end.date,asset.currency,'EUR'),1/rate(end.date))
}
for(const p of report.profiles){
 assert.equal(p.status,'raccordé dans cette PR',p.id)
 assert(p.ids.length>=2 && p.ids.length<=6)
 const assets=p.ids.map(id=>convertAsset(RANKING_ASSETS[id],p.currency,FX)),coverage=commonCoverage(assets)
 const period=buildRanking(assets,{mode:'period',start:coverage.start,end:coverage.end})
 assert(period.columns[0].rows.every(r=>Number.isFinite(r.value)))
 if(coverage.years.length){const years=coverage.years.slice(-7);const result=buildRanking(assets,{mode:'years',startYear:years[0],endYear:years.at(-1)})
 assert.equal(!annualRankingError(result),p.modes.annual,p.id)}
}
for(const id of ['nebius','vertiv','rocket-lab','ast-spacemobile','sofi','ge-vernova','constellation-energy']){
 const source=report.matrix.find(r=>r.after.history[0].id===id).automation.monthly
 assert(source.periodStart>=source.historyFloor)
 assert(source.continuitySourceUrls?.length && source.continuityNote)
}
const vanguard=report.matrix.filter(r=>['IE00B3RBWM25','IE00BK5BQT80'].includes(r.identity.isin))
assert.equal(vanguard.length,2)
assert(!CATEGORIES.some(c=>vanguard.every(r=>c.ids.includes(r.after.history[0].id))),'No accidental Acc/Dist duel')
console.log('29 exact identities, every qualified source month, independent lump/DCA/FX calculations, preserved long histories, 16 profile windows and annual admissions verified.')
