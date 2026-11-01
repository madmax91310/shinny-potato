import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRecordLoader } from '../src/lib/record-loader.js'
const content=JSON.stringify({id:'example',points:[{date:'2025-12',price:100},{date:'2026-01',price:110}]})
const file='data/history/'+createHash('sha256').update(content).digest('hex').slice(0,20)+'.json'
const previous=globalThis.fetch
try {
 let calls=0,mode='ok'
 globalThis.fetch=async (url,options)=>{
  calls++;assert.equal(url,'/app/'+file);assert(options.signal instanceof AbortSignal)
  if(mode==='offline')throw new TypeError('Network unavailable')
  if(mode==='stall')return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true}))
  if(typeof mode==='number')return new Response('',{status:mode})
  if(mode==='empty')return new Response('')
  if(mode==='malformed')return new Response('{')
  if(mode==='wrong-schema')return Response.json({unrelated:true})
  if(mode==='older')return Response.json({id:'example',points:[{date:'2025-01',price:50}]})
  return new Response(content)
 }
 for(const failure of ['offline',403,429,500,'empty','malformed','wrong-schema','older','stall']) {
  const load=createRecordLoader({example:file},'/app/',10)
  mode=failure
  // Keep the loop alive while Node's unref'ed AbortSignal deadline is pending.
  const keepAlive=setInterval(()=>{},100)
  try{await assert.rejects(load('example'),failure==='stall'?{name:'TimeoutError'}:undefined)}finally{clearInterval(keepAlive)}
  mode='ok';const before=calls
  const [a,b]=await Promise.all([load('example'),load('example')])
  assert.equal(calls,before+1,'one retry request shared by concurrent consumers');assert.strictEqual(a,b)
  assert.deepEqual(a,JSON.parse(content));assert.strictEqual(await load('example'),a);assert.equal(calls,before+1)
 }
 const load=createRecordLoader({example:file},'/app/')
 for(const id of ['missing','toString','__proto__'])await assert.rejects(load(id),/introuvables/)
 console.log('Record loader: offline/403/429/500, empty/malformed/wrong/older payloads, deadline, retry, concurrent requests and successful cache verified.')
}finally{globalThis.fetch=previous}
