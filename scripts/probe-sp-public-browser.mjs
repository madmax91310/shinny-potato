// Read-only transport qualification. No challenges, authentication, cache or registry writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
const output=process.argv[2];if(!output)throw Error('Expected evidence output path');
const configs=JSON.parse(fs.readFileSync('scripts/index-automation.json')).indices.filter(c=>c.compositionDataUrl);
if(configs.length!==2)throw Error('Unexpected S&P exact-index scope');
for(const c of configs){for(const u of[c.compositionPageUrl,c.compositionDataUrl])if(new URL(u).origin!=='https://www.spglobal.com')throw Error('Unqualified public origin');}
const envelope={schemaVersion:1,kind:'read-only-official-browser-probe',startedAt:new Date().toISOString(),expected:configs.map(c=>({id:c.id,indexId:c.compositionIndexId,currency:c.returnCurrency,fields:['composition'],page:c.compositionPageUrl,source:c.compositionDataUrl})),outcomes:configs.map(c=>({id:c.id,status:'not-attempted',reason:'execution-not-started'}))};
const save=()=>{fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output+'.tmp',JSON.stringify(envelope,null,2));fs.renameSync(output+'.tmp',output);};save();
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})});
 for(const[index,c]of configs.entries()){
  const r=envelope.outcomes[index];r.attemptedAt=new Date().toISOString();r.status='attempting';save();let context;
  try{
   context=await browser.newContext({serviceWorkers:'block'});const page=await context.newPage();
   await page.route('**/*',route=>['image','media','font'].includes(route.request().resourceType())?route.abort():route.continue());
   r.stage='ordinary-public-navigation';const navigation=await page.goto(c.compositionPageUrl,{waitUntil:'domcontentloaded',timeout:40000});r.pageStatus=navigation?.status();r.finalPageUrl=page.url();
   if(!navigation||navigation.status()!==200)throw Error('Official index page refused: '+navigation?.status());
   const title=await page.title();if(/access denied|just a moment|captcha|verify.*human|attention required/i.test(title))throw Error('Public access challenge; no challenge solving attempted');
   await page.waitForTimeout(2000);r.stage='same-session-official-json';
   const response=await page.evaluate(async url=>{const res=await fetch(url,{credentials:'include',cache:'no-store',headers:{Accept:'application/json'}});const bytes=new Uint8Array(await res.arrayBuffer());if(bytes.length>4000000)throw Error('Official response exceeds size limit');let bin='';for(let i=0;i<bytes.length;i+=32768)bin+=String.fromCharCode(...bytes.subarray(i,i+32768));return{status:res.status,url:res.url,contentType:res.headers.get('content-type'),bodyBase64:btoa(bin)};},c.compositionDataUrl);
   r.httpStatus=response.status;r.responseUrl=response.url;r.contentType=response.contentType;
   if(response.status!==200||response.url!==c.compositionDataUrl||!/^application\/json(?:;|$)/i.test(response.contentType??''))throw Error('Official JSON refused or not JSON: '+response.status+' '+response.contentType);
   const raw=Buffer.from(response.bodyBase64,'base64');if(!raw.length)throw Error('Empty official response');JSON.parse(raw.toString('utf8'));r.bodyBase64=response.bodyBase64;r.sha256=crypto.createHash('sha256').update(raw).digest('hex');r.bytes=raw.length;r.status='acquired';r.retrievedAt=new Date().toISOString();delete r.reason;
  }catch(e){r.status='failed';r.reason=String(e.message??e);}finally{await context?.close();save();console.log(JSON.stringify({...r,bodyBase64:undefined}));}
 }
}catch(e){envelope.runtimeError=String(e.message??e);for(const r of envelope.outcomes)if(r.status==='not-attempted'||r.status==='attempting'){r.status='not-attempted';r.reason='browser-runtime-failed';}}
finally{await browser?.close();envelope.completedAt=new Date().toISOString();save();}
if(envelope.outcomes.some(r=>r.status!=='acquired'))process.exitCode=1;
