import { choose } from './card-selection.mjs'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '4314'], {stdio:'ignore'})
const base='http://localhost:4314/shinny-potato'
let browser
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{};await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH})
 const page=await browser.newPage({viewport:{width:390,height:844}})
 const errors=[];page.on('pageerror', e=>errors.push(e.message))
 await mkdir('test-artifacts/studio',{recursive:true})
 for(const route of ['fiches-etf','generateur-portefeuilles','duels-portefeuilles','portefeuilles-investisseurs','france-100-menages','impact-frais','calculateur-investissement','tweets-factsheets','comparatif-courtiers']) {
  await page.goto(`${base}/${route}`,{waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  const panel=page.getByRole('tabpanel')
  await panel.locator('img,canvas').first().waitFor()
  await page.waitForFunction(()=>{const panel=document.querySelector('[role=tabpanel]:not([hidden])');const img=panel?.querySelector('img');const canvas=panel?.querySelector('canvas');return img?img.complete&&img.naturalWidth>0:canvas?.width>300})
  assert.equal(await panel.locator('[role=alert]').count(),0,route)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow')
  const bar=page.getByRole('group',{name:'Actions de publication'})
  assert(await bar.isVisible(),route+' missing actions')
  assert(await bar.locator('button,a').count()>=2,route+' missing copy/export')
  let box=await bar.boundingBox();assert(box.y>=0&&box.y+box.height<=844,route+' off-screen actions')
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));box=await bar.boundingBox();assert(box.y>=0&&box.y+box.height<=844,route+' scrolled actions')
  await page.screenshot({path:`test-artifacts/studio/${route}-mobile.png`})
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
  assert(await panel.isVisible())
 }
 for (const format of ['Comparatif ETF','Il y a X ans','Performance depuis',"Pouvoir d'achat"]) {
  await page.goto(`${base}/tweet-midi`,{waitUntil:'networkidle'})
  await page.getByRole('button',{name:format,exact:true}).click()
  await page.getByRole('button',{name:/Générer/,exact:false}).click()
  await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  if(format==='Il y a X ans') {
   await page.getByRole('tab',{name:'Image',exact:true}).click()
   // Observations automatiques fraîches ou saisie vérifiée si indisponibles.
   await page.getByRole('tab',{name:'Texte',exact:true}).click()
   for(const input of await page.locator('[id^=niveau-actuel]').all()) await input.fill('10000')
  }
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  await page.waitForFunction(()=>{const img=document.querySelector('.publication-image-stage img');return img?.complete&&img.naturalWidth>0})
  assert.equal(await page.getByRole('alert').count(),0,format)
 }
 // A written draft must survive tab switching and a slow image must follow the latest selection.
 await page.goto(`${base}/tweets-factsheets`,{waitUntil:'networkidle'})
 await page.getByRole('button',{name:'Aperçu',exact:true}).click()
 await page.locator('#factsheet-draft').fill('Mon brouillon conservé')
 await page.getByRole('tab',{name:'Image',exact:true}).click()
 await page.getByRole('tabpanel').locator('img').waitFor()
 await page.getByRole('tab',{name:'Texte',exact:true}).focus();await page.keyboard.press('Enter')
 assert.equal(await page.locator('#factsheet-draft').inputValue(),'Mon brouillon conservé')
 await page.getByRole('tab',{name:'Texte',exact:true}).focus();await page.keyboard.press('ArrowRight')
 assert.equal(await page.getByRole('tab',{name:'Image',exact:true}).getAttribute('aria-selected'),'true')
 await page.goto(`${base}/fiches-etf`,{waitUntil:'networkidle'})
 await page.getByRole('button',{name:'Aperçu',exact:true}).click();await page.getByRole('tab',{name:'Image',exact:true}).click()
 const img=page.getByRole('tabpanel').locator('img');await img.waitFor();const before=await img.getAttribute('src')
 await page.getByRole('button',{name:'Réglages',exact:true}).click();await choose(page.locator('#es-etf-select'), 'msci-world')
 await page.getByRole('button',{name:'Aperçu',exact:true}).click()
 await page.waitForFunction(previous=>document.querySelector('.publication-image-stage img')?.src!==previous&&document.querySelector('.publication-image-stage img')?.complete,before)
 const [download] = await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger l’image',exact:true}).click()])
 assert.equal(download.suggestedFilename(),'msci-world-fiche-etf.png')
 await page.locator('.workspace-action-menu summary').click()
 await page.getByRole('button',{name:/Image récapitulative/}).waitFor()
 await page.keyboard.press('Escape')
 assert.equal(await page.locator('.workspace-action-menu').getAttribute('open'),null)
 await page.setViewportSize({width:1440,height:900})
 assert.equal(await page.locator('.es-preparation').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(20, 28, 41)')
 await page.screenshot({path:'test-artifacts/studio/etf-desktop.png',fullPage:true})
 assert.deepEqual(errors,[])
 console.log('Studio: 14 image formats, direct PNG download, secondary menu, dark panels, mobile overflow, persistent actions, keyboard tabs, preserved drafts and refreshed images OK.')
} finally {await browser?.close();server.kill('SIGTERM')}
