import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { HOME_TOOLS } from '../src/tools.js'
import { checkCobaltHome } from './check-cobalt-home.mjs'

// BASE_URL also exercises the actual public artifact after deployment.
const base = (process.env.BASE_URL ?? 'http://127.0.0.1:4338/shinny-potato').replace(/\/$/, '')
const server = process.env.BASE_URL ? null : spawn('node', ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4338','--strictPort'], {stdio:'ignore'})
let browser
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${base}/`)).ok) break } catch { /* starting */ }
    assert(attempt < 100, 'Site unavailable')
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})
  const page = await browser.newPage({viewport:{width:390,height:844}})
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/`, {waitUntil:'networkidle'})
  await checkCobaltHome(page)
  await page.setViewportSize({width:390,height:844})
  const search = page.getByRole('searchbox',{name:'Rechercher un outil',exact:true})
  for (const [query, path] of [['generateur','/generateur-portefeuilles'],['GÉNÉRATEUR','/generateur-portefeuilles'],['recouvrement','/le-dca-de']]) {
    await search.fill(query)
    assert.equal(await page.locator('.workspace-tool-card').count(),1)
    assert((await page.locator('.workspace-tool-card').getAttribute('href')).endsWith(path))
  }
  await search.fill('zzzzzz')
  assert.equal(await page.locator('.workspace-tool-card').count(),0)
  assert.match(await page.getByRole('status').innerText(), /0 outil/)
  await page.getByRole('button',{name:'Effacer',exact:true}).click()
  assert.equal(await page.locator('.workspace-tool-card').count(), HOME_TOOLS.length)
  // Favoriting moves a tool into the favorites group without duplicating it.
  const favorite = page.getByRole('button',{name:'Favori : Impact des frais',exact:true})
  await favorite.click()
  assert.equal(await page.locator('.home-favorites a[href$="/impact-frais"]').count(),1)
  await page.reload({waitUntil:'networkidle'})
  assert.equal(await favorite.getAttribute('aria-pressed'),'true')
  await favorite.focus()
  await page.keyboard.press('Enter')
  // The application restores focus in requestAnimationFrame after regrouping.
  // Assert the same real focus condition after that render, not before it.
  await expect(favorite).toBeFocused()
  await page.reload({waitUntil:'networkidle'})
  assert.equal(await favorite.getAttribute('aria-pressed'),'false')
  await page.getByRole('button',{name:'Calendrier',exact:true}).click()
  await page.reload({waitUntil:'networkidle'})
  assert.equal(await page.getByRole('button',{name:'Calendrier',exact:true}).getAttribute('aria-pressed'),'true')
  // Roving keyboard tabs: arrows wrap and Home/End select the endpoints.
  await page.getByRole('tab').first().click()
  await page.keyboard.press('ArrowLeft')
  assert.equal(await page.getByRole('tab',{selected:true}).getAttribute('id'),'home-tab-6')
  await page.keyboard.press('Home')
  assert.equal(await page.getByRole('tab',{selected:true}).getAttribute('id'),'home-tab-0')
  await page.keyboard.press('End')
  assert.equal(await page.getByRole('tab',{selected:true}).getAttribute('id'),'home-tab-6')
  await page.getByRole('tab',{name:/^Jeudi/}).click()
  await page.locator('.workspace-tool-card[href*="category=Guide"]').click()
  const categories = page.locator('.tb-chiprow').filter({has:page.getByRole('button',{name:'Toutes catégories',exact:true})})
  await categories.getByRole('button',{name:'Guide ETF',exact:true}).waitFor()
  assert.equal(await categories.locator('.tb-chip.active').innerText(),'Guide ETF')
  assert(await page.locator('.tb-tweet').count() > 0)
  assert((await page.locator('.tb-tag-cat').allTextContents()).every(text => text === 'Guide ETF'))
  await page.reload({waitUntil:'networkidle'})
  assert.equal(await categories.locator('.tb-chip.active').innerText(),'Guide ETF')
  await categories.getByRole('button',{name:'Toutes catégories',exact:true}).click()
  assert.equal(await categories.locator('.tb-chip.active').innerText(),'Toutes catégories')
  await page.getByRole('link',{name:'← Tous les outils',exact:true}).click()
  await page.getByRole('button',{name:'Calendrier',exact:true}).click()
  await page.getByRole('tab',{name:/^Mardi/}).click()
  await page.locator('.workspace-tool-card[href$="?mode=dca"]').click()
  await page.getByRole('heading',{name:'Le DCA d’un abonné',level:1,exact:true}).waitFor()
  assert.equal(new URL(page.url()).searchParams.get('mode'),'dca')
  await page.getByRole('link',{name:'← Tous les outils',exact:true}).click()
  await page.locator('.home-overview').waitFor()
  assert.equal(await page.locator('.workspace-tool-card').count(), HOME_TOOLS.length)
  await page.locator('.workspace-tool-card[href$="/impact-frais"]').click()
  await page.getByRole('heading',{name:'Impact des frais',exact:true,level:1}).waitFor()
  await page.getByRole('link',{name:'← Tous les outils',exact:true}).click()
  await page.locator('.home-overview').waitFor()
  await page.getByRole('button',{name:'Calendrier',exact:true}).click()
  await page.reload({waitUntil:'networkidle'})
  assert.equal(await page.getByRole('button',{name:'Calendrier',exact:true}).getAttribute('aria-pressed'),'true', 'Return to all tools must not pin future reloads to overview')
  await mkdir('test-artifacts/cobalt-home',{recursive:true})
  for (const width of [320,390,768,1280]) {
    await page.setViewportSize({width,height:844})
    await page.getByRole('button',{name:'Vue d’ensemble',exact:true}).click()
    await page.evaluate(() => scrollTo(0,0))
    await page.screenshot({path:`test-artifacts/cobalt-home/overview-${width}.png`,fullPage:true})
    await page.evaluate(() => scrollTo(0,document.body.scrollHeight))
    for (const selector of ['.home-view-switch','.home-search']) {
      const rect = await page.locator(selector).boundingBox()
      assert(rect.y >= 0 && rect.y + rect.height <= 844, `${width}: sticky controls hidden`)
    }
    // Browser scrolling to a keyboard target must account for the sticky bar.
    const last = page.locator('.workspace-tool-card').last()
    await last.focus()
    await page.keyboard.press('Shift+Tab')
    const target = await page.evaluate(() => {
      const box = document.activeElement.getBoundingClientRect()
      return {top:box.top,bottom:box.bottom,toolbar:document.querySelector('.home-toolbar').getBoundingClientRect().bottom,outline:getComputedStyle(document.activeElement).outlineStyle}
    })
    assert(target.top >= target.toolbar && target.bottom <= 844, `${width}: focus obscured`)
    assert.notEqual(target.outline,'none',`${width}: keyboard focus invisible`)
    await page.getByRole('button',{name:'Calendrier',exact:true}).click()
    await page.getByRole('tab',{name:/^Dimanche/}).click()
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.evaluate(() => scrollTo(0,0))
    await page.screenshot({path:`test-artifacts/cobalt-home/calendar-${width}.png`,fullPage:true})
  }
  // Enlarged text must grow cards instead of clipping long titles or dates.
  await page.getByRole('button',{name:'Vue d’ensemble',exact:true}).click()
  await page.setViewportSize({width:320,height:568})
  const large = await page.addStyleTag({content:'.workspace--home .workspace-tool-card h2 {font-size:20px!important} .workspace--home .workspace-publication-day {font-size:15px!important}'})
  assert.deepEqual(await page.locator('.workspace-tool-card').evaluateAll(cards => cards.filter(card => card.scrollHeight > card.clientHeight || card.scrollWidth > card.clientWidth).map(card => card.textContent)),[])
  await large.evaluate(node => node.remove())
  // Denied, corrupt, and stale preference values must never break navigation.
  for (const fixture of ['denied','corrupt','stale']) {
    const context = await browser.newContext()
    await context.addInitScript(kind => {
      if (kind === 'denied') {
        Object.defineProperty(Storage.prototype,'getItem',{value(){throw new DOMException('blocked','SecurityError')}})
        Object.defineProperty(Storage.prototype,'setItem',{value(){throw new DOMException('blocked','QuotaExceededError')}})
      } else {
        localStorage.setItem('epargnant-libre:home-view', kind === 'corrupt' ? '{' : JSON.stringify('unknown'))
        localStorage.setItem('epargnant-libre:home-favorites',kind === 'corrupt' ? '{' : JSON.stringify(['/dilemme','/impact-frais','/impact-frais','/removed']))
      }
    }, fixture)
    const isolated = await context.newPage()
    isolated.on('pageerror', error => errors.push(error.message))
    await isolated.goto(`${base}/`,{waitUntil:'networkidle'})
    assert.equal(await isolated.locator('.workspace-tool-card').count(), HOME_TOOLS.length)
    await isolated.getByRole('button',{name:'Calendrier',exact:true}).click()
    await isolated.getByRole('tab',{name:/^Lundi/}).click()
    await isolated.getByRole('button',{name:'Vue d’ensemble',exact:true}).click()
    await isolated.getByRole('button',{name:'Favori : Impact des frais',exact:true}).click()
    assert.equal(await isolated.locator('.workspace-tool-card').count(), HOME_TOOLS.length)
    await context.close()
  }
  assert.deepEqual(errors,[])
  console.log(`Cobalt home OK: ${base}; registry, seven days, exact hrefs, search, preferences, storage failures, keyboard, sticky controls, four widths and real tools.`)
} finally {
  await browser?.close()
  server?.kill('SIGTERM')
}
