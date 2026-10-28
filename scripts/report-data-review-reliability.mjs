import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {groupReviewIssues} from '../src/pages/data-review/review-causes.js'

const [mode,...args]=process.argv.slice(2)
const option=name=>args[args.indexOf(name)+1]
const read=file=>JSON.parse(file.endsWith('.gz')?zlib.gunzipSync(fs.readFileSync(file)):fs.readFileSync(file))
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n')
const packed=(file,value)=>fs.writeFileSync(file,zlib.gzipSync(JSON.stringify(value)))
const active=r=>!['waiting','not-applicable','editorial','history'].includes(r.kind)

if(mode==='snapshot'){
 const root=path.resolve(option('--root')),captureDir=path.resolve(option('--capture')),output=path.resolve(option('--output'))
 const input=name=>{const file=path.join(captureDir,name+'.json');return read(fs.existsSync(file)?file:file+'.gz')}
 const capture=input('capture'),evaluationAt=args.includes('--at')?option('--at'):capture.capturedAt,stamp=Date.parse(evaluationAt),RealDate=Date
 if(!Number.isFinite(stamp))throw Error('Capture date invalid')
 // The replay clock never writes a source timestamp or changes a financial policy.
 globalThis.Date=class extends RealDate{constructor(...v){super(...(v.length?v:[stamp]))}static now(){return stamp}}
 const load=p=>import(pathToFileURL(path.join(root,p)))
 const {buildDataAutomationInventory}=await load('scripts/data-automation-inventory.mjs')
 const {buildAssetFieldReport}=await load('scripts/report-asset-fields.mjs')
 const {buildInbox}=await load('src/pages/data-review/review-inbox.js')
 const {buildReview}=await load('src/pages/data-review/lib.js')
 const inventory=buildDataAutomationInventory(),coverage=buildAssetFieldReport()
 const status=args.includes('--monitor')?read(option('--monitor')):input('automation-status')
 const report=buildInbox({status,inventory,coverage,financial:input('financial-reconciliation'),review:buildReview(evaluationAt.slice(0,10)),now:stamp})
 const summary={capturedAt:capture.capturedAt,evaluationAt,issues:report.issues.length,signals:report.signals,actionable:report.issues.filter(active).length,
  trackingGroups:groupReviewIssues(report.issues.filter(active)).size,provenCommonInterventions:[...groupReviewIssues(report.issues.filter(active)).values()].filter(rs=>rs.length>1).length,
  byKind:Object.fromEntries([...new Set(report.issues.map(r=>r.kind))].map(k=>[k,report.issues.filter(r=>r.kind===k).length])),
  coverageFields:coverage.rows.length,catalogFields:inventory.summary.catalogFields,usage:inventory.consumerUsage.summary,health:report.health}
 fs.mkdirSync(output,{recursive:true});write(path.join(output,'summary.json'),summary)
 packed(path.join(output,'inbox.json.gz'),report);packed(path.join(output,'inventory.json.gz'),inventory)
 console.log(JSON.stringify(summary))
}else if(mode==='reconcile'){
 const before=path.resolve(option('--before')),after=path.resolve(option('--after')),output=path.resolve(option('--output'))
 const old=read(path.join(before,'inbox.json.gz')),next=read(path.join(after,'inbox.json.gz')),inventory=read(path.join(after,'inventory.json.gz'))
 const qualified=new Map()
 const evidenceKinds=new Set(['exact-consumer-field-binding-v1','exact-consumed-series-v1'])
 const fieldEvidence=new Map([...inventory.assets,...inventory.consumerUsage.externalAssets].flatMap(a=>a.fields.filter(f=>f.state==='connected'&&evidenceKinds.has(f.qualificationEvidence?.kind)).map(f=>[a.id+':'+f.key,f.qualificationEvidence])))
 for(const tool of inventory.consumerUsage.tools)for(const r of tool.rows){const proof=fieldEvidence.get(r.id+':'+r.key);if(proof)qualified.set(`usage:${tool.path}:${r.id}:${r.key}`,proof)}
 const destinations=new Map(next.issues.flatMap(r=>r.signals.map(s=>[s.id,{signal:s.id,point:r.id,kind:r.kind,proof:s.resolutionEvidence??s.evidence?.resolutionEvidence}])))
 for(const row of next.issues)for(const signal of row.signals)if(signal.kind==='history'&&signal.resolvedAt&&signal.resolutionEvidence&&signal.id.startsWith('history:')&&signal.id.endsWith(':'+signal.resolvedAt)){
  const original=signal.id.slice(8,-signal.resolvedAt.length-1)
  if(!destinations.has(original))destinations.set(original,{signal:signal.id,point:row.id,kind:'history',proof:signal.resolutionEvidence})
 }
 const entries=[],missing=[],newSignals=new Set(next.issues.flatMap(r=>r.signals.map(s=>s.id)))
 for(const point of old.issues)for(const signal of point.signals){
  const target=destinations.get(signal.id),proof=qualified.get(signal.id)
  if(!target&&!proof)missing.push(signal.id)
  const resolved=target?.kind==='history'&&target.proof&&signal.kind!=='history'
  entries.push({signal:signal.id,pointBefore:point.id,kindBefore:signal.kind,pointAfter:target?.point??null,kindAfter:target?.kind??'qualified',status:resolved?'résolution ciblée démontrée':target?'conservé':proof?'liaison exacte démontrée':'NON RÉCONCILIÉ',proof:resolved?target.proof:target?null:proof})
  newSignals.delete(target?.signal??signal.id)
 }
 if(missing.length)throw Error('Signals without justification: '+missing.join(', '))
 fs.mkdirSync(output,{recursive:true})
 const summary={before:read(path.join(before,'summary.json')),after:read(path.join(after,'summary.json')),signalsBefore:entries.length,retained:entries.filter(e=>e.status==='conservé').length,
  justifiedBindings:entries.filter(e=>e.status==='liaison exacte démontrée').length,targetedResolutions:entries.filter(e=>e.status==='résolution ciblée démontrée').length,unaccounted:missing.length,newSignals:[...newSignals],productionChanged:false}
 write(path.join(output,'bilan.json'),summary);packed(path.join(output,'suivi-signaux.json.gz'),entries)
 const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"'
 const columns=['signal','pointBefore','kindBefore','pointAfter','kindAfter','status']
 fs.writeFileSync(path.join(output,'suivi-avant-apres.csv'),[columns.join(','),...entries.map(e=>columns.map(c=>quote(e[c])).join(','))].join('\n')+'\n')
 const openColumns=['id','kind','name','asset','field','stage','cause','qualificationBlock','impact','asOf','checkedAt','lastSuccessAt','attemptedAt','action','tools','sourceUrls','runUrl']
 const cell=v=>quote(Array.isArray(v)?v.join(' ; '):v)
 fs.writeFileSync(path.join(output,'points-ouverts.csv'),[openColumns.join(','),...next.issues.filter(active).map(r=>openColumns.map(c=>cell(r[c])).join(','))].join('\n')+'\n')
 console.log(JSON.stringify(summary))
}else throw Error('Usage: snapshot --root ROOT --capture CAPTURE --output OUTPUT | reconcile --before BEFORE --after AFTER --output OUTPUT')
