import {ordinaryListing} from './shared-listing-identities.mjs'
import {readFileSync} from 'node:fs'
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url)))
const catalog=Object.values(read('src/pages/dca-profiles/catalog.json'))
const active=new Set(Object.values(read('src/data/equity-history-links.json')).map(r=>r.isin))
const classifications=read('src/data/dca-security-classifications.json')
// Curated candidates carry the editorial identity (id, label, scene, region) and the expected
// exact listing. Issuer holdings qualify the ISIN; a reviewed directory listing can
// qualify a different venue of the same ordinary share without replacing its prices.
const curated=new Map(read('scripts/global-equity-candidates.json').candidates.map(c=>[c.isin,c]))
// Exchange labels as published in BlackRock complete holdings, mapped to the Yahoo suffix of
// the same venue and its trading timezone. A venue absent from this map is never guessed.
export const exchanges={
 'NASDAQ':['','America/New_York'],'New York Stock Exchange Inc.':['','America/New_York'],'Nyse Mkt Llc':['','America/New_York'],
 'Nyse Euronext - Euronext Paris':['.PA','Europe/Paris'],'Xetra':['.DE','Europe/Berlin'],
 'SIX Swiss Exchange':['.SW','Europe/Zurich'],'London Stock Exchange':['.L','Europe/London'],
 'Euronext Amsterdam':['.AS','Europe/Amsterdam'],'Bolsa De Madrid':['.MC','Europe/Madrid'],
 'Borsa Italiana':['.MI','Europe/Rome'],'Tokyo Stock Exchange':['.T','Asia/Tokyo'],
 'Korea Exchange (Stock Market)':['.KS','Asia/Seoul'],'Hong Kong Exchanges And Clearing Ltd':['.HK','Asia/Hong_Kong'],
 'Omx Nordic Exchange Copenhagen A/S':['.CO','Europe/Copenhagen'],
 'National Stock Exchange Of India':['.NS','Asia/Kolkata'],'Singapore Exchange':['.SI','Asia/Singapore'],
 'Shenzhen Stock Exchange':['.SZ','Asia/Shanghai'],'Shanghai Stock Exchange':['.SS','Asia/Shanghai'],
 'Euronext Brussels':['.BR','Europe/Brussels'],'Nyse Euronext - Euronext Brussels':['.BR','Europe/Brussels'],'Oslo Bors Asa':['.OL','Europe/Oslo'],
 'Nasdaq Omx Helsinki Ltd.':['.HE','Europe/Helsinki'],'Nasdaq Omx Nordic':['.ST','Europe/Stockholm'],'Nasdaq Omx Stockholm':['.ST','Europe/Stockholm'],
 'Toronto Stock Exchange':['.TO','America/Toronto'],'Asx - All Markets':['.AX','Australia/Sydney'],
 'Taiwan Stock Exchange':['.TW','Asia/Taipei'],
}
const normal=value=>String(value).toUpperCase().replace(/[-\s]/g,'').replace(/^0+(?=\d)/,'')
export function buildCandidates(){
 const candidates=[], skipped=[]
 for(const item of catalog) {
  if(item.kind!=='equity'||active.has(item.isin))continue
  const r=classifications[item.isin],market=exchanges[r?.exchange],expected=curated.get(item.isin)
  if(!r){if(expected)skipped.push({id:expected.id,isin:item.isin,reason:'No classification in the official complete holdings yet'});continue}
  if(!market||!r.ticker||!r.currency||!r.sourceUrl||!r.asOf){skipped.push({id:expected?.id??item.isin,isin:item.isin,reason:`Unsupported or incomplete listing evidence: ${r.exchange??'no exchange'}`});continue}
  const [suffix,timezone]=market
  // Yahoo writes London tickers without their trailing dot (BP. → BP.L, NG. → NG.L).
  let ticker=r.ticker.replace(/\s+/g,'-').replace(/\.+$/,'')
  if(suffix==='.HK')ticker=ticker.padStart(4,'0')
  let symbol=ticker+suffix
  let listingEvidence={sourceUrl:r.sourceUrl,asOf:r.asOf,isin:r.isin,ticker:r.ticker,exchange:r.exchange,currency:r.currency}
  // A US ordinary-share listing must not silently become its Canadian quotation.
  // Reuse the qualified directory identity, keeping the issuer ISIN proof separate.
  if(expected?.aiListingId){
   const ai=ordinaryListing(expected.aiListingId,{...expected,isin:item.isin})
   if(!ai || ai.instrumentType!=='EQUITY' || ai.symbol!==expected.symbol || ai.currency!==expected.currency || (ai.isin && ai.isin!==item.isin)){
    skipped.push({id:expected.id,isin:item.isin,reason:'Qualified common directory listing changed or is unavailable'});continue
   }
   symbol=ai.symbol
   listingEvidence={isin:item.isin,ticker:ai.ticker,exchange:ai.mic,currency:ai.currency,sourceUrl:ai.listingObservation?.sourceUrl??ai.sourceUrl,asOf:ai.listingObservation?.asOf??ai.sourceAsOf,
    identitySourceUrl:r.sourceUrl,identityAsOf:r.asOf,aiListingId:ai.id,companyId:ai.companyId,shareClass:ai.shareClass}
  }
  if(expected?.symbol&&expected.symbol!==symbol){skipped.push({id:expected.id,isin:item.isin,reason:`Expected listing ${expected.symbol} differs from the issuer-held listing ${symbol}; no substitution`});continue}
  if(expected&&!expected.aiListingId&&normal(expected.currency==='GBp'?'GBP':expected.currency)!==normal(r.currency)){skipped.push({id:expected.id,isin:item.isin,reason:`Expected currency ${expected.currency} differs from the issuer listing currency ${r.currency}`});continue}
  const label=expected?.label??(r.exchange==='London Stock Exchange'?item.name.replace(/\s*\((?:NYSE|ADR)\)$/,'')+' (Londres)':item.name)
  candidates.push({id:expected?.id??`stock${item.isin}`,isin:item.isin,label,ticker:listingEvidence.ticker,
   symbol,currency:expected?.aiListingId?expected.currency:r.currency,timezone:expected?.timezone??timezone,parser:'yahoo',field:'adjclose',precision:6,
   ...(expected?.historyFloor?{historyFloor:expected.historyFloor}:{}),
   instrumentType:'EQUITY',consumerScope:'equity',collectAnniversary:true,
   ...(expected?{icon:'📈',tweetPhrase:expected.label}:{}),
   listingEvidenceId:listingEvidence.aiListingId??`${item.isin}:${r.exchange}:${r.ticker}:${r.currency}`,
   listingEvidence,
   method:'ISIN qualifié dans les positions émetteur ; cotation exacte qualifiée par ces positions ou l’annuaire officiel référencé. Cours ajustés des distributions et divisions ; dernières clôtures quotidiennes recoupées avec les clôtures mensuelles Yahoo.'})
 }
 return {candidates,skipped}
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const {candidates,skipped}=buildCandidates()
 if(skipped.length)process.stderr.write(JSON.stringify(skipped,null,1)+'\n')
 process.stdout.write(JSON.stringify(candidates))
}
