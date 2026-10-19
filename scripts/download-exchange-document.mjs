import {chromium} from 'playwright'
const url=process.argv[2]
if(!/^https:\/\/live\.euronext\.com\/en\/product\/etfs\/[A-Z]{2}[A-Z0-9]{9}\d-[A-Z0-9]{4}$/.test(url))throw new Error('Unsupported exact exchange document')
let browser
try {
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 const page=await browser.newPage()
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000})
 if(!response?.ok()){console.log(JSON.stringify({error:'Exchange response refused',status:response?.status()}));process.exitCode=1}
 else {
  await page.waitForFunction(()=>[...document.querySelectorAll('tr')].some(row=>row.cells[0]?.textContent.trim()==='Currency'&&/^[A-Z]{3}$/.test(row.cells[1]?.textContent.trim()??'')),{},{timeout:30000})
  console.log(JSON.stringify({sourceUrl:page.url(),body:Buffer.from(await page.content()).toString('base64')}))
 }
} catch(error){console.log(JSON.stringify({error:String(error)}));process.exitCode=1}
finally{await browser?.close()}
