// Ordinary public issuer-page fetch context. No challenge solving, cookies from another account or cached financial output.
import {chromium} from 'playwright'
import {existsSync} from 'node:fs'
import sources from './official-nav-remainder-sources.json' with {type:'json'}
const source=sources.find(s=>s.id===process.argv[2]&&s.navHistoryTransport==='official-dataspan-nav-tr')
if(!source||!['COPA','BRNT','CRUD','COFF','WTAI','WCLD','COCO','NGAS','WEAT'].includes(source.wisdomTicker))throw Error('Unqualified issuer performance scope')
const executablePath=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,'/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync)
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
try{
 const context=await browser.newContext(),page=await context.newPage(),results=[]
 const entry='https://www.wisdomtree.com/gb/products'
 const parent=await page.goto(entry,{waitUntil:'networkidle',timeout:40000})
 if(!parent?.ok()||page.url()!==entry)throw Error(`Official public directory unavailable: ${parent?.status()} ${page.url()}`)
 if(/access denied|just a moment|verify you are human|captcha/i.test(await page.title()))throw Error('Official directory returned an access gate; no challenge attempted')
 for(const mode of ['gro10k','tabular']){
  const url=`https://dataspanapi.wisdomtree.com/funddetails/historical_performance?entity=${source.wisdomTicker}&mode=${mode}`
  // Let the browser provide its genuine Origin, Referer and fetch mode from
  // the public issuer site, instead of navigating directly to the JSON URL.
  const response=await page.evaluate(async url=>{const r=await fetch(url,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(40000)});return{status:r.status,url:r.url,contentType:r.headers.get('content-type'),body:await r.text()}},url)
  if(response.status!==200||response.url!==url)throw Error(`Official issuer-context performance unavailable: ${response.status} ${response.url}`)
  if(!/^(application\/json|text\/plain)(?:;|$)/i.test(response.contentType??''))throw Error(`Official issuer-context content type unqualified: ${response.contentType}`)
  const body=Buffer.from(response.body,'utf8')
  if(body.length>8_000_000)throw Error('Official issuer-context performance exceeds bound')
  if(!Array.isArray(JSON.parse(response.body)))throw Error('Expected public issuer JSON array')
  results.push({url,status:response.status,body:body.toString('base64')})
 }
 process.stdout.write(JSON.stringify({results}))
}finally{await browser.close()}
