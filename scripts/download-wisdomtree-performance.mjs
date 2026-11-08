// Ordinary issuer-page browser transport only. No challenge solving or cached data.
import {chromium} from 'playwright'
import {existsSync} from 'node:fs'
import {pathToFileURL} from 'node:url'
import sources from './official-nav-remainder-sources.json' with {type:'json'}
import routes from './issuer-access-routes.json' with {type:'json'}

export async function collectPublicPerformance(page, source, qualifiedIdentity=null) {
 const registered=sources.find(s=>s.id===source?.id&&s.navHistoryTransport==='official-dataspan-nav-tr')
 if(!registered||!['COPA','BRNT','CRUD','COFF','WTAI','WCLD','COCO','NGAS','WEAT'].includes(registered.wisdomTicker)||
   ['isin','wisdomTicker','sourceUrl','wisdomListingId','wisdomClassId','navCurrency','wisdomPerformancePathStyle'].some(k=>source[k]!==registered[k]))throw Error('Unqualified issuer performance scope')
 if(qualifiedIdentity!==null)return collectPdfBoundApiNavigation(page,source,registered,qualifiedIdentity)
 const style=source.wisdomPerformancePathStyle??'canonical'
 if(!['canonical','issuer-widget'].includes(style))throw Error('Unqualified issuer performance path style')
 const endpoint='historical_performance'+(style==='canonical'?'/':'')
 // Follow the normal public product page before its widget, as the publisher
 // does. A forbidden/challenge page or a different product stops this attempt.
 const landing=await page.goto(source.sourceUrl,{waitUntil:'domcontentloaded',timeout:30000})
 if(landing?.status()!==200||landing.url()!==source.sourceUrl)throw Error(`Official product page unavailable: ${landing?.status()}`)
 await page.waitForFunction(isin=>document.body?.innerText.includes(isin),source.isin,{timeout:5000})
 const publicProductPage={url:landing.url(),status:200,isin:source.isin,checkedAt:new Date().toISOString()}
 const results=[]
 for(const mode of ['gro10k','tabular']){
  const url=`https://dataspanapi.wisdomtree.com/funddetails/${endpoint}?entity=${source.wisdomTicker}&mode=${mode}`
  const result=await page.evaluate(async url=>{
   const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000)})
   const contentType=response.headers.get('content-type')??''
   if(response.status!==200||response.url!==url)throw Error(`Official widget unavailable: ${response.status} ${response.url}`)
   if(!/^(application\/json|text\/plain)(?:;|$)/i.test(contentType))throw Error('Official widget content type unqualified')
   const reader=response.body.getReader(),chunks=[];let size=0
   for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>8_000_000){await reader.cancel();throw Error('Official widget exceeds bound')}chunks.push(value)}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
   return {url:response.url,status:response.status,body:new TextDecoder().decode(bytes)}
  },url)
  if(result?.url!==url||result.status!==200||typeof result.body!=='string'||Buffer.byteLength(result.body)>8_000_000)throw Error('Official widget result scope unqualified')
  if(!Array.isArray(JSON.parse(result.body)))throw Error('Expected public issuer JSON array')
  results.push({url,status:200,body:Buffer.from(result.body).toString('base64')})
 }
 return {results,publicProductPage}
}

async function collectPdfBoundApiNavigation(page,source,registered,identity){
 const stamp=Date.parse(identity?.checkedAt),age=Date.now()-stamp
 if(!identity||identity.kind!=='official-exact-product-pdf-v1'||identity.isin!==source.isin||identity.currency!==source.navCurrency||
    identity.sourceUrl!==registered.factsheetUrl||identity.sourceUrl!==source.factsheetUrl||!identity.sourceUrl.endsWith('/'+source.isin)||
    !/^[a-f0-9]{64}$/.test(identity.sha256||'')||!/^\d{4}-\d{2}-\d{2}$/.test(identity.asOf||'')||
    !Number.isFinite(stamp)||age< -60000||age>300000)throw Error('Fresh qualified exact-product PDF identity required')
 const style=source.wisdomPerformancePathStyle??'canonical'
 if(!['canonical','issuer-widget'].includes(style))throw Error('Unqualified issuer performance path style')
 const endpoint='historical_performance'+(style==='canonical'?'/':'')
 const results=[]
 // Same ordinary public JSON navigation already used by the qualified issuer
 // directory/rankings readers. No CORS workaround, challenge solving or cache.
 for(const mode of ['gro10k','tabular']){
  const url=`https://dataspanapi.wisdomtree.com/funddetails/${endpoint}?entity=${source.wisdomTicker}&mode=${mode}`
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000})
  const canonical=url.replace('/historical_performance?','/historical_performance/?')
  if(response?.status()!==200||![url,canonical].includes(response.url()))throw Error(`Official public API navigation failed: ${response?.status()} ${response?.url()}`)
  const contentType=response.headers()['content-type']??''
  if(!/^(application\/json|text\/plain)(?:;|$)/i.test(contentType))throw Error('Official API response is not JSON')
  const body=await response.body()
  if(!body.length||body.length>8_000_000)throw Error('Official API body outside bound')
  const payload=JSON.parse(body.toString('utf8'))
  if(!Array.isArray(payload)||!payload.length)throw Error('Empty or modified official API array')
  results.push({url,status:200,...(response.url()!==url?{actualUrl:response.url(),redirectQualification:'Same official endpoint, entity and mode; canonical slash'}:{}),body:body.toString('base64')})
 }
 return {results,qualifiedIdentity:identity,publicApiNavigation:{checkedAt:new Date().toISOString(),requestedUrls:results.map(r=>r.url),identityFrom:'fresh exact-product official PDF',productPageAttempted:false}}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 let input='',qualifiedIdentity=null
 for await(const chunk of process.stdin){input+=chunk.toString();if(Buffer.byteLength(input)>4096)throw Error('Oversized identity binding')}
 if(input.trim())qualifiedIdentity=JSON.parse(input)
 const source=sources.find(s=>s.id===process.argv[2])
 if(!source)throw Error('Unqualified issuer performance scope')
 const executablePath=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,'/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync)
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
 try{
  const context=await browser.newContext(qualifiedIdentity?{extraHTTPHeaders:routes.wisdomtree.fundRankingsRequestHeaders}:{}),page=await context.newPage()
  process.stdout.write(JSON.stringify(await collectPublicPerformance(page,source,qualifiedIdentity)))
 }finally{await browser.close()}
}
