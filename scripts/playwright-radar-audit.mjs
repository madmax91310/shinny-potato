import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn,execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile,mkdir,writeFile } from 'node:fs/promises'
import {publicationSelection} from '../src/lib/radar-editorial.js'
import {makeRadarOverview} from '../src/lib/radar-overview.js'
import { RADAR_URL } from '../src/pages/editorial-radar/client.js'
const output='test-artifacts/radar-audit'
await mkdir(output,{recursive:true})
await promisify(execFile)('node',['scripts/replay-radar-audit.mjs',output])
const feed=JSON.parse(await readFile(output+'/feed.json','utf8')),now=new Date('2026-10-25T16:00:00Z')
const url='http://127.0.0.1:4329/shinny-potato/radar-editorial'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4329','--strictPort'],{stdio:'ignore'})
let browser
const reports=[]
try{
 for(let i=0;i<300;i++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({...process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{},args:['--no-sandbox']})
 for(const [device,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,isMobile:device==='mobile',hasTouch:device==='mobile'}),page=await context.newPage(),errors=[]
  await page.clock.setFixedTime(now)
  page.on('pageerror',e=>errors.push(e.message))
  await context.route(RADAR_URL,r=>r.fulfill({contentType:'application/json',body:JSON.stringify(feed)}))
  await context.route('**/radar-data/summary.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(makeRadarOverview(feed,publicationSelection(feed.events,{now:+now})))}))
  await page.goto(url)
  const median=page.getByRole('heading',{name:/Salaire médian du privé :/}).first();await median.waitFor()
  assert.equal(await page.getByRole('heading',{name:/perspectives de mises en chantier/}).count(),0,'Professional opinions cannot displace observed household statistics')
  await page.screenshot({path:`${output}/${device}-selection.png`,fullPage:true})
  await page.getByRole('button',{name:'Historique complet',exact:true}).click()
  await page.getByText('Filtrer les sujets',{exact:true}).click()
  const search=page.locator('input[type="search"]');await search.fill('salaire')
  const salaryGroup=page.locator('.radar-group').filter({has:page.getByRole('heading',{name:/Salaire médian du privé :/})}).first()
  await salaryGroup.waitFor();assert.ok(await salaryGroup.locator('a[href="https://www.insee.fr/fr/statistiques/9087193"]').count())
  await salaryGroup.locator('.radar-proof > summary').click()
  await salaryGroup.locator('.radar-related').first().waitFor({state:'attached'})
  assert.ok(await salaryGroup.locator('.radar-related').count()>=4,'Original facts and media contribution remain accessible')
  await salaryGroup.getByRole('button',{name:'Marquer le sujet comme lu',exact:true}).click()
  await page.reload();await page.getByRole('button',{name:'Historique complet',exact:true}).click()
  await page.getByText('Filtrer les sujets',{exact:true}).click();await page.locator('input[type="search"]').fill('salaire')
  await page.locator('.radar-group').filter({has:page.getByRole('heading',{name:/Salaire médian du privé :/})}).first().getByRole('button',{name:'Lu',exact:true}).waitFor()
  await page.locator('input[type="search"]').fill('')
  await page.getByRole('button',{name:'Autres sujets exploitables',exact:true}).click()
  const card=page.locator('.radar-card').filter({has:page.getByRole('heading',{name:/New ETF and ETP Listings on October 21/})}).first()
  await card.waitFor();await card.locator('.radar-proof > summary').click();await card.locator('.radar-related > summary').first().click();await card.locator('.radar-products > details').first().waitFor();assert.equal(await card.locator('.radar-products > details').count(),6)
  await card.getByText('Fidelity Global Equity Dynamic Buffer UCITS ETF - Acc',{exact:true}).click()
  await card.getByText('IE0001Y8K1A5',{exact:true}).waitFor();assert.ok((await card.innerText()).includes('0.500%'))
  assert.ok((await card.innerText()).includes('Non documenté'))
  const amundi=page.locator('.radar-card').filter({has:page.getByRole('heading',{name:/Amundi élargit sa gamme/})}).first()
  await amundi.waitFor();await amundi.locator('.radar-proof > summary').click();await amundi.locator('.radar-related > summary').first().click();await amundi.locator('.radar-products > details').first().waitFor();assert.equal(await amundi.locator('.radar-products > details').count(),3)
  await amundi.getByText('Étapes liées et preuves',{exact:true}).first().click();await amundi.getByText('Sujet de cotation',{exact:true}).waitFor()
  assert.match(await amundi.innerText(),/2026-10-21/);assert.match(await amundi.innerText(),/2026-10-23/)
  await page.screenshot({path:`${output}/${device}-etf.png`,fullPage:true})
  await page.getByRole('button',{name:'À suivre',exact:true}).click()
  await page.getByRole('heading',{name:/perspectives de mises en chantier/}).waitFor()
  assert.ok((await page.locator('.radar-list').innerText()).includes('Prévision ou anticipation')||(await page.locator('.radar-list').innerText()).includes('Enquête auprès de professionnels'))
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1))
  assert.deepEqual(errors,[])
  reports.push({device,errors,source:'captured audit replay, not production',readPersistence:true,allXetraRows:true,linkedStages:true,horizontalOverflow:false,notifications:'simulation only; no send'})
  await context.close()
 }
 await writeFile(output+'/browser-report.json',JSON.stringify(reports,null,2))
 console.log('Radar audit browser: desktop/mobile selection, original/reprise dossier, history/read persistence, six Xetra rows, unknowns, separate listing stage and forecasts verified. No notification sent.')
}finally{await browser?.close();server.kill()}
