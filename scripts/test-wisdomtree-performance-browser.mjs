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
