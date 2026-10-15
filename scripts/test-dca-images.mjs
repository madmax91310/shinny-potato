import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
const base='http://127.0.0.1:4367/shinny-potato/'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4367'],{stdio:'ignore'})
let browser
try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{} await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']} : {})})
  const page=await browser.newPage({viewport:{width:1440,height:1100}})
  await page.goto(base+'le-dca-de')
  const records=await page.evaluate(async()=>{
    const {PROFILES, ASSETS}=await import('/shinny-potato/src/pages/dca-profiles/data.js')
    const {prepareProfile, references}=await import('/shinny-potato/src/pages/dca-profiles/engine.js')
    const {renderDcaImage}=await import('/shinny-potato/src/pages/dca-profiles/image.js')
    const original=CanvasRenderingContext2D.prototype.fillText
    let labels=[],boxes=[]
    CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...args){
      const m=this.measureText(value), box={left:x-m.actualBoundingBoxLeft,right:x+m.actualBoundingBoxRight,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent,value}
      if(box.left<0||box.right>1601||box.top<0||box.bottom>1068) throw Error('Clipped: '+value)
      for(const b of boxes)if(Math.min(b.right,box.right)-Math.max(b.left,box.left)>1&&Math.min(b.bottom,box.bottom)-Math.max(b.top,box.top)>1)throw Error(`Overlap: ${b.value} / ${value}`)
      labels.push(String(value)); boxes.push(box)
      return original.call(this,value,x,y,...args)
    }
    const output=[]
    const cases=[...PROFILES,
      {...prepareProfile(PROFILES[0]),id:'eight-lines',name:'Pseudonyme long pour vérifier le rendu mobile',lines:Object.keys(ASSETS).slice(0,8).map((asset,i)=>({asset,label:ASSETS[asset][1],emoji:ASSETS[asset][0],weight:12.5,amount:i?1000000:0,isin:''}))},
      {...prepareProfile(PROFILES[0]),id:'zero-dca',lines:prepareProfile(PROFILES[0]).lines.map(l=>({...l,amount:0}))},
      {...prepareProfile(PROFILES[0]),id:'karim-approved',name:'Karim',age:32,job:'informaticien',location:'',income:2500,variable:false,lines:[['world',70,350],['europe',20,100],['emerging',10,50]].map(([asset,weight,amount])=>({asset,label:ASSETS[asset][1],emoji:ASSETS[asset][0],weight,amount,isin:references[asset].isin}))}
    ]
    for(const [index,{raw,field}] of cases.flatMap(raw=>['countries','sectors'].map(field=>({raw,field}))).entries()){
      const profile=raw.lines.every(l=>Number.isFinite(l.weight))?raw:prepareProfile(raw,index)
      labels=[];boxes=[]
      const canvas=await renderDcaImage(profile,field)
      if(labels.some(l=>/fictif|undefined|\bNaN\b/i.test(l)))throw Error(profile.id+' unwanted text')
      if(!labels.includes(profile.name)||labels.filter(l=>l==='Épargnant Libre').length!==1)throw Error('Identity: '+profile.id)
      for(const line of profile.lines)if(!labels.join(' ').includes(line.label))throw Error('Allocation missing: '+profile.id)
      output.push({id:profile.id+'-'+field,labels:[...labels],png:['julien','alexandre','patrick','arthur','laurent','helene','eight-lines','zero-dca','karim-approved'].includes(profile.id)?canvas.toDataURL():null})
    }
    CanvasRenderingContext2D.prototype.fillText=original
    return output
  })
  assert.equal(records.length,206)
  await mkdir('test-artifacts/dca',{recursive:true})
  for(const record of records.filter(r=>r.png))await writeFile(`test-artifacts/dca/${record.id}.png`,Buffer.from(record.png.split(',')[1],'base64'))
  await page.getByRole('button',{name:'Créer une participation',exact:true}).click()
  await page.getByLabel('Pseudonyme',{exact:true}).fill('Test participation')
  await page.getByLabel('DCA position 1',{exact:true}).fill('300')
  assert(await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).isDisabled())
  await page.getByRole('group',{name:'Support position 1',exact:true}).locator('[data-option][data-value="IE00B4L5Y983"]').click()
  await page.getByRole('checkbox').check()
  assert(await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).isEnabled())
  await page.getByLabel('Poids position 1',{exact:true}).fill('90')
  assert(await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).isDisabled())
  await page.getByRole('alert').waitFor()
  await page.getByLabel('Poids position 1',{exact:true}).fill('100')
  await page.getByRole('button',{name:'Enregistrer le brouillon',exact:true}).click()
  await page.getByLabel('Pseudonyme',{exact:true}).fill('Changement')
  await page.getByRole('button',{name:'Restaurer le brouillon',exact:true}).click()
  assert.equal(await page.getByLabel('Pseudonyme',{exact:true}).inputValue(),'Test participation')
  await page.getByRole('button',{name:'Profils préparés',exact:true}).click()
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  await page.getByRole('img',{name:'Portefeuille et versements de Julien',exact:true}).waitFor()
  const downloadEvent=page.waitForEvent('download')
  await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
  assert.equal((await downloadEvent).suggestedFilename(),'dca-julien.png')
  await page.getByRole('button',{name:'Autre profil aléatoire',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('.publication-image-stage img')?.alt!=='Portefeuille et versements de Julien')
  await page.setViewportSize({width:390,height:844})
  await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  assert(await page.getByRole('img',{name:/Portefeuille et versements de/}).isVisible())
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1))
  await page.screenshot({path:'test-artifacts/dca/mobile.png',fullPage:true})
  // Switching the visual never regenerates or densifies the publication text.
  await page.setViewportSize({width:1440,height:1100})
  const draft=page.locator('#dca-draft')
  const before=await draft.inputValue()
  await page.getByLabel('Donut de l’image',{exact:true}).selectOption('sectors')
  assert.equal(await draft.inputValue(),before)
  await page.locator('.dca-saved summary').click()
  await page.getByLabel('Nom de la sauvegarde',{exact:true}).fill('Premier portefeuille')
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
  await draft.fill('Texte personnalisé à conserver')
  await page.getByRole('button',{name:'Enregistrer ce portefeuille',exact:true}).click()
  await page.getByRole('button',{name:'Dupliquer ce portefeuille',exact:true}).click()
  await page.getByLabel('Nom de la sauvegarde',{exact:true}).fill('Deuxième portefeuille')
  await page.getByLabel('Donut de l’image',{exact:true}).selectOption('countries')
  await page.getByRole('button',{name:'Enregistrer ce portefeuille',exact:true}).click()
  await page.reload()
  await page.locator('.dca-saved summary').click()
  await page.getByRole('button',{name:'Ouvrir Premier portefeuille',exact:true}).click()
  assert.equal(await draft.inputValue(),'Texte personnalisé à conserver')
  assert.equal(await page.getByLabel('Donut de l’image',{exact:true}).inputValue(),'sectors')
  await page.getByLabel('Nom de la sauvegarde',{exact:true}).fill('Premier renommé')
  await page.getByRole('button',{name:'Mettre à jour la sauvegarde',exact:true}).click()
  assert(await page.getByRole('button',{name:'Ouvrir Deuxième portefeuille',exact:true}).isVisible())
  await page.getByRole('button',{name:'Supprimer Deuxième portefeuille',exact:true}).click()
  assert.equal(await page.locator('.dca-saved-row').count(),1)
  await page.getByRole('button',{name:'Marquer utilisé',exact:true}).click()
  await page.reload()
  await page.locator('.dca-saved summary').click()
  await page.getByRole('button',{name:'Ouvrir Premier renommé',exact:true}).click()
  assert(await page.getByRole('button',{name:'Marquer non utilisé',exact:true}).isVisible())
  await page.locator('.dca-filters summary').click()
  await page.getByLabel('Budget mensuel',{exact:true}).selectOption('small')
  await page.getByLabel('Contient au moins',{exact:true}).selectOption('equity')
  await page.getByLabel('Nombre de placements',{exact:true}).selectOption('4')
  assert(await page.getByText('Aucun profil ne correspond à ces filtres.',{exact:true}).isVisible())
  assert(await page.getByRole('button',{name:'Autre profil aléatoire',exact:true}).isDisabled())
  await page.getByRole('button',{name:'Effacer les filtres',exact:true}).click()
  await page.getByRole('button',{name:'Créer une participation',exact:true}).click()
  await page.getByLabel('Rechercher position 1',{exact:true}).fill('FR0000120073')
  await page.getByRole('group',{name:'Actif position 1',exact:true}).locator('[data-option][data-value="airliquide"]').click()
  await page.getByRole('group',{name:'Support position 1',exact:true}).locator('[data-option][data-value="FR0000120073"]').click()
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1))
  await page.setViewportSize({width:390,height:844})
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1))
  await page.screenshot({path:'test-artifacts/dca/management-mobile.png',fullPage:true})
  console.log('206 images DCA : données, texte sans mention fictive, aucun chevauchement ni dépassement, aperçu, changement de profil, téléchargement et mobile validés.')
} finally {await browser?.close();server.kill('SIGTERM')}
