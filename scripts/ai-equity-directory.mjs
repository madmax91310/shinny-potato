// Shared exact equity-directory adapter. Only consumers that opt in admit its candidates.
import fs from 'node:fs'
import crypto from 'node:crypto'
export const stableHash=s=>crypto.createHash('sha256').update(s).digest('hex')
export const tickerKey=(mic,ticker,currency)=>[mic,String(ticker).toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/^0+(?=\d)/,''),['GBX','GBp'].includes(currency)?'GBP':currency].join('/')
export function directoryCandidates(existing,venues){
 const url=new URL('../data/ai-portfolios/equity-scope/instruments.json',import.meta.url)
 if(!fs.existsSync(url))return []
 const raw=JSON.parse(fs.readFileSync(url)).listings,byQuote=new Map(existing.filter(a=>a.mic&&a.ticker).map(a=>[tickerKey(a.mic,a.ticker,a.currency),a]))
 const byIsin=new Map(existing.filter(a=>a.isin).map(a=>[a.isin,a]))
 const primaryIsins=new Set([...existing.filter(a=>a.isin).map(a=>a.isin),...raw.filter(r=>r.isin&&(r.primaryListing===true||['hkex','euronext','nordic-main','nordic-first-north'].includes(r.sourceId))).map(r=>r.isin)])
 const noIsinPrimaryMarkets=new Set(raw.filter(r=>!r.isin&&['ordinary','depositary-receipt','REIT'].includes(r.shareType)).map(r=>r.mic))
 const output=new Map()
 for(const r of raw){
  const known=byQuote.get(tickerKey(r.mic,r.ticker,r.currency))??(r.operatingMic?byQuote.get(tickerKey(r.operatingMic,r.ticker,r.currency)):null)
  const scale=['GBX','GBp'].includes(r.currency)?.01:1,currency=scale===.01?'GBP':r.currency,v=venues[r.mic]
  // An exchange directory proves a listing, not an inferred ISIN or underlying ADR.
  if(known&&(!r.isin||!known.isin||r.isin===known.isin)){
   if(r.segmentMic){known.segmentMic=r.segmentMic;known.operatingMic=r.operatingMic;known.micConvention='Legacy operating MIC retained; exact market segment documented separately'}
   if (!known.evidenceId && r.isin && r.isin===known.isin && r.sourceUrl && r.identitySha256 && !r.identityStale && !r.identityDetailError) {
    known.evidenceId=[r.sourceId,r.mic,r.ticker,r.currency,r.isin].join('|')
    known.listingEvidence={sourceUrl:r.sourceUrl,sha256:r.identitySha256,asOf:r.sourceAsOf,checkedAt:r.checkedAt,isin:r.isin,mic:r.mic,ticker:r.ticker,currency:r.currency}
    known.sourceUrl=r.sourceUrl;known.checkedAt=r.checkedAt
   }
   known.directorySources=[...new Set([...(known.directorySources??[]),r.sourceId])]
   known.company??=r.company;if(r.cik){known.cik=r.cik;known.companyId=r.companyId;known.companyIdentitySource=r.companyIdentitySource}else known.companyId??=r.companyId;known.shareType??=r.shareType;if(known.shareType==='unit')known.family='Autres titres de participation';continue
  }
  const instrumentId=r.isin??r.instrumentId??'security:'+stableHash([r.company,r.name,r.shareType].join('|')).slice(0,24)
  const id=r.listingId??instrumentId+'-'+r.mic+'-'+(r.ticker||'exchange-id-'+r.officialSecurityId)+'-'+currency
  const knownInstrument=r.isin?byIsin.get(r.isin):null
  const reusedFund=knownInstrument&&['ETF','ETC','ETN','ETP'].includes(knownInstrument.instrumentType)&&['ETF','ETN','ETC'].includes(r.shareType)
  const kind=['ordinary','depositary-receipt','REIT'].includes(r.shareType)
  const symbol=!r.ticker?null:(r.providerTicker??(r.mic==='XHKG'?String(Number(r.ticker)).padStart(4,'0'):r.ticker.replace(/[.\s]+/g,'-')))+(v?.[0]??'')
  const previous=output.get(id)
  if(previous){previous.directorySources.push(r.sourceId);continue}
  const selectionBlock=r.isin&&!primaryIsins.has(r.isin)&&(r.primaryListing===false||r.primaryMic&&r.primaryMic!==r.mic&&noIsinPrimaryMarkets.has(r.primaryMic))?'Cotation secondaire identifiée ; lien de classe avec les cotations primaires sans ISIN à documenter pour garantir la déduplication. La qualification des cours reste indépendante.':null
  const a={...r,selectionBlock,...(knownInstrument?.cik?{cik:knownInstrument.cik,companyId:knownInstrument.companyId,legalCompanyName:knownInstrument.legalCompanyName}:{}),...(reusedFund?{name:knownInstrument.name,sourceSecurityName:r.name}:{}),id,instrumentId,listingId:id,family:reusedFund?knownInstrument.family:kind?'Actions':r.shareType==='ETF'?'ETF (inventaire de marché)':`Autres titres : ${r.shareType}`,currency,sourceCurrency:r.currency,priceScale:scale,symbol,symbolCandidates:symbol?[symbol]:[],timezone:v?.[1],calendar:v?.[2],yahooExchanges:v?.[3],instrumentType:reusedFund?knownInstrument.instrumentType:kind?'EQUITY':r.shareType==='ETF'?'ETF':null,yahooInstrumentType:reusedFund?'ETF':kind?'EQUITY':r.shareType==='ETF'?'ETF':null,ucits:reusedFund?knownInstrument.ucits:false,leveraged:reusedFund?knownInstrument.leveraged:false,region:r.country??r.listingCountry??null,source:'Yahoo daily adjusted closes',symbolOrigin:'official-exchange-directory',evidenceId:[r.sourceId,r.mic,r.ticker,r.currency,r.isin??r.name].join('|'),convention:'synthetic-total-return-100-at-anchor',directorySources:[r.sourceId],permanentExclusion:!kind&&!reusedFund,discoveryBlock:!kind&&!reusedFund?'Hors périmètre actions ordinaires / certificats de dépôt : '+r.shareType:!r.ticker?'Ticker de collecte absent du fichier officiel ; identifiant de titre conservé.':r.instrumentStatus&&r.instrumentStatus!=='Active'?'Statut de cotation officiel : '+r.instrumentStatus:r.identityStale?'Photographie de cotation historique '+r.sourceAsOf+' : identité actuelle à vérifier avant admission.':r.identityDetailError?'Preuve détaillée de place indisponible : '+r.identityDetailError:!v?'Calendrier / correspondance de place à qualifier : '+r.mic:!currency?'Devise de cotation absente de la liste officielle.':null}
  if(r.typeUnverified){a.permanentExclusion=false;a.discoveryBlock=r.identityDetailError??'Classe du produit non vérifiée dans cette catégorie mixte du registre officiel.'}
  output.set(id,a);if(r.ticker&&r.mic)byQuote.set(tickerKey(r.mic,r.ticker,r.currency),a)
 }
 return [...output.values()]
}
