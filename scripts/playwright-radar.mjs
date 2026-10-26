// Browser contract for the publication policy. Real frozen publications are
// replayed, never sent or presented as live discovery. All network API is mocked.
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {publicationSelection} from '../src/lib/radar-editorial.js'
import {makeRadarOverview,overviewUnread} from '../src/lib/radar-overview.js'
import {radarToolActions} from './lib/radar-tool-actions.mjs'
import {RADAR_URL} from '../src/pages/editorial-radar/client.js'
import {EXTRA_SOURCES} from './lib/radar-extra-sources.mjs'
import {parsePublication} from './lib/radar-publications.mjs'
import {advanceRadar} from './lib/editorial-radar.mjs'
const summaryUrl='https://raw.githubusercontent.com/madmax91310/shinny-potato/radar-data/summary.json'
const now=new Date('2026-10-26T16:00:00Z'),output='test-artifacts/radar'
const capture=JSON.parse(await readFile('scripts/fixtures/radar-publication/cases.json','utf8'))
const events=capture.events.map(e=>({...e,toolActions:radarToolActions(e,+now)}))
let feed={schemaVersion:1,checkedAt:now.toISOString(),sourceRevision:'frozen-real-publications',coverage:{},observationCount:events.length,errors:[],events}
let failure=false,hold=false
const summary=()=>makeRadarOverview(feed,publicationSelection(feed.events,{now:+now}))
const url='http://127.0.0.1:4327/shinny-potato/'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4327','--strictPort'],{stdio:'ignore'})
let browser
const reports=[]
await mkdir(output,{recursive:true})
async function proof(card){await card.locator('.radar-proof > summary').click();await card.locator('.radar-related').first().waitFor()}
async function primaryProof(card){await proof(card);await card.locator('.radar-related > summary').first().click()}
try{
 for(let i=0;i<450;i++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({...process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{},args:['--no-sandbox']})
 for(const [device,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  feed={...feed,checkedAt:now.toISOString(),events};failure=false;hold=true
  const context=await browser.newContext({viewport,isMobile:device==='mobile',hasTouch:device==='mobile',permissions:['clipboard-read','clipboard-write']}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(15000);await page.clock.setFixedTime(now);page.on('pageerror',e=>errors.push(e.message))
  await context.route(RADAR_URL,r=>r.fulfill(failure?{status:503,body:'Unavailable'}:{contentType:'application/json',body:JSON.stringify(feed)}))
  await context.route(summaryUrl,async r=>{while(hold)await new Promise(resolve=>setTimeout(resolve,25));await r.fulfill(failure?{status:503,body:'Unavailable'}:{contentType:'application/json',body:JSON.stringify(summary())})})
  await page.goto(url)
  await page.getByLabel('Radar : chargement des sujets non lus',{exact:true}).first().waitFor({state:'attached'})
  hold=false
  const unread=overviewUnread(summary())
  await page.getByLabel(`${unread} sujets exploitables non lus`,{exact:true}).first().waitFor({state:'attached'})
  const home=page.locator('.home-radar-now');await home.getByRole('heading',{name:'À publier maintenant',exact:true}).waitFor()
  assert.equal(await home.locator('li').count(),Math.min(3,summary().selection.length))
  assert.doesNotMatch(await home.innerText(),/pourquoi ouvrir une assurance|financer la dépendance|prime.*carburant/i)
  if(device==='mobile')await page.locator('.workspace-mobile-radar').waitFor({state:'visible'})
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  await page.screenshot({path:`${output}/home-${device}.png`,fullPage:true})
  // Reading a dossier in another tab updates the home badge without navigation.
  const other=await context.newPage();await other.clock.setFixedTime(now)
  const salary=events.find(e=>e.entity==='salary-median'),salaryGroup=publicationSelection(events,{now:+now}).groups.find(g=>g.events.some(e=>e.id===salary.id))
  await other.goto(url+`radar-editorial?subject=${salary.id}`)
  const card=other.locator(`#subject-${salaryGroup.event.id}`);await card.getByRole('heading',{name:/Salaire médian/}).waitFor()
  assert.match(await card.innerText(),/2\s*238|2 238/);assert.match(await card.innerText(),/2025/)
  assert.match(await card.innerText(),/Publication originale : 2026-10-22/)
  assert.ok(await card.locator('.radar-tweet-facts li').count()<=3)
  await card.getByRole('button',{name:/Marquer .*lu/}).click()
  await page.getByLabel(`${unread-1} sujets exploitables non lus`,{exact:true}).first().waitFor({state:'attached'})
  await other.reload();await other.locator(`#subject-${salaryGroup.event.id}`).getByRole('button',{name:'Lu',exact:true}).waitFor()
  await primaryProof(other.locator(`#subject-${salaryGroup.event.id}`))
  await other.getByText(/équivalent temps plein|EQTP/).first().waitFor()
  await other.screenshot({path:`${output}/insee-${device}.png`,fullPage:true})
  // Existing draft editor and copy. No automatic writing or publishing.
  const salaryCard=other.locator(`#subject-${salaryGroup.event.id}`)
  await salaryCard.locator('.radar-draft > summary').click()
  const draft=salaryCard.getByRole('textbox',{name:/Brouillon/});await draft.waitFor()
  assert.match(await draft.inputValue(),/Source :/)
  await draft.fill('Mon texte personnalisé')
  await salaryCard.getByRole('button',{name:'Copier le brouillon',exact:true}).click()
  await salaryCard.getByText('Brouillon copié.',{exact:true}).waitFor()
  assert.equal(await other.evaluate(()=>navigator.clipboard.readText()),'Mon texte personnalisé')
  await salaryCard.getByRole('button',{name:'Rétablir le texte',exact:true}).click()
  assert.match(await draft.inputValue(),/2\s*238|2 238/)
  const grok=salaryCard.getByRole('link',{name:/Préparer une question Hey/})
  if(await grok.count()){
   await grok.click();await other.getByLabel('Suggestion du Radar',{exact:true}).waitFor()
   await other.getByRole('button',{name:'Ouvrir la question dans l’éditeur',exact:true}).click()
   await other.getByRole('textbox').first().waitFor()
   assert.match(await other.getByRole('textbox').first().inputValue(),/Hey @grok/)
   await other.goBack();await other.locator(`#subject-${salaryGroup.event.id}`).waitFor()
  }
  // Same shared policy orders the Radar and home, with all weaker topics accessible.
  await other.goto(url+'radar-editorial')
  await other.locator('.radar-list > .radar-card').first().waitFor()
  const actual=await other.locator('.radar-list > .radar-card').evaluateAll(nodes=>nodes.map(n=>n.id.replace('subject-','')))
  assert.deepEqual(actual,summary().selection.map(row=>row.id))
  await other.getByRole('button',{name:'Historique complet',exact:true}).click()
  await other.getByText('Filtrer les sujets',{exact:true}).click()
  await other.getByRole('searchbox').fill('Hello bank')
  await other.getByText('Contenu général sans nouveauté établie.',{exact:true}).waitFor()
  assert.equal(await other.locator('.radar-draft').count(),0)
  await other.getByRole('searchbox').fill('dépendance ?')
  await other.getByText(/Proposition, pas un changement confirmé/).waitFor()
  await other.getByRole('searchbox').fill('')
  assert.equal(await other.getByRole('heading',{name:/Carburant : jusqu’à/}).count(),0)
  await other.getByRole('button',{name:'À suivre',exact:true}).click()
  await other.screenshot({path:`${output}/watch-${device}.png`,fullPage:true})
  // Failure keeps the last loaded feed while badge no longer pretends zero.
  failure=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')))
  await page.getByLabel('Radar indisponible : nombre de sujets non lus inconnu',{exact:true}).first().waitFor({state:'attached'})
  await home.getByText(/momentanément indisponible/).waitFor()
  await other.getByRole('button',{name:'Actualiser',exact:true}).click();await other.getByRole('alert').waitFor()
  assert.ok(await other.getByRole('heading',{name:'Radar éditorial',exact:true}).count())
  failure=false;feed={...feed,events:[]}
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')))
  await page.getByLabel('0 sujets exploitables non lus',{exact:true}).first().waitFor({state:'attached'})
  assert.equal(await home.locator('li').count(),0)
  // Old projections are an error, not a successful empty response.
  feed={...feed,checkedAt:new Date(+now-48*3600000).toISOString()}
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')))
  await page.getByLabel('Radar indisponible : nombre de sujets non lus inconnu',{exact:true}).first().waitFor({state:'attached'})
  assert.deepEqual(errors,[])
  reports.push({device,homeWithoutRadarVisit:true,selectionMatches:true,loadingOutageZeroDistinct:true,crossTabRead:true,copy:true,notifications:'API simulated in unit tests; no send',errors})
  await context.close()
 }
 // Retain the pre-existing housing scenario and complete source conventions.
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage()
 await page.clock.setFixedTime(now)
 const source=EXTRA_SOURCES.find(s=>s.id==='credit-logement'),housing=parsePublication(await readFile('scripts/fixtures/radar-extensions/credit-logement.html','utf8'),source,'https://lobservatoire.creditlogement.fr/publications/analyse-marche-immobilier-septembre-2026',now)
 const seed=advanceRadar(null,[{...housing,entity:'silent-reference',publicationId:'silent-reference'}],{now});feed=advanceRadar(seed.state,[housing],{now}).feed
 await context.route(RADAR_URL,r=>r.fulfill({contentType:'application/json',body:JSON.stringify(feed)}))
 await context.route(summaryUrl,r=>r.fulfill({contentType:'application/json',body:JSON.stringify(summary())}))
 await page.goto(url+'radar-editorial');await page.getByRole('button',{name:'Historique complet',exact:true}).click()
 const housingCard=page.locator('.radar-card').filter({has:page.getByRole('heading',{name:'Analyse marché immobilier septembre 2026',exact:true})})
 await housingCard.waitFor();await primaryProof(housingCard)
 await housingCard.getByText('Conventions immobilières et scénario',{exact:true}).click()
 await housingCard.getByText('Explorer un scénario théorique de budget immobilier',{exact:true}).click()
 await housingCard.getByLabel('Taux nominal hypothétique (%)',{exact:true}).fill('3')
 await housingCard.getByText(/de capital théorique/).waitFor();await housingCard.getByText(/ne représente pas un taux de marché collecté/).waitFor()
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
 await page.screenshot({path:`output/housing-mobile.png`.replace('output',output),fullPage:true});await context.close()
 await writeFile(output+'/browser-report.json',JSON.stringify(reports,null,2))
 console.log('Radar browser: real publication replay, desktop/mobile home, live badge, cross-tab reads, same selection, exclusions, source proofs, copy/editor, Grok contract, outage/zero and housing conventions passed. No notification sent.')
}finally{hold=false;await browser?.close();server.kill()}
