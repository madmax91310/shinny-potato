// Original financial alerts are immutable; a new fetch never explains their cause.
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
const original=JSON.parse(readFileSync(new URL('../reports/reliquat-2026-10-23/reconciliation-90-ecarts.json',import.meta.url)))
const proof=new URL('../reports/data-review-2026-10-23/preuves/financial-final-observation.json.gz',import.meta.url)
const observed=existsSync(proof)?JSON.parse(gunzipSync(readFileSync(proof))):null
const executions=JSON.parse(readFileSync(new URL('../reports/data-review-2026-10-23/network-executions.json',import.meta.url)))
const financialRun=executions.runs.find(r=>r.scope==='financial')?.runUrl??null
const key=r=>`${r.isin}/${r.year}`
const diagnostics=new Map((observed?.cases??[]).map(r=>[key(r),r]))
const shares=new Map((observed?.observations??[]).map(r=>[r.isin,r]))
const integrated=JSON.parse(readFileSync(new URL('../reports/data-review-2026-10-23/preuves/reconciliation-79-master-integre.json',import.meta.url)))
const currentCases=new Map(integrated.rows.map(r=>[key(r),r]))
const rows=original.cases.map(r=>{
 const check=diagnostics.get(key(r)),share=shares.get(r.isin)
 const current=currentCases.get(key(r))
 const status=current?.status||r.status
 return {id:key(r),isin:r.isin,name:r.name,year:r.year,initialStatus:r.status,status,open:status==='anomalie encore inexpliquée',residualOpen:status.startsWith('erreur corrigée ;'),
  original:{marketReturn:r.recollectedMarketReturn,officialReturn:r.recollectedNavReturn,convertedOfficialReturn:r.recollectedNavConverted,differencePp:r.recollectedDifferencePp,
   marketCurrency:r.currency,navCurrency:r.navCurrency,marketStartDate:r.marketStartDate,marketEndDate:r.marketEndDate,marketSymbol:r.marketSymbol,marketMic:r.marketMic},
  reason:current?.demonstratedCause||r.demonstratedCause,missingPiece:current?.missingPiece||r.missingPiece||null,
  resolutionEvidence:status!==r.status?'https://github.com/madmax91310/shinny-potato/blob/master/'+integrated.source:null,
  currentConsumer:current?{route:current.voie_active_apres,secured:current.usage_securise,dailyEvidence:current.preuve_quotidienne_apres,officialCloseCheck:current.clotures_officielles_recoupees,proof:integrated.source}:null,
  sourceUrls:[...new Set([r.navSource,...(()=>{try{return JSON.parse(r.marketSource)}catch{return []}})()].filter(Boolean))],
  latestCheck:share?{runUrl:financialRun,attemptedAt:share.attemptedAt,officialStatus:share.official.status,officialError:share.official.error??null,marketStatus:share.market.status,
   recollectedAdjustedReturn:check?.recollectedAdjustedReturn??null,currentPublishedAnnual:check?.currentPublishedAnnual??null}:null,
  proof:'https://github.com/madmax91310/shinny-potato/blob/master/reports/reliquat-2026-10-23/reconciliation-90-ecarts.csv'}
})
if(rows.length!==new Set(rows.map(r=>r.id)).size)throw Error('Duplicate original financial case')
const summary={total:rows.length,open:rows.filter(r=>r.open).length,corrected:rows.filter(r=>r.status==='erreur corrigée').length,correctedWithResidual:rows.filter(r=>r.residualOpen).length,nonComparable:rows.filter(r=>r.status==='comparaison non pertinente').length,
 checked:rows.filter(r=>r.latestCheck).length}
if(summary.total!==summary.open+summary.corrected+summary.correctedWithResidual+summary.nonComparable)throw Error('Unaccounted financial case')
writeFileSync(new URL('../public/data/financial-reconciliation.json',import.meta.url),JSON.stringify({schemaVersion:1,summary,sourceCheckedAt:observed?.attemptedAt??null,rows},null,2)+'\n')
// Only the original disputed listing and valuation months are suspended.
// A separately qualified NAV or a different listing is a distinct data contract.
const windows=new Map()
for(const row of rows.filter(r=>r.open||r.residualOpen)){
 const {marketSymbol:symbol,marketCurrency:currency}=row.original
 if(!symbol||!currency||!Number.isInteger(Number(row.year)))throw Error('Unbound financial restriction '+row.id)
 const key=JSON.stringify([row.isin,symbol,currency])
 if(!windows.has(key))windows.set(key,[row.isin,symbol,currency,[]])
 windows.get(key)[3].push(Number(row.year))
}
writeFileSync(new URL('../src/data/financial-history-restrictions.json',import.meta.url),JSON.stringify([...windows.values()])+'\n')
console.log('Original financial cases preserved:',summary)
