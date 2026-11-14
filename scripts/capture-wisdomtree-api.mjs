import classes from './wisdomtree-holdings-classes.json' with {type:'json'}
import {chromium} from 'playwright'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
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
 if(!body){
  const homepage='https://www.wisdomtree.com/investments'
  try{
   const navigation=await page.goto(homepage,{waitUntil:'domcontentloaded',timeout:12000})
   if(!navigation?.ok()||new URL(page.url()).origin!=='https://www.wisdomtree.com')throw Error('Public issuer home refused: '+navigation?.status())
   if(/access denied|captcha|just a moment|verify.*human|attention required/i.test(await page.title()))throw Error('Public access challenge; no challenge solving attempted')
   const result=await page.evaluate(async url=>{
    const response=await fetch(url,{cache:'no-store',credentials:'include',headers:{Accept:'application/json'}})
    if(response.status!==200||response.url!==url||!response.headers.get('content-type')?.includes('application/json'))throw Error('Same-session native JSON refused: '+response.status)
    const bytes=new Uint8Array(await response.arrayBuffer());if(!bytes.length||bytes.length>8000000)throw Error('Native JSON body outside size bound')
    let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768))
    return btoa(binary)
   },url)
   const raw=Buffer.from(result,'base64');if(!Array.isArray(JSON.parse(raw.toString())))throw Error('Native JSON is not a portfolio array')
   body=raw;attempts.push({url,status:'acquired',transport:'ordinary-issuer-home-same-session-fetch',page:page.url(),retrievedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(raw).digest('hex')})
  }catch(error){attempts.push({url:homepage,status:'unavailable',transport:'ordinary-issuer-home-same-session-fetch',error:error.message})}
 }
 if(process.env.WISDOMTREE_ACCESS_PROOF_DIR){const dir=process.env.WISDOMTREE_ACCESS_PROOF_DIR;mkdirSync(dir,{recursive:true});writeFileSync(path.join(dir,match[0]+'.json'),JSON.stringify({subjectIsin:match[0],sourceUrl:url,attempts,acquired:Boolean(body)},null,2))}
 if(!body)throw Error(JSON.stringify(attempts))
 process.stdout.write(body)
}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1}
finally{await browser.close()}
