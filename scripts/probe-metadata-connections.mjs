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
 for(const isin of ['IE000716YHJ7','IE0000QLH0G6','IE00B579F325','IE00BD6FTQ80','IE000L2SA8K5'])
  await request(isin,'https://dng-api.invesco.com/cache/v1/accounts/en_GB/shareclasses/'+isin+'?expand=marketdata&idType=isin&variationType=exchangeTradingInformationWithMarketData')
 for(const isin of ['FR0011550185','FR0011550193','IE00B4K6B022']){
  await request(isin,'https://live.euronext.com/en/product/etfs/'+isin+'-XPAR')
  await request(isin,'https://www.borsaitaliana.it/borsa/etf/scheda/'+isin+'-'+(isin.startsWith('FR')?'XPAR':'ETFP')+'.html?lang=en')
 }
 for(const isin of ['IE0003XJA0J9','IE00B0M62S72','IE00BLNMYC90','IE00B4L5Y983']){
  const page=await context.newPage()
  const url='https://bourse.fortuneo.fr/trackers/cours-etf-'+({'IE00B4L5Y983':'IWDA','IE00B0M62S72':'IDVY','IE00BLNMYC90':'XDEW','IE0003XJA0J9':'WEBN'}[isin])+'-'+isin+'-46'
  try{
   const response=await page.goto(url,{timeout:25000,waitUntil:'domcontentloaded'});await save(isin,url,Buffer.from(await page.content()),response.status(),page.url(),'browser')
   if(isin==='IE00B4L5Y983'){
    for(const src of await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>n.src).filter(u=>u.includes('application.min.js'))))await request(isin,src)
    const input=page.locator('#term')
    if(await input.count()){
     page.on('response',async r=>{if(/search|recherche|autocomplete/i.test(r.url()))try{await save('SEARCH',r.url(),await r.body(),r.status(),r.url(),'search')}catch{}})
     await input.fill('IE0003XJA0J9');await page.waitForTimeout(5000);await save('SEARCH',url,Buffer.from(await page.content()),200,page.url(),'search-page')
    }
   }
  }catch(e){manifest.push({isin,requestedUrl:url,error:String(e)})}finally{await page.close()}
 }
 for(const url of ['https://www.zonebourse.com/cours/etf/AMUNDI-PRIME-ALL-COUNTRY--176455745/','https://www.zonebourse.com/recherche/?q=IE00BK5BQT80'])await request('SEARCH',url)
}finally {writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));await browser.close()}
console.log(JSON.stringify(manifest.map(({isin,requestedUrl,status,error})=>({isin,requestedUrl,status,error}))))
