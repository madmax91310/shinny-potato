import classes from './wisdomtree-holdings-classes.json' with {type:'json'}
import {chromium} from 'playwright'
import {readFileSync} from 'node:fs'
import {wisdomtreeProductCandidates} from './issuer-routes.mjs'

// Ordinary public browser navigation, without credentials or challenge solving.
// A blocked response stays an incident; never treat HTML as a portfolio.
const url=process.argv[2]
const match=Object.entries(classes).find(([,row])=>url===`https://www.wisdomtree.com/api/fund-holdings/${row.classId}`)
if(!match)throw Error('Unqualified issuer API URL')
const shares=['additional-etf-sources','exposure-etf-expansion'].flatMap(name=>JSON.parse(readFileSync(new URL(`./${name}.json`,import.meta.url))).instruments)
const share=shares.find(row=>row.isin===match[0])
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}: {}),
 ...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
try{
 const page=await browser.newPage({locale:'en-GB'})
 const attempts=[]
 const read=async response=>{
  if(!response?.ok()||response.url()!==url||!response.headers()['content-type']?.includes('application/json'))throw Error(`Public issuer API unavailable in browser: HTTP ${response?.status()}`)
  const body=await response.body()
  if(body.length>8_000_000||!Array.isArray(JSON.parse(body.toString())))throw Error('Invalid issuer API response')
  return body
 }
 let body
 // Let the same exact fund's ordinary public client request its own API. No
 // session credentials, challenge solving, hidden headers or alternate data.
 for(const product of (share?wisdomtreeProductCandidates(share.sourceUrl).slice(0,2):[])){
  if(body)break
  const pending=page.waitForResponse(r=>r.url()===url,{timeout:18000}).catch(()=>null)
  try{
   const response=await page.goto(product,{waitUntil:'domcontentloaded',timeout:15000})
   if(!response?.ok())throw Error(`Public product page HTTP ${response?.status()}`)
   body=await read(await pending)
  }catch(error){attempts.push({url:product,status:'unavailable',error:error.message})}
 }
 if(!body){
  try{body=await read(await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000}))}
  catch(error){attempts.push({url,status:'unavailable',error:error.message})}
 }
 if(!body)throw Error(JSON.stringify(attempts))
 process.stdout.write(body)
}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1}
finally{await browser.close()}
