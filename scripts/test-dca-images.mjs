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
  let failHoldings=true
  await page.route(/\/holdings-\d+\.json/,route=>failHoldings&&!/[?&](import|url)([=&]|$)/.test(route.request().url())?route.abort():route.continue())
  await page.goto(base+'le-dca-de')
  await page.getByRole('button',{name:'Le DCA d’un abonné',exact:true}).click()
  await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
  await page.getByRole('button',{name:'Relancer l’analyse',exact:true}).waitFor()
  failHoldings=false
  await page.getByRole('button',{name:'Relancer l’analyse',exact:true}).click()
  await page.getByRole('button',{name:'Relancer l’analyse',exact:true}).waitFor({state:'hidden'})
  await page.getByText('Chargement de l’analyse des détentions…',{exact:true}).waitFor({state:'hidden'})
  assert.equal(await page.getByRole('button',{name:'Relancer l’analyse',exact:true}).count(),0)
  await page.getByText('Détails du portefeuille',{exact:true}).filter({visible:true}).click()
  for(const scope of ['PEA','CTO','PEA + CTO','Ensemble des placements','Portefeuille investi']){
    const picker=page.getByRole('group',{name:'Périmètre du portefeuille',exact:true})
    await picker.locator(`[data-option][data-value="${scope}"]`).click()
    assert.equal(await picker.locator('[aria-pressed="true"]').getAttribute('data-value'),scope)
    const text=await page.locator('textarea').inputValue()
    assert(!/undefined|NaN/.test(text))
    if(scope!=='Portefeuille investi')assert(text.includes(`(${scope})`))
  }
  await page.locator('.dca-publication-column .dca-simple-preview img').evaluate(async img=>img.decode())
  const records=await page.evaluate(async()=>{
    const {ALL_PROFILES: PROFILES, ASSETS}=await import('/shinny-potato/src/pages/dca-profiles/data.js')
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
      {...prepareProfile(PROFILES[0]),id:'fifty-lines',name:'Portefeuille complet',lines:Object.entries(references).slice(0,50).map(([asset,r])=>({asset,label:r.name,emoji:'📊',weight:2,amount:10,isin:r.isin}))},
      {...prepareProfile(PROFILES[0]),id:'eight-lines',name:'Pseudonyme long pour vérifier le rendu mobile',lines:Object.keys(ASSETS).slice(0,8).map((asset,i)=>({asset,label:ASSETS[asset][1],emoji:ASSETS[asset][0],weight:12.5,amount:i?1000000:0,isin:''}))},
      {...prepareProfile(PROFILES[0]),id:'zero-dca',lines:prepareProfile(PROFILES[0]).lines.map(l=>({...l,amount:0}))},
      {...prepareProfile(PROFILES[0]),id:'karim-approved',name:'Karim',age:32,job:'informaticien',location:'',income:2500,variable:false,lines:[['world',70,350],['europe',20,100],['emerging',10,50]].map(([asset,weight,amount])=>({asset,label:ASSETS[asset][1],emoji:ASSETS[asset][0],weight,amount,isin:references[asset].isin}))}
    ]
    for(const [index,{raw,field}] of cases.flatMap(raw=>['countries','sectors','both','all'].map(field=>({raw,field}))).entries()){
      const profile=raw.lines.every(l=>Number.isFinite(l.weight))?raw:prepareProfile(raw,index)
      labels=[];boxes=[]
      const canvas=await renderDcaImage(profile,field)
      if(field==='all'&&!labels.includes('Répartition des actifs'))throw Error('Missing allocation donut')
      if(labels.some(l=>/fictif|simulé|inventé|polémique|controversial|problématique|risqué|provocateur|undefined|\bNaN\b/i.test(l)))throw Error(profile.id+' unwanted text')
      if(field==='all'){
        if(labels.some(l=>l===`Le DCA de ${profile.name}`||/investis par mois/.test(l)))throw Error('Redundant allocation identity: '+profile.id)
      }else if(!labels.includes(field==='both'?`Le DCA de ${profile.name}`:profile.name))throw Error('Identity: '+profile.id)
      if(labels.filter(l=>l==='Épargnant Libre').length!==1)throw Error('Brand: '+profile.id)
      // Allocation images show held assets; monthly cards show actual contributions.
      const expectedLines=field==='all'?profile.lines.filter(line=>line.weight>0):field==='both'?[]:profile.lines.filter(line=>line.amount>0)
      for(const line of expectedLines)if(expectedLines.length<=8&&!labels.join(' ').includes(line.label))throw Error('Allocation missing: '+profile.id+' / '+field+' / '+line.label)
      if(profile.id==='eight-lines'&&['countries','sectors'].includes(field)&&labels.includes(profile.lines[0].label))throw Error('Zero contribution shown as a monthly investment')
      output.push({id:profile.id+'-'+field,labels:[...labels],png:['julien','alexandre','patrick','arthur','laurent','helene','eight-lines','fifty-lines','zero-dca','karim-approved','debate-lucas','debate-ilyes','debate-lina','debate-adam','debate-jeanbaptiste','debate-matthias'].includes(profile.id)?canvas.toDataURL():null})
    }
    for(const field of ['countries','sectors','both','all']){
      labels=[];boxes=[]
      const anonymous={...prepareProfile(PROFILES[0]),name:'',imageOnly:true,lines:prepareProfile(PROFILES[0]).lines.map(({amount:_amount,...line})=>line)}
      const canvas=await renderDcaImage(anonymous,field)
      if(labels.some(l=>/LE DCA DE|investis par mois|Salaire|ans|Julien/.test(l)))throw Error('Identity or amounts leaked')
      if(!labels.includes('Épargnant Libre'))throw Error('Missing anonymous heading')
      if(['both','all'].includes(field)&&(!labels.includes('Exposition géographique')||!labels.includes('Exposition sectorielle')))throw Error('Missing panel')
      output.push({id:'anonymous-'+field,labels:[...labels],png:canvas.toDataURL()})
    }
    CanvasRenderingContext2D.prototype.fillText=original
    return output
  })
  assert.equal(records.length,620)
  await mkdir('test-artifacts/dca',{recursive:true})
  for(const record of records.filter(r=>r.png))await writeFile(`test-artifacts/dca/${record.id}.png`,Buffer.from(record.png.split(',')[1],'base64'))
  const preview=page.locator('.dca-publication-column .dca-simple-preview img')
  await preview.waitFor()
  const originalWeight=await page.getByLabel('Poids position 1',{exact:true}).inputValue()
  const originalCount=await page.locator('.dca-line-with-flow').count()
  await page.getByRole('button',{name:'Créer une participation',exact:true}).click()
  assert.equal(await page.locator('.dca-line-with-flow').count(),originalCount)
  await page.getByLabel('Pseudonyme',{exact:true}).fill('Test participation')
  await page.getByLabel('DCA position 1',{exact:true}).fill('300')
  await preview.waitFor()
  const downloadButton=page.getByRole('button',{name:'Télécharger le PNG',exact:true})
  await page.waitForFunction(()=>!!document.querySelector('.dca-publication-column .dca-simple-preview img'))
  assert(await downloadButton.isEnabled(),'Unapproved participants can export a draft')
  assert(!await page.getByRole('checkbox',{name:'La personne a validé',exact:false}).isChecked())
  const imageBeforeText=await preview.getAttribute('src')
  await page.locator('#dca-draft').fill('Texte personnalisé à conserver')
  assert.equal(await preview.getAttribute('src'),imageBeforeText,'Text does not invalidate image')
  const download=page.waitForEvent('download');await downloadButton.click()
  assert.equal((await download).suggestedFilename(),'dca-julien.png')
  await page.getByRole('link',{name:'Ouvrir l’image',exact:true}).waitFor()
  await page.getByLabel('Poids position 1',{exact:true}).fill('90')
  assert(await downloadButton.isDisabled())
  assert.equal(await preview.count(),0,'Invalid allocation never exports an old image')
  await page.getByLabel('Poids position 1',{exact:true}).fill(originalWeight)
  await preview.waitFor()
  await page.locator('#dca-draft').fill('Texte personnalisé à conserver')
  await page.getByText('Personnaliser l’image',{exact:true}).filter({visible:true}).click()
  await page.getByRole('group',{name:'Donuts de l’image',exact:true}).locator('[data-option][data-value="sectors"]').click()
  assert.equal(await page.locator('#dca-draft').inputValue(),'Texte personnalisé à conserver')
  await preview.waitFor()
  await page.locator('.dca-saved:visible summary').click()
  await page.getByLabel('Nom de la sauvegarde',{exact:true}).filter({visible:true}).fill('Premier portefeuille')
  await page.getByRole('button',{name:'Enregistrer ce portefeuille',exact:true}).click()
  await page.getByRole('button',{name:'Profils préparés',exact:true}).click()
  await page.getByLabel('Nom de la sauvegarde',{exact:true}).filter({visible:true}).fill('Deuxième portefeuille')
  await page.getByRole('button',{name:'Enregistrer ce portefeuille',exact:true}).click()
  await page.reload()
  await page.getByRole('button',{name:'Le DCA d’un abonné',exact:true}).click()
  // Automatic draft restore survives reload without a second Restore button.
  assert.equal(await page.getByLabel('Pseudonyme',{exact:true}).inputValue(),'Julien')
  await page.locator('.dca-saved:visible summary').click()
  await page.getByRole('button',{name:'Ouvrir Premier portefeuille',exact:true}).click()
  assert.equal(await page.locator('#dca-draft').inputValue(),'Texte personnalisé à conserver')
  assert.equal(await page.getByLabel('Pseudonyme',{exact:true}).inputValue(),'Test participation')
  await page.getByText('Personnaliser l’image',{exact:true}).filter({visible:true}).click()
  assert.equal(await page.getByRole('group',{name:'Donuts de l’image',exact:true}).getAttribute('data-value'),'sectors')
  await page.getByLabel('Nom de la sauvegarde',{exact:true}).filter({visible:true}).fill('Premier renommé')
  await page.getByRole('button',{name:'Mettre à jour la sauvegarde',exact:true}).click()
  await page.getByRole('button',{name:'Supprimer Deuxième portefeuille',exact:true}).click()
  assert.equal(await page.locator('.dca-saved:visible .dca-saved-row').count(),1)
  await page.getByRole('button',{name:'Profils préparés',exact:true}).click()
  await page.locator('.dca-prepared > summary').click()
  await page.getByRole('button',{name:'Marquer utilisé',exact:true}).click()
  await page.locator('.dca-filters summary').click()
  await page.getByRole('group',{name:'Budget mensuel',exact:true}).locator('[data-option][data-value="small"]').click()
  await page.getByRole('group',{name:'Contient au moins',exact:true}).locator('[data-option][data-value="equity"]').click()
  await page.getByRole('group',{name:'Nombre de placements',exact:true}).locator('[data-option][data-value="4"]').click()
  assert(await page.getByText('Aucun profil ne correspond à ces filtres dans cette sélection. Modifie les filtres ou change de sélection.',{exact:true}).isVisible())
  assert(await page.getByRole('button',{name:'Autre profil aléatoire',exact:true}).isDisabled())
  await page.getByRole('button',{name:'Effacer les filtres',exact:true}).click()
  await page.setViewportSize({width:390,height:844})
  await preview.waitFor()
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile has no horizontal overflow')
  await page.screenshot({path:'test-artifacts/dca/mobile.png',fullPage:true})
  assert.equal(await page.getByRole('group',{name:/Support position/}).count(),0,'No second ISIN confirmation')
  console.log('620 DCA images and simplified workflow: participant draft export, text-independent PNG, stale image protection, saves, automatic restore, filters and mobile verified.')
} finally {await browser?.close();server.kill('SIGTERM')}

