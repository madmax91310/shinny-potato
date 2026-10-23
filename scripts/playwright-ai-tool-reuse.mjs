import assert from 'node:assert/strict'
import {mkdirSync,readFileSync} from 'node:fs'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {choose} from './card-selection.mjs'
import {ASSETS as PERFORMANCE_ASSETS} from '../src/pages/tweet-midi/data/performanceHistory.js'
import {qualifiedYearWindow} from '../src/pages/performance-rankings/selection-windows.js'
import {ASSETS} from '../src/data/market-history.js'
import {ALL_CATEGORIES,RANKING_ASSETS,ANNUAL_ASSETS} from '../src/pages/performance-rankings/data.js'
import {comparisonFamily,COMPARISON_FAMILIES} from '../src/pages/performance-rankings/comparisonCatalog.js'
const report=JSON.parse(readFileSync('docs/ai-tools-matrix.json'))
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4395/shinny-potato'
const server=process.env.TEST_BASE_URL?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4395'],{stdio:'ignore'})
mkdirSync('/tmp/ai-tool-reuse-browser',{recursive:true})
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true})
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 const png=async(name)=>{
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  await page.locator('.publication-image-stage img').waitFor({state:'visible',timeout:60000})
  assert((await page.locator('.publication-image-stage img').getAttribute('src')).startsWith('data:image/png'))
  await page.screenshot({path:`/tmp/ai-tool-reuse-browser/${name}.png`})
  const download=page.waitForEvent('download')
  await page.getByRole('button',{name:'Télécharger cet aperçu',exact:true}).click()
  const file=await download;assert.equal(await file.failure(),null);await file.saveAs(`/tmp/ai-tool-reuse-browser/${name}-export.png`)
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
 }
 for(const route of ['performance-depuis','calculateur-investissement','il-y-a-x-ans']){
  await page.goto(`${base}/${route}`,{waitUntil:'networkidle'})
  const picker=route==='calculateur-investissement'?page.getByRole('group',{name:'Choisir un actif',exact:true}):page.locator('#subject-select')
  await picker.waitFor()
  for(const row of report.matrix){
   const history=row.after.history[0]
   const id=route==='performance-depuis'?(row.after.performanceSources.find(a=>a.id===history.id)??row.after.performanceSources[0]).id:history.id
   await choose(picker,id)
   if(route==='calculateur-investissement'){
    const window=history.qualifiedRanges.at(-1)
    await choose(page.getByRole('group',{name:'Année de départ',exact:true}),window.start.slice(0,4))
    await choose(page.getByRole('group',{name:'Mois de départ',exact:true}),String(Number(window.start.slice(5))))
    assert.equal(await page.getByRole('alert').count(),0,`${id}: compatible period must remain operational`)
   }
   if(route!=='calculateur-investissement'){
    await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
    await page.waitForFunction(label=>document.querySelector('pre')?.textContent.includes(label),(route==='performance-depuis'?PERFORMANCE_ASSETS:ASSETS)[id].label)
    assert(!/NaN|undefined|\[à saisir\]/.test(await page.locator('pre').innerText()),`${route}/${id}`)
   }else{assert(!/NaN|undefined/.test(await page.locator('body').innerText()))}
   if(['nebius','saab-b','etfIE00B53SZB19','etfIE00B3RBWM25','etfIE00B4ND3602'].includes(id))await png(`${route}-${id}`)
  }
  await page.setViewportSize({width:390,height:844})
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route}: mobile overflow`)
  await page.screenshot({path:`/tmp/ai-tool-reuse-browser/${route}-mobile.png`})
  await page.setViewportSize({width:1440,height:1000})
  console.log(`Browser: ${route}, all 29 selections and representative PNG downloads.`)
 }
 await page.goto(`${base}/classements-performances`,{waitUntil:'networkidle'})
 for(const p of report.profiles){
  const category=ALL_CATEGORIES.find(c=>c.id===p.id),family=comparisonFamily(category,{...RANKING_ASSETS,...ANNUAL_ASSETS})
  await page.getByRole('button',{name:'Présentation actuelle',exact:true}).click()
  await page.getByRole('button',{name:COMPARISON_FAMILIES.find(f=>f.id===family).label,exact:true}).click()
  const picker=page.getByRole('group',{name:'Catégorie',exact:true})
  await picker.locator(`[data-option][data-value="${p.id}"]`).click()
  await page.getByRole('button',{name:'Période libre',exact:true}).click()
  await page.getByLabel('Début, fin de mois',{exact:true}).fill(p.periodWindow.start)
  await page.getByLabel('Fin, fin de mois',{exact:true}).fill(p.periodWindow.end)
  assert.equal(await page.getByRole('alert').count(),0,`${p.id}: qualified current period`)
  assert(!/NaN|undefined/.test(await page.getByLabel('Texte à publier',{exact:true}).inputValue()))
  if(['ai-infrastructure','cyber-etf-stocks','world-gold-products'].includes(p.id))await png(`rankings-${p.id}`)
  await page.getByRole('button',{name:'Classement annuel',exact:true}).click()
  await page.getByRole('button',{name:'Année par année',exact:true}).click()
  const years=p.annualWindow.length?p.annualWindow:qualifiedYearWindow(p.coverage.years,1,7)
  if(years.length){
   await choose(page.getByRole('group',{name:'Première année',exact:true}),years[0])
   await choose(page.getByRole('group',{name:'Dernière année',exact:true}),years.at(-1))
  }
  if(p.modes.annual){
   assert.equal(await page.locator('.rk-annual-table tbody tr').count(),p.ids.length)
   const download=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger l’image',exact:true}).click()
   const file=await download;assert.equal(await file.failure(),null);await file.saveAs(`/tmp/ai-tool-reuse-browser/annual-${p.id}.png`)
  }else{
   assert.match(await page.locator('body').innerText(),/au moins 2 années civiles complètes communes/)
   assert(await page.getByRole('button',{name:'Télécharger l’image',exact:true}).isDisabled())
  }
 }
 await page.setViewportSize({width:390,height:844})
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'rankings mobile overflow')
 await page.screenshot({path:'/tmp/ai-tool-reuse-browser/rankings-mobile.png'})
 assert.deepEqual(errors,[])
 console.log('Browser: all 16 comparison profiles, both presentations, annual blockers, downloads and mobile verified.')
}finally{await browser?.close();server?.kill()}
