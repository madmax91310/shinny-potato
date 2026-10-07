import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFile, mkdir } from 'node:fs/promises'
import { ETFS } from '../src/data/etf-cards.js'
import { choose } from './card-selection.mjs'
import { commodityAllocationLines } from '../src/data/commodity-allocation.js'
const port = 4339
const base = `http://localhost:${port}/shinny-potato`
const server = spawn('node', ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)], { stdio: 'ignore' })
let browser
try {
 for (let i=0;i<100;i++) {
  try { if ((await fetch(`${base}/`)).ok) break } catch {}
  await new Promise(r=>setTimeout(r,100))
 }
 browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args:['--no-sandbox'] })
 const context = await browser.newContext({ permissions:['clipboard-read','clipboard-write'], viewport:{width:390,height:844} })
 const page = await context.newPage()
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await mkdir('test-artifacts/commodities',{recursive:true})
 for (const isin of ['IE00BD6FTQ80','IE00BDFL4P12']) {
  await page.goto(`${base}/fiches-etf`,{waitUntil:'networkidle'})
  const etf = ETFS.find(e=>e.isin===isin)
  const picker=page.locator('.asset-picker').first()
  await picker.getByRole('searchbox').fill(isin)
  await choose(picker,etf.id)
  await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
  const section=page.locator('.es-block').filter({hasText:'Matières premières de l’indice suivi'})
  await section.waitFor()
  for (const line of commodityAllocationLines(isin)) assert((await section.innerText()).includes(line),line)
  await page.getByRole('button',{name:'📋 Copier le texte',exact:true}).click()
  const copied=await page.evaluate(()=>navigator.clipboard.readText())
  for (const line of commodityAllocationLines(isin)) assert(copied.includes(line))
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.screenshot({path:`test-artifacts/commodities/${isin}.png`,fullPage:true})
  await page.goto(`${base}/bibliotheque-donnees?q=${isin}&id=${isin}`,{waitUntil:'networkidle'})
  const field=page.locator('.ds-field').filter({has:page.getByRole('heading',{name:'Allocation matières premières de l’indice suivi',exact:true})})
  await field.waitFor()
  assert((await field.innerText()).includes('2026-08-31'))
  assert((await field.locator('a').allTextContents()).some(x=>x.includes('IE00BD6FTQ80_factsheet_en.pdf')))
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Exporter la fiche JSON'}).click()])
  const data=JSON.parse(await readFile(await download.path(),'utf8'))
  const allocation=data.fields.find(f=>f.label==='Allocation matières premières de l’indice suivi')
  assert.equal(allocation.value.length,7);assert.equal(allocation.value.at(-1).weightPct,-.01)
 }
 assert.deepEqual(errors,[])
 console.log('Commodity allocations: mobile cards, copied text, dated provenance and JSON exports verified for both exact shares.')
} finally { await browser?.close();server.kill() }
