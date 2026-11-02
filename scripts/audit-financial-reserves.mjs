#!/usr/bin/env node
// Targeted follow-up of the dated #1143 reserve queue. These results are audit
// evidence only; no market observation or qualification rule is rewritten.
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {pathToFileURL} from 'node:url'
import {ASSETS as histories} from '../src/data/calculator-history.js'
import MONTHLY from '../src/data/automated-etf-monthly.json' with {type:'json'}
import {ASSETS as portfolios} from '../src/data/portfolio-assets.js'
import {CATALOG,euroReturn} from '../src/data/duel-assets.js'
import {assetReturn} from '../src/pages/portfolio-generator/performance.js'
import {getInstrumentAnnualPerformance} from '../src/data/instrument-returns.js'
import {getInstrumentFacts} from '../src/data/instrument-facts.js'
import {getAnnualReturns} from '../src/pages/tweet-midi/data/performanceHistory.js'
import {ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {convertCalendarReturn} from '../src/data/calendar-fx.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {ETFS} from '../src/data/etf-cards.js'
import {getComparisonPerformance} from '../src/pages/tweet-midi/comparisonPerformance.js'
import {getAnnualPerformance} from '../src/pages/etf-sheets/annualPerformance.js'
import {buildSheet,buildTweet} from '../src/pages/practical-sheets/lib.js'

export const output='reports/financial-qualification-2026-11-02'
const initialPath='reports/financial-consistency-2026-11-02/matrix.json'
const initial=JSON.parse(readFileSync(initialPath))
const initialRows=initial.rows.filter(r=>r.classification.startsWith('mesures différentes'))
const map=s=>s?.years??Object.fromEntries((s?.values??[]).map((v,i)=>[s.calendarYears?.[i]??2020+i,v]))
const near=(a,b,t=1e-6)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<t

// Round-trip in the issuer's native currency, THEN historical endpoint FX.
// A small market/NAV gap alone can never satisfy this check.
export function explainCalendarRounding({isin,year,history,record,left,right}) {
 if(!history||history.isin!==isin||record?.isin!==isin||history.historyConvention!=='fund-nav-total-return'||record.valuationBasis!=='fund-nav-total-return')return null
 const check=record.calendarProof?.checks?.find(c=>Number(c.year)===Number(year))
 if(!check||!Number.isInteger(check.publishedDecimalPlaces)||check.publishedDecimalPlaces<0||check.publishedDecimalPlaces>8||!record.navCurrency)return null
 const {dailyDerived,published,publishedDecimalPlaces}=check
 if(!Number.isFinite(dailyDerived)||!Number.isFinite(published)||!/^\d{4}-12-\d{2}$/.test(check.start??'')||!/^\d{4}-12-\d{2}$/.test(check.end??'')||Number(check.start.slice(0,4))!==year-1||Number(check.end.slice(0,4))!==year)return null
 const halfUnit=.5*10**-publishedDecimalPlaces
 if(Math.abs(dailyDerived-published)>halfUnit)return null
 const convertedDerived=convertCalendarReturn(dailyDerived,year,record.navCurrency,'EUR')
 const convertedPublished=convertCalendarReturn(published,year,record.navCurrency,'EUR')
 if(!near(left,convertedDerived)||!near(right,convertedPublished,1e-8))return null
 const interval=[published-halfUnit,published+halfUnit].map(v=>convertCalendarReturn(v,year,record.navCurrency,'EUR'))
 if(!interval.every(Number.isFinite)||left<interval[0]-1e-6||left>interval[1]+1e-6)return null
 return {cause:'Arrondi du calendrier officiel, avant conversion historique',nativeCurrency:record.navCurrency,check,convertedDerived,convertedPublished,convertedRoundingInterval:interval,monthlyProjectionTolerance:1e-6,sourceUrls:record.sourceUrls,sourceCheckedAt:record.checkedAt,sourceHashes:record.rawSourceHashes}
}

function consumerRows(isin,period) {
 const year=Number(period),annual=getInstrumentAnnualPerformance(isin),facts=getInstrumentFacts(isin),sheet=ETFS.find(a=>a.isin===isin),assets=Object.entries(histories).filter(([,a])=>a.isin===isin)
 const p=portfolios.find(a=>a.isin===isin),duel=CATALOG.find(a=>a.isin===isin)
 const rows=[]
 const add=(usage,channel,admitted,detail)=>rows.push({isin,period,usage,channel,initialAdmission:admitted,finalAdmission:admitted,detail,qualificationChanged:false})
 const available=Number.isFinite(map(annual)[year]);let sheetValue=null,comparisonValue=null
 if(sheet&&available){sheetValue=map(getAnnualPerformance({...sheet,performanceCurrency:'EUR'}))[year];comparisonValue=getComparisonPerformance(isin,[year],'EUR')?.rows?.find(r=>r.year===year)?.pct}
 add('Présentation ETF','calendrier annuel de part',Number.isFinite(sheetValue),{value:sheetValue,currency:'EUR',incomePolicy:facts.incomePolicy})
 add('Comparatif ETF','calendrier annuel de part',Number.isFinite(comparisonValue),{value:comparisonValue,currency:'EUR'})
 if(Number.isFinite(sheetValue)&&Number.isFinite(comparisonValue))assert(near(sheetValue,comparisonValue,1e-8),isin+' presentation/comparison')
 if(!assets.length){add('Performance depuis','mensuel',false,{reason:'Pas de série mensuelle identifiée dans ce canal ; ne pas en inventer depuis le calendrier annuel'});add('Calculateur','mensuel',false,{reason:'Pas de série mensuelle identifiée dans ce canal'})}
 for(const [id,a]of assets){
  let returns=[];try{returns=getAnnualReturns(id,year)}catch{}
  add('Performance depuis',id,returns.some(r=>r.year===year),{currency:a.currency,convention:a.historyConvention??a.priceMethod,sourceUrls:a.sourceUrls})
  const q=qualifyHistoryWindow(a,`${year-1}-12`,`${year}-12`);add('Calculateur',id,q.qualified,{...q,currency:a.currency,convention:a.historyConvention??a.priceMethod})
  const eligibility=ANNIVERSAIRE_ELIGIBLE_ASSETS.find(a=>a.id===id);add('Il y a X ans',id,!!eligibility,{reason:eligibility?'Canal de niveaux bruts/NAV distinct ; sélection courante qualifiée':'Canal actuellement exclu',periodScope:'Éligibilité actuelle ; ne certifie pas une nouvelle borne quotidienne',valuationBasis:a.anniversaryValuationBasis??a.historyConvention??a.priceMethod})
 }
 if(!assets.length)add('Il y a X ans','niveau',false,{reason:'Aucun canal brut/NAV identifié'})
 const g=p?assetReturn(p,year):null,d=duel?euroReturn(duel,year):null
 add('Générateur',p?.id??'aucun',Number.isFinite(g),{value:g,currency:'EUR',admissionScope:'Catalogue existant ; aucune admission automatique ajoutée',source:p?.calendarSource??null})
 add('Duels',duel?.id??'aucun',Number.isFinite(d),{value:d,currency:'EUR'})
 if(Number.isFinite(g)&&Number.isFinite(d))assert(near(g,d,1e-8),isin+' generator/duel')
 return rows
}

export function audit() {
 const used=new Set(),rows=[],usages=[]
 const refreshed=JSON.parse(readFileSync(`${output}/source-checks/four-nav.json`))
 for(const [index,before]of initialRows.entries()){
  const year=Number(before.period),p=portfolios.find(p=>p.isin===before.identity)
  // Retain both copper channels: their ISIN/year match, their observations do not.
  const candidates=Object.entries(histories).filter(([,a])=>a.isin===before.identity).flatMap(([id,a])=>{
   let r;try{r=getAnnualReturns(id,year).find(r=>r.year===year)}catch{}
   if(!r)return []
   const value=convertCalendarReturn(r.pct,year,a.currency,'EUR');return [{id,a,value}]
  }).filter(c=>!used.has(`${before.identity}/${year}/${c.id}`)).sort((a,b)=>Math.abs(a.value-before.left)-Math.abs(b.value-before.left))
  const found=candidates[0]
  if(!found){rows.push({caseId:`measurement-${index+1}`,initial:before,classification:'résolu depuis le bilan — canal retiré ou refusé',cause:'Ne plus comparer une fenêtre non admise ; son absence ne prouve pas une réparation du fournisseur'});continue}
  used.add(`${before.identity}/${year}/${found.id}`)
  const right=assetReturn(p,year),rounding=explainCalendarRounding({isin:before.identity,year,history:found.a,record:MONTHLY[found.id],left:found.value,right})
  const fresh=refreshed.find(r=>r.isin===before.identity&&r.qualified),officialCheck=fresh?.checks?.find(c=>Number(c.year)===year)
  const corroborated=rounding&&officialCheck&&near(officialCheck.dailyDerived,rounding.check.dailyDerived,1e-8)&&officialCheck.published===rounding.check.published&&officialCheck.start===rounding.check.start&&officialCheck.end===rounding.check.end
  const proof=corroborated?{...rounding,independentRecheck:{checkedAt:fresh.checkedAt,sourceUrls:fresh.sourceUrls,rawSourceHashes:fresh.rawSourceHashes,check:officialCheck}}:null
  const classification=proof?'différence légitime — arrondi officiel documenté':near(found.value,right,1e-8)?'résolu depuis le bilan — mesures désormais concordantes':'preuve insuffisante — résidu cotation/NAV non attribué'
  rows.push({caseId:`measurement-${index+1}`,isin:before.identity,period:before.period,leftAssetId:found.id,currency:'EUR',initial:before,current:{left:found.value,right,gap:found.value-right},classification,measureDifferenceEstablished:!proof,proof,missing:proof?null:'Cours de clôture et NAV aux mêmes dates/heures, réinvestissements et événements de part, puis fixing de change à ces bornes ; le seul écart de convention ne prouve pas le résidu.',lastValidObservationsPreserved:true})
 }
 const pairs=[...new Map(rows.filter(r=>r.isin).map(r=>[r.isin+'/'+r.period,[r.isin,r.period]])).values()]
 for(const [isin,period]of pairs)usages.push(...consumerRows(isin,period))
 const facts=buildSheet('em-pea'),tweet=buildTweet(facts)
 const policyCases=[['FR0013412020','em-pea'],['FR0013412012','em-pea'],['FR0013412038','europe-pea']]
 const policyRows=policyCases.map(([isin,topic])=>({caseId:'income-'+isin,isin,usage:'Fiches pratiques / '+topic,origin:isin==='FR0013412038'?'Cas supplémentaire de même cause':'Réserve initiale #1144',period:isin==='FR0013412012'?'Prospectus 30/12/2022, DIC 26/01/2023 et 2026':isin==='FR0013412020'?'DIC 26/01/2023 et 29/03/2024, DIC 2026':'DIC 2026 ; périodes antérieures séparées',classification:'erreur de convention démontrée — copie corrigée',initial:{policy:getInstrumentFacts(isin).distribution,practical:isin==='FR0013412012'?'À vérifier sur le DIC':'Capitalisation et/ou distribution',copy:isin==='FR0013412012'?'À vérifier sur le DIC':'capitalisation ; prédicat de préfixe ambigu'},final:{policy:getInstrumentFacts(isin).distribution,practical:buildSheet(topic).funds.find(f=>f.isin===isin).distribution,copy:'Politique à décision de la société de gestion ; aucune distribution historique inventée'},historicalCashQualification:'Politique attestée aux dates des documents archivés ; paiements historiques non certifiés, versions 2019–2022 et avis de distributions nécessaires',incomePolicyChanged:false}))
 for(const [isin]of policyCases)usages.push(...consumerRows(isin,'2025'))
 assert(!tweet.includes('Les parts présentées sont capitalisantes'))
 const boundaries=JSON.parse(readFileSync(`${output}/source-checks/nav-boundaries.json`))
 for(const b of boundaries)usages.push(...consumerRows(b.isin,'2025'))
 return {schema:1,generatedAt:new Date().toISOString(),base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),initialReport:{path:initialPath,base:initial.base,generatedAt:initial.generatedAt},measurementRows:rows,policyRows,boundaries,usageMatrix:usages,summary:{originalMeasurementComparisons:initialRows.length,uniqueMeasurementIsinYears:pairs.length,measurementClassifications:Object.fromEntries([...new Set(rows.map(r=>r.classification))].map(c=>[c,rows.filter(r=>r.classification===c).length])),boundaryRefreshRefusals:boundaries.filter(b=>!b.qualified).length,policyCases:policyRows.length,financialSeriesAdmissionsChanged:0,pricesOrReturnsRewritten:0},limits:['Aucune nouvelle tolérance financière ni autorisation historique. Le test d’arrondi explique des comparaisons déjà admises.','Un niveau conservé et un rafraîchissement refusé sont deux états distincts.','Matrice ciblée : les 4206 contrôles généraux ne sont pas rejoués.']}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const result=audit();if(process.argv.includes('--write')){mkdirSync(output,{recursive:true});writeFileSync(`${output}/matrix.json`,JSON.stringify(result,null,2)+'\n');const columns=['isin','period','usage','channel','initialAdmission','finalAdmission','detail'];writeFileSync(`${output}/usage-matrix.csv`,[columns.join(','),...result.usageMatrix.map(r=>columns.map(k=>'"'+String(typeof r[k]==='object'?JSON.stringify(r[k]):r[k]??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n')}console.log(JSON.stringify(result.summary,null,2))}
