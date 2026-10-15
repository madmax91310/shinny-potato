import { readFileSync, writeFileSync } from 'node:fs'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { qualifyExposureClassification } from '../src/lib/exposure-classification.js'
import { PORTFOLIO_EXPOSURES } from '../src/data/portfolio-exposure-data.js'
import { getInstrumentName } from '../src/data/instruments.js'
// Explicit example instruments, never silently assigned to a participant's generic ETF.
const mapping = {ussmallvalue:'IE00BSPLC413',emvalue:'IE00BG0SKF03',euroultrashort:'IE00BCRY6557',equalweight:'IE00BLNMYC90',robotics:'IE00BYZK4552',ai:'IE00BGV5VN51',cloud:'IE00BJGWQN72',energy:'IE00BJ5JP105',staples:'IE00BJ5JP329',discretionary:'IE00BJ5JP212',emexchina:'IE00BMG6Z448',emsmall:'IE00B3F81G20',smallvalue:'IE00BSPLC298',minvol:'IE00B8FHGS14',multifactor:'IE00BZ0PKT83',world:'IE00B4L5Y983',sp500:'IE00B5BMR087',europe:'FR0011550193',emerging:'IE00BTJRMP35',allworld:'IE00BK5BQT80',acwi:'IE00B6R52259',small:'IE00BF4RFH31',quality:'IE00BP3QZ601',nasdaq:'IE00B53SZB19',value:'IE00BP3QZB59',momentum:'IE00BP3QZ825',dividend:'IE00B9CQXS71',reit:'LU1437018838',russell:'IE00BJ38QD84',cybersecurity:'IE00BG0J4C88',water:'FR0010527275',infrastructure:'IE00B1FZS467',healthcare:'IE00BJ5JNZ06',industrials:'IE00BJ5JP659',materials:'IE00BM67HS53',utilities:'IE00BM67HQ30',timber:'IE00B27YCF74',agribusiness:'IE00B6R52143',semiconductors:'IE000I8KRLL9',lifestrategy20:'IE00BMVB5K07',lifestrategy40:'IE00BMVB5M21',lifestrategy60:'IE00BMVB5P51',lifestrategy80:'IE00BMVB5R75'}
const records = Object.fromEntries(Object.entries(mapping).map(([asset,isin])=>{
 const record={isin,name:getInstrumentName(isin) || isin,kind:'etf'}
 for(const field of ['countries','sectors']){
  let observation=PORTFOLIO_EXPOSURES[isin]?.[field]
 // Prefer the same complete holdings-based country contract when a current,
 // non-negative alternative exists. Never relabel the published table as risk.
 if(field==='countries'){
  const risk=AUTOMATED_ETF[isin]?.countriesRisk
  const candidate=risk&&{...risk,provider:AUTOMATED_ETF[isin].provider,basis:'fund'}
  const classification=candidate&&qualifyExposureClassification(candidate,'countries')
  const sum=candidate?.rows?.reduce((s,r)=>s+r.weightPct,0)
  if(classification?.id==='ishares-risk-net'&&(!observation||candidate.asOf>=observation.asOf)
     &&sum>=99&&sum<=100.5&&candidate.rows.every(r=>Number.isFinite(r.weightPct)&&r.weightPct>=0))
   observation={...candidate,classificationMetadata:classification}
 }
  if(!observation)continue
  // Use the shared qualified contract; issuer identity alone never proves GICS
  // or country-of-risk equivalence. Fund/index scopes remain separate.
  const compatibility=`${observation.classificationMetadata?.id || `${field}-support-${isin}`}:${observation.basis}`
  record[field]={...observation,compatibility}
 }
 return [asset,record]
}))
Object.assign(records,JSON.parse(readFileSync(new URL('../src/data/dca-equity-exposures.json',import.meta.url),'utf8')))
if(!/nasdaq/i.test(records.nasdaq.name))throw Error('DCA Nasdaq identity mismatch')
writeFileSync(new URL('../src/pages/dca-profiles/exposures.json',import.meta.url),JSON.stringify(records))
console.log(`DCA: ${Object.keys(records).length} références reliées aux collectes communes.`)
