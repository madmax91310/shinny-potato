import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {chromium} from 'playwright'
import {getInstrumentListings} from '../src/data/instrument-listings.js'
const out=process.env.PROBE_OUTPUT||'test-artifacts/metadata-connections';mkdirSync(out,{recursive:true})
const records=JSON.parse(readFileSync('src/data/automated-instrument-metadata.json'))
const sources=JSON.parse(readFileSync('scripts/instrument-metadata-sources.json')).instruments
const browser=await chromium.launch({headless:true}),context=await browser.newContext(),manifest=[]
async function save(isin,url,body,status,effective=url,kind='document'){
 const sha256=createHash('sha256').update(body).digest('hex'),file=sha256+'.body'
 writeFileSync(out+'/'+file,body);manifest.push({isin,requestedUrl:url,sourceUrl:effective,status,checkedAt:new Date().toISOString(),sha256,file,kind})
 writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2))
}
async function request(isin,url){
 try {const r=await context.request.get(url,{timeout:20000});await save(isin,url,await r.body(),r.status(),r.url())}
 catch(e){manifest.push({isin,requestedUrl:url,error:String(e)});writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2))}
}
try{
 for(const isin of ['IE0003XJA0J9','IE00BLNMYC90','IE00BP3QZ601','IE00B579F325','IE00BMVB5K07','IE00B4NCWG09']){
  const url='https://www.previ-direct.com/web/eclient-mes-placements.fr/perf-uc-mes-placements.fr-retraite-33-?p_p_id=portletperfuc_WAR_portletperfuc&p_p_lifecycle=0&p_p_mode=view&p_p_state=normal&p_r_p_564233524_action=detailSupport&p_r_p_564233524_cdIsin='+isin+'&p_r_p_564233524_cdPrd=99&p_r_p_564233524_noPtn=999'
  await request(isin,url)
 }
 for(const [isin,url] of [['IE00BMVB5K07','https://bourse.fortuneo.fr/trackers/cours-etf-V20A-IE00BMVB5K07-46'],['IE00B4NCWG09','https://bourse.fortuneo.fr/trackers/cours-etf-SSLN-XPAR-IE00B4NCWG09-23']])await request(isin,url)
}finally {writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));await browser.close()}
console.log(JSON.stringify(manifest.map(({isin,requestedUrl,status,error})=>({isin,requestedUrl,status,error}))))
