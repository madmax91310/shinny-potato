import {readFileSync} from 'node:fs'
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url)))
const catalog=Object.values(read('src/pages/dca-profiles/catalog.json'))
const active=new Set(Object.values(read('src/data/equity-history-links.json')).map(r=>r.isin))
const classifications=read('src/data/dca-security-classifications.json')
const exchanges={
 'NASDAQ':['','America/New_York'],'New York Stock Exchange Inc.':['','America/New_York'],
 'Nyse Euronext - Euronext Paris':['.PA','Europe/Paris'],'Xetra':['.DE','Europe/Berlin'],
 'SIX Swiss Exchange':['.SW','Europe/Zurich'],'London Stock Exchange':['.L','Europe/London'],
 'Euronext Amsterdam':['.AS','Europe/Amsterdam'],'Bolsa De Madrid':['.MC','Europe/Madrid'],
 'Borsa Italiana':['.MI','Europe/Rome'],'Tokyo Stock Exchange':['.T','Asia/Tokyo'],
 'Korea Exchange (Stock Market)':['.KS','Asia/Seoul'],'Hong Kong Exchanges And Clearing Ltd':['.HK','Asia/Hong_Kong'],
 'Omx Nordic Exchange Copenhagen A/S':['.CO','Europe/Copenhagen'],
 'National Stock Exchange Of India':['.NS','Asia/Kolkata'],'Singapore Exchange':['.SI','Asia/Singapore'],
 'Shenzhen Stock Exchange':['.SZ','Asia/Shanghai'],
}
const candidates=[]
for(const item of catalog) {
 if(item.kind!=='equity'||active.has(item.isin))continue
 const r=classifications[item.isin],market=exchanges[r?.exchange]
 if(!market||!r.ticker||!r.currency||!r.sourceUrl||!r.asOf)continue
 const [suffix,timezone]=market
 let ticker=r.ticker.replace(/\s+/g,'-')
 if(suffix==='.HK')ticker=ticker.padStart(4,'0')
 candidates.push({id:`stock${item.isin}`,isin:item.isin,label:r.exchange==='London Stock Exchange'?item.name.replace(/\s*\((?:NYSE|ADR)\)$/,'')+' (Londres)':item.name,ticker:r.ticker,
  symbol:ticker+suffix,currency:r.currency,timezone,parser:'yahoo',field:'adjclose',precision:6,
  instrumentType:'EQUITY',consumerScope:'equity',collectAnniversary:true,
  listingEvidenceId:`${item.isin}:${r.exchange}:${r.ticker}:${r.currency}`,
  listingEvidence:{sourceUrl:r.sourceUrl,asOf:r.asOf,isin:r.isin,ticker:r.ticker,exchange:r.exchange,currency:r.currency},
  method:'Cours de la cotation identifiée par ISIN dans les positions émetteur, ajustés des distributions et divisions ; dernières clôtures quotidiennes recoupées avec les clôtures mensuelles Yahoo.'})
}
process.stdout.write(JSON.stringify(candidates))
