import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {initialiseRegionalGate} from './vaneck-document.mjs';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
try {
 for(const [locale,retail,professional,accept,tag='button',value='Individual Investor']of [['fr/fr','Investisseur individuel','Investisseur professionnel','Accepter et continuer'],['uk/en','Individual Investor','Professional Investor','Accept & Continue'],['fr/en','Retail Investor','Professional Investor','Accept & Continue','button','Retail Investor'],['fr/en','Retail Investor','Professional Investor','Accept & Continue','a','']]){
  const context=await browser.newContext();
  // Actual published gate labels, isolated callbacks: no issuer request or consent.
  await context.route('https://www.vaneck.com/**',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><button id="gateway_button" onclick="window.actions.push('country')">Country</button><${tag} id="retail" role="menuitem" value="${value}" onclick="window.actions.push('retail')">${retail}</${tag}><button id="pi" role="menuitem" value="Professional Investor" onclick="window.actions.push('professional')">${professional}</button><button onclick="window.actions.push('accept');this.hidden=true">${accept}</button><script>window.actions=[]</script>`}));
  const page=await context.newPage();
  assert.equal(await initialiseRegionalGate(page,{landing:`https://www.vaneck.com/${locale}/`}),true);
  assert.deepEqual(await page.evaluate(()=>window.actions),['retail','accept']);
  await context.close();
 }
 const context=await browser.newContext();await context.route('https://www.vaneck.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><p>No regional gate</p>'}));
 assert.equal(await initialiseRegionalGate(await context.newPage(),{landing:'https://www.vaneck.com/fr/fr/'},100),false);
 await context.close();
 const restricted=await browser.newContext();await restricted.route('https://www.vaneck.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><button>Accepter et continuer</button><button id="pi" role="menuitem">Investisseur professionnel</button>'}));await assert.rejects(initialiseRegionalGate(await restricted.newPage(),{landing:'https://www.vaneck.com/fr/fr/'},100),/Timeout/);await restricted.close();

 // Reject a misleading professional label even if an element reuses the retail id.
 const mislabelled=await browser.newContext();
 await mislabelled.route('https://www.vaneck.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><button>Accept & Continue</button><button id="retail" role="menuitem" value="Professional Investor">Professional Investor</button>'}));
 await assert.rejects(initialiseRegionalGate(await mislabelled.newPage(),{landing:'https://www.vaneck.com/fr/en/'},100),/Timeout/);await mislabelled.close();
 const html=target=>'<!doctype html><button id="retail" role="menuitem" value="Retail Investor">Retail Investor</button><button id="continue">Accept & Continue</button><script>document.getElementById("continue").onclick=()=>location.assign('+JSON.stringify(target)+')</script>';
 // A top-level commit must not wait for unrelated page resources.
 const navigation=await browser.newContext();let release;const blocked=new Promise(r=>release=r);
 await navigation.route('https://www.vaneck.com/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/slow.js'){await blocked;await route.fulfill({contentType:'text/javascript',body:''}).catch(()=>{});return;}
  await route.fulfill({contentType:'text/html',body:path==='/confirmed'?'<html><script src="/slow.js"></script>Confirmed</html>':html('/confirmed')});
 });
 const page=await navigation.newPage();
 try{assert.equal(await initialiseRegionalGate(page,{landing:'https://www.vaneck.com/fr/en/'},1000),true);assert.equal(new URL(page.url()).pathname,'/confirmed');}finally{release();await navigation.close();}
 // A PDF download does not navigate away or hide the original button.
 const download=await browser.newContext({acceptDownloads:true});
 await download.route('https://www.vaneck.com/**',r=>new URL(r.request().url()).pathname==='/fixture.pdf'
  ?r.fulfill({headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename=fixture.pdf'},body:'%PDF-1.7\n% isolated callback fixture, not a financial observation\n%%EOF'})
  :r.fulfill({contentType:'text/html',body:html('/fixture.pdf')}));
 const downloadPage=await download.newPage();
 assert.equal(await initialiseRegionalGate(downloadPage,{landing:'https://www.vaneck.com/fr/en/'},1000),true);
 assert(await downloadPage.getByRole('button',{name:'Accept & Continue',exact:true}).isVisible());await download.close();
 const unconfirmed=await browser.newContext();
 await unconfirmed.route('https://www.vaneck.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><button id="retail" role="menuitem">Retail Investor</button><button>Accept & Continue</button>'}));
 await assert.rejects(initialiseRegionalGate(await unconfirmed.newPage(),{landing:'https://www.vaneck.com/fr/en/'},100),/confirmation not observed/);await unconfirmed.close();

 console.log('VanEck gate: French/English/retail label variants, navigation commit and PDF download completion, rejected professional controls, missing confirmation and absent gate passed.');
}finally{await browser.close()}
