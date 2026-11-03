import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { ASSETS, PROFILES } from '../src/pages/dca-profiles/data.js'
import { prepareProfile, references } from '../src/pages/dca-profiles/engine.js'
const port=4377,base=process.env.DCA_ROADMAP_BASE_URL || `http://127.0.0.1:${port}/shinny-potato/`
const server=process.env.DCA_ROADMAP_BASE_URL?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
const output=process.env.DCA_ROADMAP_ARTIFACTS || 'test-artifacts/dca-roadmap'
mkdirSync(output,{recursive:true})
const hash=buffer=>createHash('sha256').update(buffer).digest('hex')
let browser
try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{}),
    ...(process.env.DCA_ROADMAP_BASE_URL&&process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(base)
  for(const n of [1,2,8,50]){
    const lines=Object.keys(ASSETS).slice(0,n).map(asset=>({asset,label:ASSETS[asset][1],emoji:ASSETS[asset][0],isin:references[asset].isin,weight:0,amount:0}))
    await page.evaluate(lines=>localStorage.setItem('epargnant-publication:v1:simple-exposure-draft',JSON.stringify({lines,field:'all',exposureLimit:4})),lines)
    await page.goto(base+'le-dca-de')
    await page.getByRole('button',{name:'Répartir à parts égales',exact:true}).click()
    const inputs=page.getByRole('spinbutton',{name:/^Poids position /})
    assert.equal(await inputs.count(),n)
    const weights=await inputs.evaluateAll(items=>items.map(input=>Number(input.value)))
    assert(Math.abs(weights.reduce((s,w)=>s+w,0)-100)<1e-8)
    await inputs.first().fill(String(weights[0]-1))
    await page.getByRole('button',{name:'Affecter le solde à la position 1',exact:true}).click()
    assert.equal(Number(await inputs.first().inputValue()),weights[0])
    for(const width of [1440,390]){
      await page.setViewportSize({width,height:1000})
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${n} positions mobile overflow`)
      await inputs.last().scrollIntoViewIfNeeded();assert(await inputs.last().isVisible())
      if(n===50)await page.screenshot({path:`${output}/allocation-50-${width}.png`})
    }
    await page.setViewportSize({width:1440,height:1000})
    if(n===2){
      await page.getByText('Mes portefeuilles',{exact:true}).filter({visible:true}).click()
      const downloading=page.waitForEvent('download')
      await page.getByRole('button',{name:'Exporter ce portefeuille',exact:true}).click()
      const download=await downloading,path=`${output}/allocation.json`;await download.saveAs(path)
      const record=JSON.parse(readFileSync(path,'utf8')).portfolio
      assert.equal(record.profile.imageOnly,true);assert.equal(record.profile.lines.length,2)
      await page.getByLabel('Importer un portefeuille JSON',{exact:true}).filter({visible:true}).setInputFiles(path)
      await page.getByRole('button',{name:'Ouvrir le fichier importé',exact:true}).click()
      assert.equal(Number(await inputs.first().inputValue()),weights[0])
      await page.getByText('Mes portefeuilles',{exact:true}).filter({visible:true}).click()
    }
    await page.getByRole('img',{name:'Répartition et expositions du portefeuille',exact:true}).waitFor()
  }
  // A real participant, manual text, different held/flow weights and all options.
  const custom='Texte personnel inchangé\n\n🌍 Épargnant Libre',profile={...prepareProfile(PROFILES[0]),mode:'participant',approved:true,
    exposureLimit:6,showCompanies:false,analysisView:{mode:'held',capital:'12500',months:'18',groupKey:''}}
  await page.evaluate(({profile,custom})=>localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft:custom,field:'both',draftEdited:true})),{profile,custom})
  await page.reload()
  await page.getByRole('button',{name:'Le DCA d’un abonné',exact:true}).click()
  const draft=page.locator('#dca-draft'),consent=page.getByRole('checkbox',{name:'La personne a validé',exact:false})
  assert.equal(await draft.inputValue(),custom)
  await consent.check()
  const flowBefore=await page.getByRole('spinbutton',{name:/^DCA position /}).evaluateAll(items=>items.map(i=>i.value))
  await page.getByRole('button',{name:'Répartir à parts égales',exact:true}).click()
  assert.equal(await consent.isChecked(),false);assert.equal(await draft.inputValue(),custom)
  assert.deepEqual(await page.getByRole('spinbutton',{name:/^DCA position /}).evaluateAll(items=>items.map(i=>i.value)),flowBefore)
  await consent.check()
  await page.getByText('Mes portefeuilles',{exact:true}).filter({visible:true}).click()
  await page.getByLabel('Nom de la sauvegarde',{exact:true}).filter({visible:true}).fill('Transport exact')
  const downloading=page.waitForEvent('download')
  await page.getByRole('button',{name:'Exporter ce portefeuille',exact:true}).click()
  const download=await downloading,path=`${output}/portfolio.json`;await download.saveAs(path)
  const exported=JSON.parse(readFileSync(path,'utf8'))
  assert.equal(exported.portfolio.draft,custom);assert.equal(exported.portfolio.profile.approved,false)
  assert.equal(exported.portfolio.profile.exposureLimit,6);assert.equal(exported.portfolio.field,'both')
  const image=page.getByRole('img',{name:`Portefeuille et versements de ${profile.name}`,exact:true})
  // Exporting and opening the same allocation leaves the real PNG unchanged.
  await image.waitFor();await image.evaluate(img=>img.decode())
  const imageHash=await image.evaluate(async img=>Array.from(new Uint8Array(await(await fetch(img.src)).arrayBuffer())))
  const existing=await page.evaluate(()=>localStorage.getItem('el-dca-portfolios-v2'))
  const file=page.getByLabel('Importer un portefeuille JSON',{exact:true}).filter({visible:true})
  await file.setInputFiles(`${output}/allocation.json`)
  assert.equal(await page.getByRole('button',{name:'Ouvrir le fichier importé',exact:true}).count(),0,'Cross-workspace imports do not replace the current profile')
  assert.equal(await draft.inputValue(),custom)
  await file.setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{broken')})
  assert.equal(await draft.inputValue(),custom);assert.equal(await consent.isChecked(),true)
  assert.equal(await page.getByRole('button',{name:'Ouvrir le fichier importé',exact:true}).count(),0)
  await file.setInputFiles(path)
  assert.equal(await consent.isChecked(),true,'Reading a file does not apply it without the explicit open action')
  await page.getByRole('button',{name:'Ouvrir le fichier importé',exact:true}).click()
  assert.equal(await consent.isChecked(),false);assert.equal(await draft.inputValue(),custom)
  assert.equal(await page.evaluate(()=>localStorage.getItem('el-dca-portfolios-v2')),existing,'Import does not overwrite named saves')
  await image.waitFor();await image.evaluate(img=>img.decode())
  const restoredHash=await image.evaluate(async img=>Array.from(new Uint8Array(await(await fetch(img.src)).arrayBuffer())))
  assert.equal(hash(Buffer.from(restoredHash)),hash(Buffer.from(imageHash)))
  await page.reload();assert.equal(await draft.inputValue(),custom)
  await image.waitFor();await image.evaluate(img=>img.decode())
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000})
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Portable controls mobile overflow')
    await page.getByText('Mes portefeuilles',{exact:true}).filter({visible:true}).click()
    await page.getByRole('button',{name:'Exporter ce portefeuille',exact:true}).scrollIntoViewIfNeeded()
    await page.screenshot({path:`${output}/transport-${width}.png`})
    await page.getByText('Mes portefeuilles',{exact:true}).filter({visible:true}).click()
  }
  assert.deepEqual(errors,[])
  writeFileSync(`${output}/result.json`,JSON.stringify({cases:[1,2,8,50],widths:[1440,390],draftPreserved:true,approvalRevoked:true,pngUnchanged:true,errors},null,2))
  console.log('DCA roadmap browser: 1/2/8/50 positions, explicit remainder, real JSON download/import, invalid import isolation, exact custom text/options, approval revocation, unchanged PNG and desktop/mobile verified.')
} finally {await browser?.close();server?.kill()}
