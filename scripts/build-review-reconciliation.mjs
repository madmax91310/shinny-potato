// Original financial alerts are immutable; a new fetch never explains their cause.
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {ASSETS} from '../src/data/market-history.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {QUALIFIED_FUND_CALENDARS} from '../src/data/qualified-annual-calendars.js'
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
const repairs=JSON.parse(readFileSync(new URL('../src/data/financial-source-repairs.json',import.meta.url)))
const repairEvidence=new Map(Object.entries(repairs).map(([isin,repair])=>[isin,{...repair,...JSON.parse(readFileSync(new URL('../'+repair.evidencePath,import.meta.url)))}]))
const rows=original.cases.map(r=>{
 const check=diagnostics.get(key(r)),share=shares.get(r.isin)
 const current=currentCases.get(key(r))
 const repair=repairEvidence.get(r.isin),record=repair?.record
 const events=record?.isin===r.isin&&record.symbol===r.marketSymbol&&record.currency===r.currency
  ?record.distributionAdjustmentProof?.filter(p=>p.exDate.startsWith(`${r.year}-`)&&['missing-adjustment','already-adjusted'].includes(p.status)):[]
 const hasRepair=Boolean(events?.length&&record.distributionEvidence)
 const previousStatus=current?.status||r.status
 const status=hasRepair&&previousStatus==='anomalie encore inexpliquée'?'erreur corrigée ; résidu financier non attribué':previousStatus
 const points=new Map(record?.points??[]),p0=points.get(`${r.year-1}-12`),p1=points.get(`${r.year}-12`)
 return {id:key(r),isin:r.isin,name:r.name,year:r.year,initialStatus:r.status,status,open:status==='anomalie encore inexpliquée',residualOpen:status.startsWith('erreur corrigée ;'),
  original:{marketReturn:r.recollectedMarketReturn,officialReturn:r.recollectedNavReturn,convertedOfficialReturn:r.recollectedNavConverted,differencePp:r.recollectedDifferencePp,
   marketCurrency:r.currency,navCurrency:r.navCurrency,marketStartDate:r.marketStartDate,marketEndDate:r.marketEndDate,marketSymbol:r.marketSymbol,marketMic:r.marketMic},
  reason:current?.demonstratedCause||r.demonstratedCause,missingPiece:current?.missingPiece||r.missingPiece||null,
  resolutionEvidence:hasRepair?'https://github.com/madmax91310/shinny-potato/blob/master/'+repair.reportPath:status!==r.status?'https://github.com/madmax91310/shinny-potato/blob/master/'+integrated.source:null,
  currentCashRepair:hasRepair?{events:events.map(p=>({exDate:p.exDate,amount:p.amount,currency:p.currency})),sourceCheckedAt:events[0].evidenceCheckedAt,
   recordCheckedAt:record.checkedAt,sourceSha256:record.responseSha256,evidencePath:repair.evidencePath,currency:record.currency,
   correctedMarketReturn:p0&&p1?(p1/p0-1)*100:null,residualAttributed:false,priceWindowReleased:false}:null,
  currentConsumer:current?{route:current.voie_active_apres,secured:current.usage_securise,dailyEvidence:current.preuve_quotidienne_apres,officialCloseCheck:current.clotures_officielles_recoupees,proof:integrated.source}:null,
  sourceUrls:[...new Set([r.navSource,...(()=>{try{return JSON.parse(r.marketSource)}catch{return []}})()].filter(Boolean))],
  latestCheck:share?{runUrl:financialRun,attemptedAt:share.attemptedAt,officialStatus:share.official.status,officialError:share.official.error??null,marketStatus:share.market.status,
   recollectedAdjustedReturn:check?.recollectedAdjustedReturn??null,currentPublishedAnnual:check?.currentPublishedAnnual??null}:null,
  proof:'https://github.com/madmax91310/shinny-potato/blob/master/reports/reliquat-2026-10-23/reconciliation-90-ecarts.csv'}
})
for(const row of rows.filter(r=>r.open||r.residualOpen)){
 const start=`${row.year-1}-12`,end=`${row.year}-12`
 const windows=Object.values(ASSETS).filter(a=>a.isin===row.isin).map(a=>({id:a.id,currency:a.currency,convention:a.historyConvention??a.priceMethod,
  start:a.points[0]?.date,end:a.points.at(-1)?.date,sourceUrls:a.sourceUrls??[],qualification:qualifyHistoryWindow(a,start,end)}))
 const nav=windows.filter(w=>w.convention==='fund-nav-total-return'&&w.qualification.qualified)
 const calendar=QUALIFIED_FUND_CALENDARS[row.isin]
 const annualNav=Number.isFinite(calendar?.years[row.year])?{id:calendar.id,currency:calendar.currency,year:row.year,sourceUrls:calendar.sourceUrls}:null
 row.currentConsumer={integrationArchive:row.currentConsumer,windows,annualNav,
  route:nav.length?nav.map(w=>`${w.id} · ${w.currency} · ${w.convention}`).join(' ; '):annualNav?`${annualNav.id} · ${annualNav.currency} · calendrier annuel VL distinct`:'Fenêtre de cotation refusée ; aucun calcul admis sur cette période',
  proof:'Registres canoniques et qualification de fenêtres ci-dessous ; références de l’intégration précédente conservées séparément.',
  secured:nav.length?`NAV indépendante qualifiée pour ${row.year} (${nav.map(w=>w.currency).join(', ')}), sans attribuer la divergence de cotation initiale.`
   :`Fenêtre de cotation contestée refusée pour ${row.year} ; dernières observations conservées.${annualNav?' Calendrier annuel VL distinct disponible ; aucune cotation mensuelle déduite.':''}`}
}
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
