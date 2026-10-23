import fs from 'node:fs'
import {chromium} from 'playwright'
const base=(process.argv[2]??'https://madmax91310.github.io/shinny-potato/').replace(/\/?$/,'/'),output=process.argv[3]??'/tmp/ai-mobile-measure.json'
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(base.startsWith('https')?{proxy:{server:process.env.HTTPS_PROXY??process.env.HTTP_PROXY}}:{})})
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),cdp=await page.context().newCDPSession(page),records=new Map();await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});cdp.on('Network.requestWillBeSent',e=>records.set(e.requestId,{url:e.request.url}));cdp.on('Network.loadingFinished',e=>{const r=records.get(e.requestId);if(r)r.bytes=e.encodedDataLength})
 await page.goto(base+'portefeuilles-ia');await page.getByRole('heading',{name:'Une feuille blanche, pour chaque IA.'}).waitFor({timeout:120000});await page.waitForLoadState('networkidle');const before=[...records.values()],summarize=list=>({requests:list.length,bytes:list.reduce((s,r)=>s+(r.bytes??0),0),data:list.filter(r=>r.url.includes('/data/ai-portfolios/'))})
 if(await page.getByRole('button',{name:'Configuration et catalogue',exact:true}).count())await page.getByRole('button',{name:'Configuration et catalogue',exact:true}).click();else await page.getByRole('button',{name:'Configurer et saisir les décisions',exact:true}).click()
 await page.getByRole('button',{name:'Charger le catalogue complet',exact:true}).click();await page.getByRole('searchbox',{name:'Rechercher un actif',exact:true}).waitFor({timeout:120000});await page.waitForLoadState('networkidle')
 const result={measuredAt:new Date().toISOString(),device:'Chromium 390 × 844, cache froid, livre réellement publié vide',version:await (await page.request.get(base+'build-info.json')).json(),opening:summarize(before),catalogue:summarize([...records.values()].filter(r=>!before.includes(r))),resources:await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/data/ai-portfolios/')).map(r=>({url:r.name,encoded:r.encodedBodySize,decoded:r.decodedBodySize})))}
 fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify(result))
}finally{await browser.close()}
