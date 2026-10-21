import { deriveExposureSleeves } from './derive-exposure-sleeves.mjs'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { selectDcaCountryObservation } from './select-dca-country-observation.mjs'
import { PORTFOLIO_EXPOSURES } from '../src/data/portfolio-exposure-data.js'
import { INSTRUMENT_LISTINGS_BY_ISIN } from '../src/data/instrument-listings.js'
import { getInstrumentPeaStatus, getInstrumentName } from '../src/data/instruments.js'
import { ASSETS as PORTFOLIO_ASSETS } from '../src/data/portfolio-assets.js'
import { selectDcaHoldings } from './select-dca-holdings.mjs'
import { equityChartObservations } from './equity-chart-observations.mjs'
import { equityUniverse } from './dca-equity-universe.mjs'
const readOptional=name=>{const url=new URL('../src/data/'+name,import.meta.url);return existsSync(url)?JSON.parse(readFileSync(url,'utf8')):{}}
const fullHoldings=readOptional('dca-complete-holdings.json')
const securities=readOptional('dca-security-classifications.json')
const holdingStatus=readOptional('dca-holdings-status.json')
const multiAsset=readOptional('lifestrategy.json')
const chartSleeves=deriveExposureSleeves({...AUTOMATED_ETF,...readOptional('vanguard-equity-underliers.json')},readOptional('automated-indices.json'),readOptional('exposure-sleeves.json'))
const bondIsins=new Set(PORTFOLIO_ASSETS.filter(a=>a.cat==='obligataire'&&a.isin).map(a=>a.isin))
// Explicit example instruments, never silently assigned to a participant's generic ETF.
const mapping = {equalweight:'IE00BLNMYC90',robotics:'IE00BYZK4552',ai:'IE00BGV5VN51',cloud:'IE00BJGWQN72',energy:'IE00BJ5JP105',staples:'IE00BJ5JP329',discretionary:'IE00BJ5JP212',emexchina:'IE00BMG6Z448',emsmall:'IE00B3F81G20',smallvalue:'IE00BSPLC298',minvol:'IE00B8FHGS14',multifactor:'IE00BZ0PKT83',world:'IE00B4L5Y983',sp500:'IE00B5BMR087',europe:'FR0011550193',emerging:'IE00BTJRMP35',allworld:'IE00BK5BQT80',acwi:'IE00B6R52259',small:'IE00BF4RFH31',quality:'IE00BP3QZ601',nasdaq:'IE00B53SZB19',value:'IE00BP3QZB59',momentum:'IE00BP3QZ825',dividend:'IE00B9CQXS71',reit:'LU1437018838',russell:'IE00BJ38QD84',cybersecurity:'IE00BG0J4C88',water:'FR0010527275',infrastructure:'IE00B1FZS467',healthcare:'IE00BJ5JNZ06',industrials:'IE00BJ5JP659',materials:'IE00BM67HS53',utilities:'IE00BM67HQ30',timber:'IE00B27YCF74',agribusiness:'IE00B6R52143',semiconductors:'IE000I8KRLL9',lifestrategy20:'IE00BMVB5K07',lifestrategy40:'IE00BMVB5M21',lifestrategy60:'IE00BMVB5P51',lifestrategy80:'IE00BMVB5R75',
 // Or, argent, Bitcoin et Ethereum : parts exactes des registres (mêmes ETC/ETP que le Générateur), sans exposition actions.
 gold:'IE00B4ND3602',silver:'IE00B4NCWG09',btc:'GB00BLD4ZL17',eth:'GB00BLD4ZM24'}
const aliasesByIsin=Object.fromEntries(Object.entries(mapping).map(([asset,isin])=>[isin,asset]))
const allMapping={...mapping,...Object.fromEntries(Object.keys(AUTOMATED_ETF).filter(isin=>!aliasesByIsin[isin]).map(isin=>[isin,isin]))}
const commodityIsins=new Set(PORTFOLIO_ASSETS.filter(a=>a.cat==='matieres_premieres'&&a.isin).map(a=>a.isin))
const catalog={}
const holdings={}
const records = Object.fromEntries(Object.entries(allMapping).map(([asset,isin])=>{
 const source=AUTOMATED_ETF[isin],name=getInstrumentName(isin) || isin
 const synthetic=/swap|synthetic|leveraged|daily.*2x/i.test(name+' '+(source?.characteristics?.replicationMethod||''))
 const outside=/physical.*gold|physical.*silver|physical.*platinum|physical.*palladium|physical.*bitcoin|ethereum|bitcoin etp/i.test(name)
 const record={isin,name,kind:/\bET[CP]\b/.test(name)?'etc':'etf',provider:source?.provider,pea:getInstrumentPeaStatus(isin),tickers:(INSTRUMENT_LISTINGS_BY_ISIN[isin]||[]).map(l=>l.ticker),synthetic}
 // Exact products: overnight rate fund and copper ETC have no equity-sector allocation.
 if(['FR0013346681','LU0290358497'].includes(isin))record.outsideClassification='Monétaire'
 if(isin==='GB00B15KXQ89')record.outsideClassification='Cuivre'
 if(outside)record.outsideClassification=/gold/i.test(name)?'Or':/silver/i.test(name)?'Argent':/platinum/i.test(name)?'Platine':/palladium/i.test(name)?'Palladium':/bitcoin/i.test(name)?'Bitcoin':'Ethereum'
 if(!record.outsideClassification&&commodityIsins.has(isin))record.outsideClassification='Matières premières'
 if(!record.outsideClassification&&bondIsins.has(isin))record.outsideClassification='Obligations'
 if(chartSleeves[isin]?.equitySleeve)record.equitySleeve=chartSleeves[isin].equitySleeve
 if(multiAsset[isin]?.assetAllocation)record.assetAllocation=multiAsset[isin].assetAllocation
 catalog[asset]={isin,name,kind:record.kind,pea:record.pea,tickers:record.tickers,provider:record.provider}
 if(holdingStatus[isin])catalog[asset].holdingsStatus=holdingStatus[isin]
 const complete=fullHoldings[isin],partial=source?.holdings
 const h=selectDcaHoldings(complete,partial)
 if(h)catalog[asset].holdings={asOf:h.asOf,complete:h.complete===true,identifiedCoverage:h.rows.filter(r=>/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(r.isin||'')).reduce((s,r)=>s+r.weightPct,0)}
 if(h)holdings[asset]={asOf:h.asOf,basis:h.basis||'fund',sourceUrl:h.sourceUrl||source.sourceUrl,...(h.scope?{scope:h.scope,method:h.method,sourceUrls:h.sourceUrls}:{}),complete:h.complete===true,rows:h.rows.map(r=>({name:r.name,isin:r.isin,weightPct:r.weightPct})),synthetic}

 for(const field of ['countries','sectors']){
  let observation=PORTFOLIO_EXPOSURES[isin]?.[field]
 if(field==='countries')observation=selectDcaCountryObservation(observation,AUTOMATED_ETF[isin])
  if(chartSleeves[isin]?.[field])observation=chartSleeves[isin][field]
  if(!observation)continue
  if(synthetic&&observation.basis==='fund')continue // Never use a synthetic ETF's substitute basket as economic exposure.
  // Use the shared qualified contract; issuer identity alone never proves GICS
  // or country-of-risk equivalence. Fund/index scopes remain separate.
  const compatibility=observation.compatibility||`${observation.classificationMetadata?.id || `${field}-support-${isin}`}:${observation.basis}`
  record[field]={asOf:observation.asOf,basis:observation.basis,sourceUrl:observation.sourceUrl,sourceUrls:observation.sourceUrls,method:observation.method||observation.classificationMetadata?.method,classificationLabel:observation.classificationMetadata?.label,compatibility,rows:observation.rows.map(r=>({name:r.label||r.name,weightPct:r.weightPct}))}
 }
 const equityCharts=!synthetic&&equityChartObservations(complete)
 if(equityCharts&&!record.outsideClassification)Object.assign(record,equityCharts)
 return [asset,record]
}))
const previousEquities=JSON.parse(readFileSync(new URL('../src/data/dca-equity-exposures.json',import.meta.url),'utf8'))
for(const [asset,equity] of Object.entries(equityUniverse())){
 const r={...previousEquities[asset],...equity},security=securities[r.isin]
 if(chartSleeves[r.isin])Object.assign(r,chartSleeves[r.isin])
 if(security){
  const fields={countries:[security.country,'ishares-risk-net:fund','Country of risk'],sectors:[security.sector,'gics','GICS sector according to BlackRock']}
  for(const [field,[name,compatibility,method]] of Object.entries(fields))if(name&&name!=='-'&&(field==='countries'||['Information Technology','Financials','Industrials','Health Care','Consumer Discretionary','Consumer Staples','Communication','Communication Services','Energy','Materials','Utilities','Real Estate'].includes(name))&&security.asOf>=(r[field]?.asOf||''))r[field]={asOf:security.asOf,checkedAt:security.checkedAt,basis:'equity',sourceUrl:security.sourceUrl,compatibility,method,rows:[{name,weightPct:100}]}
 }
 records[asset]=r;catalog[asset]={name:r.name,isin:r.isin,kind:'equity',tickers:r.tickers,aliases:r.aliases}
}

if(!/nasdaq/i.test(records.nasdaq.name))throw Error('DCA Nasdaq identity mismatch')
const legacy=Object.fromEntries(Object.entries(records).filter(([key])=>!Object.hasOwn(AUTOMATED_ETF,key)&&records[key].kind!=='equity'))
writeFileSync(new URL('../src/pages/dca-profiles/exposures.json',import.meta.url),JSON.stringify(legacy))
const extra=Object.entries(records).filter(([key])=>Object.hasOwn(AUTOMATED_ETF,key)||records[key].kind==='equity')
for(let i=0;i<3;i++)writeFileSync(new URL(`../src/pages/dca-profiles/exposures-extra-${i}.json`,import.meta.url),JSON.stringify(Object.fromEntries(extra.filter((_,j)=>j%3===i))))
writeFileSync(new URL('../src/pages/dca-profiles/catalog.json',import.meta.url),JSON.stringify(catalog))
// Lazy shards prevent complete compositions from enlarging the initial route bundle.
const manifest={},shards=Array.from({length:32},()=>({}))
for(const [asset,h] of Object.entries(holdings)){
 const bucket=[...asset].reduce((s,c)=>(s*31+c.charCodeAt(0))>>>0,0)%32
 manifest[asset]=bucket;shards[bucket][asset]=h
}
for(let i=0;i<32;i++)writeFileSync(new URL(`../src/pages/dca-profiles/holdings-${i}.json`,import.meta.url),JSON.stringify(shards[i]))
writeFileSync(new URL('../src/pages/dca-profiles/holdings-manifest.json',import.meta.url),JSON.stringify(manifest))
// Small fallback for synchronous consumers and editorial top-ten checks.
writeFileSync(new URL('../src/pages/dca-profiles/holdings.json',import.meta.url),JSON.stringify(Object.fromEntries(Object.entries(holdings).map(([asset,h])=>[asset,{...h,complete:h.complete&&h.rows.length<=10,rows:h.rows.slice(0,10)}]))))
console.log(`DCA: ${Object.keys(records).length} références reliées aux collectes communes.`)
