import {chromium} from 'playwright'
import {mkdirSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const root='source-probe';mkdirSync(root,{recursive:true});const manifest=[]
const browser=await chromium.launch({headless:true})
const urls={
wisdom:'https://www.wisdomtree.com/gb/products/equities/wisdomtree-cloud-computing-ucits-etf---usd-acc',
vanguard:'https://www.vanguard.co.uk/professional/product/etf/equity/9679/ftse-all-world-ucits-etf-usd-accumulating',
amundi:'https://www.amundietf.fr/fr/professionnels/produits/equity/amundi-prime-all-country-world-ucits-etf-acc/ie0003xja0j9',
vaneck:'https://www.vaneck.com/nl/en/investments/semiconductor-etf/',
invesco:'https://www.invesco.com/uk/en/financial-products/etfs/invesco-ftse-all-world-ucits-etf-acc.html'}
for(const [label,url]of Object.entries(urls)){
 const context=await browser.newContext();const page=await context.newPage();const pending=[]
 page.on('response',response=>{
  if(!/graphql|\.js\?|\.js$|\/api\/|\/mapi\/|dataspan|GetBlock|BlockRenderer/i.test(response.url()))return
  if(/google|facebook|analytics|doubleclick|onetrust|cookiebot/i.test(response.url()))return
  pending.push((async()=>{try{const body=await response.body();if(body.length>12000000)return;const hash=createHash('sha256').update(body).digest('hex');writeFileSync(`${root}/${hash}.raw`,body);manifest.push({label,url:response.url(),status:response.status(),sha256:hash,bytes:body.length,request:response.request().postData(),checkedAt:new Date().toISOString()})}catch{}})())
 })
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(4000)
  for(const text of [/Accept all/i,/Accepter tout/i,/I agree/i,/J’accepte/i,/Agree and continue/i]){const button=page.getByRole('button',{name:text}).first();if(await button.isVisible().catch(()=>false))await button.click({timeout:3000}).catch(()=>{})}
  const holdings=page.getByText(/^(Holdings|Portfolio data|COMPOSITION)$/).first();if(await holdings.isVisible().catch(()=>false))await holdings.click({timeout:3000}).catch(()=>{})
  for(let n=0;n<6;n++){await page.mouse.wheel(0,900);await page.waitForTimeout(800)}
  await page.waitForTimeout(5000)
  writeFileSync(`${root}/${label}-browser.html`,await page.content())
  writeFileSync(`${root}/${label}-browser-links.json`,JSON.stringify(await page.locator('a[href]').evaluateAll(as=>as.map(a=>({text:a.textContent,url:a.href})).filter(a=>/hold|csv|xlsx|compos|download/i.test(a.text+a.url))),null,2))
 }catch(e){manifest.push({label,url,error:String(e)})}
 await Promise.allSettled(pending);await context.close()
}
await browser.close();writeFileSync(`${root}/browser-manifest.json`,JSON.stringify(manifest,null,2));console.log(manifest.map(x=>({label:x.label,url:x.url,bytes:x.bytes,status:x.status,error:x.error})))
