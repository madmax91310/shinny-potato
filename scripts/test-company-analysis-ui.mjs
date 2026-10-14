import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { COMPANIES } from '../src/data/companies.js'
import { valuationPublication } from '../src/pages/company-analysis/valuationPublication.js'
import { buildPriceScenarios as buildScenarios } from '../src/pages/company-analysis/priceTargets.js'
import { buildTweetText, calculatedRatios, decisionIndicators, activeDecision } from '../src/pages/company-analysis/lib.js'

const server = spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4315','--strictPort'],{stdio:'ignore'})
const base = 'http://127.0.0.1:4315/shinny-potato'
let browser
try {
  for(let attempt=0; ;attempt++) {
    try { if ((await fetch(`${base}/`)).ok) break } catch { /* starting */ }
    assert(attempt < 100); await new Promise(resolve=>setTimeout(resolve,100))
  }
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})
  const context = await browser.newContext({viewport:{width:1440,height:1100},permissions:['clipboard-read','clipboard-write']})
  const page = await context.newPage()
  const errors=[]; page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}/analyse-entreprise`,{waitUntil:'networkidle'})
  await page.getByRole('heading',{name:'Analyse d’entreprise',exact:true}).waitFor()
  await page.getByText('Comptes détaillés et publication existante',{exact:true}).click()
  await page.getByText('Consulter les comptes et indicateurs détaillés',{exact:true}).click()
  const chooser=page.getByRole('group',{name:'Choisir une entreprise',exact:true})
  for(const company of COMPANIES) {
    await chooser.getByRole('button',{name:`${company.name} · ${company.symbol}`}).click()
    const text=await page.getByTestId('company-tweet').innerText()
    assert(text.includes(company.name));assert(text.includes(company.activity))
    assert(/💰 .*exercice terminé en/.test(text))
    assert(!text.includes('Ce que je regarderais'))
    assert(text.startsWith(company.editorialHook))
    assert(!text.includes('💬'))
    assert(!text.includes(company.watch))
    const now = new Date()
    assert.equal(text, buildTweetText(company, now))
    const indicators = decisionIndicators(company, now)
    if (indicators.length) {
      const panel = page.getByTestId('company-decision-indicators')
      assert.equal(await panel.locator('dt').count(), indicators.length)
      for (const row of indicators) assert((await panel.innerText()).includes(row.value))
      assert(!/NaN|undefined|Infinity/.test(await panel.innerText()))
    }
    const cashRows = activeDecision(company, now)?.years.filter(row => Number.isFinite(row.freeCashFlow)) ?? []
    if (cashRows.length) assert.equal(await page.getByTestId('company-cash-history').locator('tbody tr').count(), cashRows.length)
    if(calculatedRatios(company, now).peTTM) assert(text.includes('bénéfice par action sur les douze derniers mois.'))
    assert(text.includes(company.editorialQuestion))
    assert(!text.includes('Le recul sur'))
    assert(!text.includes('PER prévisionnel'))
    assert(!text.includes('PEG :'))
    assert.equal(await page.getByTestId('company-history').locator('tbody tr').count(), company.history.years.length)
    const lastRow = page.getByTestId('company-history').locator('tbody tr').last()
    assert((await lastRow.innerText()).includes(company.annual.end.split('-').reverse().join('/')))
    assert((await lastRow.getByRole('link').getAttribute('href')).startsWith('https://'))
    assert(!/NaN|undefined|Infinity/.test(text))
  }
  // Exercise valuation inputs in the actual browser, including invalid input and reset.
  await chooser.getByRole('button',{name:'Apple · AAPL'}).click()
  const valuationPanel = page.getByTestId('company-valuation')
  await valuationPanel.getByRole('button',{name:'Bénéfices',exact:true}).click()
  await valuationPanel.getByText('Ajuster les hypothèses',{exact:true}).click()
  const growthInput = valuationPanel.getByLabel('Croissance BPA Central', {exact:true})
  const before = await valuationPanel.locator('.valuation-assumptions tbody tr').nth(1).innerText()
  const chartBefore = await valuationPanel.locator('.valuation-forecast-line.selected').getAttribute('d')
  const readingBefore = await valuationPanel.getByTestId('valuation-reading').innerText()
  await growthInput.fill('2')
  assert.notEqual(await valuationPanel.locator('.valuation-forecast-line.selected').getAttribute('d'),chartBefore)
  assert.notEqual(await valuationPanel.getByTestId('valuation-reading').innerText(),readingBefore)
  assert.notEqual(await valuationPanel.locator('.valuation-assumptions tbody tr').nth(1).innerText(), before)
  await valuationPanel.getByLabel('Multiple Central', {exact:true}).fill('0')
  await valuationPanel.getByRole('alert').waitFor()
  assert.equal(await valuationPanel.locator('.valuation-forecast-line').count(),0)
  assert.equal(await valuationPanel.getByTestId('valuation-reading').count(),0)
  await valuationPanel.getByRole('button',{name:'Rétablir les scénarios automatiques'}).click()
  assert.equal(await valuationPanel.getByRole('alert').count(),0)
  assert.equal(await valuationPanel.locator('.valuation-assumptions tbody tr').nth(1).innerText(),before)
  await valuationPanel.getByText('Ajuster les hypothèses',{exact:true}).click()
  await valuationPanel.getByRole('button',{name:'Flux de trésorerie',exact:true}).click()
  await valuationPanel.getByTestId('cash-drivers').locator('summary').click()
  assert((await valuationPanel.getByTestId('cash-drivers').innerText()).includes('Actions diluées'))
  assert(!/NaN|undefined|Infinity/.test(await valuationPanel.getByTestId('cash-drivers').innerText()))
  await valuationPanel.getByTestId('forecast-evaluation').locator('summary').click()
  assert((await valuationPanel.getByTestId('forecast-evaluation').innerText()).includes('Les hypothèses et sources d’origine sont conservées'))
  if(process.env.COMPANY_QA_DIR)await page.screenshot({path:`${process.env.COMPANY_QA_DIR}/cash-drivers-and-tracking.png`,fullPage:true})
  await valuationPanel.getByTestId('cash-drivers').locator('summary').click()
  await valuationPanel.getByTestId('forecast-evaluation').locator('summary').click()
  await valuationPanel.getByText('Préparer la publication pour X',{exact:true}).click()
  assert.equal(await page.locator('.company-publication .workspace-actions').evaluate(el=>getComputedStyle(el).position),'static')
  const publication=valuationPanel.getByRole('region',{name:'Publication de valorisation'})
  const exportImage=publication.locator('img')
  await exportImage.waitFor()
  assert.deepEqual(await exportImage.evaluate(img=>[img.naturalWidth,img.naturalHeight]),[1200,1500])
  for(const horizon of [1,3,5]) {
    await valuationPanel.getByRole('group',{name:'Horizon de prévision'}).getByRole('button',{name:`${horizon} an${horizon>1?'s':''}`,exact:true}).click()
    const expected=valuationPublication(COMPANIES.find(c=>c.id==='apple'),{},1,'cash',new Date(),horizon)
    assert.equal(await publication.getByTestId('valuation-tweet').innerText(),expected.text)
    assert.equal(await valuationPanel.getByTestId('price-target').innerText(),`${expected.reading.value.toLocaleString('fr-FR',{maximumFractionDigits:2})} USD`)
  }
  for(const method of ['cash','earnings']) {
    await valuationPanel.getByRole('button',{name:method==='cash'?'Flux de trésorerie':'Bénéfices',exact:true}).click()
    for(const [index,name] of ['Prudent','Central','Favorable'].entries()) {
      await valuationPanel.getByRole('group',{name:'Choisir un scénario'}).getByRole('button',{name:new RegExp(name)}).click()
      assert.equal(await publication.getByTestId('valuation-tweet').innerText(),valuationPublication(COMPANIES.find(c=>c.id==='apple'),{},index,method).text)
    }
  }
  await valuationPanel.getByRole('group',{name:'Choisir un scénario'}).getByRole('button',{name:/Central/}).click()
  await valuationPanel.getByText('Ajuster les hypothèses',{exact:true}).click()
  const oldImage=await exportImage.getAttribute('src')
  await growthInput.fill('2')
  assert.notEqual(await exportImage.getAttribute('src'),oldImage)
  assert.equal(await publication.getByTestId('valuation-tweet').innerText(),valuationPublication(COMPANIES.find(c=>c.id==='apple'),{1:{earningsGrowth:.02}},1,'earnings').text)
  await publication.getByRole('button',{name:'Copier le texte de valorisation',exact:true}).click()
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await publication.getByTestId('valuation-tweet').innerText())
  const png=page.waitForEvent('download')
  await publication.getByRole('button',{name:'Télécharger l’image de valorisation',exact:true}).click()
  const downloaded=await png
  assert.match(downloaded.suggestedFilename(),/^objectifs-apple-earnings-5ans-central-.*\.png$/)
  if(process.env.COMPANY_QA_DIR) await downloaded.saveAs(`${process.env.COMPANY_QA_DIR}/valuation-export-earnings.png`)
  await valuationPanel.getByLabel('Multiple Central',{exact:true}).fill('0')
  assert.equal(await publication.locator('img').count(),0)
  assert.equal(await publication.getByRole('button').count(),0)
  await valuationPanel.getByRole('button',{name:'Rétablir les scénarios automatiques'}).click()
  await valuationPanel.getByText('Ajuster les hypothèses',{exact:true}).click()
  await valuationPanel.getByRole('button',{name:'Flux de trésorerie',exact:true}).click()
  if(process.env.COMPANY_QA_DIR) {
    const {writeFile}=await import('node:fs/promises')
    await writeFile(`${process.env.COMPANY_QA_DIR}/valuation-export-fcf.png`,Buffer.from((await exportImage.getAttribute('src')).split(',')[1],'base64'))
  }
  await page.setViewportSize({width:390,height:844})
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  if(process.env.COMPANY_QA_DIR) await publication.screenshot({path:`${process.env.COMPANY_QA_DIR}/valuation-publication-mobile.png`})
  await page.setViewportSize({width:1440,height:1100})
  // Every currently eligible company can generate a finite image/text snapshot.
  for(const company of COMPANIES) {
    await chooser.getByRole('button',{name:`${company.name} · ${company.symbol}`}).click()
    if(!await valuationPanel.locator('.valuation-publication-details').evaluate(el=>el.open)) await valuationPanel.getByText('Préparer la publication pour X',{exact:true}).click()
    const inputs=buildScenarios(company).inputs
    if(process.env.COMPANY_REQUIRE_PRICE_HISTORY && (inputs.cashReady||inputs.earningsReady)) assert(company.quote.history?.length>10,`${company.id}: missing real closing history`)
    if(inputs.cashReady||inputs.earningsReady) {
      await publication.locator('img').waitFor()
      assert(!/NaN|undefined|Infinity/.test(await publication.getByTestId('valuation-tweet').innerText()))
      if(process.env.COMPANY_QA_DIR) {
        const {writeFile}=await import('node:fs/promises')
        await writeFile(`${process.env.COMPANY_QA_DIR}/valuation-${company.id}.png`,Buffer.from((await publication.locator('img').getAttribute('src')).split(',')[1],'base64'))
      }
    } else assert.equal(await publication.getByRole('button').count(),0)
  }
  await chooser.getByRole('button',{name:'Apple · AAPL'}).click()
  // A tab left open beyond the freshness window must withdraw publication.
  await valuationPanel.getByText('Préparer la publication pour X',{exact:true}).click()
  await page.clock.install()
  await page.clock.setSystemTime(new Date('2035-01-01T12:00:00Z'))
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')))
  await publication.getByRole('alert').waitFor()
  assert.equal(await publication.locator('img').count(),0)
  await page.clock.setSystemTime(new Date())
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')))
  await publication.locator('img').waitFor()
  await valuationPanel.getByText('Préparer la publication pour X',{exact:true}).click()
  await page.getByText('Comptes détaillés et publication existante',{exact:true}).click()
  if(process.env.COMPANY_QA_DIR) await valuationPanel.screenshot({path:`${process.env.COMPANY_QA_DIR}/valuation-desktop.png`})
  await page.setViewportSize({width:390,height:844})
  assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth))
  if(process.env.COMPANY_QA_DIR) await valuationPanel.screenshot({path:`${process.env.COMPANY_QA_DIR}/valuation-mobile.png`})
  await page.setViewportSize({width:1440,height:1100})
  await page.getByText('Comptes détaillés et publication existante',{exact:true}).click()
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  let previousImage = ''
  for (const company of COMPANIES) {
    await chooser.getByRole('button',{name:`${company.name} · ${company.symbol}`}).click()
    const rendered = page.getByRole('img',{name:`Les chiffres de ${company.name}`})
    await rendered.waitFor()
    await page.waitForFunction(previous => {
      const img = document.querySelector('.publication-image-stage img')
      return img && img.complete && img.naturalWidth === 1200 && img.src !== previous
    }, previousImage)
    previousImage = await rendered.getAttribute('src')
    if(process.env.COMPANY_QA_DIR) {
      const {writeFile} = await import('node:fs/promises')
      await writeFile(`${process.env.COMPANY_QA_DIR}/${company.id}.png`,Buffer.from(previousImage.split(',')[1],'base64'))
    }
  }
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
  await chooser.getByRole('button',{name:'Apple · AAPL'}).click()
  await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
  const copied=await page.evaluate(()=>navigator.clipboard.readText())
  assert.equal(copied,await page.getByTestId('company-tweet').innerText())
  await page.getByRole('button',{name:'Modifier le texte',exact:true}).click()
  await page.getByRole('textbox',{name:'Texte de la publication'}).fill('📱 Mon analyse Apple modifiée')
  await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()), '📱 Mon analyse Apple modifiée')
  await chooser.getByRole('button',{name:'Microsoft · MSFT'}).click()
  assert((await page.getByRole('textbox',{name:'Texte de la publication'}).inputValue()).includes('Microsoft'))
  await chooser.getByRole('button',{name:'Apple · AAPL'}).click()
  assert.equal(await page.getByRole('textbox',{name:'Texte de la publication'}).inputValue(), '📱 Mon analyse Apple modifiée')
  await page.getByRole('button',{name:'Rétablir le texte d’origine',exact:true}).click()
  assert.equal(await page.getByRole('textbox',{name:'Texte de la publication'}).inputValue(), copied)
  await page.getByRole('button',{name:'Voir le texte',exact:true}).click()
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  const image=page.getByRole('img',{name:'Les chiffres de Apple'})
  await image.waitFor()
  assert.deepEqual(await image.evaluate(img=>[img.naturalWidth,img.naturalHeight]),[1200,1200])
  if(process.env.COMPANY_QA_DIR) {
    await page.screenshot({path:`${process.env.COMPANY_QA_DIR}/company-desktop.png`,fullPage:true})
    const url=await image.getAttribute('src')
    const {writeFile}=await import('node:fs/promises')
    await writeFile(`${process.env.COMPANY_QA_DIR}/company-export.png`,Buffer.from(url.split(',')[1],'base64'))
  }
  const downloadPromise=page.waitForEvent('download')
  await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
  assert.match((await downloadPromise).suggestedFilename(),/^analyse-apple-.*\.png$/)
  await page.setViewportSize({width:390,height:844})
  await page.getByRole('button',{name:'Réglages',exact:true}).click()
  await chooser.getByRole('button',{name:'Microsoft · MSFT'}).click()
  await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
  assert((await page.getByTestId('company-tweet').innerText()).includes('Microsoft'))
  assert.equal(await page.getByTestId('company-history').locator('tbody tr').count(), COMPANIES.find(c => c.id === 'microsoft').history.years.length)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth))
  if(process.env.COMPANY_QA_DIR) await page.screenshot({path:`${process.env.COMPANY_QA_DIR}/company-mobile.png`,fullPage:true})
  await page.goto(`${base}/bibliotheque-donnees?q=AAPL&type=company&id=company:apple`,{waitUntil:'networkidle'})
  assert(await page.getByRole('button',{name:/Apple.*company:apple/}).count())
  await page.getByRole('button',{name:/Apple.*company:apple/}).click()
  assert((await page.locator('body').innerText()).includes('Estimations prévisionnelles'))
  assert((await page.locator('body').innerText()).includes('Historique annuel'))
  for(const company of COMPANIES.filter(c => c.accountingStandard === 'IFRS')) {
    await page.goto(`${base}/bibliotheque-donnees?q=${encodeURIComponent(company.symbol)}&type=company&id=company:${company.id}`,{waitUntil:'networkidle'})
    const result = page.getByRole('button',{name:new RegExp(`${company.name}.*company:${company.id}`)})
    await result.click()
    const body = await page.locator('body').innerText()
    assert(body.includes('Historique annuel'))
    if(company.halfYear) assert(body.includes('Comptes semestriels'))
  }
  assert.deepEqual(errors,[])
  console.log('Company UI: all companies, clipboard, image, PNG download, mobile without overflow and shared data search OK.')
} finally { await browser?.close();server.kill('SIGTERM') }
