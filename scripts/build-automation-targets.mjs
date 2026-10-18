import {readFileSync,writeFileSync} from 'node:fs'
import { wisdomtreeFactsheet, blackrockCharacteristicsEndpoint } from './issuer-routes.mjs'
import {AUTOMATED_ETF} from '../src/data/automated-etf.js'
import {INSTRUMENTS_BY_ISIN} from '../src/data/instruments.js'
import {getInstrumentListings} from '../src/data/instrument-listings.js'
import {getInstrumentFacts} from '../src/data/instrument-facts.js'
import {PEA_REVIEWS_BY_ISIN} from '../src/data/instrument-pea.js'
const existing=JSON.parse(readFileSync('scripts/dca-complete-holdings-sources.json'))
const holdings={},metadata=[]
const currentDocument=url=>url?.replace(/(\/pdfDocuments\/(?:monthly-factsheet|kid-priips|prospectus)\/[^?]+)\/\d{8}(?=$|\?)/,'$1')
for(const [isin,r] of Object.entries(AUTOMATED_ETF)) {
 const facts=getInstrumentFacts(isin),listings=getInstrumentListings(isin),urls=[r.sourceUrl,facts.characteristicsSource?.url,PEA_REVIEWS_BY_ISIN[isin]?.sourceUrl,...(PEA_REVIEWS_BY_ISIN[isin]?.eligible===true?['https://www.justetf.com/fr/etf-profile.html?isin='+isin]:[]),...listings.map(l=>l.sourceUrl)]
 // Characteristics only need the fund facts and listings; full holdings exceed the download limit.
 const endpoint=blackrockCharacteristicsEndpoint
 // WisdomTree product pages answer 403 to automated clients; its official factsheet API does not.
 const issuerDocuments=urls.some(url=>url?.includes('wisdomtree.com/'))&&wisdomtreeFactsheet(isin)?[wisdomtreeFactsheet(isin)]:[]
 metadata.push({isin,listings,urls:[...new Set([...urls.filter(Boolean),...issuerDocuments].map(currentDocument).map(endpoint))]})
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
