import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { staticBrowser, staticBase } from './static-browser.mjs'
import { prepareProfile } from '../src/pages/dca-profiles/engine.js'
import { PROFILES } from '../src/pages/dca-profiles/data.js'
import { newManualLine } from '../src/pages/dca-profiles/placements.js'
const artifacts='test-artifacts/dca-placements'
await mkdir(artifacts,{recursive:true})
for(const width of [1440,390,320])for(const dca of [false,true]){
 const {browser,page}=await staticBrowser(width),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 try{
  await page.goto(staticBase)
  const profile={...prepareProfile(PROFILES[0]),lines:[{asset:'world',label:'ETF Monde',isin:'IE00B4L5Y983',weight:50,amount:200}]}
  await page.evaluate(({profile,dca})=>{
   localStorage.clear()
   if(dca)localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft:'',field:'all'}))
   else localStorage.setItem('epargnant-publication:v1:simple-exposure-draft',JSON.stringify({lines:profile.lines,field:'all',exposureLimit:4}))
  },{profile,dca})
  await page.goto(staticBase+'le-dca-de'+(dca?'?mode=dca':''))
  const editor=page.locator(dca?'#dca-compose':'[aria-label="Composer les expositions"]')
  await editor.getByRole('spinbutton',{name:'Poids position 1',exact:true}).waitFor()
  const picker=editor.getByRole('group',{name:'Ajouter un actif',exact:true})
  for(const query of ['Livret A','LDDS','LEP','PEL','Fonds en euros','Compte à terme','Liquidités']){
   await picker.getByRole('searchbox').fill(query)
   assert(await picker.locator('[data-option]').count()>0,query)
  }
  await picker.getByRole('searchbox').fill('Livret A')
  await picker.locator('[data-option][data-value="livret-a"]').click()
  await editor.getByRole('spinbutton',{name:'Poids position 2',exact:true}).fill('25')
  await editor.getByRole('button',{name:'Ajouter un placement manuellement',exact:true}).click()
  const form=editor.locator('.dca-manual-form')
  await form.getByLabel('Nom du placement',{exact:true}).fill('Fonds euros Mutavie')
  await form.getByLabel('Catégorie',{exact:true}).selectOption('Fonds en euros')
  assert.equal(await form.getByLabel('Poids actuel (%)',{exact:true}).inputValue(),'25')
  if(dca){assert.equal(await form.getByLabel('Versement mensuel',{exact:false}).inputValue(),'0');await form.getByLabel('Versement mensuel',{exact:false}).fill('100')}
  await form.getByRole('button',{name:'Ajouter ce placement',exact:true}).click()
  const key=dca?'el-dca-draft-v1':'epargnant-publication:v1:simple-exposure-draft'
  const snapshot=()=>page.evaluate(({key,dca})=>{const raw=JSON.parse(localStorage.getItem(key));return dca?raw.profile.lines:raw.lines},{key,dca})
  await page.waitForFunction(({key,dca})=>{const raw=JSON.parse(localStorage.getItem(key));return (dca?raw.profile.lines:raw.lines).length===3},{key,dca})
  const saved=await snapshot(),manualId=saved[2].asset
  assert.match(manualId,/^manual:/);assert.equal(saved[2].isin,'')
  await page.locator('.dca-simple-preview img').filter({visible:true}).evaluate(async img=>img.decode())
  if(dca){const text=await page.locator('#dca-draft').inputValue();assert(text.includes('25 % Livret A'));assert(text.includes('100 € sur Fonds euros Mutavie'));assert(!text.includes('→ 0 € sur'))}
  // A second support in the same category keeps a distinct, stable identity.
  await editor.getByRole('spinbutton',{name:'Poids position 3',exact:true}).fill('24.99')
  await editor.getByRole('button',{name:'Ajouter un placement manuellement',exact:true}).click()
  const long='Épargne complémentaire — fonds en euros à long terme de la famille Élodie'
  await form.getByLabel('Nom du placement',{exact:true}).fill(long)
  await form.getByLabel('Catégorie',{exact:true}).selectOption('Fonds en euros')
  await form.getByLabel('Poids actuel (%)',{exact:true}).fill('0.01')
  await form.getByRole('button',{name:'Ajouter ce placement',exact:true}).click()
  await page.waitForFunction(({key,dca})=>{const raw=JSON.parse(localStorage.getItem(key));return (dca?raw.profile.lines:raw.lines).length===4},{key,dca})
  const four=await snapshot();assert.notEqual(four[2].asset,four[3].asset)
  await page.reload()
  await editor.getByRole('spinbutton',{name:'Poids position 4',exact:true}).waitFor()
  assert.deepEqual(await snapshot(),four)
  if(dca){
   await editor.getByRole('button',{name:'Ajouter un placement manuellement',exact:true}).click()
   await form.getByLabel('Nom du placement',{exact:true}).fill('Actions privées — Élodie')
   await form.getByLabel('Catégorie',{exact:true}).selectOption('Actions')
   await form.getByLabel('Poids actuel (%)',{exact:true}).fill('0')
   await form.getByLabel('Versement mensuel',{exact:false}).fill('50')
   await form.getByRole('button',{name:'Ajouter ce placement',exact:true}).click()
   await page.locator('.dca-simple-preview img').filter({visible:true}).evaluate(async img=>img.decode())
   assert((await page.locator('#dca-draft').inputValue()).includes('50 € sur Actions privées — Élodie'))
   await editor.getByRole('button',{name:'Retirer Actions privées — Élodie',exact:true}).click()
  }
  const portfolios=editor.locator('.dca-saved')
  await portfolios.locator('summary').click()
  await portfolios.getByLabel('Nom de la sauvegarde',{exact:true}).fill('Mix épargne')
  await portfolios.getByRole('button',{name:'Enregistrer ce portefeuille',exact:true}).click()
  await portfolios.getByText('Portefeuille enregistré sur cet appareil.',{exact:true}).waitFor()
  await portfolios.getByRole('button',{name:'Enregistrer une copie',exact:true}).click()
  const local=await page.evaluate(()=>JSON.parse(localStorage.getItem('el-dca-portfolios-v2')))
  assert.equal(local.items.length,2);assert.deepEqual(local.items[0].profile.lines,local.items[1].profile.lines)
  const download=page.waitForEvent('download')
  await portfolios.getByRole('button',{name:'Exporter ce portefeuille',exact:true}).click()
  const file=await download;await file.saveAs(`${artifacts}/mixed-${width}-${dca}.json`)
  await portfolios.getByRole('button',{name:'Ouvrir Mix épargne',exact:true}).first().click()
  assert.deepEqual(await snapshot(),four)
  await portfolios.getByLabel('Importer un portefeuille JSON',{exact:true}).setInputFiles(`${artifacts}/mixed-${width}-${dca}.json`)
  await portfolios.getByRole('button',{name:'Ouvrir le fichier importé',exact:true}).click()
  assert.deepEqual(await snapshot(),four)
  // Rename and replace a manual support; weight and monthly amount survive.
  const row=editor.locator('.dca-position').filter({has:page.locator('[aria-label="Changer l’actif position 3"]')})
  await row.getByLabel('Nom du placement',{exact:true}).fill('Mutavie — épargne personnalisée')
  await editor.getByRole('button',{name:'Changer l’actif position 3',exact:true}).click()
  const replacement=editor.getByRole('group',{name:'Remplacer l’actif position 3',exact:true})
  await replacement.getByRole('searchbox').fill('Liquidités')
  await replacement.locator('[data-option][data-value="liquidites"]').click()
  const replaced=await snapshot();assert.equal(replaced[2].asset,'liquidites');assert(!replaced[2].manual);assert.equal(replaced[2].weight,24.99);assert.equal(replaced[2].amount,dca?100:0)
  await editor.getByRole('button',{name:`Retirer ${long}`,exact:true}).click()
  await editor.getByRole('button',{name:'Affecter le solde à la position 1',exact:true}).click()
  await page.locator('.dca-simple-preview img').filter({visible:true}).evaluate(async img=>img.decode())
  await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
  await page.locator('.dca-analysis').filter({visible:true}).waitFor()
  assert((await page.locator('.dca-metrics').filter({visible:true}).innerText()).includes('hors classification'))
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow ${width}/${dca}`)
  await page.screenshot({path:`${artifacts}/mixed-${width}-${dca}.png`,fullPage:true})
  assert.deepEqual(errors,[])
  // The existing limits also apply to manual rows, without truncating recovery.
  const count=dca?8:50,full=Array.from({length:count},(_,i)=>newManualLine({label:`Épargne ${i}`,category:'Liquidités',weight:100/count,amount:0}))
  await page.evaluate(({key,dca,profile,full})=>localStorage.setItem(key,JSON.stringify(dca?{profile:{...profile,lines:full},draft:'',field:'all'}:{lines:full,field:'all',exposureLimit:4})),{key,dca,profile,full})
  await page.reload()
  await editor.getByRole('button',{name:'Ajouter un placement manuellement',exact:true}).waitFor()
  assert(await editor.getByRole('button',{name:'Ajouter un placement manuellement',exact:true}).isDisabled())
  assert.equal((await snapshot()).length,count)
 }finally{await browser.close()}
}
console.log('Navigateur : deux parcours à 1440/390/320 px, recherche, plusieurs lignes, petits poids, brouillons, copie, fichiers, remplacement, suppression et limites validés.')
