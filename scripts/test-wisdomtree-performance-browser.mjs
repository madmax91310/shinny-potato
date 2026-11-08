import assert from 'node:assert/strict'
import {collectPublicPerformance} from './download-wisdomtree-performance.mjs'
import sources from './official-nav-remainder-sources.json' with {type:'json'}
const source=sources.find(s=>s.wisdomTicker==='COCO')
function page({status=200,landingUrl=source.sourceUrl,identity=true,rows,offline=false,widgetStatus=200,widgetUrl='https://perfchart.wisdomtree.eu/',widgetTitle='WisdomTree | PRIIPS Chart'}={}){
 const calls=[]
 return {calls,async goto(url){calls.push(['landing',url]);if(offline)throw Error('network offline');if(url==='https://perfchart.wisdomtree.eu/')return {status:()=>widgetStatus,url:()=>widgetUrl};return {status:()=>status,url:()=>landingUrl}},
 async title(){return widgetTitle},
 async waitForFunction(fn,isin){if(isin===null){calls.push(['widget-client']);return}assert.equal(isin,source.isin);calls.push(['identity',isin]);if(!identity)throw Error('Wrong product identity')},
 async evaluate(fn,argument){const url=typeof argument==='object'?argument.url:argument;calls.push(['widget',url]);return rows?.(url)??{url,status:200,body:'[]'}}}
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

// The official client is transport only; its default demo is never instrument identity.
const binding={kind:'official-exact-product-pdf-v1',isin:source.isin,currency:source.navCurrency,sourceUrl:source.factsheetUrl,sha256:'a'.repeat(64),asOf:'2026-10-31',checkedAt:new Date().toISOString()}
const alternate=page({status:403}),via=await collectPublicPerformance(alternate,source,binding)
assert.equal(via.publicProductPage.status,403);assert.equal(via.publicProductPage.isin,undefined);assert.equal(via.publicProductPage.checkedAt,undefined);assert(via.publicProductPage.attemptedAt)
assert.equal(via.publicWidgetClient.demoTickerIsIdentity,false);assert.equal(via.publicWidgetClient.status,200)
assert.deepEqual(via.qualifiedIdentity,binding);assert.equal(via.results.length,2)
assert.equal(alternate.calls.filter(c=>c[0]==='landing').length,2)
for(const mutation of [{kind:'cache'},{isin:'IE0000000000'},{currency:'EUR'},{sourceUrl:'https://example.test/identity'},{sha256:'invalid'},{checkedAt:'2020-01-01T00:00:00Z'},{checkedAt:new Date(Date.now()+600000).toISOString()},{asOf:'unknown'}]){
 const p=page({status:403});await assert.rejects(()=>collectPublicPerformance(p,source,{...binding,...mutation}));assert(!p.calls.some(c=>c[0]==='widget'))
}
for(const options of [{status:500},{status:403,widgetStatus:403},{status:403,widgetUrl:'https://example.test/'},{status:403,widgetTitle:'Challenge'},
 {status:200,identity:false},{status:403,landingUrl:'https://example.test/'},{status:403,rows:url=>({url:url+'&wrong=1',status:200,body:'[]'})}]){
 const p=page(options);await assert.rejects(()=>collectPublicPerformance(p,source,binding))
}
console.log('Official public widget alternative: fresh exact PDF binding, primary403 retained, wrong identity/currency/cache/future/source and challenge/redirect failures rejected; no demo data used.')

const wti=sources.find(s=>s.wisdomTicker==='CRUD'),wtiBinding={...binding,isin:wti.isin,currency:wti.navCurrency,sourceUrl:wti.factsheetUrl}
const redirects=page({status:403,landingUrl:wti.sourceUrl,rows:url=>({url:url.replace('/historical_performance?','/historical_performance/?'),status:200,body:'[]'})})
const redirected=await collectPublicPerformance(redirects,wti,wtiBinding)
assert(redirected.results.every(r=>r.actualUrl===r.url.replace('/historical_performance?','/historical_performance/?')))
