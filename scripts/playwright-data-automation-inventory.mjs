import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {readFileSync,mkdirSync} from 'node:fs'
import {chromium} from 'playwright'
const report=JSON.parse(readFileSync('dist/data/data-automation-inventory.json'))
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4391'],{stdio:'ignore'})
const base='http://127.0.0.1:4391/shinny-potato'
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 mkdirSync('test-artifacts/data-automation-inventory',{recursive:true})
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[],requests=[]
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()))
  // Keep this recipe independent of the live status branch, which has its own tests.
  await page.route('**/automation-status/automation-status.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({schemaVersion:1,workflows:{}})}))
  await page.goto(base+'/donnees-a-revoir',{waitUntil:'networkidle'})
  const section=page.locator('section').filter({has:page.getByRole('heading',{name:'Inventaire de toutes les données',exact:true})})
  await section.getByText(`${report.summary.catalogRecords} fiches · ${report.summary.catalogFields} champs de catalogue · ${report.summary.registries} modules examinés.`,{exact:true}).waitFor()
  assert(!requests.some(url=>url.endsWith('/data-automation-inventory.json')),'the large audit must load only when requested')
  await section.locator('summary').click()
  const search=section.getByRole('textbox',{name:'Rechercher dans l’inventaire'})
  await search.waitFor();await search.fill('IE0006WW1TQ4')
  await section.locator('article').first().waitFor()
  assert(await section.locator('article').count()>0)
  assert.equal(await section.getByRole('link',{name:'Télécharger l’inventaire complet (JSON)'}).getAttribute('href'),'/shinny-potato/data/data-automation-inventory.json')
  assert.equal(await section.locator('details > ul').last().locator('li').count(),report.summary.peaRemaining)
  await search.fill('')
  await section.getByRole('combobox',{name:'Nature des données',exact:true}).selectOption('archive')
  const archiveCount=report.fields.filter(f=>f.nature.kind==='archive').length
  await section.getByText(`${archiveCount} champs correspondants · ${Math.min(archiveCount,50)} affichés`,{exact:true}).waitFor()
  await section.getByRole('combobox',{name:'Afficher',exact:true}).selectOption('actions')
  const first=report.backlog[0]
  if(first){await search.fill(first.id);await section.getByRole('heading',{name:`${first.name} · ${first.label}`,exact:true}).waitFor()}
  assert.equal(await section.getByRole('link',{name:'Télécharger les raccordements à traiter (CSV)'}).getAttribute('href'),'/shinny-potato/data/data-connections-backlog.csv')
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false)
  await page.screenshot({path:`test-artifacts/data-automation-inventory/${width}.png`,fullPage:true})
  assert.deepEqual(errors,[]);await page.close()
 }
 console.log('Data automation inventory: current summary, lazy audit, exact-ISIN search, PEA gaps, download and mobile/desktop passed.')
}finally{await browser?.close();server.kill()}
