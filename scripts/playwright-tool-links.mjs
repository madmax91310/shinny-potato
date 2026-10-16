import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { instrumentOption } from '../src/data/asset-selection.js'
import { ETFS } from '../src/data/etf-cards.js'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { CATALOG } from '../src/pages/portfolio-duels/lib.js'
import { ASSETS } from '../src/data/market-history.js'
import links from '../src/data/tool-links.json' with {type:'json'}

const base='http://127.0.0.1:4397/shinny-potato'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4397'],{stdio:'ignore'})
let browser
try {
  for(let i=0;i<100;i++) {try {if((await fetch(base+'/')).ok)break} catch {} await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
  await mkdir('test-artifacts/tool-links',{recursive:true})
  for(const width of [390,1440]) {
    const page=await browser.newPage({viewport:{width,height:950}}), errors=[]
    page.on('pageerror',error=>errors.push(error.message))
    const isin=Object.keys(links).find(isin=>['sheet','comparison','duel','anniversary','simulation','performance'].every(kind=>links[isin].some(l=>l.kind===kind)))
    assert(isin,'Need a support available in every destination')
    const card=ETFS.find(e=>e.isin===isin)
    await page.goto(base+'/')
    await page.evaluate(() => {
      localStorage.setItem('epargnant-publication:v1:etf-sheet',JSON.stringify('sp500'))
      localStorage.setItem('epargnant-publication:v1:duel-mode',JSON.stringify('manual'))
    })
    await page.goto(`${base}/fiches-etf?isin=${isin}`)
    await page.locator('.es-card').waitFor({state:'attached'})
    assert((await page.locator('.es-card').textContent()).includes(isin))
    assert((await page.locator('.es-controls .picker-selection').textContent()).includes(instrumentOption(card).label))
    await page.locator('.asset-tool-links summary').click()
    await page.locator('.asset-tool-links a').first().waitFor()
    const destinations=await page.locator('.asset-tool-links a').count()
    assert.equal(destinations,links[isin].filter(l=>l.kind!=='sheet').length)
    await page.screenshot({path:`test-artifacts/tool-links/sheet-${width}.png`,fullPage:true})
    for(const kind of ['comparison','duel','anniversary','simulation','performance']) {
      const link=links[isin].find(l=>l.kind===kind)
      await page.goto(base+link.href)
      if(kind==='duel') {
        const params=new URL(link.href,'https://test.invalid').searchParams
        await page.locator('#pd-tweet').waitFor({state:'attached'})
        if(params.has('asset')) {
          const id=params.get('asset')
          assert.equal(CATALOG.find(a=>a.id===id)?.isin,isin)
          assert.equal(await page.getByRole('button',{name:'Composer A et B',exact:true}).getAttribute('aria-pressed'),'true')
          assert.equal(await page.getByRole('group',{name:'Actif 1 du portefeuille A',exact:true}).getAttribute('data-value'),id)
        } else {
          assert.equal(await page.locator('#pd-select').getAttribute('data-value'),String(DUELS.findIndex(d=>d.id===params.get('duel'))))
        }
        assert((await page.locator('#pd-tweet').inputValue()).includes(card.name))
        const previewToggle = page.getByRole('button',{name:'Aperçu',exact:true})
        if (await previewToggle.isVisible()) await previewToggle.click()
        await page.getByRole('tab',{name:'Image',exact:true}).click()
        await page.locator('.publication-preview img').first().waitFor({timeout:30000})
        await page.screenshot({path:`test-artifacts/tool-links/duel-${width}.png`,fullPage:true})
      } else if(kind==='comparison') {
        await page.locator('pre').waitFor({state:'attached'})
        assert((await page.locator('pre').textContent()).includes(isin))
      } else if(kind==='anniversary') {
        await page.locator('pre').waitFor({state:'attached'})
        const id=new URL(link.href,'https://test.invalid').searchParams.get('asset')
        assert((await page.locator('pre').textContent()).includes(ASSETS[id].label))
      } else {
        await page.locator('main').waitFor()
        // Current identity in the control must agree with the exact linked support.
        const id=kind==='simulation'?new URL(link.href,'https://test.invalid').searchParams.get('asset'):Object.keys(ASSETS).find(id=>ASSETS[id].isin===isin)
        await page.locator('.picker-selection').first().waitFor({state:'attached'})
        assert((await page.locator('main').textContent()).includes(ASSETS[id].label))
      }
    }
    // A prepared deep link must also override the persisted manual mode.
    const prepared=links[isin].find(l=>l.kind==='duel' && new URL(l.href,'https://test.invalid').searchParams.has('duel'))
    if(prepared) {
      const id=new URL(prepared.href,'https://test.invalid').searchParams.get('duel')
      await page.goto(base+prepared.href)
      assert.equal(await page.locator('#pd-select').getAttribute('data-value'),String(DUELS.findIndex(d=>d.id===id)))
      assert((await page.locator('#pd-tweet').inputValue()).includes(card.name))
    }
    for(const newIsin of ['IE00BSPLC413','IE00BG0SKF03','IE00BCRY6557']) {
      await page.goto(`${base}/fiches-etf?isin=${newIsin}`)
      await page.locator('.es-card').waitFor({state:'attached'})
      assert((await page.locator('.es-card').textContent()).includes(newIsin))
      for(const kind of ['comparison','duel']) {
        const link=links[newIsin].find(row=>row.kind===kind)
        assert(link, `${newIsin}: ${kind}`)
        await page.goto(base+link.href)
        if(kind==='duel') await page.locator('#pd-tweet').waitFor({state:'attached'})
        else { await page.locator('pre').waitFor({state:'attached'}); assert((await page.locator('pre').textContent()).includes(newIsin)) }
      }
    }
    assert.deepEqual(errors,[])
    await page.close()
  }
  console.log('Exact-support navigation: 6 destinations, saved-setting precedence, mobile/desktop and unchanged duel image export passed.')
} finally {await browser?.close();server.kill()}
