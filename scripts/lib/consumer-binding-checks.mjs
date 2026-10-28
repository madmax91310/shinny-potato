import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
// Qualification of an existing binding is not a new collection. Publication is
// verified separately by the monitor against the actual public manifest.
export function consumerBindingChecks(inventory,coverage,read=path=>readFileSync(path)){
 const rows=new Map(coverage.rows.map(r=>[r.id+':'+r.field,r])),hashes=new Map(),checks={}
 const hash=path=>{if(!hashes.has(path)){const bytes=read(path);hashes.set(path,createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'))}return hashes.get(path)}
 for(const asset of inventory.assets)for(const field of asset.fields){
  const ref=field.coverageReference,row=ref&&rows.get(ref.id+':'+ref.field)
  if(field.state!=='connected'||!row?.seriesFingerprint||!row.sourceRegistry||!row.sourceUrl||!row.checkedAt)continue
  const subject=`gap:usage:${asset.id}:${field.key}`
  checks[subject]={kind:'verified-existing-field-binding',subject,checkedAt:row.checkedAt,asOf:row.asOf,
   sourceUrl:row.sourceUrl,sourceIdentity:ref.id,field:ref.field,currency:row.currency,method:row.method,
   seriesFingerprint:row.seriesFingerprint,sourceFiles:{[row.sourceRegistry]:hash(row.sourceRegistry),'src/data/market-history.js':hash('src/data/market-history.js')}}
 }
 return checks
}
