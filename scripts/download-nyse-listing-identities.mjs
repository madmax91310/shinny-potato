// Ordinary public NYSE page + its same-origin API; no authentication, challenge
// solving or cached responses. Only already registered XNYS ordinary shares.
import {chromium} from 'playwright';import {existsSync,readFileSync}from'node:fs';
const registered=JSON.parse(readFileSync(new URL('../src/data/shared-listing-identities.json',import.meta.url))).listings;
const allowed=new Set(registered.filter(r=>r.sourceId==='us-other'&&r.mic==='XNYS'&&r.currency==='USD'&&r.shareType==='ordinary'&&r.instrumentType==='EQUITY').map(r=>r.ticker));
const tickers=process.argv.slice(2);if(!tickers.length||tickers.length>allowed.size||new Set(tickers).size!==tickers.length||tickers.some(t=>!allowed.has(t)||!/^[A-Z0-9.]+$/.test(t)))throw Error('Outside registered NYSE identity scope');
const executablePath=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,'/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync);
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})});
try{
 const context=await browser.newContext(),page=await context.newPage(),url='https://www.nyse.com/quote/XNYS:'+tickers[0];
 const landing=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});if(!landing||landing.status()!==200||new URL(landing.url()).hostname!=='www.nyse.com')throw Error('Ordinary NYSE page unavailable: '+landing?.status());
 const records={},errors={};
 for(const ticker of tickers){
  try{
   const api='https://www.nyse.com/api/nyseservice/v1/quotes?symbol='+encodeURIComponent(ticker);
   const result=await page.evaluate(async api=>{const response=await fetch(api,{credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(20000)});if(response.status!==200||response.url!==api||!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')??''))throw Error('NYSE public API access/format refused: '+response.status);const text=await response.text();if(!text.length||text.length>2000000)throw Error('NYSE body outside bound');return text},api);
   const body=Buffer.from(result);if(body.length>2000000)throw Error('NYSE body outside byte bound');JSON.parse(result);records[ticker]={url:api,body:body.toString('base64')};
  }catch(error){errors[ticker]=error.message}
 }
 process.stdout.write(JSON.stringify({records,errors}));
}finally{await browser.close()}
