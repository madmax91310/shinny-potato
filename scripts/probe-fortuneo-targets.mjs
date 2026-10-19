import {readFileSync,writeFileSync} from 'node:fs'
import {getInstrumentPeaStatus} from '../src/data/instruments.js'
import {PEA_REVIEWS_BY_ISIN} from '../src/data/instrument-pea.js'
const records=JSON.parse(readFileSync('src/data/automated-instrument-metadata.json'))
const sources=JSON.parse(readFileSync('scripts/instrument-metadata-sources.json')).instruments
const targets=sources.filter(r=>!records[r.isin]?.pea&&r.isin!=='IE00B0M62S72').map(r=>{
 const preferred=r.listings.find(l=>l.mic==='XPAR')??r.listings.find(l=>l.mic==='XAMS')??r.listings[0]
 const ticker=preferred?.ticker??'ETF'
 const venues=preferred?.mic==='XAMS'?[46,23]:[23,46]
 return {isin:r.isin,expectedPea:getInstrumentPeaStatus(r.isin),previousReview:PEA_REVIEWS_BY_ISIN[r.isin]??null,urls:venues.map(id=>'https://bourse.fortuneo.fr/trackers/cours-etf-'+encodeURIComponent(ticker)+'-'+r.isin+'-'+id)}
})
writeFileSync(process.env.PROBE_TARGETS,JSON.stringify(targets))
console.log('Public source candidates:',targets.length)
