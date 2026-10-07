import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { COMPANIES } from '../src/data/companies.js'

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
  const chooser=page.getByRole('group',{name:'Choisir une entreprise',exact:true})
  for(const company of COMPANIES) {
    await chooser.getByRole('button',{name:`${company.name} · ${company.symbol}`}).click()
    const text=await page.getByTestId('company-tweet').innerText()
    assert(text.includes(company.name));assert(text.includes(company.activity))
    assert(text.includes('Ce que l’entreprise gagne'))
    assert(!text.includes('Ce que je regarderais'))
    assert(!text.includes(company.watch))
    assert(text.includes('Ce ratio utilise les bénéfices déjà publiés.'))
    assert(!/NaN|undefined|Infinity/.test(text))
  }
  await chooser.getByRole('button',{name:'Apple · AAPL'}).click()
  await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
  const copied=await page.evaluate(()=>navigator.clipboard.readText())
  assert.equal(copied,await page.getByTestId('company-tweet').innerText())
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
  assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth))
  if(process.env.COMPANY_QA_DIR) await page.screenshot({path:`${process.env.COMPANY_QA_DIR}/company-mobile.png`,fullPage:true})
  await page.goto(`${base}/bibliotheque-donnees?q=AAPL&type=company&id=company:apple`,{waitUntil:'networkidle'})
  assert(await page.getByRole('button',{name:/Apple.*company:apple/}).count())
  assert.deepEqual(errors,[])
  console.log('Company UI: all companies, clipboard, image, PNG download, mobile without overflow and shared data search OK.')
} finally { await browser?.close();server.kill('SIGTERM') }
