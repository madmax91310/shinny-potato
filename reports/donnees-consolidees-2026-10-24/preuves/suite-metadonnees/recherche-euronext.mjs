// Sonde de recherche locale, pas un collecteur planifié. Le premier cas LQQ a été capturé séparément.
import {chromium}from'playwright'
import fs from'node:fs'
import zlib from'node:zlib'
import crypto from'node:crypto'
const root=process.argv[2],ids=['CH0454664001','FR0010755611','FR0011550185','FR0011871110','FR0011871128','FR0013411998','FR0013412004','IE00B4K6B022'],manifest=[]
if(!root)throw Error('Passer un répertoire de sortie distinct des preuves originales. Recherche locale seulement, aucune qualification ou écriture dans les données de production.');fs.mkdirSync(root,{recursive:true})
const browser=await chromium.launch({headless:true}),context=await browser.newContext()
try{for(const isin of ids){const page=await context.newPage(),url=`https://live.euronext.com/en/product/etfs/${isin}-XPAR`,proof={isin,url,attemptedAt:new Date().toISOString(),verification:'local browser on official exchange; not a GitHub supplier validation'}
 try{
  const response=await page.goto(url,{waitUntil:'networkidle',timeout:45000});proof.httpStatus=response.status();if(response.status()!==200)throw Error('Page instrument indisponible')
  const body=await page.locator('body').innerText();if(!body.includes(isin+' - ')||!body.includes('EURONEXT PARIS')||!body.match(/Currency\s+EUR\b/))throw Error('Identité/cotation/devise non qualifiées dans la page')
  const reject=page.getByRole('button',{name:'Reject All',exact:true});if(await reject.isVisible())await reject.click();await page.locator('#awl-intraday-and-chart input[value=MAX]').first().click({force:true})
  await page.waitForFunction(()=>window.AmCharts?.charts?.some(c=>c.dataProvider?.length>100&&new Date(c.dataProvider[0]?.time).getUTCFullYear()<=2024),{},{timeout:12000})
  const rows=await page.evaluate(()=>{const datasets=window.AmCharts.charts.map(c=>c.dataProvider??[]).filter(d=>d.length>100&&new Date(d[0]?.time).getUTCFullYear()<=2024);datasets.sort((a,b)=>new Date(a[0].time)-new Date(b[0].time));return datasets[0].map(r=>r.dataContext??r)})
  if(!rows.every(r=>typeof r.price==='number'&&r.price>0&&typeof r.time==='string'))throw Error('Structure de cours inconnue')
  const file=`euronext-${isin}-historique.json.gz`,raw=Buffer.from(JSON.stringify({isin,mic:'XPAR',currency:'EUR',url,collectedAt:new Date().toISOString(),rows}));fs.writeFileSync(root+'/'+file,zlib.gzipSync(raw));proof.file=file;proof.sha256=crypto.createHash('sha256').update(raw).digest('hex');proof.rows=rows.length;proof.first=rows[0].time;proof.last=rows.at(-1).time;proof.identityExcerpt=body.slice(body.indexOf('Home'),body.indexOf('QUOTES')+6);proof.qualifiedAsResearchEvidence=true;proof.causeExplained=false
 }catch(e){proof.error=e.message;proof.qualifiedAsResearchEvidence=false}
 manifest.push(proof);console.log(JSON.stringify(proof));fs.writeFileSync(root+'/euronext-reliquat-manifeste.json',JSON.stringify(manifest,null,2)+'\n');await page.close();await new Promise(r=>setTimeout(r,2000))
}}finally{await browser.close()}
