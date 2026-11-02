import assert from 'node:assert/strict'
import {explainCalendarRounding} from './audit-financial-reserves.mjs'
// Immutable official Amundi 2024 EUR example. No live price or FX is frozen.
const isin='FR0011871128',year=2024,left=32.84506920671928,right=32.85
const history={isin,historyConvention:'fund-nav-total-return'}
const record={isin,valuationBasis:'fund-nav-total-return',navCurrency:'EUR',calendarProof:{checks:[{year,start:'2023-12-29',end:'2024-12-31',dailyDerived:left,published:right,publishedDecimalPlaces:2}]}}
const args={isin,year,history,record,left,right}
const result=explainCalendarRounding(args)
assert(result);assert(Math.abs(result.convertedRoundingInterval[0]-32.845)<1e-12);assert(Math.abs(result.convertedRoundingInterval[1]-32.855)<1e-12)
assert.equal(explainCalendarRounding({...args,history:{...history,historyConvention:'adjusted'}}),null,'A tiny quote/NAV residual does not prove rounding')
assert.equal(explainCalendarRounding({...args,record:{...record,isin:'FR0013412020'}}),null,'Exact share required')
assert.equal(explainCalendarRounding({...args,record:{...record,navCurrency:null}}),null,'Native currency required')
assert.equal(explainCalendarRounding({...args,year:2023}),null,'Exact period required')
assert.equal(explainCalendarRounding({...args,left:32.84}),null,'Unexplained amplitude is not certified')
assert.equal(explainCalendarRounding({...args,right:32.86}),null,'Calendar must match the actual consumer')
for(const change of [{publishedDecimalPlaces:null},{start:'2024-01-01'},{end:'2025-01-01'},{dailyDerived:32.83}]){
 const altered={...record,calendarProof:{checks:[{...record.calendarProof.checks[0],...change}]}}
 assert.equal(explainCalendarRounding({...args,record:altered}),null,'Insufficient source contract remains unqualified')
}
console.log('Réserves ciblées : identité, bornes, devise, précision publiée et refus des faux rapprochements validés.')

// Immutable official exchange/NAV/FX evidence. A small residual alone never qualifies.
const {loadMarketNavEvidence,explainOfficialMarketNav,retainedBoundary} = await import('./lib/financial-reserve-evidence.mjs')
const {readFileSync} = await import('node:fs')
const {createHash} = await import('node:crypto')
const {gunzipSync,gzipSync} = await import('node:zlib')
const {convertCalendarReturn} = await import('../src/data/calendar-fx.js')
const evidenceRoot='reports/financial-qualification-2026-11-02/followup'
const loaded=loadMarketNavEvidence(evidenceRoot)
assert.equal(loaded.error,null);assert(loaded.evidence)
const e=loaded.evidence
const fixedFx={months:Object.fromEntries([e.start,e.end].map((d,i)=>[d.slice(0,7),{asOf:d,rates:{EUR:1,USD:e.usdPerEur[i]}}]))}
const convert=(v,y,s,t)=>convertCalendarReturn(v,y,s,t,fixedFx)
const levels=e.closes.map(v=>Math.round(Math.fround(v)*1e6)/1e6)
const quoteRecord={id:e.assetId,isin:e.isin,parser:'yahoo',field:'adjclose',mic:e.listing.mic,ticker:e.listing.ticker,currency:e.listing.currency,points:[[e.start.slice(0,7),levels[0]],[e.end.slice(0,7),levels[1]]]}
const marketArgs={isin:e.isin,year:e.year,history:{isin:e.isin,historyConvention:'adjusted'},record:quoteRecord,left:(levels[1]-levels[0])/levels[0]*100,right:convert(Math.round(e.annual*100)/100,e.year,e.navCurrency,'EUR'),evidence:e,fx:fixedFx,convert}
const explained=explainOfficialMarketNav(marketArgs)
assert(explained);assert.notEqual(explained.marketReturn,explained.navReturn,'Distinct official valuations are not forced equal')
const parts=explained.decompositionPercentagePoints
assert(Math.abs(parts.marketVersusNav+parts.calendarPrecision+parts.quoteRepresentation-parts.total)<1e-11,'Arithmetic identity, not a financial tolerance')
for(const patch of [{isin:'FR0013412020'},{year:2024},{left:marketArgs.left+.000001},{right:marketArgs.right+.000001},{evidence:null}]){
 assert.equal(explainOfficialMarketNav({...marketArgs,...patch}),null,'Uncorroborated comparison remains open')
}
for(const patch of [{isin:'IE00B4L5YX21'},{mic:'XLON'},{currency:'USD'},{ticker:'SWDA'},{field:'close'},{parser:'official-nav'}]){
 assert.equal(explainOfficialMarketNav({...marketArgs,record:{...quoteRecord,...patch}}),null,'The exact listing and measure are required')
}
for(const patch of [{start:'2024-12-30'},{year:2024},{navCurrency:'EUR'}]){
 assert.equal(explainOfficialMarketNav({...marketArgs,evidence:{...e,...patch}}),null,'No date or currency substitution')
}
const changedFx=structuredClone(fixedFx);changedFx.months[e.end.slice(0,7)].asOf='2025-12-30'
assert.equal(explainOfficialMarketNav({...marketArgs,fx:changedFx}),null,'Fixing at the actual official bound required')
const changedRecord=structuredClone(quoteRecord);changedRecord.points[1][1]+=.000001
assert.equal(explainOfficialMarketNav({...marketArgs,record:changedRecord}),null,'A tiny uncaptured price revision is not certified')
const missing=loadMarketNavEvidence(evidenceRoot,()=>{throw new Error('Missing evidence')})
assert.equal(missing.evidence,null);assert.match(missing.error,/Missing/)
const originalSpec=JSON.parse(readFileSync(`${evidenceRoot}/market-nav-evidence.json`))
const wrongBody=JSON.parse(gunzipSync(readFileSync(`${evidenceRoot}/${originalSpec.captures.nav.file}`)))
wrongBody.componentsByNameMap.keyFundFacts.containersByNameMap.default.dataPointsByNameMap.isin.value='IE00B4L5YX21'
const wrongRaw=Buffer.from(JSON.stringify(wrongBody)),wrongSpec=structuredClone(originalSpec)
wrongSpec.captures.nav.uncompressedSha256=createHash('sha256').update(wrongRaw).digest('hex')
const wrong=loadMarketNavEvidence(evidenceRoot,file=>String(file).endsWith('market-nav-evidence.json')?Buffer.from(JSON.stringify(wrongSpec)):String(file).endsWith(wrongSpec.captures.nav.file)?gzipSync(wrongRaw):readFileSync(file))
assert.equal(wrong.evidence,null);assert.match(wrong.error,/NAV share/,'Verified hash does not replace exact share identity')

const oldBoundary={id:'test-nav',isin:e.isin,navLast:'2026-10-30',totalLast:'2026-10-29',qualified:false}
const partial={isin:e.isin,periodEnd:'2026-09',points:[['2026-09',100]],historyExcludedMonths:['2026-10'],calendarProof:{controlledInstrument:e.isin,controlledFields:['isin','nav','income'],withheldMonthlyEnds:[{month:'2026-10',returnAsOf:'2026-10-29',lastNavAsOf:'2026-10-30'}]}}
const rawLevel={isin:e.isin,value:101,asOf:'2026-10-30',valuationBasis:'fund-nav-price'}
const beforeBoundary=structuredClone(partial),partialResult=retainedBoundary(oldBoundary,partial,rawLevel,false)
assert(partialResult.retainedPartialQualification);assert(partialResult.problemMonthWithheld);assert(!partialResult.monthQualified)
assert.deepEqual(partialResult.current.level,rawLevel,'An independently qualified raw NAV remains available')
assert(!retainedBoundary(oldBoundary,partial,rawLevel,true).monthQualified,'Contradictory month admission cannot override its source exclusion')
assert.deepEqual(partial,beforeBoundary,'Read-only classification preserves the financial record')
const complete={...partial,periodEnd:'2026-10',points:[...partial.points,['2026-10',101]],historyExcludedMonths:[],calendarProof:{...partial.calendarProof,withheldMonthlyEnds:[]}}
assert(retainedBoundary(oldBoundary,complete,rawLevel,true).monthQualified,'Historical refusal does not override new common-date evidence')
assert(!retainedBoundary(oldBoundary,{...complete,isin:'FR0013412020'},rawLevel,true).monthQualified)
console.log('Official market/NAV: exact share, listing, bounds, historical FX and source captures; historical refusal, partial qualification and restored month remain separate.')

assert.equal(retainedBoundary(oldBoundary,complete,{...rawLevel,isin:'FR0013412020'},true).current.level,null,'Raw-level identity stays independent and exact')
assert(retainedBoundary(oldBoundary,complete,null,true).monthQualified,'Missing raw NAV must not block a qualified return month')
