import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import fs from 'node:fs/promises'
import {existsSync} from 'node:fs'
import {chromium} from 'playwright'
import {choose} from './card-selection.mjs'
import {ASSETS} from '../src/data/calculator-history.js'
import {resolveAnniversaryLevel} from '../src/data/anniversary-levels.js'
import {getAnnualReturns} from '../src/pages/tweet-midi/data/performanceHistory.js'
import {fmtEUR} from '../src/lib/format-currency.js'

const ids=['etfIE00B2QWCY14','etf_world_communication']
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4397/shinny-potato'
const out=process.env.TEST_OUTPUT_DIR??'test-artifacts/financial-nav-recovery'
const server=process.env.TEST_BASE_URL?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4397'],{stdio:'ignore'})
let browser
try{
 await fs.mkdir(out,{recursive:true})
 if(server)for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,150))}
 browser=await chromium.launch({headless:true,...(existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),...(base.startsWith('https:')&&process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
 const page=await browser.newPage({viewport:{width:390,height:950},acceptDownloads:true,extraHTTPHeaders:{'Cache-Control':'no-cache, no-store','Pragma':'no-cache'}})
 await page.addInitScript(()=>{navigator.clipboard.writeText=async text=>{window.__financialCopied=text}})
 const results=[],errors=[];page.on('pageerror',e=>errors.push(e.message))
 async function preview(){const button=page.locator('.workspace-view-switch').getByRole('button',{name:'Aperçu',exact:true});if(await button.isVisible())await button.click()}
 async function settings(){const button=page.locator('.workspace-view-switch').getByRole('button',{name:'Réglages',exact:true});if(await button.isVisible())await button.click()}
 async function exported(id,button,check){
  const pending=page.waitForEvent('download');await button.click();const file=await pending;await file.saveAs(`${out}/${id}.png`);const bytes=await fs.readFile(`${out}/${id}.png`)
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(bytes.length>10000)
  await page.getByRole('button',{name:/Copier le texte|Copié/}).click();const text=await page.evaluate(()=>window.__financialCopied);assert(typeof text==='string'&&!/NaN|undefined/.test(text));check(text)
  await fs.writeFile(`${out}/${id}.txt`,text)
  await preview();await page.getByRole('tab',{name:'Image',exact:true}).click();const img=page.locator('.publication-image-stage img');await img.waitFor();await img.evaluate(async n=>{if(!n.complete)await new Promise((resolve,reject)=>{n.onload=resolve;n.onerror=reject})})
  const previewBytes=await img.evaluate(async n=>Array.from(new Uint8Array(await(await fetch(n.src)).arrayBuffer())))
  assert(bytes.equals(Buffer.from(previewBytes)),'Downloaded PNG must equal the actual preview')
  await page.getByRole('tab',{name:'Texte',exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
  results.push({id,bytes:bytes.length,actualCopy:true,previewIdentical:true,url:page.url()});console.log(id,'financial values, copy and actual PNG/preview passed')
 }
 for(const id of ids){
  const asset=ASSETS[id],last=asset.points.at(-1),first=asset.points.at(-2);assert(first&&last)
  await page.goto(`${base}/calculateur-investissement?asset=${id}`,{waitUntil:'networkidle'})
  assert.equal(await page.getByRole('group',{name:'Choisir un actif',exact:true}).getAttribute('data-value'),id)
  await choose(page.getByRole('group',{name:'Année de départ',exact:true}),first.date.slice(0,4));await choose(page.getByRole('group',{name:'Mois de départ',exact:true}),String(Number(first.date.slice(5))))
  await page.locator('.ic-amount-wrap input').fill('1000')
  const period=new Date(last.date+'-15T12:00:00Z').toLocaleDateString('fr-FR',{month:'long',year:'numeric',timeZone:'UTC'})
  for(const mode of ['lump','dca']){
   await settings();await page.getByRole('button',{name:mode==='lump'?'Versement unique':'Mensuel (DCA)',exact:true}).click();await preview()
   const expected=1000*last.price/first.price+(mode==='dca'?1000:0)
   await exported(`${id}-${mode}`,page.getByRole('button',{name:'📊 Télécharger une image',exact:true}),text=>{assert(text.includes(period));assert(text.includes(fmtEUR(expected,asset.currency)),'Independent two-month investment calculation')})
  }
  const year=getAnnualReturns(id,Math.max(2020,Number(asset.points[0].date.slice(0,4))+1)).at(-1).year
  await page.goto(`${base}/performance-depuis?asset=${id}`,{waitUntil:'networkidle'});await choose(page.locator('#secondary-select'),String(year));await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  await exported(id+'-performance',page.getByRole('button',{name:/Télécharger.*image|Télécharger.*PNG/i}),text=>assert(text.includes(String(year))&&text.includes('revenus réinvestis')))
  await page.goto(`${base}/tweet-midi`,{waitUntil:'networkidle'});await page.getByRole('button',{name:'Il y a X ans',exact:true}).click();await choose(page.locator('#subject-select'),id);await choose(page.locator('#secondary-select'),'1');await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  const level=resolveAnniversaryLevel(id,'');assert(level);const date=level.asOf.split('-').reverse().join('/')
  await exported(id+'-anniversaire',page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}),text=>assert(text.includes('Valeur liquidative du '+date)&&text.includes('hors distributions')))
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/results.json',JSON.stringify({results,errors},null,2));console.log(results.length,'real financial PNG exports and copies verified')
}finally{await browser?.close();server?.kill()}
