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
 const page=await context.newPage();await page.goto('https://www.quantalys.com/',{timeout:30000,waitUntil:'domcontentloaded'});
 for(const isin of ["IE00BP3QZ601","IE0003XJA0J9","IE0009HF1MK9","LU0328475792","IE0008470928","IE000716YHJ7","IE0000QLH0G6","IE00BLCHJB90","IE000NDWFGA5","IE00BMH5Y871","LU0274209237","IE00BK5BQV03","IE00BFMXXD54","IE00BJ0KDQ92","IE00BK1PV551","LU2903252349","LU1737652823","LU1931975079","LU2970735911","IE00B43HR379","IE00B4JNQZ49","IE00B66F4759","IE00B8FHGS14","IE00BYXG2H39","IE00BYYHSQ67","IE00BLNMYC90","IE0006WW1TQ4","LU0290358497","IE000L6ZMMC4","IE00BGV5VN51","IE00BM67HK77","IE00BM67HS53","IE00BTJRMP35","LU1875395870","LU2196470426","IE00BK5BR733","IE0007Y8Y157","IE00BD6FTQ80","IE00B2NPKV68","IE00B3WJKG14","IE00B40B8R38","IE00B42NKQ00","IE00B4KBBD01","IE00B5W4TY14","IE00BK5BCD43","IE00BK5BCH80","IE00BM8R0J59","IE00BD4TXV59","IE0003Z9E2Y3","IE0003UVYC20","IE00BM67HV82","IE00BM67HQ30","IE00B4556L06","IE00B4LHWP62","IE000UL6CLP7","IE0003R87OG3","IE00BF4RFH31","IE00BP3QZ825","IE00BP3QZB59","IE00B1XNHC34","IE00B3F81G20","JE00BN7KB557","JE00B2QXZK10","IE000L2SA8K5","IE00BP3QZD73","IE00B1TXK627","IE00B27YCF74","IE00BZ0PKT83","DE000A0H08F7","IE000SNLFDR7","DE000A0Q4R02","DE000A0H08R2","DE000A0H08L5","DE000A0H08H3","DE000A0H08P6","IE00BG0SKF03","IE00B27YCN58","DE000A0F5UJ7","DE000A0H08K7","IE00B3VWMM18","IE00B0M62S72","IE00BQN1K901","IE00BQN1K786","IE00BQN1K562","IE00BD1F4L37","IE00BD1F4M44","IE00BD1F4N50","IE00B2QWCY14"]){
 const url='https://www.quantalys.com/Recherche/RechercheRapide?inputSearch='+isin;
 try{
 await page.locator('#inputSearch').fill(isin);
 const [response]=await Promise.all([page.waitForNavigation({timeout:25000,waitUntil:'domcontentloaded'}),page.locator('form[action="/Recherche/RechercheRapide"]').evaluate(f=>f.submit())]);
 await page.waitForTimeout(500);
 await save(isin,url,Buffer.from(await page.content()),response?.status(),page.url(),'quantalys-public-search')
 }catch(e){manifest.push({isin,requestedUrl:url,error:String(e)});try{await page.goto('https://www.quantalys.com/',{timeout:15000,waitUntil:'domcontentloaded'})}catch{}}
 }
 await page.close()
}finally {writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));await browser.close()}
console.log(JSON.stringify(manifest.map(({isin,requestedUrl,status,error})=>({isin,requestedUrl,status,error}))))
