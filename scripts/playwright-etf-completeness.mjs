import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4363'],{stdio:'ignore'});
let browser;
try {
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:4363/shinny-potato/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
 for(const width of [390,1280]) {
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4363/shinny-potato/bibliotheque-donnees',{waitUntil:'networkidle'});
  await page.locator('.ds-etf-development > summary').click();
  await page.getByRole('heading',{name:/^Couverture des \d+ instruments$/}).waitFor();
  await page.getByLabel('Rechercher un ETF ou un ISIN').fill('IE0003R87OG3');
  const detail=page.locator('.ds-etf-development details').filter({has:page.locator('summary').filter({hasText:'IE0003R87OG3'})}).first();
  await detail.locator('summary').click();
  assert.match(await detail.innerText(),/AVWS.DE \(EUR\)/);assert.match(await detail.innerText(),/Calendrier émetteur \(USD\)/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('ETF completeness: mobile/desktop search, exact currency distinction and layout verified.');
} finally {await browser?.close();server.kill();}
