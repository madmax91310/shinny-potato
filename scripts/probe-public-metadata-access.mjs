import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const root=process.env.PROBE_OUTPUT
if(!root)throw new Error('PROBE_OUTPUT required')
await mkdir(root,{recursive:true})
const targets=[
{isin:'IE00B4L5Y983',url:'https://www.boursedirect.fr/fr/marche/euronext-amsterdam/ishares-core-msci-world-ucits-IE00B4L5Y983-IWDA-EUR-XAMS/seance'},
{isin:'IE00BLNMYC90',url:'https://www.boursedirect.fr/fr/marche/six-swiss-exchange/x-sp-ew-dr-IE00BLNMYC90-XDEW-CHF-XSWX/seance'},
{isin:'IE00B4L5Y983',url:'https://bourse.fortuneo.fr/trackers/cours-etf-IWDA-IE00B4L5Y983-46'}]
const browser=await chromium.launch({headless:true})
const context=await browser.newContext({locale:'fr-FR'})
const results=[]
try {
for(const [i,target] of targets.entries()){
 const page=await context.newPage()
 const row={...target,checkedAt:new Date().toISOString(),method:'Public anonymous browser; rendered DOM'}
 try{
 const response=await page.goto(target.url,{waitUntil:'domcontentloaded',timeout:45000})
 row.status=response?.status()
 await page.waitForTimeout(2000)
 const body=await page.content()
 row.sourceUrl=page.url();row.file=String(i)+'.html';row.sha256=createHash('sha256').update(body).digest('hex')
 await writeFile(root+'/'+row.file,body)
 await page.screenshot({path:root+'/'+String(i)+'.png',fullPage:true})
 }catch(error){row.error=error.message}
 results.push(row)
 await writeFile(root+'/manifest.json',JSON.stringify({results},null,2))
 await page.close()
}
}finally{await browser.close()}
console.log(JSON.stringify(results.map(({isin,status,error,sourceUrl})=>({isin,status,error,sourceUrl}))))
