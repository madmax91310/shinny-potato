import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
import {periodReturn,formatPercent} from '../src/pages/performance-rankings/engine.js'
import {convertAsset} from '../src/pages/performance-rankings/series.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {choose} from './card-selection.mjs'
import {ASSETS} from '../src/data/market-history.js'
import {getHistoricalPrice,ymForYearsBack} from '../src/pages/tweet-midi/data/marketHistory.js'
import {resolveAnniversaryLevel} from '../src/data/anniversary-levels.js'
import {fmtEUR} from '../src/lib/format-currency.js'
const base=process.env.AUDIT_BASE??'http://127.0.0.1:4173/shinny-potato',out=process.env.AUDIT_OUT??'test-artifacts/investment-unit-consumers'
mkdirSync(out,{recursive:true});const b=await chromium.launch({headless:true}),results=[]
try{
 const context=await b.newContext({permissions:['clipboard-read','clipboard-write'],acceptDownloads:true}),p=await context.newPage(),errors=[]
 p.on('pageerror',e=>errors.push(e.message))
 await p.addInitScript(()=>{window.__painted=[];window.__labelOverflow=[];const f=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,...a){window.__painted.push(String(t));if(this.canvas.classList.contains('ic-video-canvas')&&/Banks|Timber/.test(String(t))&&a[0]+this.measureText(String(t)).width>this.canvas.width-20)window.__labelOverflow.push({text:t,x:a[0],width:this.measureText(String(t)).width,font:this.font});return f.call(this,t,...a)}})
 for(const width of [1440,390])for(const id of ['etfLU1829219390','etf_timber_ishares'])for(const route of ['performance-depuis','il-y-a-x-ans']){
 await p.setViewportSize({width,height:1000});await p.goto(`${base}/${route}?asset=${id}`,{waitUntil:'networkidle'});if(route==='il-y-a-x-ans'&&id==='etfLU1829219390'){const reason=await p.getByRole('alert').innerText();assert(reason.includes('division des parts par 80')&&reason.includes('27/10/2026'));assert.equal(await p.locator('pre, .publication-image-stage').count(),0);assert((await p.getByRole('link',{name:'Voir le rendement qualifié',exact:true}).getAttribute('href')).includes(id));results.push({key:`anniversary-split-refused-${width}`,reason});await p.screenshot({path:`${out}/anniversary-split-refused-${width}.png`,fullPage:true});continue}const picker=p.locator('#subject-select');await choose(picker,id);await choose(p.locator('#secondary-select'),route==='performance-depuis'?'2020':'1');await p.getByRole('button',{name:'🔄 Générer',exact:true}).click();const preview=p.getByRole('button',{name:'Aperçu',exact:true});if(await preview.isVisible())await preview.click();await p.getByRole('tab',{name:'Texte',exact:true}).click();await p.locator('pre').waitFor();const text=await p.locator('pre').innerText();assert(text.includes(ASSETS[id].label));assert(!/NaN|undefined/.test(text))
 if(route==='il-y-a-x-ans'){const latest=resolveAnniversaryLevel(id,'');const date=ymForYearsBack(1,new Date(latest.asOf+'T12:00:00Z'));assert(text.includes(fmtEUR(getHistoricalPrice(id,date),ASSETS[id].currency)))}
 const key=`${route}-${id}-${width}`,pending=p.waitForEvent('download');await p.getByRole('button',{name:/Télécharger.*image|Télécharger.*PNG/i}).click();const dl=await pending;await dl.saveAs(`${out}/${key}.png`);const hash=createHash('sha256').update(readFileSync(`${out}/${key}.png`)).digest('hex');await p.getByRole('tab',{name:'Image',exact:true}).click();await p.locator('.publication-image-stage img').waitFor({state:'visible',timeout:60000});const src=await p.locator('.publication-image-stage img').getAttribute('src');assert.equal(hash,createHash('sha256').update(Buffer.from(src.split(',')[1],'base64')).digest('hex'));await p.screenshot({path:`${out}/${key}-page.png`,fullPage:true});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));results.push({key,text,pngSha256:hash,painted:await p.evaluate(()=>window.__painted)});writeFileSync(`${out}/results.json`,JSON.stringify({results,errors},null,2));console.log(key,'PNG verified')
 }
 for(const width of [1440,390]){
 await p.setViewportSize({width,height:1000});await p.goto(`${base}/classements-performances`,{waitUntil:'networkidle'})
 const settings=p.getByRole('button',{name:'Réglages',exact:true});if(await settings.isVisible())await settings.click()
 await p.getByRole('button',{name:'Personnaliser les actifs',exact:true}).click();await p.getByRole('button',{name:'Nouvelle sélection',exact:true}).click();await p.getByRole('button',{name:'Un par un',exact:true}).click()
 await choose(p.getByRole('group',{name:'Devise du classement',exact:true}),'EUR')
 const ids=['etfLU1829219390','etf_timber_ishares','apple'],search=p.getByRole('searchbox',{name:'Rechercher : Actif du classement',exact:true})
 for(const id of ids){await search.fill(RANKING_ASSETS[id].isin);await p.locator(`.rk-manual [data-option][data-value="${id}"]`).click()}
 await choose(p.getByRole('group',{name:'Devise du classement',exact:true}),'EUR');await p.getByRole('button',{name:'Période libre',exact:true}).click()
 await p.getByLabel('Fin, fin de mois',{exact:true}).fill('2026-10');await p.getByLabel('Début, fin de mois',{exact:true}).fill('2026-01')
 const preview=p.getByRole('button',{name:'Aperçu',exact:true});if(await preview.isVisible())await preview.click();await p.getByRole('tab',{name:'Texte',exact:true}).click()
 const text=await p.getByLabel('Texte à publier',{exact:true}).inputValue();for(const id of ids)assert(text.includes(formatPercent(periodReturn(convertAsset(RANKING_ASSETS[id],'EUR',FX),'2026-01','2026-10'))))
 const pending=p.waitForEvent('download');await p.getByRole('button',{name:/Télécharger.*image|Télécharger.*PNG/i}).click();await(await pending).saveAs(`${out}/ranking-${width}.png`)
 await p.getByRole('tab',{name:'Image',exact:true}).click();await p.locator('.publication-image-stage img').waitFor({state:'visible',timeout:60000});const src=await p.locator('.publication-image-stage img').getAttribute('src');assert.equal(createHash('sha256').update(readFileSync(`${out}/ranking-${width}.png`)).digest('hex'),createHash('sha256').update(Buffer.from(src.split(',')[1],'base64')).digest('hex'))
 results.push({key:`ranking-${width}`,text});writeFileSync(`${out}/results.json`,JSON.stringify({results,errors},null,2));console.log('ranking',width,'monthly EUR amounts verified')
 }
 // Real MediaRecorder export, using both repaired series in their affected modes.
 for(const [id,mode]of [['etfLU1829219390','lump'],['etf_timber_ishares','dca']]){
 await p.setViewportSize({width:1440,height:1000});await p.goto(`${base}/calculateur-investissement?asset=${id}`,{waitUntil:'networkidle'});await p.getByRole('tab',{name:'Texte',exact:true}).click();if(mode==='dca')await p.getByRole('button',{name:'Mensuel (DCA)',exact:true}).click();const value=await p.locator('.ic-hero-number').innerText();await p.evaluate(()=>{window.__painted=[]});await p.getByRole('button',{name:/Générer la vidéo/}).click();const download=p.getByRole('button',{name:/Télécharger.*webm/i});await download.waitFor({state:'visible',timeout:90000});const wait=p.waitForEvent('download');await download.click();const file=await wait;await file.saveAs(`${out}/${id}-${mode}.webm`);assert(await p.evaluate(v=>window.__painted.includes(v),value));assert.deepEqual(await p.evaluate(()=>window.__labelOverflow),[],'Exact share names fit the video');results.push({key:`video-${id}-${mode}`,value,bytes:readFileSync(`${out}/${id}-${mode}.webm`).length});writeFileSync(`${out}/results.json`,JSON.stringify({results,errors},null,2));console.log(id,mode,'video verified')
 }
 await p.getByRole('button',{name:'Comparatif',exact:true}).click()
 await choose(p.getByRole('group',{name:'Actif vidéo 1',exact:true}),'etfLU1829219390')
 await choose(p.getByRole('group',{name:'Actif vidéo 2',exact:true}),'etf_timber_ishares')
 const text=await p.locator('#ic-comparison-text').inputValue();assert(text.includes('sans conversion de change'))
 await p.getByRole('button',{name:/Générer la vidéo/}).click();await p.getByRole('button',{name:/Télécharger.*webm/i}).waitFor({state:'visible',timeout:90000});const wait=p.waitForEvent('download');await p.getByRole('button',{name:/Télécharger.*webm/i}).click();await(await wait).saveAs(`${out}/comparative.webm`)
 assert.deepEqual(await p.evaluate(()=>window.__labelOverflow),[]);results.push({key:'comparative-video',text,bytes:readFileSync(`${out}/comparative.webm`).length});writeFileSync(`${out}/results.json`,JSON.stringify({results,errors},null,2))
 assert.deepEqual(errors,[])
}finally{await b.close()}
