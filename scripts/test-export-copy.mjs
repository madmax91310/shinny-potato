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
      records.push({ name, png, text })
    }
    const { ETFS } = await module('data/etf-cards.js')
    const { renderETFImage } = await module('pages/etf-sheets/canvasImage.js')
    const { renderAnnualETFImage } = await module('pages/etf-sheets/annualImage.js')
    const { getAnnualPerformance } = await module('pages/etf-sheets/annualPerformance.js')
    const { buildText } = await module('pages/etf-sheets/lib.js')
    for (const etf of ETFS) {
      if (/🆕|Nouveau/.test(buildText(etf))) throw new Error(`New label in tweet: ${etf.id}`)
      await check(`etf-${etf.id}`, () => renderETFImage(etf), (_, text) => !/PRÉSENTATION|Nouveau/.test(text) && text.includes('Pas un conseil en investissement'))
      if (getAnnualPerformance(etf)?.values.filter(Number.isFinite).length >= 2) {
        await check(`annual-${etf.id}`, () => renderAnnualETFImage(etf), (_, text) => !text.includes('PRÉSENTATION') && !text.includes('Rendements calendaires de la part'))
      }
    }
    const { SHEETS } = await module('data/index-factsheets.js')
    const { renderFactsheetImage } = await module('pages/factsheet-tweets/canvasImage.js')
    for (const sheet of SHEETS) await check(`facts-${sheet.id}`, () => renderFactsheetImage(sheet))
    const { FAMILIES } = await module('data/index-comparisons.js')
    const { renderIndexImage } = await module('pages/index-comparator/imageExport.js')
    for (const family of FAMILIES) await check(`indices-${family.id}`, () => renderIndexImage(family), (words) => {
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
    await check('performance', () => renderPerformanceImage({mode:'simple', assetId:'msciWorld',year:2016}), (words,text) => !/SÉRIE|Hausse|Baisse/.test(text) && words.filter(word => word === 'PERFORMANCE CUMULÉE').length === 1)
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
    const { simulateCapitalSeries } = await module('pages/fee-impact/lib.js')
    await check('fees', () => { const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1200; const first=simulateCapitalSeries(300,20,7,.2),second=simulateCapitalSeries(300,20,7,1.5);drawFeeImpactImage(canvas.getContext('2d'),{amount:300,years:20,returnRate:7,fee1:.2,fee2:1.5},first,second,{capital1:first.at(-1).capital,capital2:second.at(-1).capital,ecart:first.at(-1).capital-second.at(-1).capital});return canvas }, (_,text) => !/SIMULATION|Deux scénarios|Frais annuels :/.test(text))
    const { normalizePortfolio } = await module('pages/investor-portfolio/data.js')
    const { renderPortfolioImage: renderInvestor } = await module('pages/investor-portfolio/image.js')
    const payload=await fetch('/shinny-potato/data/investors/ackman.json').then(response=>response.json())
    await check('investor', () => renderInvestor(normalizePortfolio(payload)), (_,text) => !text.includes('/  INVESTISSEURS'))
    const { HOUSEHOLD_STATISTICS } = await module('data/household-statistics.js')
    const { renderHouseholdImage, HOUSEHOLD_DESIGNS } = await module('pages/france-100-menages/image.js')
    for (const design of HOUSEHOLD_DESIGNS) for (const record of HOUSEHOLD_STATISTICS) await check(`household-${design.id}-${record.id}`, () => renderHouseholdImage(record,design.id), (_,text) => !text.includes('Chaque point représente'))
    return records
  })
  await mkdir('test-artifacts/export-copy', { recursive: true })
  // Representative images, plus all written labels, remain reviewable in the CI artifact.
  for (const result of results) {
    await writeFile(`test-artifacts/export-copy/${result.name}.txt`, result.text)
    if (!result.name.startsWith('etf-') || result === results[0]) await writeFile(`test-artifacts/export-copy/${result.name}.png`, Buffer.from(result.png.split(',')[1], 'base64'))
  }
  console.log(`${results.length} PNG exports: copy, signatures and duplicate removal verified.`)
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
