import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { TOOLS } from '../src/tools.js'
import { EDITORIAL_WEEK } from '../src/data/editorial-calendar.js'

const base = 'http://127.0.0.1:4324/shinny-potato'
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4324', '--strictPort'], { stdio: 'ignore' })
const formats = [
  ['/fiche-lexique', 'Fiche lexique', 'Fiche lexique'],
  ['/comparatif-etf', 'Comparatif ETF', 'Comparatif ETF'],
  ['/il-y-a-x-ans', 'Il y a X ans', 'Il y a X ans'],
  ['/performance-depuis', 'Performance depuis', 'Performance depuis'],
  ['/pouvoir-achat', 'Pouvoir d’achat', "Pouvoir d'achat"],
]
let browser
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${base}/`)).ok) break } catch { /* starting */ }
    assert(attempt < 100, 'Preview server unavailable')
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {})
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  const scheduledEntries = EDITORIAL_WEEK.flatMap(day => [...day.midday, ...day.evening])
  const scheduledPaths = new Set(scheduledEntries.map(entry => entry.path))
  assert.equal(await page.locator('.workspace-tool-card').count(), scheduledEntries.length + TOOLS.filter(t => !t.hidden && !scheduledPaths.has(t.to)).length)
  assert.equal(await page.getByRole('link', {name:/Vrai ou faux|Cas concrets|Comparateur indices|Dilemme/}).count(), 0)
  assert.equal(await page.locator('.workspace-tool-card[href$="/tweet-midi"]').count(), 0)
  for (const [index, midday, evening] of [
    [0, ['/performance-depuis'], ['/tweets-factsheets']],
    [1, ['/calculateur-investissement'], ['/le-dca-de']],
    [2, ['/classements-performances'], ['/comparatif-courtiers']],
    [3, ['/classements-performances'], ['/banque-tweets']],
    [4, ['/fiches-etf'], []],
    [5, [], []],
    [6, ['/portefeuilles-investisseurs'], ['/fiches-pratiques']],
  ]) {
    for (const [period, paths] of [['midday', midday], ['evening', evening]]) {
      const actual = await page.locator(`[data-day="${index}"] [data-period="${period}"] .workspace-tool-card`).evaluateAll(cards => cards.map(card => '/' + new URL(card.href).pathname.split('/').at(-1)))
      assert.deepEqual(actual, paths, `${index}: ${period}`)
    }
  }
  assert.equal(await page.locator('[data-period="evening"] a[href$="/classements-performances"]').count(), 0)
  assert.equal(await page.locator('.home-period').count(), 14)
  assert.equal(await page.locator('.home-week [data-period="midday"] > h3').filter({ hasText: /^Midi$/ }).count(), 7)
  assert.equal(await page.locator('.home-week a[href$="/calculateur-investissement"]').count(), 1)
  assert.equal(await page.locator('[data-day="4"] [data-period="evening"] .home-day-note').innerText(), 'Réservé à ton tweet du vendredi')
  assert.equal(await page.locator('[data-day="5"] [data-period="midday"] .home-day-note').innerText(), 'Ton bilan de la semaine')
  assert.equal(await page.locator('[data-day="5"] [data-period="evening"] .home-day-note').innerText(), 'Quote de ton bilan')
  for (const day of [2, 3]) {
    assert.equal(await page.locator(`[data-day="${day}"] [data-period="midday"] .workspace-tool-card h2`).innerText(), 'Qui a vraiment gagné ?')
  }
  assert.equal(await page.locator('.home-week').getByText(/alternance|alternative|facultatif|matin|récap/i).count(), 0)
  assert.equal(await page.locator('.home-calendar-intro').innerText(), 'Un format par créneau, le midi et le soir.')
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: horizontal overflow`)
    const problems = await page.locator('.workspace-tool-card').evaluateAll(cards => cards.flatMap(card => {
      const title = card.querySelector('h2').getBoundingClientRect()
      const day = card.querySelector('.workspace-publication-day')?.getBoundingClientRect()
      const box = card.getBoundingClientRect()
      return title.bottom > box.bottom || (day && (title.bottom > day.top || day.bottom > box.bottom)) ? [card.textContent] : []
    }))
    assert.deepEqual(problems, [], `${width}: cards cropped or title/day overlap`)
  }
  assert.deepEqual(await page.locator('.home-day-band h2').allTextContents(), ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'])
  assert.equal(new Set(await page.locator('.workspace-tool-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')))).size, TOOLS.filter(t=>!t.hidden).length)
  assert.equal(await page.locator('a[href$="/analyse-entreprise"]').count(), 0, 'Abandoned analysis is absent from home and navigation')
  // Scheduled DCA links open the publication, including after reload. Switching
  // modes updates the URL so browser back restores the selected tool.
  await page.locator('[data-day="1"] [data-period="evening"] .workspace-tool-card').click()
  await page.getByRole('heading', {name:'Le DCA d’un abonné',exact:true,level:1}).waitFor()
  assert.equal(new URL(page.url()).searchParams.get('mode'), 'dca')
  await page.reload({waitUntil:'networkidle'})
  await page.getByRole('heading', {name:'Le DCA d’un abonné',exact:true,level:1}).waitFor()
  await page.getByRole('button', {name:'Analyser une allocation',exact:true}).click()
  await page.getByRole('heading', {name:'Actifs & expositions',exact:true,level:1}).waitFor()
  await page.goBack()
  await page.getByRole('heading', {name:'Le DCA d’un abonné',exact:true,level:1}).waitFor()
  for (const path of ['/classements-performances','/tweets-factsheets','/calculateur-investissement']) {
    const tool=TOOLS.find(item=>item.to===path)
    await page.goto(base+path, {waitUntil:'networkidle'})
    await page.getByRole('heading', {name:tool.title,exact:true,level:1}).waitFor()
    assert.equal(await page.locator('.workspace-sidebar').getByRole('link',{name:tool.title,exact:true,includeHidden:true}).count(),1)
    assert.equal(await page.locator('.workspace-mobile-menu').getByRole('link',{name:tool.title,exact:true,includeHidden:true}).count(),1)
    assert.equal(await page.locator('a[href$="/analyse-entreprise"]').count(),0)
  }
  await page.goto(base+'/',{waitUntil:'networkidle'})
  // Short screens and enlarged text must grow cards instead of overlapping labels.
  for (const [width, height, enlarged] of [[320, 568, false], [360, 640, false], [390, 700, false], [390, 844, true]]) {
    await page.setViewportSize({ width, height })
    const style = enlarged ? await page.addStyleTag({ content: '.workspace--home .workspace-tool-card h2 { font-size: 20px !important; line-height: 1.25 !important; } .workspace--home .workspace-publication-day { font-size: 15px !important; line-height: 1.25 !important; }' }) : null
    const problems = await page.locator('.workspace-tool-card').evaluateAll(cards => cards.flatMap(card => {
      const title = card.querySelector('h2').getBoundingClientRect()
      const day = card.querySelector('.workspace-publication-day')?.getBoundingClientRect()
      const box = card.getBoundingClientRect()
      return title.bottom > box.bottom || (day && (title.bottom > day.top || day.bottom > box.bottom || day.right > box.right)) ? [card.textContent] : []
    }))
    assert.deepEqual(problems, [], `${width}x${height}${enlarged ? ' enlarged text' : ''}: label overlap or clipping`)
    if (style) await style.evaluate(node => node.remove())
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await mkdir('test-artifacts/weekly-publications', { recursive: true })
  await page.screenshot({ path: 'test-artifacts/weekly-publications/home-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.screenshot({ path: 'test-artifacts/weekly-publications/home-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  for (const [path, title, badge] of formats) {
    await page.goto(`${base}/`, { waitUntil: 'networkidle' })
    await page.locator(`.workspace-tool-card[href$="${path}"]`).click()
    await page.getByRole('heading', { name: title, exact: true, level: 1 }).waitFor()
    assert.equal(await page.getByText('Étape 1 — Format', { exact: true }).count(), 0)
    await page.getByRole('button', { name: 'Aperçu', exact: true }).click()
    assert.equal(await page.locator('.tool-preview').getByText(badge, { exact: true }).count(), 1, `${path}: incorrect initial format`)
    await page.getByRole('button', { name: 'Réglages', exact: true }).click()
    await page.getByRole('button', { name: '🔄 Générer', exact: true }).click()
    await page.getByRole('button', { name: 'Aperçu', exact: true }).click()
    assert.equal(await page.locator('.tool-preview').getByText(badge, { exact: true }).count(), 1, `${path}: generation escaped format`)
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: title, exact: true, level: 1 }).waitFor()
  }
  // Switching between routes backed by the same component must remount its state.
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${base}/dilemme`, { waitUntil: 'networkidle' })
  await page.locator('.workspace-sidebar').getByRole('link', { name: 'Comparatif ETF', exact: true }).click()
  await page.getByRole('heading', { name: 'Comparatif ETF', exact: true, level: 1 }).waitFor()
  assert.equal(await page.locator('.tool-preview').getByText('Comparatif ETF', { exact: true }).count(), 1)
  await page.goBack()
  await page.getByRole('heading', { name: 'Dilemme', exact: true, level: 1 }).waitFor()
  assert.equal(await page.locator('.tool-preview').getByText('Dilemme', { exact: true }).count(), 1)
  await page.goto(`${base}/tweet-midi`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Tweet Midi', exact: true, level: 1 }).waitFor()
  assert.equal(await page.getByText('Étape 1 — Format', { exact: true }).count(), 1)
  assert.deepEqual(errors, [])
  console.log('Weekly publications: mobile layout, schedule, six direct formats, generation, reload, shared-route switching and legacy URL OK.')
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
