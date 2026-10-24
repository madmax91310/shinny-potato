import {chromium} from 'playwright'
import fs from 'node:fs'
import crypto from 'node:crypto'
fs.mkdirSync('evidence',{recursive:true})
const sourceUrl='https://www.londonstockexchange.com/stock/CSPX/ishares/company-page'
const evidence={checkedAt:new Date().toISOString(),sourceUrl,publication:'not-requested',financiallyQualified:false,responses:[],reason:'Read-only access probe; split and cash adjustment conventions and consumer compatibility still require independent qualification.'}
const browser=await chromium.launch({headless:true})
try {
 const page=await browser.newPage()
 page.on('response',async r=>{
  if(!r.url().includes('/rest/api/timeseries/historical'))return
  try {const raw=await r.body();const body=JSON.parse(raw);if(body.request?.ric!=='CSPX.L')return
   const sha256=crypto.createHash('sha256').update(raw).digest('hex');fs.writeFileSync(`evidence/${sha256}.json`,raw)
   evidence.responses.push({receivedAt:new Date().toISOString(),path:new URL(r.url()).pathname,sha256,request:body.request,last:body.data?.at(-1),metadata:body.metadata})
  }catch(error){evidence.captureError=String(error)}
 })
 const response=await page.goto(sourceUrl,{waitUntil:'domcontentloaded',timeout:45000});evidence.httpStatus=response.status()
 const consent=page.locator('#onetrust-reject-all-handler');await consent.waitFor({timeout:20000});await consent.click()
 await page.waitForTimeout(6000)
 let clicked=false
 for(const frame of page.frames()){
  const control=frame.getByText('Total Return',{exact:true})
  if(await control.count()){await control.first().click({timeout:10000});clicked=true;break}
 }
 if(!clicked)throw new Error('No public Total Return control: not a qualified alternative')
 await page.waitForTimeout(6000)
 const text=await page.locator('body').innerText();fs.writeFileSync('evidence/page.txt',text)
 evidence.pageTitle=await page.title();evidence.totalReturnControlClicked=clicked
 if(!evidence.responses.some(r=>r.request.adjustment==='D'))throw new Error('No adjusted daily response captured')
 console.log(JSON.stringify(evidence))
}catch(error){evidence.error=String(error);console.error(evidence.error);process.exitCode=1}
finally{fs.writeFileSync('evidence/execution.json',JSON.stringify(evidence,null,2)+'\n');await browser.close()}
