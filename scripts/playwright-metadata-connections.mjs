import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {mkdir} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {getPreferredInstrumentListing} from '../src/data/instrument-listings.js'
import {getInstrumentPeaStatus} from '../src/data/instruments.js'
import {DEFAULT_THEMES} from '../src/data/etf-themes.js'
import {getComparatifEtfText} from '../src/pages/tweet-midi/data/comparatifEtf.js'
const records=JSON.parse(readFileSync('src/data/automated-instrument-metadata.json'))
const connectedPea=Object.entries(records).filter(([isin,r])=>/^https:\/\/(?:www\.quantalys\.com\/Fonds\/[1-9]\d*|extraetf\.com\/fr\/etf-profile\/[A-Z0-9]+|etf\.dws\.com\/api\/pdp\/fr-fr\/etf\/[A-Z0-9]+\/pdpMetaTagsTealium)$/.test(r.pea?.sourceUrl??'')&&DEFAULT_THEMES.some(t=>t.etfs.some(f=>f.isin===isin))).map(([isin])=>isin).slice(0,3)
const isins=[...new Set([...connectedPea,'IE000DQLYVB9','IE000716YHJ7','IE0000QLH0G6','IE00B579F325','IE00BD6FTQ80','IE00B4K6B022','FR0011550185','FR0011550193','IE000L2SA8K5','IE00BK5BQT80','IE00BD4TXV59','IE000QDFFK00'])]
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4390'],{stdio:'ignore'})
const base='http://127.0.0.1:4390/shinny-potato'
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 await mkdir('test-artifacts/metadata-connections',{recursive:true})
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  for(const isin of isins){
   const listing=getPreferredInstrumentListing(isin)
   assert(listing?.sourceUrl&&listing.checkedAt,isin+': qualified common listing')
   assert(records[isin]?.listings?.value.length,isin+': renewable registry listing')
   await page.goto(base+'/fiches-etf?isin='+isin,{waitUntil:'networkidle'})
   if(await page.getByRole('button',{name:'Aperçu',exact:true}).isVisible())await page.getByRole('button',{name:'Aperçu',exact:true}).click()
   await page.getByRole('tab',{name:'Texte',exact:true}).click()
   const facts=page.locator('.es-card .es-facts')
   await facts.getByText('ISIN : '+isin,{exact:true}).waitFor()
   const text=await facts.innerText()
   assert(text.includes('Cotation : '+listing.exchange+' · '+listing.currency),isin+': exact preferred venue and currency reach the sheet')
   if(getInstrumentPeaStatus(isin)===false)assert(text.includes('CTO'),isin+': documented negative is rendered as CTO')
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false)
   if(['IE000DQLYVB9','IE000716YHJ7','IE00B4K6B022','FR0011550185','IE00BK5BQT80','IE00BD4TXV59','IE000QDFFK00'].includes(isin))await page.screenshot({path:'test-artifacts/metadata-connections/'+isin+'-'+width+'.png',fullPage:true})
  }
  const theme=DEFAULT_THEMES.find(t=>t.etfs.some(f=>connectedPea.includes(f.isin)))??DEFAULT_THEMES.find(t=>t.etfs.some(f=>f.isin==='IE00BK5BQT80'))
  assert(theme,'A real comparison contains the newly documented PEA share')
  await page.goto(base+'/comparatif-etf?subject='+encodeURIComponent(theme.id),{waitUntil:'networkidle'})
  if(await page.getByRole('button',{name:'Aperçu',exact:true}).isVisible())await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
  await page.waitForFunction(isin=>document.querySelector('pre')?.textContent.includes(isin),theme.etfs[0].isin)
  assert.equal((await page.locator('pre').innerText()).trim(),getComparatifEtfText(theme.id).trim())
  await page.screenshot({path:'test-artifacts/metadata-connections/comparison-'+width+'.png',fullPage:true})
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('.publication-image-stage img')?.naturalWidth>=1000)
  assert.deepEqual(errors,[]);await page.close()
 }
 console.log('Renewed exact listings and PEA statuses verified in real sheets and comparisons on desktop and mobile.')
}finally{await browser?.close();server.kill()}

