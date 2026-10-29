import wisdomtreeClasses from './wisdomtree-holdings-classes.json' with {type:'json'}
import {readFileSync,writeFileSync} from 'node:fs'
import { wisdomtreeFactsheet, blackrockCharacteristicsEndpoint, wisdomtreeProductCandidates, qualifiedWisdomtreeRankingsRoute } from './issuer-routes.mjs'
import {AUTOMATED_ETF} from '../src/data/automated-etf.js'
import {INSTRUMENTS_BY_ISIN} from '../src/data/instruments.js'
import {getInstrumentListings} from '../src/data/instrument-listings.js'
import {getInstrumentFacts} from '../src/data/instrument-facts.js'
import METADATA from '../src/data/automated-instrument-metadata.json' with {type:'json'}
import {PEA_REVIEWS_BY_ISIN} from '../src/data/instrument-pea.js'
import {hasPhysicalPortfolio} from './lib/physical-replication.mjs'
const existing=JSON.parse(readFileSync('scripts/dca-complete-holdings-sources.json'))
const issuerShares=new Map(['amundi-etf','additional-etf-sources','exposure-etf-expansion','non-bond-expansion-sources'].flatMap(file=>
 JSON.parse(readFileSync(`scripts/${file}.json`)).instruments).map(share=>[share.isin,share]))
const amundiShares=new Set(JSON.parse(readFileSync('scripts/amundi-etf.json')).instruments.map(share=>share.isin))
// Candidate rows the metadata collector must find in the issuer's own document before any
// registry learns them: a verified row for the same venue, ticker and currency takes precedence.
const candidates=Object.fromEntries(JSON.parse(readFileSync('scripts/listing-candidates.json')).candidates.map(c=>[c.isin,c.rows]))
const withCandidates=(isin,listings)=>[...listings,...(candidates[isin]??[]).filter(c=>!listings.some(l=>l.mic===c.mic&&l.ticker===c.ticker&&l.currency===c.currency)).map(({ticker,mic,exchange,currency,symbol})=>({ticker,mic,exchange,currency,symbol}))]
const completeHoldings=JSON.parse(readFileSync('src/data/dca-complete-holdings.json'))
const holdings={},metadata=[]
const previousStatus=JSON.parse(readFileSync('src/data/instrument-metadata-status.json'))
const supplemental=new Map(JSON.parse(readFileSync('scripts/instrument-metadata-supplemental-sources.json')).instruments.map(r=>[r.isin,r.urls]))
const holds=new Map(JSON.parse(readFileSync('scripts/metadata-qualification-holds.json')).instruments.map(r=>[r.isin,r]))
// Always renew French tax statements, including previously reviewed positives/negatives.
// The issuer's explicit « Régime fiscal PEA » is evidence; a dash stays unknown.
const frenchIssuerPage=(r,urls)=>{
 const id=/[?&]portfolioId=(\d+)/.exec(r.sourceUrl??'')?.[1]
 // Bare /products/<id> URLs return 404. Preserve the issuer-published product slug.
 const product=urls.filter(Boolean).map(url=>/https:\/\/(?:www\.ishares\.com|www\.blackrock\.com)\/[^?]*\/products\/(\d+)\/([^/?#]+)/.exec(url)).find(match=>match?.[1]===id)
 return product?[`https://www.blackrock.com/fr/particuliers/products/${id}/${product[2]}`]:[]
}
// A VanEck factsheet page (no .pdf) is an HTML shell without the share's ISIN; read the PDF it serves.
const currentDocument=url=>url?.replace(/(\/pdfDocuments\/(?:monthly-factsheet|kid-priips|prospectus)\/[^?]+)\/\d{8}(?=$|\?)/,'$1').replace(/^(https:\/\/www\.vaneck\.com\/(?:ucits|[a-z]{2}\/[a-z]{2})\/library\/fact-sheets\/[a-z0-9]+-fact-sheet)$/,'$1.pdf')
for(const [isin,r] of Object.entries(AUTOMATED_ETF)) {
 const facts=getInstrumentFacts(isin),listings=withCandidates(isin,getInstrumentListings(isin)),urls=[r.sourceUrl,facts.characteristicsSource?.url,PEA_REVIEWS_BY_ISIN[isin]?.sourceUrl,'https://www.justetf.com/fr/etf-profile.html?isin='+isin,...listings.map(l=>l.sourceUrl)]
 urls.push(...frenchIssuerPage(r,urls))
 // French tax panels publish an explicit boolean, unlike an absent badge.
 urls.push(...urls.filter(url=>url?.startsWith('https://etf.dws.com/api/pdp/en-gb/etf/')).map(url=>url.replace('/api/pdp/en-gb/','/api/pdp/fr-fr/')))
 urls.push(...(supplemental.get(isin)??[]))
 // Search the broker's own reference index before constructing a profile URL.
 // An absent reference stays unknown; no ticker or market number is guessed.
 if(!METADATA[isin]?.pea||METADATA[isin]?.pea?.sourceUrl?.startsWith('https://bourse.fortuneo.fr/'))urls.push('https://bourse.fortuneo.fr/api/search?term='+isin)
 // Quantalys exposes an explicit PEA cell on a public fund reference. Search is discovery only.
 const priorPeaSource=METADATA[isin]?.pea?.sourceUrl??''
 if(!METADATA[isin]?.pea||priorPeaSource.startsWith('https://extraetf.com/'))urls.push('https://extraetf.com/fr/etf-profile/'+isin)
 if(!METADATA[isin]?.pea||/^https:\/\/www\.quantalys\.com\/Fonds\/[1-9]\d*$/.test(priorPeaSource))urls.push(/^https:\/\/www\.quantalys\.com\/Fonds\/[1-9]\d*$/.test(priorPeaSource)?priorPeaSource:'https://www.quantalys.com/Recherche/RechercheRapide?inputSearch='+isin)
 if(urls.some(url=>url?.includes('invesco.com/'))){
  urls.push('https://dng-api.invesco.com/cache/v1/accounts/fr_FR/shareclasses/'+isin+'?idType=isin')
  urls.push('https://dng-api.invesco.com/cache/v1/accounts/en_GB/shareclasses/'+isin+'?expand=marketdata&idType=isin&variationType=exchangeTradingInformationWithMarketData')
  urls.push('https://dng-api.invesco.com/cache/v1/accounts/fr_FR/shareclasses/'+isin+'?expand=marketdata&idType=isin&variationType=exchangeTradingInformationWithMarketData')
 }
 if(['FR0011550185','FR0011550193','IE00B4K6B022','IE000QDFFK00','IE000DQLYVB9'].includes(isin))urls.push('https://live.euronext.com/en/product/etfs/'+isin+'-XPAR')
 if(isin==='IE00BD4TXV59')urls.push('https://live.euronext.com/en/product/etfs/'+isin+'-ETFP')
 // Characteristics only need the fund facts and listings; full holdings exceed the download limit.
 const endpoint=blackrockCharacteristicsEndpoint
 // WisdomTree product pages answer 403 to automated clients; its official factsheet API does not.
 const issuerDocuments=urls.some(url=>url?.includes('wisdomtree.com/'))&&wisdomtreeFactsheet(isin)?[wisdomtreeFactsheet(isin)]:[]
 const review=PEA_REVIEWS_BY_ISIN[isin]
 // A later unavailable page cannot erase a previously observed contradiction.
 // Keep one qualification condition per field and set of public source URLs.
 const qualificationHolds=[...new Map(([...(holds.has(isin)?[holds.get(isin)]:[]),...(previousStatus[isin]?.errors??[]).filter(error=>error.qualificationRequired&&error.sources?.length>=2&&['pea','currencyHedge'].includes(error.field)).map(({field,sources})=>({field,sources}))]).map(hold=>[JSON.stringify([hold.field,hold.sources.map(row=>row.sourceUrl).sort()]),hold])).values()]
 urls.push(...qualificationHolds.flatMap(hold=>hold.sources.map(row=>row.sourceUrl)))
 metadata.push({isin,listings,...(typeof review?.eligible==='boolean'?{peaExpectation:{value:review.eligible,sourceUrl:review.sourceUrl,checkedAt:review.checkedAt}}:{}),urls:[...new Set([...urls.filter(Boolean),...issuerDocuments].map(currentDocument).map(endpoint))],...(qualificationHolds.length?{qualificationHolds}:{})})
 if(existing[isin])continue
 const name=INSTRUMENTS_BY_ISIN[isin]?.name??''
 if(/\b(?:ETC|ETN|ETP)\b|bond|treasury|govt|overnight|court terme/i.test(name))continue
 const url=r.sourceUrl??''
 const share=issuerShares.get(isin)
 const method=r.characteristics?.replicationMethod??facts.replicationMethod??''
 if(!hasPhysicalPortfolio(method,facts.replicationMethod??'',{issuer:share?.expansionKind}))continue
 if(['IE00BMVB5K07','IE00BMVB5M21','IE00BMVB5P51','IE00BMVB5R75'].includes(isin))holdings[isin]={isin,name,currency:'EUR',parser:'lifestrategy-lookthrough'}
 else if(url.includes('blackrock.com/varnish-api/') && /portfolioId=\d+/.test(url))holdings[isin]={isin,name,url:url.replace(/component=[^&]+/,'component=keyFundFacts%2Choldings.all')}
 // A fund total may be displayed in another currency; it cannot identify a share.
 else if(/^https:\/\/etf\.dws\.com\/api\/pdp\/en-gb\/etf\//.test(url))holdings[isin]={isin,name,currency:share?.currency??r.currency,parser:'dws',sourceUrl:url}
 else if(/^https:\/\/www\.ssga\.com\/[^?#]+\/etfs\//.test(url))holdings[isin]={isin,name,currency:share?.currency??r.currency,parser:'ssga',sourceUrl:url}
 else if(/^https:\/\/globalxetfs\.eu\/funds\/(?:botz|bug|copx|silv|urnu)\/?$/.test(url))holdings[isin]={isin,name,currency:'USD',parser:'globalx-complete',sourceUrl:url}
 else if(isin==='IE00B4K6B022')holdings[isin]={isin,name,currency:'EUR',parser:'hsbc-complete'}
 else if(isin==='IE0003UVYC20')holdings[isin]={isin,name,currency:'USD',parser:'jpm-complete'}
 else if(share?.parser==='vaneck'&&share.pageUrl&&share.apiTicker)holdings[isin]={isin,name,currency:share.currency,parser:'vaneck-complete',pageUrl:share.pageUrl,apiTicker:share.apiTicker}
 else if(share&&(amundiShares.has(isin)||share.parser==='amundi-expansion'))holdings[isin]={isin,name,currency:share.currency,parser:'amundi-complete'}
 else if(share?.productCode&&/vanguard/.test(share.parser??''))holdings[isin]={isin,name,currency:share.currency,productCode:share.productCode,parser:'vanguard-complete'}
 else if(['IE000716YHJ7','IE0000QLH0G6','IE000L2SA8K5'].includes(isin)&&share)holdings[isin]={isin,name,currency:share.currency,parser:'invesco-complete',sourceUrl:share.sourceUrl}
 else if(share?.documentType==='wisdomtree-ucits'&&completeHoldings[isin]?.complete===true&&(
  (wisdomtreeProductCandidates(share.sourceUrl).includes(completeHoldings[isin]?.sourceUrl)&&completeHoldings[isin]?.identityMethod==='Exact SEDOL to ISIN; identity-source weights never imported') ||
  (wisdomtreeClasses[isin]?.currency===share.currency&&qualifiedWisdomtreeRankingsRoute(completeHoldings[isin]?.sourceUrl,wisdomtreeClasses[isin],completeHoldings[isin]?.qualifiedRankingListings)&&completeHoldings[isin]?.identitySourceUrl===wisdomtreeFactsheet(isin)&&/^[a-f0-9]{64}$/.test(completeHoldings[isin]?.identitySha256||'')&&completeHoldings[isin]?.identityMethod==='Exact SEDOL to ISIN; identity-source weights never imported') ||
  (wisdomtreeClasses[isin]?.currency===share.currency&&completeHoldings[isin]?.sourceUrl===`https://www.wisdomtree.com/api/fund-holdings/${wisdomtreeClasses[isin].classId}`&&completeHoldings[isin]?.identitySourceUrl===wisdomtreeFactsheet(isin)&&/^[a-f0-9]{64}$/.test(completeHoldings[isin]?.identitySha256||'')&&completeHoldings[isin]?.identityMethod==='Exact issuer listing FIGI matched to independent ISIN query; unknown identities retained')
 ))holdings[isin]={isin,name,currency:share.currency,provider:share.provider,sourceUrl:share.sourceUrl,parser:'wisdomtree-complete'}
 else if(isin==='IE0003R87OG3')holdings[isin]={isin,name,currency:'USD',parser:'avantis-complete',
  sourceUrl:share.sourceUrl,
  holdingsUrl:'https://www.avantisinvestors.com/ucitsetf/en-de/total-holdings/295032351307042/'}
}
// Exact fund-level classes already qualified in collect_vanguard_sleeves.py.
// These dependencies are not new user catalogue products.
for(const [isin,productCode,name]of [
 ['IE00BFMXYX26',9674,'Vanguard FTSE Japan UCITS ETF (USD) Accumulating'],
 ['IE00BK5BQZ41',9676,'Vanguard FTSE Developed Asia Pacific ex Japan UCITS ETF (USD) Accumulating'],
 ['IE00BKX55R35',9523,'Vanguard FTSE North America UCITS ETF']])
 holdings[isin]={isin,name,productCode,currency:'USD',parser:'vanguard-complete',catalog:false}
writeFileSync('scripts/generated-holdings-sources.json',JSON.stringify(holdings,null,2)+'\n')
writeFileSync('scripts/instrument-metadata-sources.json',JSON.stringify({instruments:metadata},null,2)+'\n')
console.log(`Automatic targets: ${metadata.length} metadata instruments, ${Object.keys(holdings).length} additional complete holdings sources.`)

