// Execute the publisher's own same-origin export in a normal browser session.
// No CAPTCHA handling, alternate host, proxy service or financial transformation.
import {chromium} from 'playwright'
import {existsSync} from 'node:fs'
const [endpoint,product,input]=process.argv.slice(2),url=new URL(endpoint),pageUrl=new URL(product),payload=JSON.parse(input)
if(url.protocol!=='https:'||url.host!=='www.wisdomtree.com'||!/^\/api\/fund-history\/\d+\/historical-data-export$/.test(url.pathname)||url.search||url.hash||url.username||url.password||pageUrl.origin!==url.origin||!pageUrl.pathname.startsWith('/en-ie/')||pageUrl.username||pageUrl.password)throw Error('Unsupported official export scope')
const executablePath=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,'/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync)
const browser=await chromium.launch({...(executablePath?{executablePath}:{}),...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
try{
 const page=await browser.newPage(),response=await page.goto(pageUrl.href,{waitUntil:'domcontentloaded',timeout:30000})
 if(!response?.ok()||new URL(page.url()).origin!==url.origin)throw Error('Official identity page unavailable: '+response?.status())
 const html=await response.body();if(html.length>8_000_000)throw Error('Official identity page too large')
 const result=await page.evaluate(async({endpoint,payload})=>{
  const r=await fetch(endpoint,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)})
  if(!r.ok||!r.headers.get('content-type')?.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))throw Error('Official browser export unavailable: '+r.status)
  if(Number(r.headers.get('content-length'))>2_000_000)throw Error('Official export too large')
  const b=new Uint8Array(await r.arrayBuffer());if(b.length>2_000_000)throw Error('Official export too large')
  return{body:btoa(Array.from(b,x=>String.fromCharCode(x)).join('')),status:r.status,url:r.url}
 },{endpoint:url.href,payload})
 if(result.url!==url.href)throw Error('Official export redirected outside its qualified endpoint')
 process.stdout.write(JSON.stringify({...result,identityBody:html.toString('base64'),identityUrl:response.url(),transport:'publisher-same-origin-browser-export'}))
}finally{await browser.close()}
