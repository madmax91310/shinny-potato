import {waitPreview} from './wait-preview.mjs'
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
const port=4363,base=`http://127.0.0.1:${port}/shinny-potato`;
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'});
let browser;
try {
 await waitPreview(server,base)
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/donnees-a-revoir');
  const section=page.locator('[aria-label="Couverture par actif et par champ"]');
  await section.getByRole('heading',{name:'Couverture par actif et par champ',exact:true}).waitFor();
  assert.equal(await page.locator('select').count(),0);
  await section.getByText('Consulter le détail et les lacunes',{exact:true}).click();
  await section.getByPlaceholder('Nom, ISIN, encours…').fill('IE00BM8R0J59');
  await section.getByRole('button',{name:'Tous les champs',exact:true}).click();
  assert((await section.innerText()).includes('Global X Nasdaq 100 Covered Call'));
  assert((await section.innerText()).includes('Historique mensuel'));
  assert((await section.innerText()).includes('Dernier contrôle'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Per-field automation coverage: desktop/mobile filtering, source conflicts and rendering verified.');
}finally{await browser?.close();server.kill();}
