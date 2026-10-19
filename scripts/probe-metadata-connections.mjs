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
 for(const [isin,url,kind] of [
 ['IE000DQLYVB9','https://live.euronext.com/en/product/etfs/IE000DQLYVB9-XPAR','euronext-browser'],
 ['IE000716YHJ7','https://www.quantalys.com/Fonds/Recherche?isin=IE000716YHJ7','public-browser']
 ]){
 const page=await context.newPage();
 try{const response=await page.goto(url,{timeout:30000,waitUntil:'domcontentloaded'});if(kind==='euronext-browser')await page.getByText('Currency',{exact:true}).waitFor({timeout:25000});else await page.waitForTimeout(4000);await save(isin,url,Buffer.from(await page.content()),response?.status(),page.url(),kind)}catch(e){manifest.push({isin,requestedUrl:url,error:String(e)})}
 await page.close()
 }
 await request('IE000DQLYVB9','https://www.blackrock.com/varnish-api/uk-retail01-product-data/product-data/api/v2/get-product-data?appSubType=ISHARES&appType=PRODUCT_PAGE&component=keyFundFacts%2Clistings&locale=en_GB&portfolioId=342916&targetSite=ishares-uk&userType=individual&excludeContent=true&includeConfig=true')
}finally {writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));await browser.close()}
console.log(JSON.stringify(manifest.map(({isin,requestedUrl,status,error})=>({isin,requestedUrl,status,error}))))
