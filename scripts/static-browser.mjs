import {chromium} from 'playwright'
import {readFile} from 'node:fs/promises'
import {resolve,extname} from 'node:path'
export const staticBase='https://production.test/shinny-potato/'
export async function staticBrowser(width=390){
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}: {})})
 const context=await browser.newContext({viewport:{width,height:950}})
 await context.route('**/*',async route=>{
  const url=route.request().url();if(!url.startsWith(staticBase))return route.abort()
  const path=decodeURIComponent(new URL(url).pathname).slice('/shinny-potato/'.length),root=resolve('dist'),file=resolve(root,path||'index.html')
  if(!file.startsWith(root+'/'))return route.abort()
  try{await route.fulfill({body:await readFile(file),contentType:({'.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'})[extname(file)]||'text/html'})}
  catch{if(!extname(path))await route.fulfill({body:await readFile(resolve(root,'index.html')),contentType:'text/html'});else await route.fulfill({status:404,body:''})}
 })
 const page=await context.newPage();return{browser,context,page}
}
