import assert from 'node:assert/strict'
import {collectPublicPerformance} from './download-wisdomtree-performance.mjs'
import sources from './official-nav-remainder-sources.json' with {type:'json'}
const source=sources.find(s=>s.wisdomTicker==='COCO')
function page({status=200,landingUrl=source.sourceUrl,identity=true,rows,offline=false}={}){
 const calls=[]
 return {calls,async goto(url){calls.push(['landing',url]);if(offline)throw Error('network offline');return {status:()=>status,url:()=>landingUrl}},
 async waitForFunction(fn,isin){assert.equal(isin,source.isin);calls.push(['identity',isin]);if(!identity)throw Error('Wrong product identity')},
 async evaluate(fn,url){calls.push(['widget',url]);return rows?.(url)??{url,status:200,body:'[]'}}}
}
const p=page(),r=await collectPublicPerformance(p,source)
assert.deepEqual(p.calls.map(r=>r[0]),['landing','identity','widget','widget'])
assert.equal(r.publicProductPage.isin,source.isin)
assert.equal(r.results.length,2)
for(const result of r.results){assert(result.url.includes('/historical_performance/?entity=COCO&mode='));assert.equal(Buffer.from(result.body,'base64').toString(),'[]')}
for(const options of [{status:403},{status:200,identity:false},{landingUrl:'https://another.invalid/'},{offline:true},
 {rows:url=>({url,status:403,body:'[]'})},{rows:url=>({url:url+'&other=1',status:200,body:'[]'})},
 {rows:url=>({url,status:200,body:'<html>challenge</html>'})},{rows:url=>({url,status:200,body:'{}'})},
 {rows:url=>({url,status:200,body:'x'.repeat(8_000_001)})}]){
 const p=page(options);await assert.rejects(()=>collectPublicPerformance(p,source))
 if(options.status===403||options.identity===false||options.landingUrl||options.offline)assert(!p.calls.some(r=>r[0]==='widget'),'Landing/identity failure must not request widget data')
}
for(const patch of [{isin:'wrong'},{wisdomTicker:'NGAS'},{navCurrency:'EUR'},{sourceUrl:'https://example.org'}]){
 const p=page();await assert.rejects(()=>collectPublicPerformance(p,{...source,...patch}));assert.equal(p.calls.length,0)
}
console.log('WisdomTree browser: exact public product precedes its two widgets; forbidden pages, wrong identity, network failures, partial/changed/oversize payloads rejected without cache.')

// A fresh official PDF can independently bind the public API navigation, as
// in the existing directory/rankings transports. No generic demo identity.
const binding={kind:'official-exact-product-pdf-v1',isin:source.isin,currency:source.navCurrency,sourceUrl:source.factsheetUrl,sha256:'a'.repeat(64),asOf:'2026-10-31',checkedAt:new Date().toISOString()}
function apiPage({status=200,urlChange=u=>u,contentType='application/json',body='[{}]',offline=false}={}){
 const calls=[];return{calls,async goto(url){calls.push(url);if(offline)throw Error('network offline');return{status:()=>status,url:()=>urlChange(url),headers:()=>({'content-type':contentType}),body:async()=>Buffer.from(body)}}}
}
const native=apiPage(),via=await collectPublicPerformance(native,source,binding)
assert.equal(via.publicProductPage,undefined);assert.equal(via.publicApiNavigation.productPageAttempted,false)
assert.deepEqual(via.qualifiedIdentity,binding);assert.equal(via.results.length,2)
assert(native.calls.every(u=>u.startsWith('https://dataspanapi.wisdomtree.com/funddetails/historical_performance/')))
for(const mutation of [{kind:'cache'},{isin:'IE0000000000'},{currency:'EUR'},{sourceUrl:'https://example.test/identity'},{sha256:'invalid'},{checkedAt:'2020-01-01T00:00:00Z'},{checkedAt:new Date(Date.now()+600000).toISOString()},{asOf:'unknown'}]){
 const p=apiPage();await assert.rejects(()=>collectPublicPerformance(p,source,{...binding,...mutation}));assert.equal(p.calls.length,0)
}
for(const options of [{status:403},{status:500},{urlChange:u=>u+'&wrong=1'},{urlChange:()=> 'https://example.test/'},{contentType:'text/html'},{body:'[]'},{body:'{}'},{body:'<html>challenge</html>'},{body:'x'.repeat(8_000_001)},{offline:true}])await assert.rejects(()=>collectPublicPerformance(apiPage(options),source,binding))
const wti=sources.find(s=>s.wisdomTicker==='CRUD'),wtiBinding={...binding,isin:wti.isin,currency:wti.navCurrency,sourceUrl:wti.factsheetUrl}
const redirected=await collectPublicPerformance(apiPage({urlChange:u=>u.replace('/historical_performance?','/historical_performance/?')}),wti,wtiBinding)
assert(redirected.results.every(r=>r.actualUrl===r.url.replace('/historical_performance?','/historical_performance/?')))
console.log('PDF-bound ordinary public API navigation: exact scope, fresh identity, canonical redirect, empty/partial/invalid/oversize/network failures; no cached or demo identity admitted.')
