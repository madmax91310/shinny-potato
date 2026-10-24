import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {pathToFileURL} from 'node:url'
const pick=(row,keys)=>Object.fromEntries(keys.filter(k=>row[k]!==undefined).map(k=>[k,row[k]]))
export function reviewInboxProjection(report){
 const fieldConsumers={},needed=new Set()
 const tools=report.consumerUsage.tools.map(t=>{
  for(const r of t.rows)if(r.required){const key=r.id+':'+r.key;fieldConsumers[key]=[...new Set([...(fieldConsumers[key]??[]),t.name??t.path])]}
  const rows=t.rows.filter(r=>r.required&&!['connected','not-required'].includes(r.state)).map(r=>{needed.add(r.id+':'+r.key);return pick(r,['id','key','required','state'])})
  return pick({...t,rows},['name','path','rows'])
 })
 return {schemaVersion:1,contract:'data-review-inbox-v1',generatedAt:report.generatedAt,
  summary:report.summary,fieldConsumers,consumerUsage:{summary:report.consumerUsage.summary??report.summary.consumerUsage,tools},
  backlog:report.backlog.map(r=>pick(r,['type','id','name','field','label','actionState','reason','nextAction','asOf','checkedAt','lastAttemptAt','lastSuccessAt','tools','sourceUrl','configuredSourceUrls','scope','currency','method'])),
  assets:report.assets.map(a=>({id:a.id,name:a.name,fields:(a.fields??[]).filter(f=>needed.has(a.id+':'+f.key)).map(f=>pick(f,['key','label','reason','action','nextAction','asOf','checkedAt','sourceUrls','scope','currency']))})).filter(a=>a.fields.length)}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const bytes=fs.readFileSync('public/data/data-automation-inventory.json'),report=reviewInboxProjection(JSON.parse(bytes))
 report.inventorySha256=createHash('sha256').update(bytes).digest('hex')
 report.inventoryBlobSha=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
 const output=JSON.stringify(report)+'\n';fs.writeFileSync('public/data/data-review-inbox.json',output)
 console.log(`Review inbox: ${report.backlog.length} backlog rows, ${Buffer.byteLength(output)} bytes, full inventory ${bytes.length} bytes.`)
}
