import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
import {runBounded} from './lib/bounded-command.mjs'
const base=process.env.AUDIT_BASE??'http://127.0.0.1:4418/shinny-potato'
const server=process.env.AUDIT_BASE?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4418','--strictPort'],{stdio:'ignore'})
const out=process.env.AUDIT_OUT??'test-artifacts/investment-validation';mkdirSync(out,{recursive:true});const results=[]
try{
 let ready=false
 for(let i=0;i<100;i++){try{if((await fetch(base.replace(/\/$/,'')+'/')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,200))}
 assert(ready,'Built investment validation server unavailable')
 for(const name of ['anomalies','unit-consumers','identity','protections']){
  const started=Date.now(),command=`node scripts/playwright-investment-${name}.mjs`
  const result=await runBounded(command,{timeoutMs:600000,env:{...process.env,AUDIT_BASE:base,AUDIT_OUT:`${out}/${name}`}})
  process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'')
  results.push({command,base,status:result.status,seconds:(Date.now()-started)/1000,error:result.error})
  writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2)+'\n')
  assert.equal(result.status,0,`${command}: ${result.error??'failed'}`)
 }
}finally{server?.kill('SIGTERM')}
console.log('Investment final built validation: lump/DCA, copied text, preview/download PNG, six videos, shared consumers, persisted settings and bounded refusals passed.')
