import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { TOOLS } from '../src/tools.js'

const base = 'http://127.0.0.1:4324/shinny-potato'
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4324', '--strictPort'], { stdio: 'ignore' })
const formats = [
  ['/fiche-lexique', 'Fiche lexique', 'Fiche lexique'],
  ['/comparatif-etf', 'Comparatif ETF', 'Comparatif ETF'],
  ['/il-y-a-x-ans', 'Il y a X ans', 'Il y a X ans'],
  ['/performance-depuis', 'Performance depuis', 'Performance depuis'],
  ['/pouvoir-achat', 'Pouvoir d’achat', "Pouvoir d'achat"],
  ['/dilemme', 'Dilemme', 'Dilemme'],
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
  assert.equal(await page.locator('.workspace-tool-card').count(), TOOLS.length)
  assert.equal(await page.getByRole('link', {name:/Vrai ou faux|Cas concrets|Comparateur indices/}).count(), 0)
  assert.equal(await page.locator('.workspace-tool-card[href$="/tweet-midi"]').count(), 0)
  for (const [path, day] of [
    ['/comparatif-etf', 'Lundi midi · alternance'], ['/fiche-lexique', 'Lundi midi · alternance'],
    ['/tweets-factsheets', 'Lundi soir'],
    ['/france-100-menages', 'Mardi midi'], ['/generateur-portefeuilles', 'Mardi soir'],
    ['/analyse-entreprise', 'Mercredi midi'], ['/calculateur-investissement', 'Mercredi soir'],
    ['/duels-portefeuilles', 'Jeudi midi'], ['/fiches-etf', 'Jeudi soir'],
    ['/presentations', 'Vendredi midi · alternance'],
    ['/portefeuilles-investisseurs', 'Dimanche midi'], ['/faits-marquants-marches', 'Dimanche soir'],
    ['/il-y-a-x-ans', 'Publication ponctuelle'], ['/performance-depuis', 'Publication ponctuelle'],
    ['/pouvoir-achat', 'Publication ponctuelle'], ['/dilemme', 'Publication ponctuelle'],
    ['/comparatif-courtiers', 'Publication ponctuelle'], ['/impact-frais', 'Publication ponctuelle'],
  ]) assert.equal(await page.locator(`.workspace-tool-card[href$="${path}"] .workspace-publication-day`).innerText(), day)
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
  for (const tool of TOOLS.filter(tool => /^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)/.test(tool.publicationDay ?? ''))) {
    const row = page.locator('.home-day').filter({ has: page.locator(`.workspace-tool-card[href$="${tool.to}"]`) })
    assert.equal(await row.locator('.home-day-band h2').innerText(), tool.publicationDay.split(' ')[0])
  }
  assert.equal(new Set(await page.locator('.workspace-tool-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')))).size, TOOLS.length)
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
