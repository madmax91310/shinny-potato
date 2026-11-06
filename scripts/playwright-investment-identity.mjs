import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdirSync,writeFileSync} from 'node:fs'
import {derive,fmtEUR} from '../src/pages/investment-calculator/lib.js'
const base=process.env.AUDIT_BASE??'http://127.0.0.1:4173/shinny-potato',out=process.env.AUDIT_OUT??'test-artifacts/investment-share-identity'
mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true}),rows=[]
try{for(const width of [1440,390])for(const mode of ['lump','dca'])for(const year of [2015,2019]){
 const state={currency:'native',scenario:'standard',crisisId:'covid',assetId:'etfLU1829219390',startYear:year,startMonth:1,amountRaw:'1000',mode,customLabel:'',customStart:'',customEnd:'',overridePriceRaw:''}
 const c=await browser.newContext({viewport:{width,height:960}});await c.addInitScript(s=>localStorage.setItem('epargnant-publication:v1:investment-settings',JSON.stringify(s)),state)
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/calculateur-investissement',{waitUntil:'networkidle'})
 await p.locator('.ic-card, .ic-error, [role=alert]').first().waitFor();const body=await p.locator('body').innerText(),key=`${year}-${mode}-${width}`
 if(year===2015){assert.match(body,/lancement officiel de LU1829219390 le 2018-11-08/);assert.match(body,/continuité du prédécesseur non qualifiée/);assert.equal(await p.locator('.ic-hero-number').count(),0)}
 else{const expected=fmtEUR(derive(state).result.finalValue,'EUR');assert.equal(await p.locator('.ic-hero-number').innerText(),expected)}
 assert.deepEqual(errors,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`${out}/${key}.png`,fullPage:true});rows.push({key,state,width,url:p.url(),body,errors});writeFileSync(`${out}/results.json`,JSON.stringify(rows,null,2));await c.close()
}}finally{await browser.close()}
console.log('BNKE: four precise prelaunch refusals and four valid 2019 lump/DCA windows, desktop/mobile, no substituted dates or asset.')
