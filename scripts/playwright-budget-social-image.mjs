import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs'
import{chromium}from'playwright'
import{expect}from'playwright/test'
import{SOCIAL_BODY_SIZE}from'../src/pages/budget-profiles/socialImage.js'
import{BUDGET_PROFILES}from'../src/pages/budget-profiles/data.js'
import{spawn}from'node:child_process'
import{waitPreview}from'./wait-preview.mjs'
import{DRAFT_KEY}from'../src/pages/budget-profiles/storage.js'
import{buildBudgetText}from'../src/pages/budget-profiles/lib.js'
const shard=Number(process.argv[2]||0),shards=Number(process.argv[3]||1)
assert(Number.isInteger(shard)&&Number.isInteger(shards)&&shards>0&&shard>=0&&shard<shards,'Invalid budget X partition')
const uiProfiles=BUDGET_PROFILES.filter((_,index)=>index%shards===shard)
const base=process.env.BUDGET_SOCIAL_BASE||'http://127.0.0.1:4399/shinny-potato',output=process.env.BUDGET_ARTIFACTS||`test-artifacts/budget-social-${shard}`
mkdirSync(output,{recursive:true})
const server=process.env.BUDGET_SOCIAL_BASE?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4399','--strictPort'],{stdio:'ignore'})
const uiBase=process.env.BUDGET_PUBLIC_BASE||'http://127.0.0.1:4486/shinny-potato'
const preview=process.env.BUDGET_PUBLIC_BASE?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4486','--strictPort'],{stdio:'ignore'})
let browser
try{
 if(server)await waitPreview(server,base)
 if(preview)await waitPreview(preview,uiBase)
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})})
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),phone=await browser.newPage({viewport:{width:390,height:488},deviceScaleFactor:1}),results=[],errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>{const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...args){const s=String(value),m=this.measureText(s),left=x-(this.textAlign==='right'?m.width:this.textAlign==='center'?m.width/2:0);this.canvas.budgetDrawn??=[];this.canvas.budgetDrawn.push({text:s,left,right:left+m.width,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent,size:Number(this.font.match(/([\d.]+)px/)[1])});return fill.call(this,value,x,y,...args)}})
 await page.goto(base+'/le-budget-de');await page.evaluate(()=>document.fonts.ready)
 for(const [index,p]of BUDGET_PROFILES.entries()){
  const r=await page.evaluate(async id=>{const{BUDGET_PROFILES}=await import('/shinny-potato/src/pages/budget-profiles/data.js');const{renderBudgetImages}=await import('/shinny-potato/src/pages/budget-profiles/image.js');const{planSocialBudget}=await import('/shinny-potato/src/pages/budget-profiles/socialImage.js');const{buildBudgetText}=await import('/shinny-potato/src/pages/budget-profiles/lib.js');const p=BUDGET_PROFILES.find(p=>p.id===id),before=JSON.stringify(p),text=buildBudgetText(p),plan=planSocialBudget(document.createElement('canvas').getContext('2d'),p),canvases=await renderBudgetImages(p,'social');return{fit:plan.fit,unchanged:before===JSON.stringify(p)&&text===buildBudgetText(p),expected:plan.sections.flatMap(s=>s.rows),pages:canvases.map(c=>({width:c.width,height:c.height,layout:c.budgetLayout,drawn:c.budgetDrawn,png:c.toDataURL().split(',')[1]}))}},p.id)
  assert(r.unchanged,p.id+' data/text immutable');const source=r.pages.flatMap(p=>p.layout.sourceRows)
  for(const row of r.expected){const parts=source.filter(r=>r.id===row.id||r.id.startsWith(row.id+':part:'));assert(parts.length,p.id+': missing '+row.id);assert.equal(parts.map(p=>p.label).join(' ').replace(/\s/g,''),row.label.replace(/\s/g,''),p.id+': complete label '+row.id);if(row.amount!==undefined)assert.deepEqual(parts.filter(p=>p.amount!==undefined).map(p=>p.amount),[row.amount],p.id+': one amount per source line')}
  for(const [i,part]of r.pages.entries()){
   assert.deepEqual([part.width,part.height],[1080,1350],p.id);assert.equal(part.layout.fontSize,SOCIAL_BODY_SIZE)
   assert(!/exemple de budget|fictif|reconstitu|simulation|hypothèse|version éditoriale|préparé le|vérifié le/i.test(part.drawn.map(t=>t.text).join(' ')),p.id)
   for(const t of part.drawn)assert(t.left>=30&&t.right<=1050&&t.top>=0&&t.bottom<=1350,p.id+' bounds '+JSON.stringify(t))
   for(let x=0;x<part.drawn.length;x++)for(const b of part.drawn.slice(x+1)){const a=part.drawn[x];assert(!(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1),p.id+' overlap '+JSON.stringify([a,b]))}
   const stem=`${p.id}-${String(i+1).padStart(2,'0')}`;writeFileSync(`${output}/${stem}.png`,Buffer.from(part.png,'base64'));await phone.setContent(`<body style="margin:0;background:#1c2127"><img width="390" height="487.5" src="data:image/png;base64,${part.png}"></body>`);await expect(phone.locator('img')).toBeVisible();await phone.locator('img').evaluate(img=>img.decode());await phone.screenshot({path:`${output}/${stem}-phone.png`});delete part.png
  }
  results.push({id:p.id,name:p.name,count:r.pages.length,fit:r.fit,pages:r.pages});console.log(`Budget X ${index+1}/${BUDGET_PROFILES.length}: ${p.name} — ${r.pages.length} image(s)`)
 }
 assert.deepEqual(errors,[]);writeFileSync(`${output}/audit.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({single:results.filter(r=>r.count===1).length,multiple:results.filter(r=>r.count>1).length,pages:results.reduce((s,r)=>s+r.count,0)}))
 // A restored 72-row participation must also remain a numbered 4:5 series.
 const dense={...structuredClone(BUDGET_PROFILES.find(p=>p.name==='Émilie')),id:'social-dense-72',currency:'CHF',kind:'participant',source:null,publishedAt:null,checkedAt:null,name:'Alexandrine et Maximilien',context:'Préparer une installation avec une réserve séparée.',question:'Quels postes reverriez-vous dans ce budget ?'}
 for(const [key,amount]of [['income',100],['expenses',110],['savings',10]])dense[key]=Array.from({length:24},(_,i)=>({label:`Poste ${i+1} avec un long libellé complet et tous les détails à conserver`,amount}))
 const densePages=await page.evaluate(async profile=>{const{renderBudgetImages}=await import('/shinny-potato/src/pages/budget-profiles/image.js');return(await renderBudgetImages(profile,'social')).map(c=>({width:c.width,height:c.height,rows:c.budgetLayout.sourceRows,drawn:c.budgetDrawn}))},dense)
 assert(densePages.length>1);const denseRows=densePages.flatMap(p=>p.rows)
 for(const [key,amount]of [['income',100],['expenses',110],['savings',10]]){const rows=denseRows.filter(r=>r.id.startsWith(key+':')&&r.amount!==undefined);assert.equal(rows.length,24);assert.equal(rows.reduce((s,r)=>s+r.amount,0),24*amount)}
 for(const part of densePages){assert.deepEqual([part.width,part.height],[1080,1350]);for(const t of part.drawn)assert(t.left>=30&&t.right<=1050&&t.top>=0&&t.bottom<=1350);assert(!part.drawn.some(t=>t.text.includes('7 000')),'An adapted personal profile never inherits the bank character’s wealth')}
 const custom='Mon texte personnalisé : il reste conservé quand je change les images.'
 const restored=await browser.newContext({viewport:{width:390,height:950},acceptDownloads:true})
 // Deliberately slow unselected middle pages: they must neither be encoded
 // eagerly nor hold the last selected page behind a PNG preparation queue.
 await restored.addInitScript(()=>{const original=HTMLCanvasElement.prototype.toBlob;window.budgetPngRequests=[];HTMLCanvasElement.prototype.toBlob=function(callback,...args){if(this.budgetPageCount>3){window.budgetPngRequests.push(this.budgetPage);if(this.budgetPage!==1&&this.budgetPage!==this.budgetPageCount){setTimeout(()=>original.call(this,callback,...args),10000);return}}return original.call(this,callback,...args)}})
 await restored.addInitScript(({key,profile,text})=>localStorage.setItem(key,JSON.stringify({profile,text,edited:true})),{key:DRAFT_KEY,profile:dense,text:custom})
 const restoredPage=await restored.newPage();await restoredPage.goto(uiBase+'/le-budget-de');await expect(restoredPage.getByLabel('Texte prêt à publier')).toHaveValue(custom)
 await expect(restoredPage.locator('.budget-image-count')).toContainText(`${densePages.length} images`)
 await restoredPage.getByRole('button',{name:`Image ${densePages.length} sur ${densePages.length}`,exact:true}).click()
 const restoredImage=restoredPage.getByRole('region',{name:'Image du budget'}).locator('img');await expect.poll(()=>restoredImage.evaluate(i=>[i.naturalWidth,i.naturalHeight])).toEqual([1080,1350])
 const event=restoredPage.waitForEvent('download');await restoredPage.getByRole('button',{name:'Télécharger le PNG',exact:true}).click();assert((await event).suggestedFilename().includes(`-sur-${String(densePages.length).padStart(2,'0')}`))
 assert((await restoredPage.evaluate(()=>window.budgetPngRequests)).every(index=>index===1||index===densePages.length),'Only requested PNG pages are encoded')
 await restoredPage.getByLabel('Dépenses · montant 1',{exact:true}).fill('120');await expect(restoredPage.getByLabel('Texte prêt à publier')).toHaveValue(custom)
 await expect(restoredPage.getByRole('button',{name:'Télécharger le PNG',exact:true})).toBeEnabled();await restoredPage.getByRole('button',{name:'Rétablir le texte',exact:true}).click();const changed={...dense,expenses:dense.expenses.map((r,i)=>i? r:{...r,amount:120})};await expect(restoredPage.getByLabel('Texte prêt à publier')).toHaveValue(buildBudgetText(changed));await expect(restoredPage.getByRole('checkbox',{name:'Profil publié',exact:true})).not.toBeChecked();assert(await restoredPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await restored.close()
 console.log(`Restored 72-row CHF fixture: ${densePages.length} fixed 4:5 pages, every amount once, long names, deficit, manual question, selected download and protected custom text passed.`)
 // Exercise UI, selected download and the legacy modes on a real phone and desktop.
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:950},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true}),ui=await context.newPage();await ui.goto(uiBase+'/le-budget-de');
  for(const p of (width===390?uiProfiles:[BUDGET_PROFILES.find(p=>p.name==='Émilie'),BUDGET_PROFILES.find(p=>p.name==='Lucie'),BUDGET_PROFILES.find(p=>results.find(r=>r.id===p.id).count>1),BUDGET_PROFILES.find(p=>p.name==='Amandine et Nicolas')])){
   await ui.getByRole('group',{name:'Version de l’image',exact:true}).locator('[data-value="social"]').click();await ui.getByRole('group',{name:'Choisir un profil',exact:true}).locator(`[data-value="${p.id}"]`).click();await expect(ui.getByLabel('Texte prêt à publier')).toHaveValue(buildBudgetText(p));const count=results.find(r=>r.id===p.id).count;await expect(ui.locator('.budget-image-count')).toContainText(`${count} image`);
   for(let i=0;i<count;i++){
    if(count>1)await ui.getByRole('button',{name:`Image ${i+1} sur ${count}`,exact:true}).click();const img=ui.getByRole('region',{name:'Image du budget'}).locator('img');await expect(ui.getByRole('button',{name:'Télécharger le PNG',exact:true})).toBeEnabled();await expect.poll(()=>img.evaluate(i=>[i.naturalWidth,i.naturalHeight])).toEqual([1080,1350]);const bytes=await img.evaluate(async i=>{const b=await(await fetch(i.src)).blob();return [...new Uint8Array(await b.arrayBuffer())]});const event=ui.waitForEvent('download');await ui.getByRole('button',{name:'Télécharger le PNG',exact:true}).click();const d=await event;assert.deepEqual(readFileSync(await d.path()),Buffer.from(bytes));if(count>1)assert(d.suggestedFilename().includes(`-${String(i+1).padStart(2,'0')}-sur-`));
   }
   await ui.getByRole('button',{name:'Copier le texte',exact:true}).click();await expect(ui.getByRole('checkbox',{name:'Profil publié',exact:true})).not.toBeChecked();assert.equal(await ui.evaluate(()=>navigator.clipboard.readText()),buildBudgetText(p));
   for(const mode of ['detailed','summary']){await ui.getByRole('group',{name:'Version de l’image',exact:true}).locator(`[data-value="${mode}"]`).click();await expect(ui.getByRole('button',{name:'Télécharger le PNG',exact:true})).toBeEnabled();await expect.poll(()=>ui.getByRole('region',{name:'Image du budget'}).locator('img').evaluate(i=>i.naturalWidth)).toBe(1200)}
  }
  assert(await ui.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await context.close()
 }
 console.log(`Budget X: all real-canvas pages, 390px phone captures, immutable inputs/texts, source row conservation, bounds, overlaps; desktop/mobile page navigation, selected PNG bytes, copy and both legacy formats passed. UI partition ${shard+1}/${shards}: ${uiProfiles.length} profiles at 390px.`)
}finally{await browser?.close();server?.kill();preview?.kill()}
