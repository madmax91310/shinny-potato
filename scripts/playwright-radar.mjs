import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { parsePurchasingFeed, PURCHASING_SOURCES } from './lib/purchasing-power-news.mjs'
import { RADAR_URL } from '../src/pages/editorial-radar/client.js'
const now=new Date(), day=now.toISOString().slice(0,10)
const row={family:'etf',entity:'FR001400U5Q4',label:'Amundi PEA Monde',field:'ter',fieldLabel:'Frais annuels',value:.2,sourceUrl:'https://www.amundietf.fr/product',scope:'Part FR001400U5Q4',period:day,checkedAt:day,unit:'% / an',tool:'/fiches-etf',priority:'high'}
const initial=advanceRadar(null,[row],{now})
let feed=advanceRadar(initial.state,[{...row,value:.15}],{now}).feed
const url='http://127.0.0.1:4327/shinny-potato/'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4327','--strictPort'],{stdio:'ignore'})
let browser
await mkdir('test-artifacts/radar',{recursive:true})
try{
 for(let i=0;i<450;i++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({...process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{},args:['--no-sandbox']})
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']}),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 let failure=false
 await context.route(RADAR_URL,route=>route.fulfill(failure?{status:503,body:'Unavailable'}:{contentType:'application/json',body:JSON.stringify(feed)}))
 await page.goto(url)
 await page.getByRole('link',{name:/Radar éditorial/}).first().click()
 await page.getByRole('heading',{name:'Radar éditorial',exact:true}).waitFor()
 await page.getByRole('heading',{name:/frais annuels, 0,2.*0,15/i}).waitFor()
 assert.equal(await page.locator('.radar-card').count(),1)
 assert.ok(await page.getByLabel('1 signaux non lus').count()>0)
 await page.screenshot({path:'test-artifacts/radar/desktop.png',fullPage:true})
 await page.locator('.radar-draft summary').click()
 const draft=page.getByRole('textbox',{name:/Brouillon/})
 assert.match(await draft.inputValue(),/0,2.*0,15/)
 await draft.fill('Mon texte personnalisé')
 await page.getByRole('button',{name:'Copier le brouillon',exact:true}).click()
 await page.getByText('Brouillon copié.',{exact:true}).waitFor()
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'Mon texte personnalisé')
 await page.getByRole('button',{name:'Rétablir le texte',exact:true}).click()
 assert.match(await draft.inputValue(),/0,2.*0,15/)
 await page.locator('.radar-filter-panel > summary').click()
 await page.getByRole('button',{name:'Courtiers',exact:true}).click()
 await page.getByRole('heading',{name:'Aucun signal pour cette sélection',exact:true}).waitFor()
 await page.getByRole('button',{name:'Tout',exact:true}).click()
 await page.getByRole('button',{name:'Marquer comme lu',exact:true}).click()
 await page.getByRole('button',{name:'Non lus',exact:true}).click()
 await page.getByRole('heading',{name:'Aucun signal pour cette sélection',exact:true}).waitFor()
 await page.reload()
 await page.getByRole('button',{name:'Lu',exact:true}).waitFor()
 failure=true
 await page.getByRole('button',{name:'Actualiser',exact:true}).click()
 await page.getByRole('alert').waitFor()
 assert.equal(await page.locator('.radar-card').count(),1,'Derniers signaux conservés après échec')
 failure=false;feed={...feed,checkedAt:new Date(now-48*3600000).toISOString()}
 await page.getByRole('button',{name:'Actualiser',exact:true}).click()
 await page.getByText(/plus de 36 heures/).waitFor()
 const mobile=await context.newPage();await mobile.setViewportSize({width:390,height:844});await mobile.goto(url+'radar-editorial')
 await mobile.getByRole('heading',{name:/frais annuels, 0,2.*0,15/i}).waitFor()
 await mobile.screenshot({path:'test-artifacts/radar/mobile.png',fullPage:true})
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Pas de débordement mobile')
 assert.deepEqual(errors,[])
 // A noisy feed opens on five actionable groups; each other state stays accessible.
 const base = feed.events[0]
 const stamp = now.toISOString()
 feed = {...feed, checkedAt:stamp, events:[
   ...Array.from({length:7},(_,i)=>({...base,id:`fee-${i}`,entity:`fund-${i}`,label:`ETF test ${i}`,title:`ETF test ${i}`,detectedAt:stamp})),
   {...base,id:'related',entity:'fund-0',field:'pea',fieldLabel:'Éligibilité au PEA',before:false,after:true,beforeText:'Non',afterText:'Oui',detectedAt:stamp},
   {...base,id:'composition',field:'countries:United States',fieldLabel:'Poids des États-Unis',before:60,after:63,beforeText:'60 %',afterText:'63 %',detectedAt:stamp},
   {...base,id:'launch',entity:'issuer-launch',field:'announcement',kind:'new',label:'Vanguard will launch a UCITS ETF',title:'Lancement annoncé',detectedAt:stamp},
   {...base,id:'old-fee',entity:'old-fund',detectedAt:new Date(now-20*86400000).toISOString()},
 ]}
 await mobile.getByRole('button',{name:'Actualiser',exact:true}).click()
 await mobile.getByRole('heading',{name:'ETF test 0 : 2 changements regroupés',exact:true}).waitFor()
 assert.equal(await mobile.locator('.radar-page > .radar-list > .radar-card').count(),5)
 await mobile.getByRole('button',{name:'Marquer le sujet comme lu',exact:true}).click()
 await mobile.getByRole('button',{name:'À suivre',exact:true}).click()
 await mobile.getByRole('heading',{name:/Lancement annoncé : Vanguard/}).waitFor()
 assert.equal(await mobile.locator('.radar-page > .radar-list > .radar-card').count(),1)
 await mobile.getByRole('button',{name:'Variations secondaires',exact:true}).click()
 await mobile.getByRole('heading',{name:/poids des États-Unis/i}).waitFor()
 await mobile.getByRole('button',{name:'Historique complet',exact:true}).click()
 assert.equal(await mobile.locator('.radar-page > .radar-list > .radar-card').count(),10)
 await mobile.getByRole('button',{name:'À exploiter',exact:true}).click()
 await mobile.screenshot({path:'test-artifacts/radar/selection-mobile.png',fullPage:true})
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Grouped mobile feed has no overflow')
 feed=initial.feed
 await mobile.getByRole('button',{name:'Actualiser',exact:true}).click()
 await mobile.getByRole('heading',{name:'Le radar est en veille',exact:true}).waitFor()
 // New category remains useful on the silent first run and after source errors.
 const official = parsePurchasingFeed(`<rss><channel><item><title>PTZ : nouveau plafond applicable</title><description>Le plafond applicable est de 100 000 euros pour certains foyers.</description><link>https://www.service-public.gouv.fr/particuliers/actualites/A12345</link><pubDate>${day}</pubDate></item></channel></rss>`,PURCHASING_SOURCES[0],now).observations
 feed=advanceRadar(initial.state,official,{now,purchasingSources:[{id:'service-public',name:'Service Public',url:PURCHASING_SOURCES[0].url,checkedAt:now.toISOString(),status:'ok',articles:1,relevant:1}]}).feed
 await mobile.getByRole('button',{name:'Actualiser',exact:true}).click()
 await mobile.getByRole('button',{name:'Historique complet',exact:true}).click()
 await mobile.locator('.radar-filter-panel > summary').click()
 await mobile.getByRole('button',{name:'Pouvoir d’achat',exact:true}).click()
 await mobile.getByRole('heading',{name:'Les informations récupérées',exact:true}).waitFor()
 await mobile.getByRole('heading',{name:'PTZ : nouveau plafond applicable',exact:true}).waitFor()
 await mobile.getByText('Application indiquée',{exact:true}).waitFor()
 await mobile.getByRole('button',{name:'Dépenses courantes',exact:true}).click()
 await mobile.getByText('Aucune information pour ce thème et cette recherche.',{exact:true}).waitFor()
 await mobile.getByRole('button',{name:'Logement',exact:true}).click()
 await mobile.getByRole('heading',{name:'PTZ : nouveau plafond applicable',exact:true}).waitFor()
 await mobile.screenshot({path:'test-artifacts/radar/purchasing-power-mobile.png',fullPage:true})
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Veille mobile sans débordement')
 assert.deepEqual(errors,[])
 console.log('Radar navigateur : signaux, filtres, lecture persistante, copie, conservation après échec, fraîcheur et mobile validés.')
}finally{await browser?.close();server.kill()}
