import {chromium} from 'playwright'
import {createHash} from 'node:crypto'
import contracts from '../src/data/native-index-composition-contracts.json' with {type:'json'}

// Observe the public page's own economic-exposure response and census. Never
// request the separate fund/collateral table, attest investor status or solve a gate.
const indexId=process.argv[2],contract=contracts.indices[indexId]
if(contract?.methodCode!=='invesco-published-economic-index-v1')throw Error('Unqualified economic index')
const hash=b=>createHash('sha256').update(b).digest('hex')
const browser=await chromium.launch({headless:true,
 ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{}),
 ...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
const attempts=[]
try{
 const page=await browser.newPage({locale:'en-GB'})
 page.on('response',r=>{if(r.url()===contract.weightSourceUrl)attempts.push({url:r.url(),status:r.status()})})
 const pending=page.waitForResponse(r=>r.url()===contract.weightSourceUrl,{timeout:35000}).catch(()=>null)
 const response=await page.goto(contract.publisherPageUrl,{waitUntil:'domcontentloaded',timeout:35000})
 if(!response?.ok())throw Error(`Public issuer page HTTP ${response?.status()}: ${contract.publisherPageUrl}`)
 const source=await pending
 if(!source?.ok())throw Error('Economic exposure response unavailable: '+JSON.stringify(attempts))
 const raw=await source.body()
 if(raw.length>8_000_000||!['application/json','text/plain'].includes(source.headers()['content-type']?.split(';')[0]))throw Error('Economic exposure response format unavailable')
 const heading=page.getByText('Top 10 exposures',{exact:true}).filter({visible:true})
 await heading.waitFor({timeout:15000})
 if(await heading.count()!==1)throw Error('Ambiguous economic exposure heading')
 const table=heading.locator('xpath=ancestor::section[contains(@class,"dynamic-table")][1]')
 await table.getByText(/Showing\s+1\s+to\s+10\s+of\s+\d+/).waitFor({timeout:15000})
 const model=JSON.parse(await page.locator('[data-model-json]').getAttribute('data-model-json')),configs=[],baskets=[]
 const visit=node=>{
  if(!node||typeof node!=='object')return
  if(node.tableVariation==='holdings'&&node.isin===contract.publisherIsin&&node.displayComponent===true){
   if(node.variationType==='index')configs.push(node)
   if(node.variationType==='fund'&&node.analyticsVariation==='View Basket Constituents')baskets.push(node)
  }
  for(const child of Object.values(node))visit(child)
 }
 visit(model)
 if(configs.length!==1||baskets.length!==1)throw Error('Economic exposure and substitute basket not separately published')
 const config=configs[0],bodyText=await page.locator('body').innerText(),tableText=await table.innerText()
 const count=tableText.match(/Showing\s+1\s+to\s+10\s+of\s+(\d+)/)
 const title=(await page.locator('h1').innerText()).replace(/\s+/g,' ').trim()
 if(title!==contract.publisherShareName||!bodyText.includes('Economic exposure')||!bodyText.includes('View basket constituents')||!count)throw Error('Missing issuer economic-index context')
 const fields=['isin','tableVariation','variationType','apiResponseKey','top10Holdings','displayComponent','maxRowCount','benchmarkProvider','downloadData']
 process.stdout.write(JSON.stringify({indexId,pageUrl:page.url(),pageTitle:title,sourceUrl:source.url(),
  sourceSha256:hash(raw),bodyBase64:raw.toString('base64'),publisherRowCount:Number(count[1]),
  tableText,tableTextSha256:hash(tableText),economicExposurePublished:true,separateSubstituteBasketPublished:true,
  publisherPageSha256:hash(await page.content()),widget:Object.fromEntries(fields.map(k=>[k,config[k]]))}))
}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1}
finally{await browser.close()}
