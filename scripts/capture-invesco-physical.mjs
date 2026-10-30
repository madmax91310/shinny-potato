import {chromium} from 'playwright'
import {createHash} from 'node:crypto'
import contracts from './invesco-physical-holdings-contracts.json' with {type:'json'}

// The ordinary public fund page supplies its own complete-table census. No
// credentials, investor-status attestation, challenge solving or hidden route.
const isin=process.argv[2],share=contracts.shares[isin]
if(!share)throw Error('Unqualified Invesco physical share')
const endpoint=`https://dng-api.invesco.com/cache/v1/accounts/${contracts.account}/shareclasses/${isin}/holdings/index?idType=isin&loadType=initial`
const hash=b=>createHash('sha256').update(b).digest('hex')
const browser=await chromium.launch({headless:true,
 ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{}),
 ...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
const attempts=[]
try{
 const page=await browser.newPage({locale:'fr-FR'})
 page.on('response',r=>{if(r.url().startsWith('https://dng-api.invesco.com/')&&r.url().includes('/holdings/'))attempts.push({url:r.url(),status:r.status(),contentType:r.headers()['content-type']})})
 const pending=page.waitForResponse(r=>r.url()===endpoint,{timeout:35000}).catch(()=>null)
 const response=await page.goto(share.pageUrl,{waitUntil:'domcontentloaded',timeout:35000})
 if(!response?.ok())throw Error(`Public Invesco page HTTP ${response?.status()}`)
 const source=await pending
 // This issuer serves its JSON portfolio as text/plain;charset=UTF-8. The
 // exact public endpoint and full JSON/census contract qualify it, not MIME alone.
 const mime=source?.headers()['content-type']?.split(';')[0].trim().toLowerCase()
 if(!source?.ok()||!['application/json','text/plain'].includes(mime))throw Error('Public physical holdings response unavailable: '+JSON.stringify(attempts))
 const raw=await source.body()
 if(raw.length>8_000_000)throw Error('Oversized issuer table')
 const payload=JSON.parse(raw.toString())
 const heading=page.getByText(/^Les 10\s+principales expositions$/).filter({visible:true})
 await heading.waitFor({timeout:15000})
 if(await heading.count()!==1)throw Error('Ambiguous issuer holdings table')
 const table=heading.locator('xpath=ancestor::*[.//table][1]')
 await table.getByText(/Afficher\s+1\s+à\s+10\s+de\s+\d+\s+produits/).waitFor({timeout:15000})
 const tableText=await table.innerText(),bodyText=await page.locator('body').innerText()
 const model=await page.locator('[data-model-json]').getAttribute('data-model-json')
 const configs=[]
 const visit=node=>{
  if(!node||typeof node!=='object')return
  if(node.tableVariation==='holdings'&&node.variationType==='index'&&node.isin===isin&&node.displayComponent===true)configs.push(node)
  else for(const child of Object.values(node))visit(child)
 }
 visit(JSON.parse(model))
 if(configs.length!==1)throw Error('Missing exact-share public holdings configuration')
 const config=configs[0]
 const literal=value=>String(value).replace(/\s+/gu,' ').trim()
 const pageTitle=literal(await page.locator('h1').innerText())
 const count=tableText.match(/Afficher\s+1\s+à\s+10\s+de\s+(\d+)\s+produits/)
 const stamp=tableText.match(/\bau\s+(\d{2})\/(\d{2})\/(\d{4})\b/)
 const sampling=literal(bodyText).toLowerCase().includes("le fonds détiendra un nombre de titres inférieur à celui de l'indice de référence")
 if(pageTitle!==share.shareName||!count||!stamp||!sampling||config.top10Holdings!==true||config.apiResponseKey!=='holdings')throw Error('Unqualified physical sampled fund context: '+JSON.stringify({pageTitle,hasCount:!!count,hasDate:!!stamp,sampling,top10Holdings:config.top10Holdings,apiResponseKey:config.apiResponseKey}))
 const asOf=`${stamp[3]}-${stamp[2]}-${stamp[1]}`
 const total=Number(count[1])
 if(!Array.isArray(payload.holdings)||total<11||total!==payload.holdings.length||payload.effectiveDate!==asOf)throw Error('Incomplete or mismatched publisher table census/date')
 process.stdout.write(JSON.stringify({isin,pageUrl:share.pageUrl,pageTitle,asOf,publisherRowCount:total,
  sourceUrl:endpoint,sourceSha256:hash(raw),bodyBase64:raw.toString('base64'),payload,tableText,tableTextSha256:hash(tableText),
  samplingMandateConfirmed:true,widget:{isin:config.isin,tableVariation:config.tableVariation,
   variationType:config.variationType,apiResponseKey:config.apiResponseKey,top10Holdings:config.top10Holdings,
   displayComponent:config.displayComponent,maxRowCount:config.maxRowCount}}))
}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1}
finally{await browser.close()}
