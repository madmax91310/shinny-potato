import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'

const port = 4312
const base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(base)).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage()
  await page.goto(base)
  await mkdir('test-artifacts/export-copy', { recursive: true })
  // Stream each result instead of returning hundreds of full PNGs in one
  // Playwright message (which can exceed Node's maximum string size).
  await page.exposeFunction('saveExportCopy', async result => {
    await writeFile(`test-artifacts/export-copy/${result.name}.txt`, result.text)
    if (result.png) await writeFile(`test-artifacts/export-copy/${result.name}.png`, Buffer.from(result.png.split(',')[1], 'base64'))
  })
  const results = await page.evaluate(async () => {
    const module = path => import(`/shinny-potato/src/${path}`)
    const records = []
    let words = []
    const original = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText = function(value, ...args) {
      words.push(String(value)); return original.call(this, value, ...args)
    }
    const check = async (name, render, validate = () => true) => {
      words = []
      const result = await render()
      const png = typeof result === 'string' ? result : result.toDataURL('image/png')
      const text = words.join('\n')
      if (!validate(words, text)) throw new Error(`${name}: unexpected export copy\n${text}`)
      if (words.filter(word => /[ée]pargnant.?libre/i.test(word)).length !== 1) throw new Error(`${name}: signature must appear once`)
      await window.saveExportCopy({ name, text, png: !name.startsWith('etf-') || records.length === 0 ? png : null })
      records.push(name)
    }
    const { ETFS } = await module('data/etf-cards.js')
    const { renderETFImage } = await module('pages/etf-sheets/canvasImage.js')
    const { buildText } = await module('pages/etf-sheets/lib.js')
    for (const etf of ETFS) {
      if (/🆕|Nouveau/.test(buildText(etf))) throw new Error(`New label in tweet: ${etf.id}`)
      await check(`etf-${etf.id}`, () => renderETFImage(etf), (_, text) => !/PRÉSENTATION|Nouveau/.test(text) && text.includes('Pas un conseil en investissement'))

    }
    const { SHEETS } = await module('data/index-factsheets.js')
    const { renderFactsheetImage } = await module('pages/factsheet-tweets/canvasImage.js')
    for (const sheet of SHEETS) await check(`facts-${sheet.id}`, () => renderFactsheetImage(sheet))
    const { FAMILIES } = await module('data/index-comparisons.js')
    const { getIndexComparisonPairs } = await module('data/index-comparison-pairs.js')
    const { renderIndexImage } = await module('pages/index-comparator/imageExport.js')
    for (const family of FAMILIES.flatMap(getIndexComparisonPairs)) await check(`indices-${family.pairId}`, () => renderIndexImage(family), (words) => {
      const dates = family.indices.map(index => index.indexFacts?.asOf)
      return !dates.every(date => date && date === dates[0]) || words.filter(word => word.includes(dates[0].split('-').reverse().join('/'))).length === 1
    })
    const { DEFAULT_THEMES: THEMES } = await module('data/etf-themes.js')
    const { renderComparatifEtfImage } = await module('pages/tweet-midi/comparatifEtfImage.js')
    for (const theme of THEMES) await check(`compare-${theme.id}`, () => renderComparatifEtfImage(theme), (words, text) => !text.includes('COMPARATIF') && !/, CTO/.test(text) )
    const { DUELS } = await module('pages/portfolio-duels/data.js')
    const { buildDuel } = await module('pages/portfolio-duels/lib.js')
    const { renderDuelImage } = await module('pages/portfolio-duels/canvasImage.js')
    for (const definition of DUELS) await check(`duel-${definition.id}`, () => renderDuelImage(buildDuel(definition)), (_, text) => !/DUEL DE PORTEFEUILLES|PIRE ANNÉE|ÉDITION LIBRE/.test(text))
    const { generatePortfolio } = await module('pages/portfolio-generator/engine.js')
    const { renderPortfolioImage } = await module('pages/portfolio-generator/canvasImage.js')
    await check('generator', () => renderPortfolioImage(generatePortfolio([], 'equilibre', 'generaliste')), (words, text) => !words.some(word => /100\s*%/.test(word)) && !/NON PRÉDICTIF|Répartition de|portefeuille|COMPOSITION|…/.test(text))
    const { renderPerformanceImage } = await module('pages/tweet-midi/performanceImage.js')
    await check('performance', () => renderPerformanceImage({mode:'simple', assetId:'msciWorld',year:2016}), (words,text) => !/SÉRIE|Hausse|Baisse|PERFORMANCE DEPUIS|PERFORMANCE CUMULÉE|clôtures annuelles|SANS CONVERSION/.test(text) && words.includes('Le MSCI World') && words.some(word => /^Fin 2015 → Fin \d{4}$/.test(word)) && words.includes('Rendements annuels'))
    const { renderAnniversaryImage } = await module('pages/tweet-midi/anniversaryImage.js')
    await check('anniversary', () => renderAnniversaryImage({mode:'simple',assetId:'bitcoin',yearsBack:5}, '123456'), (words,text) => !text.includes('ÉVOLUTION DU COURS') && words.filter(word => word.includes('123')).length === 1)
    const { renderInvestmentImage } = await module('pages/investment-calculator/imageExport.js')
    const { derive } = await module('pages/investment-calculator/lib.js')
    for (const assetId of ['bitcoin', 'cac40']) {
      const state = {assetId, mode:'lump', amountRaw:'1000', startYear:2020,startMonth:1,overridePriceRaw:''}
      await check(`investment-${assetId}`, () => renderInvestmentImage(state,derive(state)), (_,text) => !/ET SI TU AVAIS INVESTI|Clôture de décembre à clôture de décembre|Évolution historique ·/.test(text) && text.includes('Les performances passées ne préjugent pas des performances futures'))
    }
    const { renderPurchasingPowerImage } = await module('pages/tweet-midi/purchasingPowerImage.js')
    await check('purchasing-power', () => renderPurchasingPowerImage({mode:'brut',amount:1000,startYear:2020}), (_, text) => !text.includes('/  POUVOIR'))
    const { drawBrokerVersus } = await module('pages/broker-comparator/versus-image.js')
    await check('brokers', async () => { const canvas=document.createElement('canvas'); await drawBrokerVersus(canvas, 'tr', 'bourso'); return canvas }, (_,text) => !text.includes('DUEL DE COURTIERS'))
    const { drawFeeImpactImage } = await module('pages/fee-impact/imageExport.js')
    const { simulateCapitalSeries, computeComparison, fmtEUR: feeEUR } = await module('pages/fee-impact/lib.js')
    for (const [name, amount, years, fee1, fee2] of [
      ['fees', 400, 30, .2, 2], ['fees-short', 100, .5, .1, .5],
      ['fees-inverted', 500, 10, 2, .2], ['fees-equal', 300, 20, .2, .2],
      ['fees-close', 100, 10, .1, .2], ['fees-long', 1000, 50, .2, 2],
    ]) {
      const state = { amount, years, returnRate: 7, fee1, fee2 }
      const comparison = computeComparison(state)
      await check(name, () => {
        const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 1600
        drawFeeImpactImage(canvas.getContext('2d'), state,
          simulateCapitalSeries(amount, years, 7, fee1), simulateCapitalSeries(amount, years, 7, fee2), comparison)
        return canvas
      }, (words, text) => words.includes(feeEUR(comparison.ecart))
        && words.includes(feeEUR(comparison.capital1)) && words.includes(feeEUR(comparison.capital2))
        && !/SIMULATION|Deux scénarios|Frais annuels :|Les mêmes versements|ÉCART$|hors fiscalité|début de mois/.test(text))
    }
    const { normalizePortfolio } = await module('pages/investor-portfolio/data.js')
    const { renderPortfolioImage: renderInvestor } = await module('pages/investor-portfolio/image.js')
    const payload=await fetch('/shinny-potato/data/investors/ackman.json').then(response=>response.json())
    await check('investor', () => renderInvestor(normalizePortfolio(payload)), (_,text) => !text.includes('/  INVESTISSEURS'))
    const { HOUSEHOLD_STATISTICS } = await module('data/household-statistics.js')
    const { renderHouseholdImage, HOUSEHOLD_DESIGNS } = await module('pages/france-100-menages/image.js')
    for (const design of HOUSEHOLD_DESIGNS) for (const record of HOUSEHOLD_STATISTICS) await check(`household-${design.id}-${record.id}`, () => renderHouseholdImage(record,design.id), (_,text) => !text.includes('Chaque point représente'))
    return records
  })
  console.log(`${results.length} PNG exports: copy, signatures and duplicate removal verified.`)
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
