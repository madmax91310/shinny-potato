import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync}from'node:child_process'
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'metadata-scope-'))
try{
 const file=path.join(dir,'report.json'),run=(args=[])=>spawnSync(process.execPath,['scripts/check-active-data-freshness.mjs',file,...args],{encoding:'utf8'})
 const baseline={successes:[{id:'FR0007054358:distribution'}],errors:[{id:'IE00B0M62S72:pea:qualification',error:'Conflit non résolu'}]}
 fs.writeFileSync(file,JSON.stringify(baseline));const targeted=run(['--only','fr0007054358,FR0007054358']);assert.equal(targeted.stderr,'');assert(JSON.parse(targeted.stdout).overdue.every(r=>r.id.startsWith('FR0007054358:')))
 const current=JSON.parse(fs.readFileSync(file));assert(current.errors.some(r=>r.id===baseline.errors[0].id),'An unrelated failure remains explicit')
 assert(current.successes.every(r=>baseline.successes.some(p=>p.id===r.id)),'No source-success is manufactured from a current cached value')
 fs.writeFileSync(file,JSON.stringify({successes:[],errors:[]}));const global=run();assert.equal(global.stderr,'');assert(Array.isArray(JSON.parse(global.stdout).overdue));assert.deepEqual(JSON.parse(fs.readFileSync(file)).successes,[],'A global cache check is not a new successful collection')
 for(const args of [['--only'],['--only','UNKNOWN'],['--only','FR0007054358,UNKNOWN']]){
  const before=fs.readFileSync(file);assert.notEqual(run(args).status,0);assert.deepEqual(fs.readFileSync(file),before,'Invalid scope fails before changing the report')
 }
 console.log('Freshness: exact scope, invalid input refused, unrelated failures retained, no cache-derived source successes.')
}finally{fs.rmSync(dir,{recursive:true,force:true})}
