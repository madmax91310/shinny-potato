import {chromium} from 'playwright'

// Ordinary public browser navigation, without credentials or challenge solving.
// A blocked response stays an incident; never treat HTML as a portfolio.
const url=process.argv[2]
if(url!=='https://www.wisdomtree.com/api/fund-holdings/3104137')throw Error('Unqualified issuer API URL')
const browser=await chromium.launch({headless:true})
try{
 const page=await browser.newPage({locale:'en-GB'})
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000})
 if(!response?.ok()||response.url()!==url||!response.headers()['content-type']?.includes('application/json'))throw Error(`Public issuer API unavailable in browser: HTTP ${response?.status()}`)
 const body=await response.body()
 if(body.length>8_000_000||!Array.isArray(JSON.parse(body.toString())))throw Error('Invalid issuer API response')
 process.stdout.write(body)
}finally{await browser.close()}
