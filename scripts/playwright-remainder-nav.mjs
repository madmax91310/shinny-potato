import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import fs from 'node:fs/promises'
import {chromium} from 'playwright'
import {choose} from './card-selection.mjs'
import {ASSETS} from '../src/data/market-history.js'
import {resolveAnniversaryLevel} from '../src/data/anniversary-levels.js'
const requested=(process.env.TEST_NAV_IDS??'').split(',').filter(Boolean),width=Number(process.env.TEST_VIEWPORT_WIDTH??1280)
const port=4396,base=process.env.TEST_BASE_URL??`http://127.0.0.1:${port}/shinny-potato`
const server=process.env.TEST_BASE_URL?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
const out=process.env.TEST_OUTPUT_DIR??'test-artifacts/remainder-nav';let browser
try{
 await fs.mkdir(out,{recursive:true})
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,150))}
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width,height:1000},acceptDownloads:true}),errors=[],results=[]
 page.on('pageerror',e=>errors.push(e.message))
 async function png(id,button){const pending=page.waitForEvent('download');await button.click();const file=await pending;await file.saveAs(`${out}/${id}.png`);const b=await fs.readFile(`${out}/${id}.png`);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(b.length>10000);results.push({id,bytes:b.length});console.log(id,'PNG valid')}
 async function preview(){const button=page.locator('.workspace-view-switch').getByRole('button',{name:'Aperçu',exact:true});if(await button.isVisible())await button.click()}
 const sources=JSON.parse(await fs.readFile('scripts/official-nav-remainder-sources.json','utf8'));assert(requested.every(id=>sources.some(s=>s.id===id)),'Unknown NAV scope')
 for(const {id} of sources.filter(s=>!requested.length||requested.includes(s.id))){
  await page.goto(`${base}/calculateur-investissement?asset=${id}`,{waitUntil:'networkidle'})
  assert.equal(await page.getByRole('group',{name:'Choisir un actif',exact:true}).getAttribute('data-value'),id)
  await preview();assert((await page.locator('body').innerText()).includes(ASSETS[id].label))
  await png(id+'-lump',page.getByRole('button',{name:'📊 Télécharger une image',exact:true}))
  const editor=page.locator('.workspace-view-switch').getByRole('button',{name:'Réglages',exact:true});if(await editor.isVisible())await editor.click()
  await page.getByRole('button',{name:'Mensuel (DCA)',exact:true}).click();await preview()
  await png(id+'-dca',page.getByRole('button',{name:'📊 Télécharger une image',exact:true}))
  await page.goto(`${base}/performance-depuis?asset=${id}`,{waitUntil:'networkidle'})
  assert.equal(await page.locator('#subject-select').getAttribute('data-value'),id)
  await choose(page.locator('#secondary-select'),'2025');await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  assert((await page.locator('pre').innerText()).includes('VL'))
  await png(id+'-performance',page.getByRole('button',{name:/Télécharger.*image|Télécharger.*PNG/i}))
  await page.goto(`${base}/tweet-midi`,{waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Il y a X ans',exact:true}).click();await choose(page.locator('#subject-select'),id);await choose(page.locator('#secondary-select'),'1');await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  const latest=resolveAnniversaryLevel(id,'');assert(latest)
  assert(Math.abs(Number(await page.locator('#niveau-actuel').inputValue())-latest.value)<1e-6)
  const text=await page.locator('pre').innerText();assert(text.includes('VL')&&text.includes('Valeur liquidative du'));assert(!/NaN|undefined/.test(text))
  await png(id+'-anniversaire',page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}))
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/anniversaire-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));assert.deepEqual(errors,[])
 await fs.writeFile(out+'/results.json',JSON.stringify({results,errors},null,2));console.log(results.length,'official NAV PNG downloads verified')
}finally{await browser?.close();server?.kill()}
