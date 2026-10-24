import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {choose} from './card-selection.mjs'
import {ASSETS} from '../src/data/market-history.js'
import {resolveAnniversaryLevel} from '../src/data/anniversary-levels.js'
import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
import {periodReturn,formatPercent} from '../src/pages/performance-rankings/engine.js'
import {annualImagePercent} from '../src/pages/performance-rankings/annualRanking.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
const id='etfFR0007054358',manual='manual-FR0007054358'
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4441/shinny-potato',out=process.env.TEST_OUTPUT_DIR??'test-artifacts/amundi-distributions'
const server=process.env.TEST_BASE_URL?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4441'],{stdio:'ignore'})
let browser
try {
 await fs.mkdir(out,{recursive:true})
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,150))}
 browser=await chromium.launch({headless:true})
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[],results=[]
 page.on('pageerror',e=>errors.push(e.message))
 async function png(name,button){const wait=page.waitForEvent('download');await button.click();const download=await wait;await download.saveAs(`${out}/${name}.png`);const bytes=await fs.readFile(`${out}/${name}.png`);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(bytes.length>10000);results.push({name,bytes:bytes.length})}
 async function preview(){const b=page.locator('.workspace-view-switch').getByRole('button',{name:'Aperçu',exact:true});if(await b.isVisible())await b.click()}
 await page.goto(base+'/calculateur-investissement?asset='+id,{waitUntil:'networkidle'})
 assert.equal(await page.getByRole('group',{name:'Choisir un actif',exact:true}).getAttribute('data-value'),id)
 await choose(page.getByRole('group',{name:'Année de départ',exact:true}),'2022');await preview();assert((await page.locator('body').innerText()).includes(ASSETS[id].label));await png('amundi-lump',page.getByRole('button',{name:'📊 Télécharger une image',exact:true}))
 const editor=page.locator('.workspace-view-switch').getByRole('button',{name:'Éditeur',exact:true});if(await editor.isVisible())await editor.click()
 await page.getByRole('button',{name:'Mensuel (DCA)',exact:true}).click();await preview();await png('amundi-dca',page.getByRole('button',{name:'📊 Télécharger une image',exact:true}))
 await page.goto(base+'/performance-depuis?asset=annual-FR0007054358',{waitUntil:'networkidle'});assert.equal(await page.locator('#subject-select').getAttribute('data-value'),'annual-FR0007054358')
 await choose(page.locator('#secondary-select'),'2020');await page.getByRole('button',{name:'🔄 Générer',exact:true}).click();let text=await page.locator('pre').innerText();assert(text.includes('2020')&&!/NaN|undefined/.test(text));await fs.writeFile(out+'/performance.txt',text);await png('amundi-performance',page.getByRole('button',{name:/Télécharger.*image|Télécharger.*PNG/i}))
 await page.goto(base+'/tweet-midi',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Il y a X ans',exact:true}).click();await choose(page.locator('#subject-select'),id);await choose(page.locator('#secondary-select'),'1');await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
 const latest=resolveAnniversaryLevel(id,'');assert(latest);assert(Math.abs(Number(await page.locator('#niveau-actuel').inputValue())-latest.value)<1e-6);text=await page.locator('pre').innerText();assert(!text.includes('Valeur liquidative du')&&!/NaN|undefined/.test(text));await png('amundi-anniversaire',page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}))
 await page.goto(base+'/classements-performances',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Personnaliser les actifs',exact:true}).click();await page.getByRole('button',{name:'Nouvelle sélection',exact:true}).click();await page.getByRole('button',{name:'Un par un',exact:true}).click()
 const search=page.getByRole('searchbox',{name:'Rechercher : Actif du classement',exact:true}),ids=[id,'etfIE00B5W4TY14','etfUsaSmallValue']
 for(const key of ids){await search.fill(RANKING_ASSETS[key].isin);await page.locator(`.rk-manual [data-option][data-value="${key}"]`).click()}
 await page.getByRole('group',{name:'Devise du classement',exact:true}).locator('[data-value="EUR"]').click();await page.getByRole('button',{name:'Une année',exact:true}).click();await page.getByRole('group',{name:'Année',exact:true}).locator('[data-value="2018"]').click();await page.getByRole('tab',{name:'Texte',exact:true}).click()
 text=await page.getByLabel('Texte à publier',{exact:true}).inputValue();assert(text.includes('2018')&&text.includes('EUR')&&!/NaN|undefined/.test(text));const proof=[]
 for(const key of ids){const a=RANKING_ASSETS[key],factor=a.currency==='USD'?FX.months['2017-12'].rates.USD/FX.months['2018-12'].rates.USD:1;const expected=((1+periodReturn(a,'2017-12','2018-12')/100)*factor-1)*100;assert(text.includes(formatPercent(expected)));proof.push({id:key,expected,outputCurrency:'EUR'})}
 await fs.writeFile(out+'/comparaison.txt',text);await fs.writeFile(out+'/calculs-classement.json',JSON.stringify(proof,null,2));await png('amundi-comparaison-2018',page.getByRole('button',{name:'Télécharger l’image',exact:true}))
 await page.getByRole('button',{name:'Classement annuel',exact:true}).click();await page.getByRole('button',{name:'Année par année',exact:true}).click();await page.getByRole('group',{name:'Première année',exact:true}).locator('[data-value="2017"]').click();await page.getByRole('group',{name:'Dernière année',exact:true}).locator('[data-value="2018"]').click()
 const cells=await page.locator('.rk-annual-table td').evaluateAll(cs=>cs.map(c=>({id:c.dataset.asset,color:c.style.background,text:c.innerText})));assert.equal(cells.length,6);for(const key of ids)assert.equal(new Set(cells.filter(c=>c.id===key).map(c=>c.color)).size,1);assert(cells.some(c=>c.id===id&&c.text.replace(/\s/g,'').includes(annualImagePercent(-12.140103976189353).replace(/\s/g,''))));await fs.writeFile(out+'/annual-cells.json',JSON.stringify(cells,null,2));await png('amundi-classement-2017-2018',page.getByRole('button',{name:'Télécharger l’image',exact:true}))
 await page.goto(base+'/generateur-portefeuilles?asset='+manual,{waitUntil:'networkidle'});assert((await page.locator('.pg-manual-selection-name').innerText()).includes('STOXX'));await page.getByRole('button',{name:'Générer le tweet',exact:true}).click();await page.locator('.pg-manual-result-panel').waitFor();text=await page.locator('.pg-tweet-body').innerText();assert(text.includes('2020')&&text.includes('2025')&&text.includes('100%')&&!/NaN|undefined/.test(text));await fs.writeFile(out+'/manuel.txt',text);await png('amundi-manuel',page.getByRole('link',{name:/Télécharger l’image PNG/}))
 await page.goto(base+'/duels-portefeuilles?asset='+manual,{waitUntil:'networkidle'});assert.equal(await page.getByRole('group',{name:'Actif 1 du portefeuille A',exact:true}).getAttribute('data-value'),manual);text=await page.locator('#pd-tweet').inputValue();assert(text.includes('2020')&&text.includes('2025')&&!/NaN|undefined/.test(text));await fs.writeFile(out+'/duel.txt',text);await png('amundi-duel',page.getByRole('button',{name:/Télécharger l’image PNG/}))
 assert.equal(await page.getByRole('alert').count(),0);assert.deepEqual(errors,[]);assert.equal(results.length,8);await fs.writeFile(out+'/results.json',JSON.stringify({results,errors},null,2));console.log('Amundi: eight actual PNGs, selectors, repaired returns, EUR, fixed annual colours and existing manual/Duel links passed.')
} finally {await browser?.close();server?.kill()}
