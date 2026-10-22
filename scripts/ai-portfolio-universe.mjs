// Exhaustive projection of common identities, listings and documented history links.
// A provider symbol is a candidate, never evidence of daily availability.
import fs from 'node:fs'
import CLASSIFICATIONS from '../src/data/dca-security-classifications.json' with {type:'json'}
import {matchesListing} from './build-equity-history-links.mjs'
import { INSTRUMENTS_BY_ISIN } from '../src/data/instruments.js'
import { getInstrumentListings } from '../src/data/instrument-listings.js'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { ASSETS as HISTORY } from '../src/data/market-history.js'
import BITCOIN from '../src/data/bitcoin-yahoo-monthly.json' with {type:'json'}
import GLOBAL from '../src/data/global-equities.json' with {type:'json'}
import EQUITIES from '../src/data/equity-history-links.json' with {type:'json'}
const monthly=JSON.parse(fs.readFileSync(new URL('./monthly-automation.json',import.meta.url))).series
// Venue adapters, not an instrument whitelist. Metadata must confirm these mappings.
export const VENUES={
 XPAR:['.PA','Europe/Paris','XPAR',['PAR']],XAMS:['.AS','Europe/Amsterdam','XAMS',['AMS']],
 ETFP:['.MI','Europe/Rome','XMIL',['MIL']],XETR:['.DE','Europe/Berlin','XETR',['GER']],
 XSWX:['.SW','Europe/Zurich','XSWX',['EBS','SWX']],XLON:['.L','Europe/London','XLON',['LSE']],
 XMEX:['.MX','America/Mexico_City','XMEX',['MEX']],XSGO:['.SN','America/Santiago','XSGO',['SGO']],
 XASE:['','America/New_York','XASE',['ASE']],XNAS:['','America/New_York','XNYS',['NMS','NGM','NCM']],XNYS:['','America/New_York','XNYS',['NYQ']],
 XTSE:['.TO','America/Toronto','XTSE',['TOR']],XHKG:['.HK','Asia/Hong_Kong','XHKG',['HKG']],
 XSHG:['.SS','Asia/Shanghai','XSHG',['SHH']],XSHE:['.SZ','Asia/Shanghai','XSHG',['SHZ']],
 XTKS:['.T','Asia/Tokyo','XTKS',['JPX']],XKRX:['.KS','Asia/Seoul','XKRX',['KSC']],
 XNSE:['.NS','Asia/Kolkata','XBOM',['NSI']],XSES:['.SI','Asia/Singapore','XSES',['SES']],
 XASX:['.AX','Australia/Sydney','XASX',['ASX']],XOSL:['.OL','Europe/Oslo','XOSL',['OSL']],
 XCSE:['.CO','Europe/Copenhagen','XCSE',['CPH']],XSTO:['.ST','Europe/Stockholm','XSTO',['STO']],
 XHEL:['.HE','Europe/Helsinki','XHEL',['HEL']],XBRU:['.BR','Europe/Brussels','XBRU',['BRU']],
 XMAD:['.MC','Europe/Madrid','XMAD',['MCE']],CRYPTO:['','UTC','24/7',['CCC']]
}
const suffixMic=Object.fromEntries(Object.entries(VENUES).filter(([,v])=>v[0]).map(([mic,v])=>[v[0],mic]))
const exchangeMic=name=>/nasdaq/i.test(name??'')?'XNAS':/nyse mkt/i.test(name??'')?'XASE':/new york|nyse/i.test(name??'')?'XNYS':null
function family(name,type){
 if(type==='EQUITY')return 'Actions'
 if(type==='CRYPTOCURRENCY')return 'Crypto au comptant'
 if(/ETC|ETP|WisdomTree (?!.*UCITS)/i.test(name))return /bitcoin|ethereum|crypto/i.test(name)?'ETP crypto':'ETC / matières premières'
 if(/LifeStrategy|multi.asset|portfolio/i.test(name))return 'ETF multi-actifs'
 if(/overnight|money market|monétaire|€STR|cash/i.test(name))return 'ETF monétaires'
 if(/bond|treasury|govt|oblig|aggregate|fixed income|corporate|high yield/i.test(name))return 'ETF obligataires'
 if(/real estate|property|immobilier|REIT/i.test(name))return 'ETF immobiliers'
 if(/factor|momentum|value|quality|dividend|small cap|minimum|equal weight/i.test(name))return 'ETF factoriels / dividendes / small caps'
 if(/technology|health|energy|robot|water|cyber|semiconductor|sector|theme|thema|infrastructure|clean|defen[cs]e/i.test(name))return 'ETF sectoriels / thématiques'
 return /ETF|UCITS|iShares|Vanguard|Amundi|SPDR|Xtrackers/i.test(name)?'ETF actions':'Autres instruments cotés'
}
export function inventory(){
 const rows=[]
 for(const [isin,identity] of Object.entries(INSTRUMENTS_BY_ISIN)){
  const histories=monthly.filter(r=>r.isin===isin&&r.parser==='yahoo'),global=GLOBAL.find(r=>r.isin===isin),equity=Object.values(EQUITIES).find(r=>r.isin===isin)
  const name=identity.name
  const documentedProductType=histories.map(h=>h.instrumentType).find(t=>['ETC','ETN','ETP'].includes(t))
  const type=identity.instrumentType==='EQUITY'||equity||global?'EQUITY':documentedProductType??(['ETC','ETN','ETP'].includes(identity.instrumentType)?identity.instrumentType:null)??(/\bETC\b/.test(name)?'ETC':/\bET[PN]\b/.test(name)?'ETP':'ETF')
  const listings=getInstrumentListings(isin).map(r=>({...r}))
  for(const h of histories){
   const mic=h.mic??exchangeMic(h.listingEvidence?.exchange)??suffixMic['.'+h.symbol.split('.').slice(1).join('.')]
   if(mic&&!listings.some(r=>r.mic===mic&&r.currency===h.currency&&(r.symbol===h.symbol||r.ticker===h.ticker)))listings.push({ticker:h.ticker??h.symbol.split('.')[0],symbol:h.symbol,mic,currency:h.currency,sourceUrl:h.listingEvidence?.sourceUrl??equity?.sourceUrl??global?.identitySourceUrl,checkedAt:equity?.checkedAt??global?.checkedAt,evidenceId:h.listingEvidenceId,exchange:h.listingEvidence?.exchange??mic})
  }
  const security=CLASSIFICATIONS[isin],linked=global??equity
  if(security&&linked&&matchesListing(linked,security)){
   const mic=exchangeMic(security.exchange)??suffixMic['.'+linked.symbol.split('.').slice(1).join('.')]
   if(mic&&!listings.some(r=>r.mic===mic&&r.ticker===security.ticker&&r.currency===security.currency))listings.push({ticker:security.ticker,symbol:linked.symbol,mic,currency:security.currency,exchange:security.exchange,sourceUrl:security.sourceUrl,checkedAt:security.checkedAt,evidenceId:[isin,mic,security.ticker,security.currency].join('-')})
  }
  if(!listings.length&&(global||equity)){
   const h=global??equity,mic=suffixMic['.'+h.symbol.split('.').slice(1).join('.')]
   if(mic)listings.push({...h,ticker:h.symbol.split('.')[0],mic,sourceUrl:h.identitySourceUrl??h.sourceUrl,evidenceId:`${isin}-${mic}-${h.symbol}-${h.currency}`})
  }
  if(!listings.length)listings.push({mic:null,ticker:null,currency:null,discoveryBlock:'Aucune cotation exacte documentée dans les registres communs.'})
  const seen=new Set()
  for(const listing of listings){
   const v=VENUES[listing.mic],h=histories.find(r=>r.listingEvidenceId===listing.evidenceId||(r.mic===listing.mic&&r.currency===listing.currency&&r.ticker===listing.ticker))
   const symbol=listing.symbol??h?.symbol??(v&&listing.ticker?listing.ticker+v[0]:null)
   const unique=`${listing.mic}/${listing.ticker}/${listing.currency}`;if(seen.has(unique))continue;seen.add(unique)
   // Preserve original IDs when unambiguous; include listing currency/ticker on alternatives.
   const sameVenue=listings.filter(r=>r.mic===listing.mic)
   const id=isin+'-'+(listing.mic??'unlisted')+(sameVenue.length>1?'-'+listing.ticker+'-'+listing.currency:'')
   rows.push({id,instrumentId:isin,isin,name,family:family(name,type),...listing,symbol,
    symbolCandidates:[...new Set([symbol,v&&listing.ticker?listing.ticker+v[0]:null].filter(Boolean))],
    currency:['GBp','GBX'].includes(listing.currency)?'GBP':listing.currency,sourceCurrency:listing.currency,
    priceScale:['GBp','GBX'].includes(listing.currency)?0.01:1,
    timezone:v?.[1],calendar:v?.[2],yahooExchanges:v?.[3],instrumentType:type,
    yahooInstrumentType:histories.find(h=>h.yahooInstrumentType)?.yahooInstrumentType??(['EQUITY','ETC','ETN','ETP'].includes(type)?'EQUITY':'ETF'),
    ucits:/UCITS/i.test(name),leveraged:/leverag|\(2x\)|\(3x\)|daily.*(?:short|inverse)|\b(?:2x|3x|inverse)\b/i.test(name),
    region:global?.region??security?.country??null,exposure:global?.sector??equity?.sector??security?.sector??null,
    discoveryBlock:listing.discoveryBlock??(!v?'Calendrier / correspondance de place à qualifier : '+listing.mic:!symbol?'Symbole de collecte absent':!listing.sourceUrl?'Preuve d’identité de cotation absente':null),
    convention:'synthetic-total-return-100-at-anchor',source:'Yahoo daily adjusted closes',symbolOrigin:listing.symbol?'issuer-listing':h?.symbol?'documented-history':'venue-adapter-candidate'})
  }
 }
 // Include non-ISIN series, indices and non-daily investment products, without inventing tradable shares.
 const instruments=new Set(Object.keys(INSTRUMENTS_BY_ISIN))
 for(const r of DATA_CATALOG.filter(r=>['index','series','scpi','insurance'].includes(r.type))){
  const alias=r.id.replace(/^history:/,'')
  const reviewedSymbol=HISTORY[alias]?.review?.sourceUrls?.map(u=>{try{return decodeURIComponent(new URL(u).pathname.split('/chart/')[1]??'')}catch{return ''}}).find(Boolean)
  const linkedIsin=Object.values(EQUITIES).find(x=>x.symbol===reviewedSymbol&&x.currency===HISTORY[alias]?.currency)?.isin??HISTORY[alias]?.isin??EQUITIES[alias]?.isin??GLOBAL.find(x=>x.id===alias)?.isin
  if(linkedIsin&&instruments.has(linkedIsin))continue
  if(r.id.startsWith('history:')&&DATA_CATALOG.some(x=>x.id===alias&&x.type==='index'))continue
  const h=alias==='bitcoin'?{id:'bitcoin',parser:'yahoo',symbol:BITCOIN.symbol}:monthly.find(x=>alias===x.id)
  if(h?.isin&&instruments.has(h.isin))continue
  const potential=Boolean(h?.parser==='yahoo'&&h?.consumerScope==='equity'||reviewedSymbol&&!reviewedSymbol.startsWith('^')&&HISTORY[alias]?.priceMethod==='adjusted')
  const crypto=h?.parser==='yahoo'&&/-USD$/.test(h.symbol??'')&&!h.isin
  const instrumentId=crypto?'crypto:'+h.symbol:r.id
  if(rows.some(x=>x.instrumentId===instrumentId))continue
  rows.push({id:instrumentId+(crypto?'-CRYPTO':''),instrumentId,isin:null,name:r.name,family:crypto?'Crypto au comptant':potential?'Identité à documenter':r.type==='index'?'Indices (référence uniquement)':r.type==='scpi'?'SCPI':r.type==='insurance'?'Assurance-vie':'Séries non détenables',ticker:crypto?h.symbol:null,symbol:crypto?h.symbol:null,mic:crypto?'CRYPTO':null,currency:crypto?'USD':null,sourceCurrency:crypto?'USD':null,priceScale:1,timezone:crypto?'UTC':null,calendar:crypto?'24/7':null,yahooExchanges:crypto?['CCC']:null,instrumentType:crypto?'CRYPTOCURRENCY':null,ucits:false,leveraged:false,sourceUrl:crypto?'https://finance.yahoo.com/quote/'+h.symbol+'/':null,evidenceId:crypto?'documented-history:'+h.id:null,source:crypto?'Yahoo daily spot closes':null,convention:'synthetic-total-return-100-at-anchor',discoveryBlock:crypto?null:potential?'Identité de la part / ISIN et cotation à documenter avant qualification quotidienne.':r.type==='index'?'Indice, référence uniquement ; aucune part détenable.':'Pas de cotation quotidienne détenable documentée ; aucune interpolation autorisée.',permanentExclusion:!crypto&&!potential})
 }
 const identities=Map.groupBy(rows.filter(r=>r.mic&&r.ticker),r=>[r.mic,r.ticker,r.sourceCurrency].join('/'))
 for(const entries of identities.values())if(new Set(entries.map(a=>a.instrumentId)).size>1)for(const a of entries)a.discoveryBlock='Identité ambiguë : même ticker, place et devise attribués à plusieurs ISIN dans le registre.'
 return rows.sort((a,b)=>a.id.localeCompare(b.id))
}
export function universe(){return inventory().filter(r=>!r.permanentExclusion)}
if(process.argv[1]===new URL(import.meta.url).pathname)console.log(JSON.stringify(inventory()))
