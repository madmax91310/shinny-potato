import {waitPreview} from './wait-preview.mjs'
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {readFileSync,mkdirSync} from 'node:fs'
import {chromium} from 'playwright'
const report=JSON.parse(readFileSync('dist/data/data-automation-inventory.json'))
if(report.backlog[0])report.backlog[0].sourceAccess={qualification:'access-check-only',financialDataQualified:false,
 status:'accessible-unqualified',lastAccessAttemptAt:'2026-10-20T12:00:00Z'}
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4391'],{stdio:'ignore'})
const base='http://127.0.0.1:4391/shinny-potato'
let browser
try{
 await waitPreview(server,base)
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 mkdirSync('test-artifacts/data-automation-inventory',{recursive:true})
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[],requests=[]
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()))
  // Keep this recipe independent of the live status branch, which has its own tests.
  await page.route('**/automation-status/automation-status.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({schemaVersion:1,workflows:{}})}))
  await page.route('**/data/data-automation-inventory.json',r=>r.fulfill({json:report}))
  await page.goto(base+'/donnees-a-revoir',{waitUntil:'networkidle'})
  const section=page.locator('section').filter({has:page.getByRole('heading',{name:'Inventaire de toutes les données',exact:true})})
  await section.getByText(`${report.summary.catalogRecords} fiches · ${report.summary.catalogFields} champs de catalogue · ${report.summary.registries} modules examinés.`,{exact:true}).waitFor()
  assert(!requests.some(url=>url.endsWith('/data-automation-inventory.json')),'the full technical audit remains lazy; the primary inbox uses its exhaustive compact projection')
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
  await section.getByText(`${archiveCount} champs correspondants`,{exact:true}).waitFor()
  await section.getByRole('combobox',{name:'Afficher',exact:true}).selectOption('actions')
  const first=report.backlog[0]
  if(first){
   await search.fill(first.id)
   const row=section.getByRole('heading',{name:`${first.name} · ${first.label}`,exact:true}).locator('..')
   await row.waitFor()
   await row.getByText(/Source accessible ; champ toujours à qualifier/).waitFor()
   assert.match(await row.textContent(),/Ce contrôle ne renouvelle pas la donnée financière/)
   assert.equal(await row.locator('dd').last().textContent(),first.lastSuccessAt??'Non documenté')
  }
  assert.equal(await section.getByRole('link',{name:'Télécharger les raccordements à traiter (CSV)'}).getAttribute('href'),'/shinny-potato/data/data-connections-backlog.csv')
  await section.getByRole('combobox',{name:'Afficher',exact:true}).selectOption('assets')
  await search.fill('IE00BJGWQN72')
  const profile=section.locator('article').filter({hasText:'IE00BJGWQN72'}).first()
  await profile.waitFor()
  await profile.locator('summary').click()
  await profile.getByText(/Contrôle de la source/).first().waitFor()
  assert(await profile.getByRole('link',{name:'Source ↗'}).count()>0,'individual field source links are exposed')
  assert.equal(await section.getByRole('link',{name:'Télécharger le bilan par actif et par champ (CSV)'}).getAttribute('href'),'/shinny-potato/data/asset-automation.csv')
  await section.getByRole('combobox',{name:'Afficher',exact:true}).selectOption('priorities')
  const alternative=report.connections.find(r=>r.field==='performance'&&r.actionState!=='current'&&r.marketCalendar)
  if(alternative){
   await search.fill(alternative.id)
   await section.getByRole('heading',{name:`Calendrier de cotation calculé · ${alternative.marketCalendar.currency}`,exact:true}).waitFor()
   await section.getByText(/ces rendements diffèrent du calendrier NAV/i).waitFor()
  }
  await section.getByRole('combobox',{name:'Données prioritaires'}).selectOption('completeHoldings')
  await search.fill('IE000NDWFGA5')
  await section.getByText(/Identités non qualifiées/).waitFor()
  await section.getByRole('combobox',{name:'Données prioritaires'}).selectOption('countries')
  await search.fill('IE0003R87OG3')
  await section.getByRole('heading',{name:'Répartition de la poche actions',exact:true}).waitFor()
  await section.getByText(/exclut les liquidités/).waitFor()
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false)
  await page.screenshot({path:`test-artifacts/data-automation-inventory/${width}.png`,fullPage:true})
  for(const isin of ['IE00BLCHJB90','IE000NDWFGA5','IE00BMH5Y871','IE000UL6CLP7','IE0003R87OG3','IE0003Z9E2Y3','IE00BM8R0J59']){
   await page.goto(`${base}/fiches-etf?isin=${isin}`,{waitUntil:'networkidle'})
   if(await page.getByRole('button',{name:'Aperçu',exact:true}).isVisible())await page.getByRole('button',{name:'Aperçu',exact:true}).click()
   await page.getByRole('tab',{name:'Texte',exact:true}).click()
   await page.locator('.es-card .es-facts').getByText(`ISIN : ${isin}`,{exact:true}).waitFor()
   const observation=report.connections.find(r=>r.id===isin&&r.field==='performance')
   const expected=observation.marketCalendar
   const card=await page.locator('.es-card').innerText()
   if(observation.actionState==='current'){
    assert(card.includes('Performances annuelles'),isin)
    assert(!card.includes('cours ajustés, distributions réinvesties'),'The official NAV calendar must regain precedence once published: '+isin)
    continue
   }
   assert(card.includes('cours ajustés, distributions réinvesties'),isin)
   assert(card.includes(`(${expected.currency})`),isin)
   const year=Object.keys(expected.years).at(-1),value=expected.years[year]
   assert(card.includes(`${year} : ${value>0?'+':''}${value.toLocaleString('fr-FR',{maximumFractionDigits:2})} %`),isin)
  }
  assert.deepEqual(errors,[]);await page.close()
 }
 console.log('Data automation inventory and priority markets: lazy audit, dated alternatives, unknown weights and seven calculated ETF calendars verified on mobile/desktop.')
}finally{await browser?.close();server.kill()}
