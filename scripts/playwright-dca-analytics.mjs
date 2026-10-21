import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const base='http://127.0.0.1:4369/shinny-potato/'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4369'],{stdio:'ignore'})
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}: {})})
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto(base+'le-dca-de')
  await page.getByRole('button',{name:'Le DCA d’un abonné',exact:true}).click()
 await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
 await page.getByRole('heading',{name:'Ce que tu détiens vraiment',exact:true}).waitFor()
 await page.getByText('Chargement de l’analyse des détentions…',{exact:true}).waitFor({state:'hidden'})
 const panel=page.getByRole('region',{name:'Analyse du portefeuille',exact:true})
 await panel.getByText('Concentration et poids cumulés',{exact:true}).click()
 assert((await panel.locator('.dca-security-list details').count())>0)
 await panel.getByRole('button',{name:'Versements mensuels',exact:true}).click()
 await panel.getByRole('button',{name:'Après les versements',exact:true}).click()
 await page.getByLabel('Capital actuel pour les versements',{exact:true}).fill('1000')
 await page.getByLabel('Durée des versements en mois',{exact:true}).fill('12')
 assert((await panel.innerText()).includes('Ce n’est pas une prévision'))
 await panel.getByRole('button',{name:'Portefeuille actuel',exact:true}).click()
 await panel.getByText('Comparer deux allocations',{exact:true}).click()
 await panel.getByRole('button',{name:'Garder cette allocation comme référence',exact:true}).click()
 await panel.getByRole('button',{name:'Versements mensuels',exact:true}).click()
 assert((await panel.locator('.dca-diff-table').count())>0)
 await panel.getByRole('button',{name:'Portefeuille actuel',exact:true}).click()
 const images=await page.evaluate(async()=>{
  const {renderDcaImage}=await import('/shinny-potato/src/pages/dca-profiles/image.js')
  const {PROFILES}=await import('/shinny-potato/src/pages/dca-profiles/data.js')
  const {prepareProfile}=await import('/shinny-potato/src/pages/dca-profiles/engine.js')
  const p=prepareProfile(PROFILES[0]);const named=await renderDcaImage(p,'overlap');const anonymous=await renderDcaImage({...p,imageOnly:true,name:'PRIVATE_TEST'},'overlap')
  return {named:named.toDataURL(),anonymous:anonymous.toDataURL()}
 })
 await mkdir('test-artifacts/dca',{recursive:true})
 for(const [name,png] of Object.entries(images))await writeFile(`test-artifacts/dca/recouvrement-${name}.png`,Buffer.from(png.split(',')[1],'base64'))
 await page.evaluate(()=>scrollTo(0,0))
 await page.screenshot({path:'test-artifacts/dca/page-desktop.png',fullPage:false})
 await panel.scrollIntoViewIfNeeded();await panel.screenshot({path:'test-artifacts/dca/analyse-desktop.png'})
 await page.setViewportSize({width:390,height:844})
 await page.locator('#dca-compose').scrollIntoViewIfNeeded()
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No mobile overflow')
 await page.screenshot({path:'test-artifacts/dca/analyse-mobile.png',fullPage:false})
 // Both composition and publication stay visible without nested mobile tabs.
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900})
  assert(await page.locator('#dca-compose').isVisible())
  assert(await page.locator('#dca-draft').isVisible())
  await page.locator('#dca-draft').fill('Brouillon conservé pendant le parcours')
  await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
  await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
  assert.equal(await page.locator('#dca-draft').inputValue(),'Brouillon conservé pendant le parcours')
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
 }
 await page.goto(base)
 await page.locator('.workspace-portfolio-card').screenshot({path:'test-artifacts/dca/home-card.png'})
 assert.deepEqual(errors,[])
 console.log('DCA analytics browser: holdings, contributions, comparison, image exports and responsive page verified.')
}finally{await browser?.close();server.kill()}
