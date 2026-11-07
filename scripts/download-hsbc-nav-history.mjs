// Ordinary public issuer UI and public FCA filings; no authentication/challenge
// bypass. Anonymous tokens, cookies and request headers never leave the browser.
import {chromium} from 'playwright'
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {dirname} from 'node:path'
const [configPath,output]=process.argv.slice(2)
if(!configPath||!output)throw Error('Expected exact source configuration and output path')
const source=JSON.parse(readFileSync(configPath,'utf8'))
const ISIN='IE00B4K6B022',PAGE='https://www.assetmanagement.hsbc.co.uk/en/institutional-investor/funds/ie00b4k6b022'
if(source.isin!==ISIN||source.sourceUrl!==PAGE||source.navCurrency!=='EUR')throw Error('Unsupported exact HSBC source identity')
const filings=source.cashAnnouncementUrls
if(!Array.isArray(filings)||filings.length!==4||new Set(filings).size!==4||filings.some(u=>!/^https:\/\/data\.fca\.org\.uk\/artefacts\/NSM\/RNS\/\d+\.html$/.test(u)))throw Error('Unqualified historical cash filing scope')
const executable=['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync)
const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{}),args:['--disable-dev-shm-usage'],...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
const result={schemaVersion:1,isin:ISIN,checkedAt:new Date().toISOString(),sourceUrl:PAGE,requestedCashUrls:filings,expectedKinds:['presentation','nav-workbook','dividend-table','documents-table','cash-announcement'],observations:[],attempts:[]},pending=[],componentErrors=[]
const observe=(kind,url,body,status=200)=>{if(body.length>3_000_000)throw Error('HSBC browser response exceeds size guard');result.observations.push({kind,url,status,sha256:createHash('sha256').update(body).digest('hex'),bodyBase64:body.toString('base64')})}
try{
 const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage();page.setDefaultTimeout(25000)
 page.on('response',r=>{const u=new URL(r.url());if(u.hostname!=='www.assetmanagement.hsbc.co.uk'||!['/api/v1/detail/presentation','/api/v1/detail/dividend-table','/api/v1/detail/documents-table'].includes(u.pathname))return
  pending.push((async()=>{if(r.status()!==200)throw Error('Official HSBC component failed: '+u.pathname+' HTTP'+r.status());observe(u.pathname.split('/').at(-1),u.origin+u.pathname,await r.body())})().catch(e=>componentErrors.push(e.message)))
 })
 const response=await page.goto(PAGE,{waitUntil:'networkidle',timeout:55000})
 if(!response?.ok()||new URL(response.url()).pathname.toLowerCase()!==new URL(PAGE).pathname)throw Error('Exact public HSBC page unavailable')
 await page.locator('#share-class-select').waitFor();if(await page.locator('#share-class-select').inputValue()!==ISIN)throw Error('Wrong selected HSBC share')
 const decline=page.getByRole('button',{name:'Decline optional cookies',exact:true});if(await decline.isVisible())await decline.click()
 // NAV is the share's base EUR workbook, independent of the displayed exchange quote.
 // Keep the issuer's default quote context; never convert that quote into NAV.
 result.selection={isin:await page.locator('#share-class-select').inputValue(),exchange:await page.locator('#exchange-select').inputValue(),currency:await page.locator('#excurrency-select').locator('option:checked').innerText(),listingId:await page.locator('#excurrency-select').inputValue()}
 result.phase='cash';await page.getByText('Dividends',{exact:true}).click();await page.waitForFunction(()=>document.body.innerText.includes('Latest dividend payment'));await Promise.all(pending);if(!result.observations.some(r=>r.kind==='dividend-table'))throw Error('Current cash response absent; rendered/cache text is not source proof')
 await page.getByText('Prices and fees',{exact:true}).click();const link=page.getByRole('link',{name:/NAV_history/});await link.waitFor()
 const download=page.waitForEvent('download');await link.click();const file=await download;const temporary=output+'.xlsx';await file.saveAs(temporary);const workbook=readFileSync(temporary);observe('nav-workbook','https://www.assetmanagement.hsbc.co.uk/api/v1/detail/fund-history',workbook);result.workbookFilename=file.suggestedFilename()
 result.phase='documents';await page.getByText('Documents',{exact:true}).click();await page.getByText('Annual report',{exact:true}).first().waitFor();await Promise.all(pending);if(!result.observations.some(r=>r.kind==='documents-table'))throw Error('Current document-directory response absent');if(componentErrors.length)throw Error(componentErrors.join('; '))
 for(const url of filings){const p=await context.newPage(),attempt={url,attemptedAt:new Date().toISOString()};result.attempts.push(attempt);try{const r=await p.goto(url,{waitUntil:'domcontentloaded',timeout:35000});attempt.status=r?.status();if(!r?.ok()||r.url()!==url)throw Error('Public FCA historical filing unavailable: '+attempt.status+' '+url);observe('cash-announcement',url,await r.body())}finally{await p.close()}}
 result.phase='complete';result.status='succeeded';result.completedAt=new Date().toISOString()
}catch(error){result.status='failed';result.error=error.message;process.exitCode=1}
finally{await Promise.allSettled(pending);await browser.close();mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(result)+'\n')}
console.log(JSON.stringify({status:result.status,isin:ISIN,observations:result.observations.length,error:result.error}))
