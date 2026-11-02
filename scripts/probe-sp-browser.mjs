import {chromium} from 'playwright'
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const out=process.argv[2],configs=JSON.parse(await readFile('scripts/index-automation.json')).indices.filter(c=>c.compositionDataUrl),rows=[]
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']})
try{
 for(const c of configs){
  const context=await browser.newContext(),page=await context.newPage()
  try{
   const response=await page.goto(c.compositionPageUrl,{waitUntil:'domcontentloaded',timeout:30000})
   rows.push({id:c.id,kind:'navigation',url:c.compositionPageUrl,finalUrl:page.url(),status:response?.status(),at:new Date().toISOString()})
   // No API request after an access refusal, login, CAPTCHA or challenge page.
   const title=await page.title(),text=await page.locator('body').innerText({timeout:5000})
   if(response?.status()!==200||/captcha|access denied|verify you are human|just a moment|sign in to continue/i.test(title+' '+text.slice(0,1200)))continue
   const answer=await page.evaluate(async url=>{const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});return{status:r.status,url:r.url,type:r.headers.get('content-type'),body:await r.text()}},c.compositionDataUrl)
   const body=Buffer.from(answer.body);await writeFile(`${out}/${c.id}-browser.response`,body)
   rows.push({id:c.id,kind:'same-origin-api',url:answer.url,status:answer.status,contentType:answer.type,sha256:createHash('sha256').update(body).digest('hex'),bytes:body.length,at:new Date().toISOString()})
  }catch(e){rows.push({id:c.id,error:e.message,at:new Date().toISOString()})}finally{await context.close()}
 }
}finally{await browser.close();await writeFile(`${out}/browser-access.json`,JSON.stringify(rows,null,2))}
console.log(JSON.stringify(rows,null,2))
