import assert from 'node:assert/strict'
import {staticBrowser,staticBase} from './static-browser.mjs'
import {newManualLine} from '../src/pages/dca-profiles/placements.js'
import {mkdir} from 'node:fs/promises'
for(const width of [1440,390]){
 const {browser,page}=await staticBrowser(width)
 try{
  const errors=[];page.on('pageerror',error=>errors.push(error.message))
  await page.addInitScript(()=>{window.labels=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(value,...args){window.labels.push(String(value));return original.call(this,value,...args)}})
  await page.goto(staticBase+'le-dca-de?mode=dca')
  const profile={id:'subscriber:unlimited',mode:'participant',name:'Épargne sans plafond',scope:'Portefeuille investi',lines:Array.from({length:200},(_,i)=>newManualLine({label:`Placement ${i}`,category:'Fonds en euros',weight:.5,amount:0}))}
  const draft='Texte personnalisé conservé. '.repeat(1000)
  await page.evaluate(({profile,draft})=>localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft,draftEdited:true,field:'all'})),{profile,draft})
  await page.reload()
  await page.getByText('200 positions',{exact:false}).filter({visible:true}).waitFor()
  await page.getByRole('button',{name:'Ajouter un placement manuellement',exact:true}).click()
  const form=page.locator('.dca-manual-form')
  await form.getByLabel('Nom du placement',{exact:true}).fill('Placement 200')
  await form.getByLabel('Catégorie',{exact:true}).selectOption('Fonds en euros')
  await form.getByLabel('Poids actuel (%)',{exact:true}).fill('0')
  await form.getByLabel('Versement mensuel (€/mois, facultatif)',{exact:true}).fill('1')
  await form.getByRole('button',{name:'Ajouter ce placement',exact:true}).click()
  await page.getByText('201 positions',{exact:false}).filter({visible:true}).waitFor()
  const nav=page.getByRole('navigation',{name:'Images à exporter'}).filter({visible:true})
  await nav.waitFor({timeout:60000})
  assert.equal(await page.locator('#dca-draft').inputValue(),draft)
  await page.getByText('Mes portefeuilles',{exact:true}).filter({visible:true}).click()
  await page.getByLabel('Nom de la sauvegarde',{exact:true}).filter({visible:true}).fill('Grande allocation')
  await page.getByRole('button',{name:'Enregistrer ce portefeuille',exact:true}).filter({visible:true}).click()
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('el-dca-portfolios-v2')).items[0].profile.lines.length),201)
  await page.reload();await nav.waitFor({timeout:60000})
  assert.equal(await page.locator('#dca-draft').inputValue(),draft)
  if(width===390){
   const large={...profile,lines:Array.from({length:1000},(_,i)=>newManualLine({label:`Placement ${i}`,category:'Fonds en euros',weight:.1,amount:0}))}
   await page.evaluate(({profile,draft})=>localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft,draftEdited:true,field:'all'})),{profile:large,draft})
   await page.reload();await nav.waitFor({timeout:60000})
   await nav.getByRole('button',{name:'Répartition des actifs',exact:true}).click()
   const image=page.locator('.dca-simple-preview img').filter({visible:true})
   await image.evaluate(image=>image.decode())
   assert(await image.evaluate(image=>image.naturalHeight<=16000&&image.naturalWidth<1600))
   const labels=await page.evaluate(()=>window.labels)
   for(let i=0;i<1000;i++)assert(labels.includes(`Placement ${i}`),`Missing ${i}`)
   const pending=page.waitForEvent('download')
   await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).filter({visible:true}).click()
   assert.match((await pending).suggestedFilename(),/-allocation\.png$/)
  }
  await page.evaluate(()=>{const {profile}=JSON.parse(localStorage.getItem('el-dca-draft-v1'));localStorage.setItem('epargnant-publication:v1:simple-exposure-draft',JSON.stringify({lines:profile.lines.filter(l=>l.weight>0),field:'all',exposureLimit:4}))})
  await page.goto(staticBase+'le-dca-de');await nav.waitFor({timeout:60000})
  assert(await page.getByRole('button',{name:'Ajouter un placement manuellement',exact:true}).filter({visible:true}).isEnabled())
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  assert.deepEqual(errors,[])
  await mkdir('test-artifacts',{recursive:true});await page.screenshot({path:`test-artifacts/unlimited-${width}.png`})
  console.log(`Unlimited ${width}px: >200 additions, saves/long draft restore, image hook and both workflows; large canvas PNG and all 1000 labels on mobile passed.`)
 }finally{await browser.close()}
}
