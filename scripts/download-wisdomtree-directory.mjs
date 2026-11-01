// Same public collective endpoint as the ordinary HTTP producer. No challenge
// solving, authentication, alternate host, cached body or instrument fallback.
import {chromium} from 'playwright'
import {existsSync} from 'node:fs'
import routes from './issuer-access-routes.json' with {type:'json'}
const route=routes.wisdomtree,url=route.fundDirectory
if(url!=='https://dataspanapi.wisdomtree.com/fundlist/data/?divisionId=2&wtRegion=GB&isoCode=en-GB&isLeveraged=-1&isFP=0')throw Error('Unqualified directory endpoint')
if(process.argv.length!==2)throw Error('Directory transport does not accept arbitrary URLs')
const executablePath=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,'/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync)
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
try {
 const context=await browser.newContext({extraHTTPHeaders:route.fundRankingsRequestHeaders})
 const page=await context.newPage(),response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000})
 if(!response||response.status()!==200||response.url()!==url)throw Error(`Public directory browser access failed: ${response?.status()} ${response?.url()}`)
 const contentType=response.headers()['content-type']??''
 if(!/^application\/json(?:;|$)/i.test(contentType))throw Error('Public directory response is not JSON')
 const body=await response.body()
 if(body.length===0||body.length>8_000_000)throw Error('Public directory body outside bound')
 const payload=JSON.parse(body.toString('utf8'))
 if(!Array.isArray(payload)||!payload.length)throw Error('Empty or modified public directory')
 process.stdout.write(JSON.stringify({url,status:response.status(),contentType,body:body.toString('base64')}))
}finally{await browser.close()}
