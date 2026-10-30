// Ordinary public browser transport only. No challenge solving or cached data.
import {chromium} from 'playwright'
import {existsSync} from 'node:fs'
import sources from './official-nav-remainder-sources.json' with {type:'json'}
const source=sources.find(s=>s.id===process.argv[2]&&s.navHistoryTransport==='official-dataspan-nav-tr')
if(!source||!['COPA','BRNT','CRUD','COFF','WTAI','WCLD','COCO','NGAS','WEAT'].includes(source.wisdomTicker))throw Error('Unqualified issuer performance scope')
const executablePath=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,'/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync)
const style=source.wisdomPerformancePathStyle??'canonical'
if(!['canonical','issuer-widget'].includes(style))throw Error('Unqualified issuer performance path style')
const endpoint='historical_performance'+(style==='canonical'?'/':'')
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
try{
 const context=await browser.newContext({extraHTTPHeaders:{Origin:'https://www.wisdomtree.com',Referer:source.sourceUrl,Accept:'application/json'}})
 const page=await context.newPage(),results=[]
 for(const mode of ['gro10k','tabular']){
  const url=`https://dataspanapi.wisdomtree.com/funddetails/${endpoint}?entity=${source.wisdomTicker}&mode=${mode}`
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000})
  if(!response?.ok()||response.url()!==url)throw Error(`Official browser performance unavailable: ${response?.status()} ${response?.url()} (expected ${url})`)
  const contentType=response.headers()['content-type']??''
  if(!/^(application\/json|text\/plain)(?:;|$)/i.test(contentType))throw Error(`Official browser performance content type unqualified: ${contentType}`)
  const body=await response.body()
  if(body.length>8_000_000)throw Error('Official browser performance exceeds bound')
  if(!Array.isArray(JSON.parse(body.toString('utf8'))))throw Error('Expected public issuer JSON array')
  results.push({url,status:response.status(),body:body.toString('base64')})
 }
 process.stdout.write(JSON.stringify({results}))
}finally{await browser.close()}
