import {choose} from './card-selection.mjs'
import { getDuelArt } from '../src/pages/portfolio-duels/visualIdentity.js'
import { existsSync } from 'node:fs'
import { euroReturn } from '../src/data/duel-assets.js'
import assert from 'node:assert/strict'
import { RESOURCE_COMPARISONS, RESOURCE_DUEL_CHOICES } from '../src/data/resource-selections.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { ASSETS } from '../src/data/portfolio-assets.js'
import MONTHLY_DUEL_RETURNS from '../src/data/monthly-duel-returns.json' with { type: 'json' }
import { buildTweetText } from '../src/pages/etf-tweets/lib/tweetFormat.js'
import { getComparisonYears } from '../src/pages/tweet-midi/comparisonPerformance.js'
import { buildSheet, buildTweet } from '../src/pages/practical-sheets/lib.js'
import { buildDuel, CATALOG } from '../src/pages/portfolio-duels/lib.js'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { PROFILES } from '../src/pages/dca-profiles/data.js'
for (const c of RESOURCE_COMPARISONS) {
 const theme=DEFAULT_THEMES.find(t=>t.id===c.id), tweet=buildTweetText(theme)
 assert(tweet.includes(c.cloture),c.id)
 assert(!/non renseign|undefined|NaN/.test(tweet),c.id)
 assert.equal(getComparisonYears(c.funds).length,3)
 for(const isin of c.funds) {
  assert(tweet.includes(isin));assert(AUTOMATED_ETF[isin].performance.sourceUrl ?? AUTOMATED_ETF[isin].sourceUrl)
  assert(AUTOMATED_ETF[isin].characteristics.checkedAt)
 }
 const sheet=buildSheet(c.id);assert(!sheet.blocked)
 assert.equal(sheet.columns.length,c.funds.length);assert(buildTweet(sheet).includes(c.cloture))
}
const newDuels=DUELS.filter(d=>d.id.startsWith('world-resource-')||['world-platinum-palladium','world-timber-agriculture'].includes(d.id))
assert.equal(newDuels.length,8)
for(const d of newDuels) {const result=buildDuel(d);assert(result.years.length>=3);assert(Number.isFinite(result.a.final));assert(Number.isFinite(result.b.final))}
for(const [id,isin] of RESOURCE_DUEL_CHOICES) {
 const item=CATALOG.find(a=>a.id===id);assert.equal(item.isin,isin)
 const art=getDuelArt(item);assert(art.scene);assert(existsSync('public/asset-art/'+art.scene),id)
 // An ETC the Générateur already serves through its automated market-price history shares that
 // exact-share series with the duel; every other resource duel keeps the issuer NAV performance.
 const sharedManual=ASSETS.some(a=>a.id===`manual-${isin}`&&a.automatedManual)
 assert.equal(item.basis==='market-price',sharedManual,id)
 assert.equal(item.calendarReturns[2025],sharedManual?MONTHLY_DUEL_RETURNS[isin].years[2025]:AUTOMATED_ETF[isin].performance.years[2025])
 assert.notEqual(euroReturn(item,2025),item.calendarReturns[2025],'USD must use verified FX')
}
for(const key of ['water','timber','agribusiness'])assert(PROFILES.some(p=>p.lines.some(l=>l.asset===key)))
console.log('Resources: automatic ISIN fields, complete common years, 8 duels, verified FX, practical sheets and 100 DCA profiles checked.')
if(process.argv.includes('--browser')) {
 const {spawn}=await import('node:child_process'),{mkdir,writeFile}=await import('node:fs/promises'),{chromium}=await import('playwright')
 const base='http://127.0.0.1:4397/shinny-potato/',dir='test-artifacts/resource-selections'
 const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4397'],{stdio:'ignore'})
 let browser
 try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message));await mkdir(dir,{recursive:true})
  for(const c of RESOURCE_COMPARISONS) {
   await page.goto(base+'comparatif-etf');await choose(page.locator('#subject-select'),c.id);await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
   assert((await page.locator('.tool-preview pre').textContent()).includes(c.funds[0]))
   const result=await page.evaluate(async id=>{
    const {DEFAULT_THEMES}=await import('/shinny-potato/src/data/etf-themes.js')
    const {renderComparatifEtfImage}=await import('/shinny-potato/src/pages/tweet-midi/comparatifEtfImage.js')
    const labels=[],original=CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText=function(value,...args){labels.push([this.canvas,String(value)]);return original.call(this,value,...args)}
    try {
     const canvas=await renderComparatifEtfImage(DEFAULT_THEMES.find(t=>t.id===id))
     const words=labels.filter(([c])=>c===canvas).map(([,label])=>label)
     if(words.some(word=>/Non disponible|N\/D/.test(word)))throw Error('Missing value in resource image')
     if(id!=='water-timber-agriculture'&&words.some(word=>/PRINCIPAUX PAYS|PRINCIPAUX SECTEURS/.test(word)))throw Error('Equity composition shown for a commodity ETC')
     return canvas.toDataURL('image/png')
    }finally{CanvasRenderingContext2D.prototype.fillText=original}
   },c.id)
   await writeFile(`${dir}/${c.id}-comparison.png`,Buffer.from(result.split(',')[1],'base64'))
   await page.goto(base+'fiches-pratiques?fiche='+c.id)
   assert((await page.locator('#practical-tweet').inputValue()).includes(c.cloture))
   await page.screenshot({path:`${dir}/${c.id}-practical.png`,fullPage:true})
  }
  await page.goto(base+'duels-portefeuilles')
  for(const d of newDuels) {await page.locator(`#pd-select [data-option][data-value="${DUELS.indexOf(d)}"]`).click();assert((await page.locator('#pd-tweet').inputValue()).length>100)}
  for(const id of ['thomas','audrey','lucie','alice']) {
   await page.goto(base+'le-dca-de');await page.getByRole('button',{name:'Le DCA d’un abonné',exact:true}).click();await page.locator('.dca-prepared summary').first().click();await page.getByRole('group',{name:'Choisir un profil DCA',exact:true}).locator(`[data-option][data-value="${id}"]`).click()
   assert((await page.locator('#dca-draft').inputValue()).includes(PROFILES.find(p=>p.id===id).lines.find(l=>['timber','agribusiness'].includes(l.asset)).label))
  }
  assert.deepEqual(errors,[])
  console.log('Browser: 3 comparisons and PNG exports, 3 practical sheets, 8 duels and 4 DCA profiles exercised.')
 }finally{await browser?.close();server.kill()}
}
