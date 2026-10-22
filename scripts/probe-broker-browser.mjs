import {chromium} from 'playwright'
import fs from 'node:fs'
const browser=await chromium.launch({headless:true,...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
const rows=[]
for(const url of ['https://www.boursedirect.fr/fr/formulaires-en-ligne','https://www.boursedirect.com/pdf/tarifs_bd.pdf','https://bofip.impots.gouv.fr/bofip/1556-PGP.html']) {
 const page=await browser.newPage()
 try {const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});rows.push({url,status:response?.status(),title:await page.title()})}
 catch(e){rows.push({url,error:e.message.split('\n')[0]})}
 await page.close()
}
await browser.close();fs.writeFileSync('reports/corrections-2026-10-22/preuves/courtiers-navigateur.json',JSON.stringify(rows,null,2));console.log(rows)
