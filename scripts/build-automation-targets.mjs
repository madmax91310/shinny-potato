import {readFileSync,writeFileSync} from 'node:fs'
import { wisdomtreeFactsheet, blackrockCharacteristicsEndpoint } from './issuer-routes.mjs'
import {AUTOMATED_ETF} from '../src/data/automated-etf.js'
import {INSTRUMENTS_BY_ISIN} from '../src/data/instruments.js'
import {getInstrumentListings} from '../src/data/instrument-listings.js'
import {getInstrumentFacts} from '../src/data/instrument-facts.js'
import METADATA from '../src/data/automated-instrument-metadata.json' with {type:'json'}
import {PEA_REVIEWS_BY_ISIN} from '../src/data/instrument-pea.js'
const existing=JSON.parse(readFileSync('scripts/dca-complete-holdings-sources.json'))
// Candidate rows the metadata collector must find in the issuer's own document before any
// registry learns them: a verified row for the same venue, ticker and currency takes precedence.
const candidates=Object.fromEntries(JSON.parse(readFileSync('scripts/listing-candidates.json')).candidates.map(c=>[c.isin,c.rows]))
const withCandidates=(isin,listings)=>[...listings,...(candidates[isin]??[]).filter(c=>!listings.some(l=>l.mic===c.mic&&l.ticker===c.ticker&&l.currency===c.currency)).map(({ticker,mic,exchange,currency,symbol})=>({ticker,mic,exchange,currency,symbol}))]
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
 urls.push(...(supplemental.get(isin)??[]))
 // Search the broker's own reference index before constructing a profile URL.
 // An absent reference stays unknown; no ticker or market number is guessed.
 if(!METADATA[isin]?.pea||METADATA[isin]?.pea?.sourceUrl?.startsWith('https://bourse.fortuneo.fr/'))urls.push('https://bourse.fortuneo.fr/api/search?term='+isin)
 if(urls.some(url=>url?.includes('invesco.com/')))
  urls.push('https://dng-api.invesco.com/cache/v1/accounts/en_GB/shareclasses/'+isin+'?expand=marketdata&idType=isin&variationType=exchangeTradingInformationWithMarketData')
 if(['FR0011550185','FR0011550193','IE00B4K6B022'].includes(isin))urls.push('https://live.euronext.com/en/product/etfs/'+isin+'-XPAR')
 if(isin==='IE00B4K6B022')urls.push('https://www.borsaitaliana.it/borsa/etf/scheda/'+isin+'-ETFP.html?lang=en')
 // Characteristics only need the fund facts and listings; full holdings exceed the download limit.
 const endpoint=blackrockCharacteristicsEndpoint
 // WisdomTree product pages answer 403 to automated clients; its official factsheet API does not.
 const issuerDocuments=urls.some(url=>url?.includes('wisdomtree.com/'))&&wisdomtreeFactsheet(isin)?[wisdomtreeFactsheet(isin)]:[]
 const review=PEA_REVIEWS_BY_ISIN[isin]
 // A later unavailable page cannot erase a previously observed contradiction.
 const qualificationHolds=[...(holds.has(isin)?[holds.get(isin)]:[]),...(previousStatus[isin]?.errors??[]).filter(error=>error.qualificationRequired&&error.sources?.length>=2&&['pea','currencyHedge'].includes(error.field)).map(({field,sources})=>({field,sources}))]
 urls.push(...qualificationHolds.flatMap(hold=>hold.sources.map(row=>row.sourceUrl)))
 metadata.push({isin,listings,...(typeof review?.eligible==='boolean'?{peaExpectation:{value:review.eligible,sourceUrl:review.sourceUrl,checkedAt:review.checkedAt}}:{}),urls:[...new Set([...urls.filter(Boolean),...issuerDocuments].map(currentDocument).map(endpoint))],...(qualificationHolds.length?{qualificationHolds}:{})})
 if(existing[isin])continue
 const name=INSTRUMENTS_BY_ISIN[isin]?.name??''
 if(/\b(?:ETC|ETN|ETP)\b|bond|treasury|govt|overnight|court terme/i.test(name))continue
 const url=r.sourceUrl??''
 const method=r.characteristics?.replicationMethod??facts.replicationMethod??''
 if(!/physic|direct replication/i.test(method) || /synthe|swap|indirect/i.test(method))continue
 if(url.includes('blackrock.com/varnish-api/') && /portfolioId=\d+/.test(url))holdings[isin]={url:url.replace(/component=[^&]+/,'component=keyFundFacts%2Choldings.all')}
 else if(/api\.funds\.dws\.com.*\/products\//.test(url))holdings[isin]={parser:'dws',sourceUrl:url}
}
writeFileSync('scripts/generated-holdings-sources.json',JSON.stringify(holdings,null,2)+'\n')
writeFileSync('scripts/instrument-metadata-sources.json',JSON.stringify({instruments:metadata},null,2)+'\n')
console.log(`Automatic targets: ${metadata.length} metadata instruments, ${Object.keys(holdings).length} additional complete holdings sources.`)

