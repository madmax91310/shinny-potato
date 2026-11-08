// Ordinary issuer-page browser transport only. No challenge solving or cached data.
import {chromium} from 'playwright'
import {existsSync} from 'node:fs'
import {pathToFileURL} from 'node:url'
import sources from './official-nav-remainder-sources.json' with {type:'json'}

export async function collectPublicPerformance(page, source, qualifiedIdentity=null) {
 const registered=sources.find(s=>s.id===source?.id&&s.navHistoryTransport==='official-dataspan-nav-tr')
 if(!registered||!['COPA','BRNT','CRUD','COFF','WTAI','WCLD','COCO','NGAS','WEAT'].includes(registered.wisdomTicker)||
   ['isin','wisdomTicker','sourceUrl','wisdomListingId','wisdomClassId','navCurrency','wisdomPerformancePathStyle'].some(k=>source[k]!==registered[k]))throw Error('Unqualified issuer performance scope')
 const style=source.wisdomPerformancePathStyle??'canonical'
 if(!['canonical','issuer-widget'].includes(style))throw Error('Unqualified issuer performance path style')
 const endpoint='historical_performance'+(style==='canonical'?'/':'')
 // Follow the normal public product page before its widget, as the publisher
 // does. A forbidden/challenge page or a different product stops this attempt.
 const landing=await page.goto(source.sourceUrl,{waitUntil:'domcontentloaded',timeout:30000})
 let publicWidgetClient
 const productOk=landing?.status()===200&&landing.url()===source.sourceUrl
 if(!productOk){
  // A freshly qualified official exact-share PDF supplies identity, never the
  // demo ticker of the publisher's generic public chart client.
  const i=qualifiedIdentity,stamp=Date.parse(i?.checkedAt),age=Date.now()-stamp
  if(landing?.status()!==403||landing.url()!==source.sourceUrl||!i||
     i.kind!=='official-exact-product-pdf-v1'||i.isin!==source.isin||i.currency!==source.navCurrency||
     i.sourceUrl!==source.factsheetUrl||!i.sourceUrl.endsWith('/'+source.isin)||
     !/^[a-f0-9]{64}$/.test(i.sha256||'')||!/^\d{4}-\d{2}-\d{2}$/.test(i.asOf||'')||
     !Number.isFinite(stamp)||age< -60000||age>300000)throw Error(`Official product page unavailable: ${landing?.status()} ${landing?.url()}`)
  const widget=await page.goto('https://perfchart.wisdomtree.eu/',{waitUntil:'domcontentloaded',timeout:30000})
  if(widget?.status()!==200||widget.url()!=='https://perfchart.wisdomtree.eu/'||await page.title()!=='WisdomTree | PRIIPS Chart')throw Error('Official public widget client unavailable')
  await page.waitForFunction(()=>typeof window.performanceChart==='object'&&document.querySelector('#performanceChart'),null,{timeout:5000})
  publicWidgetClient={url:widget.url(),status:200,checkedAt:new Date().toISOString(),identitySource:'fresh qualified official exact-share PDF',demoTickerIsIdentity:false}
 }else await page.waitForFunction(isin=>document.body?.innerText.includes(isin),source.isin,{timeout:5000})
 const publicProductPage={url:landing.url(),status:landing.status(),...(productOk?{isin:source.isin,checkedAt:new Date().toISOString()}:{attemptedAt:new Date().toISOString()})}
 const results=[]
 for(const mode of ['gro10k','tabular']){
  const url=`https://dataspanapi.wisdomtree.com/funddetails/${endpoint}?entity=${source.wisdomTicker}&mode=${mode}`
  const result=await page.evaluate(async ({url,widget})=>{
   const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000)})
   const contentType=response.headers.get('content-type')??''
   const canonical=url.replace('/historical_performance?','/historical_performance/?')
   if(response.status!==200||(response.url!==url&&!(widget&&response.url===canonical)))throw Error(`Official widget unavailable: ${response.status} ${response.url}`)
   if(!/^(application\/json|text\/plain)(?:;|$)/i.test(contentType))throw Error('Official widget content type unqualified')
   const reader=response.body.getReader(),chunks=[];let size=0
   for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>8_000_000){await reader.cancel();throw Error('Official widget exceeds bound')}chunks.push(value)}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
   return {url:response.url,status:response.status,body:new TextDecoder().decode(bytes)}
  },{url,widget:Boolean(publicWidgetClient)})
  const canonical=url.replace('/historical_performance?','/historical_performance/?')
  if((result?.url!==url&&!(publicWidgetClient&&result?.url===canonical))||result.status!==200||typeof result.body!=='string'||Buffer.byteLength(result.body)>8_000_000)throw Error('Official widget result scope unqualified')
  if(!Array.isArray(JSON.parse(result.body)))throw Error('Expected public issuer JSON array')
  results.push({url,...(result.url!==url?{actualUrl:result.url,redirectQualification:'same official endpoint, entity and mode; publisher canonical slash'}:{}),status:200,body:Buffer.from(result.body).toString('base64')})
 }
 return {results,publicProductPage,...(publicWidgetClient?{publicWidgetClient,qualifiedIdentity}: {})}
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
  const context=await browser.newContext(),page=await context.newPage()
  process.stdout.write(JSON.stringify(await collectPublicPerformance(page,source,qualifiedIdentity)))
 }finally{await browser.close()}
}
