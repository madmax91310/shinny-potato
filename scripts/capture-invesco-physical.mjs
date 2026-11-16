import {chromium} from 'playwright'
import {createHash} from 'node:crypto'
import contracts from './invesco-physical-holdings-contracts.json' with {type:'json'}

// The ordinary public fund page supplies its own complete-table census. No
// credentials, investor-status attestation, challenge solving or hidden route.
const isin=process.argv[2],share=contracts.shares[isin],routeId=process.argv[3]||'primary'
if(!share)throw Error('Unqualified Invesco physical share')
const route=routeId==='primary'?{account:contracts.account,locale:'fr-FR',pageUrl:share.pageUrl,mandateLiteral:share.mandateLiteral}:share.qualifiedRoutes?.[routeId]
if(!route||!['fr-FR','en-GB'].includes(route.locale)||!['fr_FR','en_GB'].includes(route.account))throw Error('Unqualified public acquisition route')
const english=route.locale==='en-GB'
const censusPattern=english?/Showing\s+1\s+to\s+10\s+of\s+(\d+)\b/:/Afficher\s+1\s+à\s+10\s+de\s+(\d+)\s+produits/
const endpoint=`https://dng-api.invesco.com/cache/v1/accounts/${route.account}/shareclasses/${isin}/holdings/index?idType=isin&loadType=initial`
const hash=b=>createHash('sha256').update(b).digest('hex')
const browser=await chromium.launch({headless:true,
 ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{}),
 ...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
const attempts=[]
try{
 const page=await browser.newPage({locale:route.locale})
 page.on('response',r=>{if(r.url().startsWith('https://dng-api.invesco.com/')&&r.url().includes('/holdings/'))attempts.push({url:r.url(),status:r.status(),contentType:r.headers()['content-type']})})
 const pending=page.waitForResponse(r=>r.url()===endpoint,{timeout:35000}).catch(()=>null)
 const response=await page.goto(route.pageUrl,{waitUntil:'domcontentloaded',timeout:35000})
 if(!response?.ok())throw Error(`Public Invesco page HTTP ${response?.status()}`)
 const source=await pending
 // This issuer serves its JSON portfolio as text/plain;charset=UTF-8. The
 // exact public endpoint and full JSON/census contract qualify it, not MIME alone.
 const mime=source?.headers()['content-type']?.split(';')[0].trim().toLowerCase()
 if(!source?.ok()||!['application/json','text/plain'].includes(mime))throw Error('Public physical holdings response unavailable: '+JSON.stringify(attempts))
 const raw=await source.body()
 if(raw.length>8_000_000)throw Error('Oversized issuer table')
 const payload=JSON.parse(raw.toString())
 const heading=page.getByText(english?/^Top 10\s+exposures$/:/^Les 10\s+principales expositions$/).filter({visible:true})
 await heading.waitFor({timeout:15000})
 if(await heading.count()!==1)throw Error('Ambiguous issuer holdings table')
 const table=heading.locator('xpath=ancestor::*[.//table][1]')
 await table.getByText(censusPattern).waitFor({timeout:15000})
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
 const count=tableText.match(censusPattern)
 const stamp=tableText.match(english?/\bas of\s+(\d{1,2})-([A-Za-z]{3})-(\d{2})\b/:/\bau\s+(\d{2})\/(\d{2})\/(\d{4})\b/)
 const sampling=english?Boolean(route.samplingMandateLiteral)&&literal(bodyText).includes(route.samplingMandateLiteral):literal(bodyText).toLowerCase().includes("le fonds détiendra un nombre de titres inférieur à celui de l'indice de référence")
 const mode=share.mandate||'physical-sampling'
 if(!['physical-sampling','full-physical-replication'].includes(mode))throw Error('Unqualified replication mandate')
 const replicated=mode==='full-physical-replication'&&Boolean(route.mandateLiteral)&&literal(bodyText).includes(route.mandateLiteral)
 const mandateConfirmed=mode==='full-physical-replication'?replicated:sampling
 if(pageTitle!==share.shareName||!count||!stamp||!mandateConfirmed||config.top10Holdings!==true||config.apiResponseKey!=='holdings')throw Error('Unqualified physical sampled fund context: '+JSON.stringify({pageTitle,hasCount:!!count,hasDate:!!stamp,sampling,replicated,top10Holdings:config.top10Holdings,apiResponseKey:config.apiResponseKey}))
 const months='jan feb mar apr may jun jul aug sep oct nov dec'.split(' ')
 const asOf=english?payload.effectiveDate:`${stamp[3]}-${stamp[2]}-${stamp[1]}`
 if(english&&(!/^\d{4}-\d{2}-\d{2}$/.test(asOf)||Number(stamp[1])!==Number(asOf.slice(8,10))||months.indexOf(stamp[2].toLowerCase())+1!==Number(asOf.slice(5,7))||stamp[3]!==asOf.slice(2,4)))throw Error('Public date and full ISO source date disagree')
 const total=Number(count[1])
 if(!Array.isArray(payload.holdings)||total<11||total!==payload.holdings.length||payload.effectiveDate!==asOf)throw Error('Incomplete or mismatched publisher table census/date')
 process.stdout.write(JSON.stringify({isin,acquisitionRoute:routeId,pageUrl:route.pageUrl,pageTitle,asOf,publisherRowCount:total,
  sourceUrl:endpoint,sourceSha256:hash(raw),bodyBase64:raw.toString('base64'),payload,tableText,tableTextSha256:hash(tableText),
  samplingMandateConfirmed:sampling,...(mode==='full-physical-replication'?{physicalReplicationMandateConfirmed:replicated}:{}),widget:{isin:config.isin,tableVariation:config.tableVariation,
   variationType:config.variationType,apiResponseKey:config.apiResponseKey,top10Holdings:config.top10Holdings,
   displayComponent:config.displayComponent,maxRowCount:config.maxRowCount}}))
}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1}
finally{await browser.close()}
