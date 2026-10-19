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
 for(const isin of ['IE0003XJA0J9','IE00BK5BQT80','IE00BLNMYC90','IE00B0M62S72','IE00B4L5Y983','IE00B53QG562','IE00B4K6B022'])
  await request(isin,'https://bourse.fortuneo.fr/api/search?term='+isin)
 const page=await context.newPage()
 page.on('response',async r=>{if(/euronext.com/.test(r.url())&&/ajax|api|quote|detail/i.test(r.url()))try{await save('FR0011550185',r.url(),await r.body(),r.status(),r.url(),'euronext-response')}catch{}})
 try{await page.goto('https://live.euronext.com/en/product/etfs/FR0011550185-XPAR',{timeout:30000,waitUntil:'networkidle'});await save('FR0011550185',page.url(),Buffer.from(await page.content()),200,page.url(),'euronext-browser')}catch(e){console.log(String(e))}
 await page.close()
}finally {writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));await browser.close()}
console.log(JSON.stringify(manifest.map(({isin,requestedUrl,status,error})=>({isin,requestedUrl,status,error}))))
