import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { advanceRadar } from './lib/editorial-radar.mjs'
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
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({...process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{},args:['--no-sandbox']})
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']}),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 let failure=false
 await context.route(RADAR_URL,route=>route.fulfill(failure?{status:503,body:'Unavailable'}:{contentType:'application/json',body:JSON.stringify(feed)}))
 await page.goto(url)
 await page.getByRole('link',{name:/Radar éditorial/}).first().click()
 await page.getByRole('heading',{name:'Radar éditorial',exact:true}).waitFor()
 await page.getByRole('heading',{name:/Frais annuels en mouvement/i}).waitFor()
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
 await mobile.getByRole('heading',{name:/Frais annuels en mouvement/i}).waitFor()
 await mobile.screenshot({path:'test-artifacts/radar/mobile.png',fullPage:true})
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Pas de débordement mobile')
 assert.deepEqual(errors,[])
 feed=initial.feed
 await mobile.getByRole('button',{name:'Actualiser',exact:true}).click()
 await mobile.getByRole('heading',{name:'Le radar est en veille',exact:true}).waitFor()
 console.log('Radar navigateur : signaux, filtres, lecture persistante, copie, conservation après échec, fraîcheur et mobile validés.')
}finally{await browser?.close();server.kill()}
