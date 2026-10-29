import registry from '../src/data/automation-workflows.json' with { type: 'json' }
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4317','--strictPort'],{stdio:'ignore'})
let browser
try {
 for(let n=0;;n++){try{if((await fetch('http://127.0.0.1:4317/shinny-potato/')).ok)break}catch{}assert(n<300);await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH})
 const page=await browser.newPage({viewport:{width:390,height:844}})
 await page.route('https://api.github.com/**/actions/workflows/automation-status.yml/runs?**',r=>r.fulfill({json:{workflow_runs:[{id:1,head_branch:'master',event:'schedule',status:'completed',conclusion:'success'}]}}))
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 let status={schemaVersion:1,workflows:{economic:{name:'Données économiques',status:'success',completedAt:'2026-10-07T10:00:00Z',lastSuccessAt:'2026-10-01T10:00:00Z',runUrl:'https://github.com/madmax91310/shinny-potato/actions/runs/1',dataFailures:{wealth:{name:'Patrimoine des ménages',completedAt:'2026-10-07T10:00:00Z',runUrl:'https://github.com/madmax91310/shinny-potato/actions/runs/1'}}}}}
 await page.route('**/automation-status/automation-status.json',route=>{
  const raw=Buffer.from(JSON.stringify({monitoring:{schemaVersion:1,checkedAt:new Date().toISOString(),active:{},resolved:[]},...status}))
  return route.fulfill({json:{schemaVersion:2,monitorStorage:'gzip+base64-v1',decodedBytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex'),data:gzipSync(raw).toString('base64')}})
 })
 await page.goto('http://127.0.0.1:4317/shinny-potato/donnees-a-revoir',{waitUntil:'networkidle'})
 const shared=page.locator('details').filter({has:page.locator('summary',{hasText:'Actions, historiques et expositions'})})
 await shared.locator('summary').click()
 const report=await (await page.request.get('http://127.0.0.1:4317/shinny-potato/data/shared-market-coverage.json')).json()
 assert.equal(report.errors.length,0)
 await shared.getByText(`${report.summary.histories} historiques`,{exact:false}).waitFor()
 assert.match(await shared.textContent(),/Les actions utilisées par les outils restent incluses/)
 assert.equal(await shared.getByRole('link').getAttribute('href'),'/shinny-potato/data/shared-market-coverage.json')
 const section=page.getByRole('region',{name:'Échecs des mises à jour automatiques'})
 await section.getByRole('heading',{name:'Patrimoine des ménages'}).waitFor()
 assert.equal(await section.getByRole('link',{name:'Voir la cause et le suivi ↗'}).getAttribute('href'),status.workflows.economic.runUrl)
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 await page.screenshot({path:'test-artifacts/automation-failure-mobile.png',fullPage:true})
 status={schemaVersion:1,workflows:{economic:{status:'success',collectionStatus:'success',name:'Données économiques',completedAt:'2026-10-09T10:00:00Z',lastSuccessAt:'2026-10-09T10:00:00Z'},pending:{status:'unknown',name:'Collecte non documentée'}}}
 await page.reload({waitUntil:'networkidle'});assert.equal(await section.count(),0)
 const overview=page.getByRole('region',{name:'Bilan des collectes automatiques'})
 assert.equal(await overview.locator('.dr-item').count(),Object.keys(registry).length+2)
 await overview.getByRole('button',{name:'Réussies · 1',exact:true}).click()
 assert.equal(await overview.locator('.dr-item').count(),1)
 assert.match(await overview.textContent(),/09\/10\/2026/)
 await overview.getByRole('button',{name:`État non documenté · ${Object.keys(registry).length+1}`,exact:true}).click()
 assert.equal(await overview.locator('.dr-item').count(),Object.keys(registry).length+1)
 await overview.getByRole('button',{name:'En échec · 0',exact:true}).click()
 await overview.getByText('Aucune collecte pour cette sélection.').waitFor()
 status={schemaVersion:1,workflows:{etf:{name:'Update active ETF issuer data',status:'failure',completedAt:'2026-10-08T13:28:34Z',runUrl:'https://github.com/madmax91310/shinny-potato/actions/runs/37784356798'}}}
 await page.reload({waitUntil:'networkidle'})
 assert.equal(await section.locator('.dr-item').count(),1)
 assert.equal(await section.getByRole('link',{name:'Voir la cause et le suivi ↗'}).getAttribute('href'),status.workflows.etf.runUrl)
 status={schemaVersion:1,workflows:{etf:{name:'Update active ETF issuer data',status:'success'}}}
 await page.reload({waitUntil:'networkidle'});assert.equal(await section.count(),0)
 status={schemaVersion:1,workflows:{insurance:{name:'Assurance-vie',status:'failure',collectionStatus:'success',publicationStatus:'failure',lastCollectionSuccessAt:'2026-10-10T10:00:00Z',lastPublicationSuccessAt:'2026-10-09T09:00:00Z',runUrl:'https://github.com/test/repo/actions/runs/2'}}}
 await page.reload({waitUntil:'networkidle'})
 assert.match(await section.textContent(),/Les données ont été collectées, mais leur publication dans l’application a échoué/)
 assert.match(await overview.textContent(),/La collecte a réussi ; son déploiement reste à reprendre/)
 const insuranceRow=overview.locator('.dr-item').filter({has:page.getByRole('heading',{name:'Assurance-vie',exact:true})})
 assert.equal(await insuranceRow.getByText('Dernier contrôle de collecte réussi',{exact:true}).count(),1)
 assert.equal(await insuranceRow.getByText('Dernière publication réussie',{exact:true}).count(),1)
 assert.match(await overview.textContent(),/10\/10\/2026/)
 assert.match(await overview.textContent(),/09\/10\/2026/)

 status={schemaVersion:1,workflows:{'update-scpi.yml':{name:'SCPI de test',status:'failure',collectionStatus:'success',recordingStatus:'failure',publicationStatus:'not-run',runUrl:'https://github.com/test/repo/actions/runs/3'}}}
 await page.reload({waitUntil:'networkidle'})
 status.recovery={'update-scpi.yml':{status:'waiting',reason:'recording-failed',nextAttemptAt:'2026-10-19T16:00:00Z'}}
 await page.reload({waitUntil:'networkidle'})
 await overview.getByText('Enregistrement en échec',{exact:true}).waitFor()
 await overview.getByRole('status').filter({hasText:'Reprise automatique : Nouvelle tentative programmée'}).waitFor()
 assert.match(await overview.textContent(),/Prochaine tentative possible/)
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 await page.screenshot({path:'test-artifacts/automation-recovery-mobile.png',fullPage:true})
 await page.setViewportSize({width:1440,height:1000})
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 await page.screenshot({path:'test-artifacts/automation-recovery-desktop.png',fullPage:true})
 await page.setViewportSize({width:390,height:844})
 assert.match(await overview.textContent(),/L’enregistrement des données validées a échoué/)
 assert.equal(await overview.getByText('Collecte en échec',{exact:true}).count(),0)

 status={schemaVersion:1,workflows:{'update-scpi.yml':{name:'SCPI de test',status:'failure',collectionStatus:'success',validationStatus:'failure',recordingStatus:'not-run',publicationStatus:'not-run'}}}
 await page.reload({waitUntil:'networkidle'})
 await overview.getByText('Validation en échec',{exact:true}).waitFor()
 const validationRow=overview.locator(':scope > .dr-list > .dr-item').filter({has:page.getByRole('heading',{name:'SCPI de test',exact:true})})
 for(const phase of ['Collecte','Validation','Enregistrement','Publication'])assert.equal(await validationRow.getByText(`${phase} de cette exécution`,{exact:true}).count(),1)
 assert.match(await validationRow.textContent(),/Leur enregistrement est bloqué/)
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))

 status={schemaVersion:1,workflows:{'update-lifestrategy.yml':{name:'Vanguard LifeStrategy',status:'success',collectionStatus:'success',completedAt:'2020-01-01T00:00:00Z'}}}
 await page.reload({waitUntil:'networkidle'})
 await overview.getByRole('button',{name:'En retard · 1',exact:true}).click()
 await overview.getByText('Contrôle en retard',{exact:true}).waitFor()
 assert.equal(await overview.locator('.dr-item').count(),1)
 status.monitoring={schemaVersion:1,checkedAt:new Date().toISOString(),active:{a:{id:'a',name:'MSCI World',kind:'conflict',field:'Poids du pays Irlande',cause:'Deux poids pour la même période',tools:['Coulisses des indices'],firstSeenAt:'2026-10-14T08:00:00Z',to:'/bibliotheque-donnees?id=world'}},resolved:[{id:'b',name:'Bill Ackman',field:'Portefeuille 13F',resolvedAt:'2026-10-14T08:00:00Z'}]}
 await page.reload({waitUntil:'networkidle'})
 const monitoring=page.getByRole('region',{name:'Surveillance des données',exact:true})
 await monitoring.getByRole('heading',{name:'MSCI World'}).waitFor()
 assert.match(await monitoring.textContent(),/Poids du pays Irlande/)
 await monitoring.getByRole('searchbox',{name:'Rechercher un incident'}).fill('introuvable')
 await monitoring.getByText('Aucun incident pour cette sélection.').waitFor()
 await monitoring.getByRole('searchbox',{name:'Rechercher un incident'}).fill('Coulisses')
 assert.equal(await monitoring.locator(':scope > .dr-list .dr-item').count(),1)
 await page.evaluate(() => { window.copiedDiagnostic = null; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedDiagnostic = text } } }) })
 await monitoring.getByRole('button', {name:'Copier le diagnostic',exact:true}).click()
 await monitoring.getByRole('status').filter({hasText:'Diagnostic copié.'}).waitFor()
 assert.match(await page.evaluate(() => window.copiedDiagnostic), /MSCI World/)
 assert.match(await page.evaluate(() => window.copiedDiagnostic), /Deux poids pour la même période/)
 await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('Blocked') } } }) })
 await monitoring.getByRole('button', {name:'Copier le diagnostic',exact:true}).click()
 assert.match(await monitoring.getByRole('textbox', {name:'Diagnostic à copier'}).inputValue(), /Conserver les dernières valeurs validées/)
 await page.screenshot({path:'test-artifacts/alert-center-mobile.png',fullPage:true})

 await monitoring.getByText('Retours à la normale · 1').click()
 assert.match(await monitoring.textContent(),/Bill Ackman/)
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 status.monitoring.active.history = {id:'history',name:'ETF récent',dataId:'TEST-ISIN',kind:'history',field:'Historique mensuel',cause:'Période absente : 2026-08',missingPeriods:['2026-08'],checkedAt:'2026-10-17',asOf:'2026-09',tools:['Performance depuis']}
 await page.reload({waitUntil:'networkidle'})
 await monitoring.getByRole('button',{name:'Historique incomplet · 1',exact:true}).click()
 await monitoring.getByRole('searchbox',{name:'Rechercher un incident'}).fill('TEST-ISIN')
 assert.equal(await monitoring.locator(':scope > .dr-list .dr-item').count(),1)
 assert.match(await monitoring.locator(':scope > .dr-list .dr-item').textContent(),/2026-09/)
 assert.equal(await monitoring.getByRole('button',{name:'Valeur suspecte · 0',exact:true}).count(),0)
 await monitoring.screenshot({path:'test-artifacts/alert-center-mobile.png'})
 await page.setViewportSize({width:1440,height:1000})
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 await monitoring.screenshot({path:'test-artifacts/alert-center-desktop.png'})
 await page.setViewportSize({width:390,height:844})
 status.monitoring.checkedAt='2020-01-01T00:00:00Z'
 await page.reload({waitUntil:'networkidle'})
 await monitoring.getByRole('status').filter({hasText:'Le contrôle horaire'}).waitFor()
 await page.unroute('**/automation-status/automation-status.json')
 await page.route('**/automation-status/automation-status.json',route=>route.fulfill({status:503,body:'unavailable'}))
 await page.reload({waitUntil:'networkidle'})
 await page.getByRole('status').filter({hasText:'Le suivi des automatisations'}).waitFor()
 assert.deepEqual(errors,[])
 console.log('Automation overview UI: success, unknown, filters, dates, failures, recovery, unavailable status, links and mobile layout OK')
}finally{await browser?.close();server.kill()}

