import { readFileSync, writeFileSync } from 'node:fs'
import { PORTFOLIO_EXPOSURES } from '../src/data/portfolio-exposure-data.js'
import { getInstrumentName } from '../src/data/instruments.js'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
// Explicit example instruments, never silently assigned to a participant's generic ETF.
const mapping = {world:'IE00B4L5Y983',sp500:'IE00B5BMR087',europe:'FR0011550193',emerging:'IE00BTJRMP35',allworld:'IE00BK5BQT80',acwi:'IE00B6R52259',small:'IE00BF4RFH31',quality:'IE00BP3QZ601',nasdaq:'IE00B53SZB19',value:'IE00BP3QZB59',momentum:'IE00BP3QZ825',dividend:'IE00B9CQXS71',reit:'LU1437018838',russell:'IE00BJ38QD84',cybersecurity:'IE00BG0J4C88',water:'FR0010527275',infrastructure:'IE00B1FZS467',healthcare:'IE00BJ5JNZ06',industrials:'IE00BJ5JP659',materials:'IE00BM67HS53',utilities:'IE00BM67HQ30',timber:'IE00B27YCF74',agribusiness:'IE00B6R52143',semiconductors:'IE000I8KRLL9',lifestrategy20:'IE00BMVB5K07',lifestrategy40:'IE00BMVB5M21',lifestrategy60:'IE00BMVB5P51',lifestrategy80:'IE00BMVB5R75'}
const records = Object.fromEntries(Object.entries(mapping).map(([asset,isin])=>{
 const source=AUTOMATED_ETF[isin], record={isin,name:getInstrumentName(isin) || isin,kind:'etf'}
 for(const field of ['countries','sectors']){
  const observation=PORTFOLIO_EXPOSURES[isin]?.[field]
  if(!observation)continue
  const registration=/registration country/i.test(observation.method || '')
  // Explicit compatible attribution only; ICB and unqualified classifications stay separate.
  const compatibility=field==='countries'
   ? registration?'country-registration':source?.provider==='iShares'||/country of risk/i.test(observation.method||'')?'country-risk':`country-support-${isin}`
   : source?.provider==='iShares'||registration?'gics':`sector-support-${isin}`
  record[field]={...observation,compatibility}
 }
 return [asset,record]
}))
Object.assign(records,JSON.parse(readFileSync(new URL('../src/data/dca-equity-exposures.json',import.meta.url),'utf8')))
if(!/nasdaq/i.test(records.nasdaq.name))throw Error('DCA Nasdaq identity mismatch')
writeFileSync(new URL('../src/pages/dca-profiles/exposures.json',import.meta.url),JSON.stringify(records))
console.log(`DCA: ${Object.keys(records).length} références reliées aux collectes communes.`)
