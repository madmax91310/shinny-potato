// Replay the public capture with the current reader, without regenerating any
// financial input. The compact monitor fixture contains exactly the keys read
// by buildInbox; the original transport and full inventory hashes are recorded.
import fs from 'node:fs'
import {gunzipSync} from 'node:zlib'
import assert from 'node:assert/strict'
import {buildInbox,projectionHealth} from '../src/pages/data-review/review-inbox.js'
const root=process.argv[2]??'reports/data-review-situations-2026-11-02/preuves'
const read=n=>JSON.parse(gunzipSync(fs.readFileSync(`${root}/${n}.json.gz`)))
const review=read('review-reader-input')
const before=read('before-ledger'),inventory=read('data_data-review-inbox'),publication=read('data_publication-manifest')
const report=buildInbox({status:read('monitor-reader-input'),inventory,coverage:read('data_asset-field-coverage'),financial:read('data_financial-reconciliation'),review,now:Date.parse('2026-11-02T05:48:23.760Z')})
assert.equal(projectionHealth(inventory,publication),null)
const previous=new Map(before.issues.flatMap(r=>r.signals.map(id=>[id,r])))
const next=new Map(report.issues.flatMap(r=>r.signals.map(s=>[s.id,r])))
assert.equal(report.signals,before.signals+review.archiveItems.length)
assert([...previous.keys()].every(id=>next.has(id)),'Every original signal remains accessible')
const newlyVisible=[...next.keys()].filter(id=>!previous.has(id))
assert.deepEqual(newlyVisible.sort(),review.archiveItems.map(r=>r.id).sort(),'Only explicitly archived catalogue fields are added')
assert.equal(report.signals,next.size,'No signal introduced twice')
const transitions={},counts={}
for(const r of before.issues)counts[r.kind]=(counts[r.kind]??0)+1
for(const [id,row]of next){const key=(previous.get(id)?.kind??'archive du catalogue hors boîte')+' → '+row.kind;transitions[key]=(transitions[key]??0)+1}
const partitions=before.issues.filter(r=>new Set(r.signals.map(id=>next.get(id).id)).size>1)
const mergers=report.issues.filter(r=>new Set(r.signals.map(s=>previous.get(s.id)?.id??s.id)).size>1)
const financial=report.issues.filter(r=>r.id.startsWith('financial:'))
const result={capturedAt:'2026-11-02T05:48:23.760Z',before:{points:before.issues.length,categories:counts,signals:before.signals,initial:before.issues.filter(r=>!['waiting','not-applicable','editorial','history'].includes(r.kind)).length},after:{...report.summary,initial:report.issues.filter(r=>['failure','connection','monitoring'].includes(r.kind)).length},signalTransitions:transitions,
 newlyVisibleCatalogueArchives:newlyVisible.length,beforePointsSeparated:partitions.length,afterPointsMergingPreviouslySeparateSignals:mergers.length,
 financialStates:financial.reduce((o,r)=>(o[r.impactState]=(o[r.impactState]??0)+1,o),{}),
 mergers:mergers.map(r=>({id:r.id,signals:r.signals.map(s=>s.id)})),
 separated:partitions.map(r=>({before:r.id,after:[...new Set(r.signals.map(id=>next.get(id).id))]}))}
fs.writeFileSync(`${root}/before-after.json`,JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({...result,mergers:undefined,separated:undefined},null,2))
