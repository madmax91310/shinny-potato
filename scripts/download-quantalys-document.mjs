import {chromium} from 'playwright'
const url=process.argv[2]
const search=/^https:\/\/www\.quantalys\.com\/Recherche\/RechercheRapide\?inputSearch=([A-Z]{2}[A-Z0-9]{9}\d)$/.exec(url)
if(!search&&!/^https:\/\/www\.quantalys\.com\/Fonds\/[1-9]\d*$/.test(url))throw new Error('Unsupported public exact-share reference')
let browser
try{
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 const page=await browser.newPage()
 let response=await page.goto(search?'https://www.quantalys.com/':url,{waitUntil:'domcontentloaded',timeout:25000})
 if(response?.ok()&&search){
  await page.locator('#inputSearch').fill(search[1])
  ;[response]=await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:25000}),page.locator('form[action="/Recherche/RechercheRapide"]').evaluate(form=>form.submit())])
 }
 if(!response?.ok()){console.log(JSON.stringify({error:'Public fund response refused',status:response?.status()}));process.exitCode=1}
 else{
  if(/^https:\/\/www\.quantalys\.com\/Fonds\/[1-9]\d*$/.test(page.url()))await page.locator('[data-ref="root-synthese-fond"]').waitFor({timeout:15000})
  console.log(JSON.stringify({sourceUrl:page.url(),body:Buffer.from(await page.content()).toString('base64')}))
 }
}catch(error){console.log(JSON.stringify({error:String(error)}));process.exitCode=1}
finally{await browser?.close()}
