import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import registry from '../src/data/automation-workflows.json' with {type:'json'}

const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4397','--strictPort'],{stdio:'ignore'})
const base='http://127.0.0.1:4397/shinny-potato'
let browser
try {
  for(let n=0;n<100;n++){
    try {if((await fetch(base+'/')).ok)break} catch {}
    if(n===99)throw Error('Preview unavailable')
    await new Promise(resolve=>setTimeout(resolve,200))
  }
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})})
  const page=await browser.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  const now=new Date().toISOString(),workflow='update-editorial-radar.yml'
  const dedicated={id:'monitor:radar',name:'Radar arrêté de recette',kind:'unobserved',field:'Lecture du radar',cause:'Flux absent',tools:['Radar éditorial'],firstSeenAt:'2026-11-09T08:00:00Z'}
  const shared={id:'collection:shared-fixture',workflow,name:'Donnée partagée de recette',kind:'collection',field:'Composition',cause:'Contradiction conservée',dataId:'radar:insee',tools:['Radar éditorial','Pouvoir d’achat'],firstSeenAt:'2026-11-09T08:00:00Z'}
  const workflows=Object.fromEntries(Object.entries(registry).map(([id,c])=>[id,{name:c.name,completedAt:now,status:'success',collectionStatus:'success',dataFailures:{}}]))
  const snapshot={schemaVersion:1,workflows,monitoring:{schemaVersion:1,checkedAt:now,active:{[dedicated.id]:dedicated,[shared.id]:shared},resolved:[]}}
  await page.route('**/automation-status/automation-status.json',r=>r.fulfill({json:snapshot}))
  await page.route('https://api.github.com/**/actions/workflows/automation-status.yml/runs?**',r=>r.fulfill({json:{workflow_runs:[{id:1,head_branch:'master',event:'schedule',status:'completed',conclusion:'success'}]}}))
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:900})
    await page.goto(base+'/donnees-a-revoir',{waitUntil:'networkidle'})
    await page.getByText('Documents sources : moniteur, producteurs et couverture par champ',{exact:true}).click()
    const monitor=page.getByRole('region',{name:'Surveillance des données',exact:true})
    await monitor.getByText('1 entrées de suivi · 1 signalement(s) conservé(s)',{exact:false}).waitFor()
    await monitor.getByRole('searchbox',{name:'Rechercher un incident'}).fill('Donnée partagée de recette')
    await monitor.locator(':scope > .dr-list').getByRole('heading',{name:'Donnée partagée de recette',exact:true}).waitFor()
    assert.equal(await monitor.locator(':scope > .dr-list').getByRole('heading',{name:'Radar arrêté de recette',exact:true}).count(),0)
    await monitor.locator('summary').filter({hasText:'Retirés du périmètre'}).click()
    await monitor.getByRole('heading',{name:'Radar arrêté de recette',exact:true}).waitFor()
    assert((await monitor.innerText()).includes('Ces incidents ne sont pas comptés comme des données réparées.'))
    const inbox=page.getByRole('region',{name:'Tous les problèmes de données'})
    await inbox.getByRole('searchbox',{name:'Recherche globale des problèmes'}).fill('Donnée partagée de recette')
    await inbox.getByRole('heading',{name:'Donnée partagée de recette · Composition',exact:true}).waitFor()
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow')
  }
  assert.deepEqual(errors,[])
  console.log('Radar retirement browser: desktop/mobile, shared anomaly active, service history archived without repair, no overflow or page errors.')
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
