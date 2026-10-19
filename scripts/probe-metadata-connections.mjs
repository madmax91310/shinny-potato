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
 for(const isin of ['IE00B4L5Y983','IE00BP3QZ601','IE00BDBRDM35','IE00B0M62S72']){
  const source=sources.find(x=>x.isin===isin);const api=source.urls.find(u=>u.includes('blackrock.com/varnish-api/'))
  if(!api)continue
  const id=new URL(api).searchParams.get('portfolioId')
  await request(isin,api.replace('locale=en_GB','locale=fr_FR').replace('targetSite=ishares-uk','targetSite=ishares-fr').replace('/uk-retail01-','/fr-retail01-'))
  await request(isin,'https://www.blackrock.com/fr/particuliers/products/'+id+'/fund')
 }
 for(const [isin,url] of [['IE0003XJA0J9','https://www.quantalys.com/Fonds/Recherche?isin=IE0003XJA0J9'],['IE0003XJA0J9','https://www.abcbourse.com/cotation/WEBNq'],['IE00BLNMYC90','https://www.boursorama.com/bourse/trackers/cours/composition/1gXDEW/']])await request(isin,url)
}finally {writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));await browser.close()}
console.log(JSON.stringify(manifest.map(({isin,requestedUrl,status,error})=>({isin,requestedUrl,status,error}))))
