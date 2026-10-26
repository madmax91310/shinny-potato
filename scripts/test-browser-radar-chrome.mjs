import assert from 'node:assert/strict'
import {isRadarChromeRequest,mockRadarChrome} from './lib/browser-radar-chrome.mjs'
const url='https://raw.githubusercontent.com/madmax91310/shinny-potato/radar-data/summary.json'
const request=(type='fetch',method='GET',href=url)=>({url:()=>href,method:()=>method,resourceType:()=>type})
assert.ok(isRadarChromeRequest(request()))
for(const type of ['image','font','script','stylesheet','document'])assert.equal(isRadarChromeRequest(request(type)),false,'Export resources remain subject to origin checks')
assert.equal(isRadarChromeRequest(request('fetch','POST')),false)
assert.equal(isRadarChromeRequest(request('fetch','GET',url+'?other=1')),false)
assert.equal(isRadarChromeRequest(request('fetch','GET','https://example.org/logo.svg')),false)
let handler,fulfilled
await mockRadarChrome({route:async(pattern,callback)=>{assert.equal(pattern,url);handler=callback}})
await handler({request:()=>request(),fulfill:async value=>fulfilled=value})
assert.deepEqual(JSON.parse(fulfilled.body).selection,[])
assert.throws(()=>handler({request:()=>request('image')}),/export resources/)
console.log('Navigation-only API fixture: exact GET/fetch, no real news; images, fonts, scripts and every other URL remain checked as export resources.')
