import assert from 'node:assert/strict'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {chromium} from 'playwright'
import {staticBrowser,staticBase} from './static-browser.mjs'
import {ALL_PROFILES} from '../src/pages/dca-profiles/data.js'
import {prepareProfile} from '../src/pages/dca-profiles/engine.js'
import {newManualLine} from '../src/pages/dca-profiles/placements.js'
import {shortDonutName,holdingPercentage} from '../src/pages/dca-profiles/donut-layout.js'
const out=process.env.DCA_PNG_ARTIFACTS||'test-artifacts/dca-png-audit'
const base=process.env.DCA_PNG_BASE_URL||staticBase
const seed=prepareProfile(ALL_PROFILES[0])
const manual=(n,long=false)=>Array.from({length:n},(_,i)=>newManualLine({label:long?(`Placement ${i+1} — `+'Épargne familiale de très long terme '.repeat(8)).slice(0,250):`Placement ${i+1}`,category:'Fonds en euros',weight:100/n,amount:(i+1)*7.13}))
const targeted=[
 {id:'one',name:'Une position',lines:[{...seed.lines[0],weight:100,amount:123.45}]},
 {id:'nine',name:'Neuf positions',lines:manual(9)},
 {id:'fifty',name:'Cinquante positions',lines:manual(50)},
 {id:'fifty-long',name:'Cinquante noms de deux cent cinquante lettres',lines:manual(50,true)},
 {id:'concentrated',name:'Petites parts',lines:manual(9).map((l,i)=>({...l,weight:i?0.01:99.92,amount:i?12.34:0}))},
 {id:'mixed',name:'Élodie mixte',lines:[{...seed.lines[0],weight:60,amount:0},{asset:'livret-a',label:'Livret A',isin:'',weight:30,amount:100},newManualLine({label:'Fonds euros Mutavie — réserve familiale',category:'Fonds en euros',weight:10,amount:200}),newManualLine({label:'Projet sans détention actuelle',category:'Actions',weight:0,amount:50})]},
].map(p=>({...seed,...p,mode:'participant',multiImage:true,showCompanies:false}))
const profiles=(process.env.DCA_PNG_SAMPLE_ONLY?[seed,...targeted]:[...ALL_PROFILES.map(prepareProfile),...targeted]).filter((_,i)=>i%Number(process.env.DCA_PNG_SHARDS||1)===Number(process.env.DCA_PNG_SHARD||0))
const choices=[['Vue complète','complete'],['Répartition des actifs','allocation'],['Exposition géographique','countries'],['Exposition sectorielle','sectors']]
const squash=s=>s.replace(/\s/g,'')
await mkdir(out,{recursive:true})
const results=[]
for(const width of [1440,390]){
 let browser,page
 if(process.env.DCA_PNG_BASE_URL){browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});page=await browser.newPage({viewport:{width,height:950}})}
 else ({browser,page}=await staticBrowser(width))
 const viewer=await page.context().newPage(),errors=[]
 await viewer.setViewportSize({width:390,height:900})
 page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>{
  const records=new WeakMap(),blobs=new WeakMap();window.pngAudit={}
  const rec=ctx=>{if(!records.has(ctx.canvas))records.set(ctx.canvas,{texts:[],slices:[]});return records.get(ctx.canvas)}
  const proto=CanvasRenderingContext2D.prototype,fillText=proto.fillText,begin=proto.beginPath,arc=proto.arc,fill=proto.fill,toBlob=HTMLCanvasElement.prototype.toBlob,url=URL.createObjectURL
  const paths=new WeakMap()
  proto.beginPath=function(...a){paths.set(this,[]);return begin.apply(this,a)}
  proto.arc=function(...a){paths.get(this)?.push(a);return arc.apply(this,a)}
  proto.fill=function(...a){const arcs=paths.get(this)||[];if(arcs.length===2&&arcs[0][2]>=100)rec(this).slices.push({color:this.fillStyle,weight:(arcs[0][4]-arcs[0][3])*100/(2*Math.PI)});return fill.apply(this,a)}
  proto.fillText=function(value,x,y,...a){const m=this.measureText(value),t=this.getTransform();const points=[[x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent],[x+m.actualBoundingBoxRight,y-m.actualBoundingBoxAscent],[x-m.actualBoundingBoxLeft,y+m.actualBoundingBoxDescent],[x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent]].map(([x,y])=>({x:t.a*x+t.c*y+t.e,y:t.b*x+t.d*y+t.f}));rec(this).texts.push({value:String(value),font:this.font,left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))});return fillText.call(this,value,x,y,...a)}
  HTMLCanvasElement.prototype.toBlob=function(callback,...a){const r=records.get(this)||{texts:[],slices:[]};return toBlob.call(this,b=>{if(b)blobs.set(b,{...r,width:this.width,height:this.height});callback(b)},...a)}
  URL.createObjectURL=function(b){const u=url.call(this,b);if(blobs.has(b))window.pngAudit[u]=blobs.get(b);return u}
 })
 try{
  await page.goto(base)
  for(const profile of profiles){
   await page.bringToFront()
   if(profile.mode==='prepared'){
    if(!page.url().includes('le-dca-de'))await page.goto(base+'le-dca-de?mode=dca')
    await page.getByRole('group',{name:'Sélection de profils',exact:true}).locator(`[data-option][data-value="${profile.selection}"]`).click()
    await page.locator('.dca-prepared > summary').click()
    await page.getByRole('searchbox',{name:'Rechercher : Choisir un profil DCA',exact:true}).fill(profile.name)
    await page.getByRole('group',{name:'Choisir un profil DCA',exact:true}).locator(`[data-option][data-value="${profile.id}"]`).click()
   }else{
    await page.evaluate(profile=>localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft:'Recette des images',draftEdited:true,field:'all'})),profile)
    await page.goto(base+'le-dca-de?mode=dca')
   }
   const preview=page.getByRole('region',{name:'Image des expositions',exact:true}).filter({visible:true})
   await preview.locator('nav').waitFor({timeout:90000})
   const actual=await page.evaluate(()=>JSON.parse(localStorage.getItem('el-dca-draft-v1')).profile)
   assert.equal(actual.name,profile.name,'The requested profile must actually be restored')
   const audits={}
   for(const [label,id] of choices){
    await preview.getByRole('button',{name:label,exact:true}).click()
    const image=preview.locator('img');await image.evaluate(img=>img.decode())
    const state=await image.evaluate(async img=>({audit:window.pngAudit[img.src],sha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await(await fetch(img.src)).arrayBuffer()))).map(b=>b.toString(16).padStart(2,'0')).join('')}))
    assert(state.audit,`${profile.id}/${id}: export audit missing`)
    const pending=page.waitForEvent('download');await preview.getByRole('button',{name:'Télécharger le PNG',exact:true}).click();const download=await pending
    const filename=download.suggestedFilename(),path=`${out}/${width}-${profile.id}-${id}.png`
    assert(filename.endsWith(`-${id}.png`));assert(filename.includes(profile.id.replaceAll(':','_')))
    await download.saveAs(path);assert.equal(await download.failure(),null)
    const bytes=await readFile(path);assert(bytes.length>1000);assert.equal(createHash('sha256').update(bytes).digest('hex'),state.sha256,'Saved PNG differs from its current preview')
    assert.equal(bytes.subarray(1,4).toString(),'PNG')
    // Open the bytes that were saved to disk, not the preview URL or its canvas.
    await viewer.goto('about:blank');await viewer.setContent(`<img style="width:390px;height:auto" src="data:image/png;base64,${bytes.toString('base64')}">`)
    const size=await viewer.locator('img').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight]})
    assert.deepEqual(size,[state.audit.width,state.audit.height])
    const a=state.audit,text=squash(a.texts.map(t=>t.value).join(' '))
    for(const t of a.texts){assert(t.left>=-1&&t.right<=a.width+1&&t.top>=-1&&t.bottom<=a.height+1,`${profile.id}/${id}: clipped ${t.value}`)}
    for(let i=0;i<a.texts.length;i++)for(const b of a.texts.slice(i+1)){const t=a.texts[i];assert(!(Math.min(t.right,b.right)-Math.max(t.left,b.left)>2&&Math.min(t.bottom,b.bottom)-Math.max(t.top,b.top)>2),`${profile.id}/${id}: overlap ${t.value} / ${b.value}`)}
    assert(!text.includes('dupatrimoine'));assert(!text.includes('autrespositions'))
    if(['complete','allocation'].includes(id)){
     const held=actual.lines.filter(l=>l.weight>0).sort((a,b)=>b.weight-a.weight)
     for(const line of held){assert(text.includes(squash(shortDonutName(line.label))),`${profile.id}/${id}: missing ${line.label}`);assert(text.includes(squash(holdingPercentage(line.weight))),`${profile.id}/${id}: missing percentage ${line.weight}`)}
     assert(a.slices.length>=held.length)
     audits[id]=a.slices.slice(0,held.length)
    }
    results.push({profile:profile.id,width,image:id,filename,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),size})
    if(width===390&&(targeted.some(p=>p.id===profile.id)||['julien','debate-jeanbaptiste'].includes(profile.id)))await viewer.screenshot({path:`${out}/opened-${profile.id}-${id}-390.png`,fullPage:true})
   }
   const sort=slices=>slices.map(s=>({color:s.color,weight:Math.round(s.weight*10)/10})).sort((a,b)=>a.color.localeCompare(b.color)||a.weight-b.weight)
   const global=sort(audits.complete),individual=sort(audits.allocation)
   assert.deepEqual(global.map(s=>s.color),individual.map(s=>s.color),'Holding colours differ between global and individual')
   for(let i=0;i<global.length;i++)assert(Math.abs(global[i].weight-individual[i].weight)<.2,'Holding geometry differs')
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
   console.log(`${width}: ${profile.id}: 4 PNG saved, reopened and checked`)
  }
  if(profiles.at(-1)?.id==='mixed'){
  // Rapid real edits: the old image disappears, then each new export contains the new identity and data.
  await page.getByLabel('Pseudonyme',{exact:true}).fill('Profil modifié')
  const preview=page.getByRole('region',{name:'Image des expositions',exact:true}).filter({visible:true})
  assert(await preview.getByRole('button',{name:'Télécharger le PNG',exact:true}).isDisabled())
  await page.getByRole('spinbutton',{name:'DCA position 1',exact:true}).fill('987.65')
  await preview.locator('nav').waitFor({timeout:90000})
  for(const [label,id] of choices){await preview.getByRole('button',{name:label,exact:true}).click();const pending=page.waitForEvent('download');await preview.getByRole('button',{name:'Télécharger le PNG',exact:true}).click();const d=await pending;assert(d.suggestedFilename().includes('profil-modifie'));await d.saveAs(`${out}/${width}-modified-${id}.png`)}
  await page.getByText('Personnaliser l’image',{exact:true}).filter({visible:true}).click()
  await page.getByRole('group',{name:'Donuts de l’image',exact:true}).locator('[data-option][data-value="both"]').click()
  let previous=''
  for(const amount of ['432.10','765.43']){
   await page.getByRole('spinbutton',{name:'DCA position 1',exact:true}).fill(amount)
   await preview.locator('nav').waitFor({timeout:90000})
   await preview.getByRole('button',{name:'Géographie + secteurs',exact:true}).click()
   const data=await preview.locator('img').evaluate(img=>window.pngAudit[img.src])
   const current=await page.evaluate(()=>JSON.parse(localStorage.getItem('el-dca-draft-v1')).profile)
   const monthly=current.lines.reduce((sum,l)=>sum+l.amount,0).toLocaleString('fr-FR',{maximumFractionDigits:2})
   assert(data.texts.some(t=>t.value===`Le DCA de ${current.name}`))
   assert(data.texts.some(t=>t.value===`${monthly} € investis par mois`))
   assert.deepEqual(current.lines.map(l=>l.weight),targeted.at(-1).lines.map(l=>l.weight),'Flow edit must preserve held allocation')
   const pending=page.waitForEvent('download');await preview.getByRole('button',{name:'Télécharger le PNG',exact:true}).click();const d=await pending
   const path=`${out}/${width}-monthly-${amount}.png`;await d.saveAs(path);const bytes=await readFile(path),hash=createHash('sha256').update(bytes).digest('hex')
   assert.notEqual(hash,previous);previous=hash
   await viewer.goto('about:blank');await viewer.setContent(`<img src="data:image/png;base64,${bytes.toString('base64')}">`);await viewer.locator('img').evaluate(img=>img.decode())
  }
  }
  assert.deepEqual(errors,[])
 }finally{await browser.close();await writeFile(`${out}/audit.json`,JSON.stringify(results,null,2))}
}
console.log(`${results.length} PNG downloaded, reopened, matched to preview and audited.`)
