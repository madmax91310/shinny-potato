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
 // Image-only edits preserve custom text and revoke participant approval.
 const custom='Texte personnel à conserver pendant les réglages d’image'
 await page.locator('#dca-draft').fill(custom)
 await page.getByText('Personnaliser l’image',{exact:true}).filter({visible:true}).click()
 await page.getByRole('group',{name:'Catégories par donut',exact:true}).locator('[data-option][data-value="6"]').click()
 assert.equal(await page.locator('#dca-draft').inputValue(),custom)
 await page.getByRole('checkbox',{name:'Ajouter le top 10 des entreprises',exact:true}).check()
 assert.equal(await page.locator('#dca-draft').inputValue(),custom)
 await page.getByRole('checkbox',{name:'Ajouter le top 10 des entreprises',exact:true}).uncheck()
 // Changes to the portfolio preserve manual text, including a temporarily
 // invalid weight, while automatic text resumes correctly after validation.
 const amount=page.getByLabel('DCA position 1',{exact:true}),weight=page.getByLabel('Poids position 1',{exact:true})
 const initialAmount=await amount.inputValue(),initialWeight=await weight.inputValue()
 await amount.fill(String(Number(initialAmount)+1))
 await weight.fill('')
 assert.equal(await page.locator('#dca-draft').inputValue(),custom)
 await weight.fill(initialWeight)
 await page.reload()
 assert.equal(await page.locator('#dca-draft').inputValue(),custom)
 await page.getByRole('button',{name:'Rétablir le texte',exact:true}).click()
 const regenerated=await page.locator('#dca-draft').inputValue()
 await weight.fill('')
 assert.equal(await page.locator('#dca-draft').inputValue(),regenerated,'Invalid intermediate inputs do not blank the draft')
 await weight.fill(initialWeight)
 await amount.fill(initialAmount)
 assert.notEqual(await page.locator('#dca-draft').inputValue(),regenerated,'Untouched automatic text still tracks contributions')
 await page.locator('#dca-draft').fill(custom)
 await page.getByText('Personnaliser l’image',{exact:true}).filter({visible:true}).click()
 await page.getByRole('button',{name:'Créer une participation',exact:true}).click()
 const consent=page.getByRole('checkbox',{name:'La personne a validé',exact:false})
 for(const field of ['countries','sectors','both','all','overlap']){
  await consent.check()
  await page.getByRole('group',{name:'Donuts de l’image',exact:true}).locator(`[data-option][data-value="${field}"]`).click()
  assert.equal(await consent.isChecked(),false,'A changed image needs a new approval')
 }
 await page.locator('#dca-draft').fill(custom)
 await consent.check()
 await page.getByRole('group',{name:'Catégories par donut',exact:true}).locator('[data-option][data-value="4"]').click()
 assert.equal(await consent.isChecked(),false)
 assert.equal(await page.locator('#dca-draft').inputValue(),custom)
 await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
 await page.getByRole('heading',{name:'Ce que tu détiens vraiment',exact:true}).waitFor()
 await page.getByText('Chargement de l’analyse des détentions…',{exact:true}).waitFor({state:'hidden'})
 const panel=page.getByRole('region',{name:'Analyse du portefeuille',exact:true})
 await panel.getByText('Concentration et poids cumulés',{exact:true}).click()
 await panel.locator('.dca-security-list details').first().waitFor({state:'visible'})
 assert((await panel.locator('.dca-security-list details').count())>0)
 await panel.getByRole('button',{name:'Versements mensuels',exact:true}).click()
 await panel.getByRole('button',{name:'Après les versements',exact:true}).click()
 await page.getByLabel('Capital actuel pour les versements',{exact:true}).fill('1000')
 await page.getByLabel('Durée des versements en mois',{exact:true}).fill('12')
 assert((await panel.innerText()).includes('Ce n’est pas une prévision'))
 await panel.getByRole('button',{name:'Portefeuille actuel',exact:true}).click()
 await panel.getByText('Comparer deux allocations',{exact:true}).click()
 await panel.getByRole('button',{name:'Garder cette allocation comme référence',exact:true}).click()
 await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
 await panel.waitFor({state:'hidden'})
 await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
 await panel.getByText('Comparer deux allocations',{exact:true}).click()
 await panel.getByRole('button',{name:'Effacer la référence',exact:true}).waitFor()
 await panel.getByRole('button',{name:'Versements mensuels',exact:true}).click()
 assert.equal(await panel.locator('.dca-diff-table').count(),0,'Mixed source conventions are not certified as comparable')
 assert((await panel.getByText('Les dates ou les méthodes ne permettent pas de comparer ces ventilations.',{exact:true}).count())>0)
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
 // Trace the canvas behind the actual preview URL, rather than testing an
 // independent render that could conceal a different UI selection.
 await page.addInitScript(()=>{
  const fill=CanvasRenderingContext2D.prototype.fillText,toBlob=HTMLCanvasElement.prototype.toBlob,create=URL.createObjectURL
  const labels=new WeakMap();window.dcaPreviewLabels={}
  CanvasRenderingContext2D.prototype.fillText=function(value,...args){(this.canvas.dcaLabels??=[]).push(String(value));return fill.call(this,value,...args)}
  HTMLCanvasElement.prototype.toBlob=function(callback,...args){const drawn=[...(this.dcaLabels||[])];return toBlob.call(this,blob=>{if(blob)labels.set(blob,drawn);callback(blob)},...args)}
  URL.createObjectURL=function(blob){const url=create.call(this,blob);if(labels.has(blob))window.dcaPreviewLabels[url]=labels.get(blob);return url}
 })
 const fixtureDate=new Date().toISOString().slice(0,10)
 await page.route(/\/holdings-\d+\.json/,route=>/[?&](import|url)([=&]|$)/.test(route.request().url())?route.continue():route.fulfill({json:{
  world:{asOf:fixtureDate,basis:'fund',sourceUrl:'https://example.com/fund',complete:true,rows:[{isin:'US0378331005',name:'Apple',weightPct:100}]},
  FR001400ZGO4:{asOf:fixtureDate,basis:'index',sourceUrl:'https://example.com/index',complete:true,rows:[{isin:'US5949181045',name:'Microsoft',weightPct:100}]},
 }}))
 for(const imageOnly of [false,true]){
  await page.evaluate(async imageOnly=>{
   const {references}=await import('/shinny-potato/src/pages/dca-profiles/engine.js')
   const profile={id:'browser-consistency',name:'Test',mode:'participant',scope:'Portefeuille investi',imageOnly,
    lines:[['world',90,100],['FR001400ZGO4',10,900]].map(([asset,weight,amount])=>({asset,weight,amount,isin:references[asset].isin,label:references[asset].name}))}
   localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft:'Texte préservé',field:'overlap'}))
   localStorage.setItem('epargnant-publication:v1:simple-exposure-draft',JSON.stringify({lines:profile.lines,field:'overlap',exposureLimit:4}))
  },imageOnly)
  await page.goto(base+'le-dca-de'+(imageOnly?'':'?mode=dca'))
  await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
  const current=page.getByRole('region',{name:'Analyse du portefeuille',exact:true})
  await current.getByText('Concentration et poids cumulés',{exact:true}).click()
  await current.locator('.dca-security-list details').first().waitFor()
  const scope=current.locator('[aria-label="Périmètre des détentions"]')
  assert(await scope.getByRole('button',{name:/Positions publiées/}).getAttribute('aria-pressed')==='true','Largest covered scope is the default on screen')
  async function assertPreview(expected,scopeLabel){
   await page.locator('.dca-simple-preview:visible img').waitFor()
   const drawn=await page.locator('.dca-simple-preview:visible img').evaluate(img=>window.dcaPreviewLabels[img.src])
   assert(drawn?.includes(expected),`Actual preview contains ${expected}`)
   assert(drawn.includes(scopeLabel),'Actual preview uses the selected scope')
   assert((await current.locator('.dca-concentration').innerText()).includes(expected),'Screen uses the same weights')
  }
  await assertPreview('90 %','Périmètre : positions publiées')
  await scope.getByRole('button',{name:/Indices suivis/}).click()
  await assertPreview('10 %','Périmètre : indices suivis')
  if(!imageOnly){
   await current.getByRole('button',{name:'Versements mensuels',exact:true}).click()
   await assertPreview('90 %','Périmètre : indices suivis')
   await current.getByRole('button',{name:'Après les versements',exact:true}).click()
   await page.getByLabel('Capital actuel pour les versements',{exact:true}).fill('1000')
   await page.getByLabel('Durée des versements en mois',{exact:true}).fill('1')
   await assertPreview('50 %','Périmètre : positions publiées')
   assert.equal(await page.locator('#dca-draft').inputValue(),'Texte préservé')
  }
  await page.reload()
  await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
  await current.getByText('Concentration et poids cumulés',{exact:true}).click()
  await current.locator('.dca-security-list details').first().waitFor()
  await assertPreview(imageOnly?'10 %':'50 %',imageOnly?'Périmètre : indices suivis':'Périmètre : positions publiées')
 }
 // A damaged draft is archived once and the replacement resumes autosaving.
 const recovery=await browser.newPage({viewport:{width:390,height:844}})
 await recovery.goto(base+'le-dca-de?mode=dca')
 await recovery.locator('#dca-draft').waitFor()
 await recovery.evaluate(()=>localStorage.setItem('el-dca-draft-v1','damaged original draft'))
 await recovery.reload()
 await recovery.getByText('L’ancien brouillon est conservé à part. Le nouveau brouillon est enregistré automatiquement.',{exact:true}).waitFor()
 await recovery.getByLabel('Pseudonyme',{exact:true}).fill('Brouillon récupéré')
 await recovery.waitForFunction(()=>JSON.parse(localStorage.getItem('el-dca-draft-v1')).profile.name==='Brouillon récupéré')
 assert(await recovery.evaluate(()=>Object.keys(localStorage).some(key=>key.startsWith('el-dca-draft-v1-recovery-')&&localStorage.getItem(key)==='damaged original draft')))
 await recovery.reload()
 assert.equal(await recovery.getByLabel('Pseudonyme',{exact:true}).inputValue(),'Brouillon récupéré')
 // A failed bucket does not discard other compositions. Retrying recovers the
 // missing one and refreshes the actual preview, without touching manual text.
 const manifest=(await import('../src/pages/dca-profiles/holdings-manifest.json',{with:{type:'json'}})).default
 assert.notEqual(manifest.world,manifest.nasdaq)
 let failBucket=true
 await recovery.route(/\/holdings-\d+\.json/,route=>{
  if(/[?&](import|url)([=&]|$)/.test(route.request().url()))return route.continue()
  const bucket=Number(route.request().url().match(/holdings-(\d+)\.json/)[1])
  if(failBucket&&bucket===manifest.nasdaq)return route.abort()
  const data={}
  for(const [asset,isin,name] of [['world','US0378331005','Apple'],['nasdaq','US5949181045','Microsoft']])if(manifest[asset]===bucket)data[asset]={asOf:fixtureDate,basis:'fund',sourceUrl:'https://example.com/'+asset,complete:true,rows:[{isin,name,weightPct:100}]}
  return route.fulfill({json:data})
 })
 await recovery.evaluate(async()=>{
  const {references}=await import('/shinny-potato/src/pages/dca-profiles/engine.js')
  const profile={id:'partial-recovery',name:'Test',mode:'participant',scope:'Portefeuille investi',lines:[['world',60],['nasdaq',40]].map(([asset,weight])=>({asset,weight,amount:100,isin:references[asset].isin,label:references[asset].name}))}
  localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft:'Mon texte conservé',field:'overlap'}))
 })
 await recovery.reload()
 await recovery.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
 const partial=recovery.getByRole('region',{name:'Analyse du portefeuille',exact:true})
 await partial.getByRole('button',{name:'Relancer l’analyse',exact:true}).waitFor()
 await partial.getByText('Concentration et poids cumulés',{exact:true}).click()
 await partial.locator('.dca-security-list details').first().waitFor()
 assert.equal(await partial.locator('.dca-security-list details').count(),1)
 assert((await partial.locator('.dca-concentration').innerText()).includes('60 %'))
 await recovery.locator('.dca-publication-column .dca-simple-preview img').waitFor()
 const partialPreview=await recovery.locator('.dca-publication-column .dca-simple-preview img').getAttribute('src')
 await recovery.getByRole('checkbox',{name:'La personne a validé',exact:false}).check()
 failBucket=false
 await partial.getByText('Sources, couverture du catalogue et détail des comparaisons',{exact:true}).click()
 await partial.getByText('Positions communes entre ETF et actions',{exact:true}).click()
 await partial.getByRole('button',{name:'Réessayer',exact:true}).click()
 await partial.getByRole('button',{name:'Relancer l’analyse',exact:true}).waitFor({state:'hidden'})
 await partial.locator('.dca-security-list details').nth(1).waitFor()
 assert((await partial.locator('.dca-concentration').innerText()).includes('100 %'))
 await recovery.locator('.dca-publication-column .dca-simple-preview img').waitFor()
 assert.notEqual(await recovery.locator('.dca-publication-column .dca-simple-preview img').getAttribute('src'),partialPreview)
 assert.equal(await recovery.locator('#dca-draft').inputValue(),'Mon texte conservé')
 assert.equal(await recovery.getByRole('checkbox',{name:'La personne a validé',exact:false}).isChecked(),false,'Recovered compositions change the image and revoke approval')
 await recovery.close()
 await page.getByRole('link',{name:'← Tous les outils',exact:true}).click()
 const homeCard=page.locator('.workspace-tool-card[href$="/le-dca-de"]')
 await homeCard.getByRole('heading',{name:'Portefeuille & DCA',exact:true}).waitFor()
 assert.equal(await homeCard.count(),1,'The portfolio tool appears once on the complete home')
 await homeCard.screenshot({path:'test-artifacts/dca/home-card.png'})
 assert.deepEqual(errors,[])
 console.log('DCA analytics browser: holdings, contributions, comparison, image exports and responsive page verified.')
}finally{await browser?.close();server.kill()}
