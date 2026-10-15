import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
const base='http://127.0.0.1:4357/shinny-potato'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4357'],{stdio:'ignore'})
let browser
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH})
 await mkdir('test-artifacts/portfolio-roadmap',{recursive:true})
 for(const width of [390,1280]) {
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}/duels-portefeuilles`,{waitUntil:'networkidle'})
  const preview=page.locator('.workspace-view-switch').getByRole('button',{name:'Aperçu',exact:true})
  if(await preview.isVisible())await preview.click()
  const comparison=page.getByText('Comparer les expositions actuelles de A et B',{exact:true})
  await comparison.waitFor()
  await comparison.click()
  await page.getByText(/Ces compositions actuelles expliquent/).waitFor()
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false)
  await page.screenshot({path:`test-artifacts/portfolio-roadmap/duel-${width}.png`,fullPage:true})
  await page.goto(`${base}/generateur-portefeuilles`,{waitUntil:'networkidle'})
  const generatorPreview=page.locator('.workspace-view-switch').getByRole('button',{name:'Réglages',exact:true})
  if(await generatorPreview.isVisible())await generatorPreview.click()
  await page.locator('.pg-alloc-list').waitFor()
  const history=page.getByRole('link',{name:'Performance de cette part'}).first()
  if(await history.count()) {await history.click();await page.locator('pre').waitFor();assert.match(page.url(),/performance-depuis/)}
  assert.deepEqual(errors,[])
  await page.close()
 }
 console.log('Portefeuilles : comparaison des expositions et liens historiques, mobile et bureau OK.')
} finally {await browser?.close();server.kill()}
