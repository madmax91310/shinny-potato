import assert from 'node:assert/strict'
import {requestStatus} from '../src/pages/ai-portfolios/owner.js'
const request={requestId:'status-race-test'},original=globalThis.fetch
let ready=false,scope='master',lastPage=false,receiptId=request.requestId,calls=[]
const reply=(value,headers={})=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json',...headers}})
globalThis.fetch=async url=>{
 calls.push(url)
 if(url.includes('overview.json'))return reply({version:2,book:{revision:1,audit:ready?[{requestId:request.requestId}]:[],competitions:[]}})
 if(url.includes('/search/issues'))return reply({items:[{number:123,title:'Portefeuilles IA · '+request.requestId,html_url:'https://github.com/test'}]})
 if(url.includes('page=2'))return reply([{user:{login:'github-actions[bot]'},body:'AI_PORTFOLIO_STATUS\n'+JSON.stringify({state:'failed',error:'Precise source gap'})}])
 if(url.includes('/comments'))return reply([{user:{login:'github-actions[bot]'},body:'AI_PORTFOLIO_STATUS\n'+JSON.stringify({state:'recorded',requestId:receiptId,branch:scope})}],lastPage?{Link:'<https://api.github.com/repos/madmax91310/shinny-potato/issues/123/comments?page=2>; rel="last"'}:{})
 throw Error('Unexpected request')
}
try{
 let s=await requestStatus(request);assert.equal(s.state,'recorded-awaiting-data');assert.equal(s.overview,undefined,'Never replace a usable dashboard with absent CDN data')
 scope='ai-rehearsal/20261023-test';s=await requestStatus(request);assert.equal(s.state,'isolated','Production UI cannot consume an isolated book')
 receiptId='different-request';scope='master';s=await requestStatus(request);assert.equal(s.state,'failed');assert.match(s.error,/autre identifiant/);receiptId=request.requestId;lastPage=true;s=await requestStatus(request);assert.equal(s.state,'failed');assert.equal(s.error,'Precise source gap','Latest journal page is authoritative')
 ready=true;calls=[];s=await requestStatus(request);assert.equal(s.state,'recorded');assert(s.overview);assert.equal(calls.length,1,'Published audit needs no issue API calls')
}finally{globalThis.fetch=original}
console.log('Delayed CDN receipt, preserved dashboard, isolated scope, paginated latest failure, authoritative audit: OK')
