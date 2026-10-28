import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import {spawnSync} from 'node:child_process'
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'review-reconciliation-'))
try{
 const before=path.join(temp,'before'),after=path.join(temp,'after'),output=path.join(temp,'out')
 for(const dir of [before,after])fs.mkdirSync(dir)
 const save=(dir,file,value)=>fs.writeFileSync(path.join(dir,file),file.endsWith('.gz')?zlib.gzipSync(JSON.stringify(value)):JSON.stringify(value))
 const issue=(id,kind,extra={})=>({id,kind,signals:[{id,kind,...extra}]})
 const usage='usage:/bibliotheque-donnees:A:field',resolvedAt='2026-10-28T12:00:00Z'
 save(before,'inbox.json.gz',{issues:[issue(usage,'qualification'),issue('monitor:gap','monitoring'),issue('still','failure')]})
 save(after,'inbox.json.gz',{issues:[issue('history:monitor:gap:'+resolvedAt,'history',{resolvedAt,resolutionEvidence:{kind:'fully-enumerated-skipped-interval'}}),issue('still','failure')]})
 save(after,'inventory.json.gz',{assets:[{id:'A',fields:[{key:'field',state:'connected',qualificationEvidence:{kind:'exact-consumer-field-binding-v1'}}]}],consumerUsage:{externalAssets:[],tools:[{path:'/bibliotheque-donnees',rows:[{id:'A',key:'field'}]}]}})
 for(const dir of [before,after])save(dir,'summary.json',{capturedAt:resolvedAt})
 const result=spawnSync(process.execPath,['scripts/report-data-review-reliability.mjs','reconcile','--before',before,'--after',after,'--output',output],{encoding:'utf8'})
 assert.equal(result.status,0,result.stderr)
 const report=JSON.parse(fs.readFileSync(path.join(output,'bilan.json')))
 assert.equal(report.signalsBefore,3);assert.equal(report.retained,1);assert.equal(report.justifiedBindings,1);assert.equal(report.targetedResolutions,1);assert.equal(report.unaccounted,0)
 assert.deepEqual(report.newSignals,[],'A historical alias is not a newly opened incident')
}finally{fs.rmSync(temp,{recursive:true,force:true})}
console.log('Before/after reconciliation: every signal retained or linked to exact qualification/resolution proof, without phantom incidents.')
