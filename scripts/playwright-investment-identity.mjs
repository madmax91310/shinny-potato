import assert from 'node:assert/strict'
import {choose} from './card-selection.mjs'
import {chromium} from 'playwright'
import {mkdirSync,writeFileSync} from 'node:fs'
import {derive,fmtEUR} from '../src/pages/investment-calculator/lib.js'
const base=process.env.AUDIT_BASE??'http://127.0.0.1:4173/shinny-potato',out=process.env.AUDIT_OUT??'test-artifacts/investment-share-identity'
mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true}),rows=[]
try{for(const width of [1440,390])for(const mode of ['lump','dca'])for(const [year,month]of [[2015,1],[2018,10],[2018,11],[2019,1]]){
 const state={currency:'native',scenario:'standard',crisisId:'covid',assetId:'etfLU1829219390',startYear:year,startMonth:month,amountRaw:'1000',mode,customLabel:'',customStart:'',customEnd:'',overridePriceRaw:''}
 const c=await browser.newContext({viewport:{width,height:960}});await c.addInitScript(s=>localStorage.setItem('epargnant-publication:v1:investment-settings',JSON.stringify(s)),state)
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/calculateur-investissement',{waitUntil:'networkidle'})
 await p.locator('.workspace-tool-view').waitFor({state:'attached'});
 const beforeLaunch=year<2018||(year===2018&&month<11),issue=p.locator('#ic-history-date-issue'),yearPicker=p.getByRole('group',{name:'Année de départ',exact:true}),monthPicker=p.getByRole('group',{name:'Mois de départ',exact:true})
 if(beforeLaunch){await issue.waitFor({state:'visible'});assert.match(await issue.innerText(),/lancement officiel de LU1829219390 le 2018-11-08.*continuité du prédécesseur non qualifiée/);assert.equal(await yearPicker.getAttribute('aria-invalid'),'true');assert.equal(await monthPicker.getAttribute('aria-describedby'),'ic-history-date-issue')}
 else{assert.equal(await issue.count(),0);assert.equal(await yearPicker.getAttribute('aria-invalid'),'false')}
 if(year===2018&&month===10){await choose(monthPicker,'11');await issue.waitFor({state:'detached'});assert.equal(await monthPicker.getAttribute('aria-invalid'),'false');await choose(monthPicker,'10');await issue.waitFor({state:'visible'})}
 if(year===2018&&month===10&&mode==='lump')await p.screenshot({path:`${out}/2018-10-lump-${width}-settings.png`,fullPage:true})
 const preview=p.getByRole('button',{name:'Aperçu',exact:true});if(await preview.isVisible())await preview.click();
 await p.waitForFunction(()=>document.body.innerText.includes('lancement officiel de LU1829219390')||Boolean(document.querySelector('.ic-hero-number'))); const body=await p.locator('body').innerText(),key=`${year}-${month}-${mode}-${width}`
 if(year<2018||(year===2018&&month<11)){assert.match(body,/lancement officiel de LU1829219390 le 2018-11-08/);assert.match(body,/continuité du prédécesseur non qualifiée/);assert.equal(await p.locator('.ic-hero-number').count(),0)}
 else{const expected=fmtEUR(derive(state).result.finalValue,'EUR');assert.equal(await p.locator('.ic-hero-number').innerText(),expected)}
 assert.deepEqual(errors,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`${out}/${key}.png`,fullPage:true});rows.push({key,state,width,url:p.url(),body,errors});writeFileSync(`${out}/results.json`,JSON.stringify(rows,null,2));await c.close()
}}finally{await browser.close()}
console.log('BNKE: eight precise prelaunch refusals and eight valid November 2018/2019 lump/DCA windows, desktop/mobile, no substituted dates or asset; selector reasons, accessibility and October/November transitions verified.')
