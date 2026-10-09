import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { PRESENTATION_ACTORS, ACTOR_FAMILIES, buildActorTweet } from '../src/data/presentation-actors.js'
const base='http://127.0.0.1:4345/shinny-potato'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4345','--strictPort'],{stdio:'ignore'})
let browser
try {
  for(let i=0;;i++){try{if((await fetch(`${base}/`)).ok)break}catch{}assert(i<100);await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch()
  const page=await browser.newPage({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}/presentations`,{waitUntil:'networkidle'})
  const families=page.getByRole('group',{name:'Choisir une famille',exact:true})
  for(const record of PRESENTATION_ACTORS){
    await families.getByRole('button',{name:ACTOR_FAMILIES.find(row=>row.id===record.family).label,exact:true}).click()
    await page.getByRole('group',{name:'Choisir un acteur',exact:true}).getByRole('button',{name:record.name,exact:true}).click()
    await page.getByRole('tab',{name:'Texte',exact:true}).click()
    assert.equal(await page.locator('#actor-draft').inputValue(),buildActorTweet(record))
    await page.locator('#actor-draft').fill(`Retouche ${record.id}`)
    await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),`Retouche ${record.id}`)
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    const img=page.getByRole('img',{name:`Visuel de ${record.name}`,exact:true});await img.waitFor()
    const url=await img.getAttribute('src')
    const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger l’image',exact:true}).click()
    const download=await pending
    assert.equal(download.suggestedFilename(),`${record.id}-epargnant-libre.png`)
    assert.deepEqual(await readFile(await download.path()),Buffer.from(url.split(',')[1],'base64'))
  }
  await families.getByRole('button',{name:'Private equity',exact:true}).click()
  await page.getByRole('button',{name:'Fundora',exact:true}).click()
  assert.equal(await page.locator('#actor-draft').inputValue(),'Retouche fundora')
  await page.getByRole('button',{name:'Anaxago',exact:true}).click()
  assert.equal(await page.locator('#actor-draft').inputValue(),'Retouche anaxago')
  await page.getByRole('button',{name:'Rétablir le texte',exact:true}).click()
  assert.equal(await page.locator('#actor-draft').inputValue(),buildActorTweet(PRESENTATION_ACTORS.find(r=>r.id==='anaxago')))
  await families.getByRole('button',{name:'Assurance-vie',exact:true}).click()
  await page.locator('#insurance-draft').fill('Assurance conservée')
  await families.getByRole('button',{name:'SCPI',exact:true}).click()
  await page.locator('#scpi-draft').fill('SCPI conservée')
  await families.getByRole('button',{name:'Assurance-vie',exact:true}).click()
  assert.equal(await page.locator('#insurance-draft').inputValue(),'Assurance conservée')
  await families.getByRole('button',{name:'SCPI',exact:true}).click()
  assert.equal(await page.locator('#scpi-draft').inputValue(),'SCPI conservée')
  for(const width of [320,390]){
    await page.setViewportSize({width,height:844})
    await families.getByRole('button',{name:'Bovins',exact:true}).click()
    await page.getByRole('button',{name:'Aperçu',exact:true}).click()
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    await page.getByRole('img',{name:'Visuel de MyMarguerit',exact:true}).waitFor({state:'visible'})
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  }
  for(const [route,family] of [['presentation-scpi','scpi'],['presentation-assurance-vie','insurance']]){
    await page.goto(`${base}/${route}`,{waitUntil:'networkidle'})
    assert(new URL(page.url()).pathname.endsWith('/presentations'))
    assert.equal(new URL(page.url()).searchParams.get('famille'),family)
  }
  assert.deepEqual(errors,[])
  console.log('Unified presentations UI: actor exports, clipboard, preserved drafts, reset, mobile and legacy redirects OK.')
} finally{await browser?.close();server.kill('SIGTERM')}
