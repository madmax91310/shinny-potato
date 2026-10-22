import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {choose} from './card-selection.mjs'
const port=4387,base=`http://127.0.0.1:${port}/shinny-potato`,folder='test-artifacts/corrections-20261022'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true})
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[],results=[]
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);await mkdir(folder,{recursive:true})
 const button=()=>page.getByRole('button',{name:'📊 Télécharger une image',exact:true})
 async function png(name){await button().waitFor({state:'visible'});const pending=page.waitForEvent('download');await button().click();const download=await pending;await download.saveAs(`${folder}/${name}.png`);const body=await readFile(`${folder}/${name}.png`);assert.equal(body.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(body.length>10000);results.push({name,bytes:body.length});console.log(name,'PNG valide')}
 for(const [id,startYear,startMonth,reason]of [['etfIE00B579F325','2024','12',/cours reportés/],['etfIE000U9ODG19','2026','2',/cours reportés/],['etfIE00BYTRR863','2016','12',/lancée le 29 avril 2016/]]) {
  await page.goto(`${base}/calculateur-investissement?asset=${id}`,{waitUntil:'networkidle'})
  const picker=page.getByRole('group',{name:'Choisir un actif',exact:true})
  if(await picker.getAttribute('data-value')!==id)await choose(picker,id)
  if(id==='etfIE00BYTRR863'){
   await choose(page.getByRole('group',{name:'Année de départ',exact:true}),'2015')
   await choose(page.getByRole('group',{name:'Mois de départ',exact:true}),'12')
  }
  await page.getByText(reason).first().waitFor()
  assert(await button().count()===0||await button().isDisabled(),'A refused window cannot export a PNG')
  await page.screenshot({path:`${folder}/${id}-refus.png`,fullPage:true})
  await choose(page.getByRole('group',{name:'Année de départ',exact:true}),startYear)
  await choose(page.getByRole('group',{name:'Mois de départ',exact:true}),startMonth)
  await png(`${id}-fenetre-valide`)
 }
 for(const id of ['aerospace-paris-eur','gold-invesco-usd','soxx']) {
  await page.goto(`${base}/calculateur-investissement?asset=${id}`,{waitUntil:'networkidle'})
  if(id==='soxx')assert((await page.locator('body').innerText()).includes('hors dividendes'))
  await png(`${id}-calculateur`)
 }
 await page.goto(`${base}/performance-depuis?asset=aerospace-paris-eur`,{waitUntil:'networkidle'})
 assert.equal(await page.locator('#subject-select').getAttribute('data-value'),'aerospace-paris-eur')
 assert((await page.locator('body').innerText()).includes('EUR'))
 await page.screenshot({path:`${folder}/aerospace-performance.png`,fullPage:true})
 assert.deepEqual(errors,[])
 await writeFile(`${folder}/resultats.json`,JSON.stringify({results,errors,checked:['refus fenêtres non qualifiées','conservation fenêtres valides','cotation Paris EUR distincte','or Londres USD distinct','SOXX hors dividendes','performance depuis EUR']},null,2))
 console.log(results.length,'PNG, refus ciblés, reprises et aucune erreur navigateur')
} finally {await browser?.close();server.kill()}
