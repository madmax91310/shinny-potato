import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {initialiseRegionalGate} from './vaneck-document.mjs';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
try {
 for(const [locale,retail,professional,accept]of [['fr/fr','Investisseur individuel','Investisseur professionnel','Accepter et continuer'],['uk/en','Individual Investor','Professional Investor','Accept & Continue']]){
  const context=await browser.newContext();
  // Actual published gate labels, isolated callbacks: no issuer request or consent.
  await context.route('https://www.vaneck.com/**',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><button id="gateway_button" onclick="window.actions.push('country')">Country</button><button onclick="window.actions.push('retail')">${retail}</button><button onclick="window.actions.push('professional')">${professional}</button><button onclick="window.actions.push('accept');this.hidden=true">${accept}</button><script>window.actions=[]</script>`}));
  const page=await context.newPage();
  assert.equal(await initialiseRegionalGate(page,{landing:`https://www.vaneck.com/${locale}/`}),true);
  assert.deepEqual(await page.evaluate(()=>window.actions),['retail','accept']);
  await context.close();
 }
 const context=await browser.newContext();await context.route('https://www.vaneck.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><p>No regional gate</p>'}));
 assert.equal(await initialiseRegionalGate(await context.newPage(),{landing:'https://www.vaneck.com/fr/fr/'},100),false);
 await context.close();
 console.log('VanEck gate: actual French/English retail labels, acceptance completion, no country/professional clicks, absent gate passed.');
}finally{await browser.close()}
