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
 for(const isin of ['IE000716YHJ7','IE0003XJA0J9','IE00B0M62S72']){
 const url='https://www.quantalys.com/Fonds/Recherche?isin='+isin,page=await context.newPage();
 try{
 await page.goto(url,{timeout:30000,waitUntil:'domcontentloaded'});
 await page.locator('#inputSearch').fill(isin);
 await Promise.all([page.waitForNavigation({timeout:30000,waitUntil:'domcontentloaded'}),page.locator('form[action="/Recherche/RechercheRapide"]').evaluate(f=>f.submit())]);
 await page.waitForTimeout(2000);
 await save(isin,url,Buffer.from(await page.content()),200,page.url(),'quantalys-public-search')
 }catch(e){manifest.push({isin,requestedUrl:url,error:String(e)})}
 await page.close()
 }
}finally {writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));await browser.close()}
console.log(JSON.stringify(manifest.map(({isin,requestedUrl,status,error})=>({isin,requestedUrl,status,error}))))
