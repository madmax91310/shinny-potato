import {chromium} from 'playwright'
import {mkdirSync,writeFileSync} from 'node:fs'
const out='test-artifacts/automation-source-probe'
mkdirSync(out,{recursive:true})
const browser=await chromium.launch({headless:true})
const targets=[
 ['jpm','https://am.jpmorgan.com/sg/en/asset-management/per/products/jpm-global-equity-premium-income-active-ucits-etf-usd-dist-ie0003uvyc20'],
 ['ubs','https://www.ubs.com/de/en/assetmanagement/funds/etf.html/ie00bd4txv59-ubs-core-msci-world-ucits-etf-usd-acc-pd001'],
 ['lg','https://fundcentres.landg.com/en/uk/institutional/fund-centre/ETF/Cyber-Security/IE00BYPLS672/'],
]
for(const [label,url] of targets){
 const context=await browser.newContext()
 const page=await context.newPage();const requests=[],pending=[];let counter=0,bytes=0
 page.on('response',response=>{
  const u=new URL(response.url())
  if(!['am.jpmorgan.com','cdn.jpmorganfunds.com','www.ubs.com','fundcentres.landg.com'].includes(u.hostname))return
  if(!/json|javascript/.test(response.headers()['content-type']??''))return
  if(!/api|FundsMarketingHandler|fund|pdp|product|portfolio/i.test(u.pathname))return
  const number=counter++;if(number>=45)return
  pending.push((async()=>{try{
   const body=await response.body();if(body.length>4e6||bytes+body.length>12e6)return;bytes+=body.length
   for(const key of u.searchParams.keys())if(/token|auth|key/i.test(key))u.searchParams.set(key,'REDACTED')
   const file=`${label}-response-${number}.raw`;writeFileSync(`${out}/${file}`,body)
   requests.push({url:u.href,status:response.status(),file,bytes:body.length})
  }catch{}})())
 })
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(25000)
  const tabs=page.getByRole('tab',{name:/portfolio|holdings|composition/i})
  if(await tabs.count()){await tabs.first().click({timeout:5000});await page.waitForTimeout(5000)}
  writeFileSync(`${out}/${label}-browser.html`,await page.content())
  writeFileSync(`${out}/${label}-browser.txt`,await page.locator('body').innerText())
 }catch(error){requests.push({error:error.message})}
 await Promise.allSettled(pending);writeFileSync(`${out}/${label}-requests.json`,JSON.stringify(requests,null,2))
 await context.close()
}
await browser.close()
