import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4317','--strictPort'],{stdio:'ignore'})
let browser
try {
 for(let n=0;;n++){try{if((await fetch('http://127.0.0.1:4317/shinny-potato/')).ok)break}catch{}assert(n<100);await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH})
 const page=await browser.newPage({viewport:{width:390,height:844}})
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 let status={schemaVersion:1,workflows:{economic:{name:'Données économiques',status:'failure',completedAt:'2026-10-07T10:00:00Z',lastSuccessAt:'2026-10-01T10:00:00Z',runUrl:'https://github.com/madmax91310/shinny-potato/actions/runs/1',dataFailures:{wealth:{name:'Patrimoine des ménages',completedAt:'2026-10-07T10:00:00Z',runUrl:'https://github.com/madmax91310/shinny-potato/actions/runs/1'}}}}}
 await page.route('**/automation-status/automation-status.json',route=>route.fulfill({json:status}))
 await page.goto('http://127.0.0.1:4317/shinny-potato/donnees-a-revoir',{waitUntil:'networkidle'})
 const section=page.getByRole('region',{name:'Échecs des mises à jour automatiques'})
 await section.getByRole('heading',{name:'Patrimoine des ménages'}).waitFor()
 assert.equal(await section.getByRole('link',{name:'Voir la cause et le suivi ↗'}).getAttribute('href'),status.workflows.economic.runUrl)
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 await page.screenshot({path:'test-artifacts/automation-failure-mobile.png',fullPage:true})
 status={schemaVersion:1,workflows:{economic:{status:'success',name:'Données économiques',completedAt:'2026-10-09T10:00:00Z',lastSuccessAt:'2026-10-09T10:00:00Z'},pending:{status:'unknown',name:'Collecte non documentée'}}}
 await page.reload({waitUntil:'networkidle'});assert.equal(await section.count(),0)
 const overview=page.getByRole('region',{name:'Bilan des collectes automatiques'})
 assert.equal(await overview.locator('.dr-item').count(),2)
 await overview.getByRole('button',{name:'Réussies · 1',exact:true}).click()
 assert.equal(await overview.locator('.dr-item').count(),1)
 assert.match(await overview.textContent(),/09\/10\/2026/)
 await overview.getByRole('button',{name:'État non documenté · 1',exact:true}).click()
 assert.equal(await overview.locator('.dr-item').count(),1)
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
 assert.equal(await overview.getByText('Dernier contrôle de collecte réussi',{exact:true}).count(),1)
 assert.equal(await overview.getByText('Dernière publication réussie',{exact:true}).count(),1)
 assert.match(await overview.textContent(),/10\/10\/2026/)
 assert.match(await overview.textContent(),/09\/10\/2026/)

 await page.unroute('**/automation-status/automation-status.json')
 await page.route('**/automation-status/automation-status.json',route=>route.fulfill({status:503,body:'unavailable'}))
 await page.reload({waitUntil:'networkidle'})
 await page.getByRole('status').filter({hasText:'Le suivi des automatisations'}).waitFor()
 assert.deepEqual(errors,[])
 console.log('Automation overview UI: success, unknown, filters, dates, failures, recovery, unavailable status, links and mobile layout OK')
}finally{await browser?.close();server.kill()}
