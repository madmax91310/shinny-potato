import {fileURLToPath} from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
const read = path => JSON.parse(readFileSync(new URL('../'+path, import.meta.url)))
const classifications = read('src/data/dca-security-classifications.json')
const aliases = {...read('scripts/dca-equity-identities.json'), ...read('scripts/dca-equity-extra-identities.json')}
const sources = read('scripts/monthly-automation.json').series
const global = new Map(read('src/data/global-equities.json').map(r=>[r.id,r]))
const catalog = Object.values(read('src/pages/dca-profiles/catalog.json'))
const exchanges = {'.PA':['Nyse Euronext - Euronext Paris','Euronext Paris'],'.AS':['Euronext Amsterdam'],'.DE':['Xetra','Deutsche Boerse Xetra'],'.SW':['SIX Swiss Exchange'],'.MC':['Bolsa De Madrid'],'.MI':['Borsa Italiana'],'.T':['Tokyo Stock Exchange'],'.KS':['Korea Exchange (Stock Market)'],'.HK':['Hong Kong Exchanges And Clearing Ltd'],'.CO':['Omx Nordic Exchange Copenhagen A/S'],'.NS':['National Stock Exchange Of India'],'.SI':['Singapore Exchange'],'.SZ':['Shenzhen Stock Exchange'],'.SS':['Shanghai Stock Exchange'],'.BR':['Euronext Brussels'],'.OL':['Oslo Bors Asa'],'.HE':['Nasdaq Omx Helsinki Ltd.'],'.ST':['Nasdaq Omx Nordic','Nasdaq Omx Stockholm'],'.TO':['Toronto Stock Exchange'],'.AX':['Asx - All Markets']}
const normal = value => String(value).toUpperCase().replace(/[-\s]/g,'').replace(/^0+(?=\d)/,'')
export function matchesListing(source, security) {
  if (!security || source.currency !== security.currency) return false
  const suffix = Object.keys(exchanges).find(s=>source.symbol.endsWith(s))
  if (suffix && !exchanges[suffix].includes(security.exchange)) return false
  if (!suffix && !['NASDAQ','New York Stock Exchange Inc.','Nyse Mkt Llc'].includes(security.exchange)) return false
  const ticker = suffix ? source.symbol.slice(0,-suffix.length) : source.symbol
  return normal(ticker) === normal(security.ticker)
}
const links={}, unresolved=[]
for (const source of sources) {
  if (source.parser!=='yahoo' || source.field!=='adjclose' || source.consumerScope==='catalog') continue
  const explicit=global.get(source.id)
  const candidates=Object.values(classifications).filter(r=>matchesListing(source,r))
  const reviewed=aliases[source.id]
  const security=(reviewed && candidates.find(r=>r.isin===reviewed)) || (candidates.length===1 ? candidates[0] : null)
  // A reviewed global source already carries the exact local listing and ISIN.
  const isin=source.isin ?? explicit?.isin ?? security?.isin
  if (!isin) {if (reviewed || catalog.some(r=>r.kind==='equity' && r.name===source.label)) unresolved.push({id:source.id,symbol:source.symbol,reason:'No unambiguous exact listing/ISIN evidence; ADR and ordinary shares stay separate.'});continue}
  const reference=catalog.find(r=>r.isin===isin)
  if (!reference || reference.kind!=='equity') throw new Error(`${source.id}: equity identity absent from exposure catalogue`)
  links[source.id]={isin,label:source.label,symbol:source.symbol,currency:source.currency,sector:classifications[isin]?.sector??null,
    sourceUrl:classifications[isin]?.sourceUrl ?? explicit?.classificationSourceUrl ?? null,
    asOf:classifications[isin]?.asOf??null,checkedAt:classifications[isin]?.checkedAt?.slice(0,10)??null}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
writeFileSync('src/data/equity-history-links.json',JSON.stringify(links,null,2)+'\n')
writeFileSync('docs/equity-identity-gaps.json',JSON.stringify({unresolved},null,2)+'\n')
console.log(`Exact equity identities: ${Object.keys(links).length}; unresolved: ${unresolved.length}`)

}
