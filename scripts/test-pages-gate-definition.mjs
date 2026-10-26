import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import {gateDefinition,compatibleGate,gateReceipt,verifyGateReceipt,GATE_REFERENCE} from './pages-gate-definition.mjs'
import {planSnapshot} from './resolve-pages-snapshot.mjs'
import {codeDataSnapshot} from './prepare-code-data-refresh.mjs'

const root=mkdtempSync(join(tmpdir(),'pages-definition-'))
const main='.github/workflows/deploy-pages.yml',child='.github/workflows/child.yml'
try{
 const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
 const write=(path,value)=>{mkdirSync(join(root,path,'..'),{recursive:true});writeFileSync(join(root,path),value)}
 const save=()=>{git('add','.');git('commit','-qm','Isolated gate history');return git('rev-parse','HEAD')}
 const contract=files=>JSON.stringify({schemaVersion:1,entrypoint:main,definitions:files})
 git('init','-b','master');git('config','user.name','Gate contract test');git('config','user.email','test@example.invalid')
 write(GATE_REFERENCE,contract([main]));write(main,'jobs:\n  build:\n    steps:\n      - run: node test-a.mjs\n')
 write('app.js','export const version=1\n');write('src/data/automated-scpi.json','{"value":1}\n')
 const definition=save()
 write('src/data/automated-scpi.json','{"value":2}\n');const collected=save()
 write('.github/workflows/unrelated.yml','name: independent check\n');write('app.js','export const version=2\n');const current=save()
 const ancestor=(a,b)=>{try{git('merge-base','--is-ancestor',a,b);return true}catch{return false}}
 const changed=(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean)
 const options={requested:collected,master:current,ancestor,changed,allowed:['src/data/automated-scpi.json'],fullGate:true,compatibleGate:ref=>compatibleGate(definition,ref,git)}
 assert(compatibleGate(definition,current,git),'An unrelated workflow does not change the executing gate')
 assert.deepEqual(planSnapshot({...options,info:{sha:definition}}),{candidate:current,current:true})
 const receipt=gateReceipt(definition,current,git)
 verifyGateReceipt(receipt,current,git)

 // master moves again after validation: a data prefix is publishable, a new
 // app or gate is not. The receipt still identifies the validated code.
 write('src/data/automated-scpi.json','{"value":3}\n');const laterData=save()
 assert.equal(codeDataSnapshot({code:current,head:laterData,ancestor,changed,allowed:options.allowed}),laterData)
 write(main,readFileSync(join(root,main),'utf8')+'      - run: node required-new-check.mjs\n');const newGate=save()
 assert(!compatibleGate(definition,newGate,git))
 assert.equal(planSnapshot({...options,master:newGate,info:{sha:definition}}).candidate,collected)
 assert.throws(()=>planSnapshot({...options,requested:newGate,master:newGate,info:{sha:definition}}),/executing gate definition/,'A collector can record data on code newer than the workflow that started it')
 assert.equal(codeDataSnapshot({code:current,head:newGate,ancestor,changed,allowed:options.allowed,history:()=>[laterData,newGate]}),laterData)
 verifyGateReceipt(receipt,current,git)
 assert.throws(()=>verifyGateReceipt(receipt,newGate,git),/exact fully validated code/)
 assert.throws(()=>verifyGateReceipt({...receipt,fingerprint:'forged'},current,git),/receipt changed/)
 assert(!compatibleGate('0'.repeat(40),current,git),'Unknown Git objects fail closed')
 // A served request can still leave the queue without certifying newer code.
 assert.deepEqual(planSnapshot({...options,requested:current,master:newGate,info:{sha:current}}),{candidate:current,current:false})

 // A reusable dependency is part of the frozen definition even if the main
 // YAML is unchanged. Omitting it from the reference must fail, not guess.
 write(main,'jobs:\n  nested:\n    uses: ./.github/workflows/child.yml\n');write(child,'jobs:\n  check:\n    steps:\n      - run: first-check\n')
 const omitted=save();assert.throws(()=>gateDefinition(omitted,git),/Undeclared reusable/)
 write(GATE_REFERENCE,contract([main,child]));const nested=save()
 write(child,'jobs:\n  check:\n    steps:\n      - run: second-check\n');const changedChild=save()
 assert.notEqual(gateDefinition(nested,git).fingerprint,gateDefinition(changedChild,git).fingerprint)
 write(GATE_REFERENCE,contract([main,child,'.github/workflows/unrelated.yml']));assert.throws(()=>gateDefinition(save(),git),/Unrelated workflow/)
 write(GATE_REFERENCE,'{"schemaVersion":99}');assert.throws(()=>gateDefinition(save(),git),/Unknown Pages/)

 // Invoke the actual selection CLI in an isolated Git repository. This is a
 // runner simulation, not a claim that GitHub supplied these environment values.
 git('checkout','--detach',current)
 const out=join(root,'selection.txt'),proof=join(root,'proof.json')
 const env={...process.env,PAGES_PRODUCTION:'false',PAGES_DEFINITION_SHA:definition,PAGES_GATE_RECEIPT:proof,GITHUB_OUTPUT:out}
 execFileSync(process.execPath,[new URL('./resolve-pages-snapshot.mjs',import.meta.url).pathname],{cwd:root,env,stdio:'pipe'})
 verifyGateReceipt(JSON.parse(readFileSync(proof,'utf8')),current,git)
 assert(readFileSync(out,'utf8').includes('commit_sha='+current))
 git('checkout','--detach',newGate)
 assert.throws(()=>execFileSync(process.execPath,[new URL('./resolve-pages-snapshot.mjs',import.meta.url).pathname],{cwd:root,env,stdio:'pipe'}))
}finally{rmSync(root,{recursive:true,force:true})}

// One executable job source, including the historical recovery entry point.
const workflow=readFileSync(new URL('../.github/workflows/deploy-pages.yml',import.meta.url),'utf8')
const recovery=readFileSync(new URL('../.github/workflows/verify-etf-publication-954.yml',import.meta.url),'utf8')
assert(recovery.includes('uses: ./.github/workflows/deploy-pages.yml'))
assert(!recovery.includes('run:')&&!recovery.includes('actions/deploy-pages@'),'Recovery cannot maintain a second job/check list')
assert(recovery.includes('validation_group: etf-publication-954'))
assert(workflow.includes("inputs.validation_group == 'etf-publication-954' && 'pages-validation-etf-publication-954'"))
assert(workflow.includes('PAGES_DEFINITION_SHA: ${{ github.workflow_sha }}'))
assert(workflow.includes('name: validated-gate-definition'))
assert(workflow.includes('node scripts/pages-gate-definition.mjs "$RUNNER_TEMP/gate-definition/pages-gate-definition.json" "${{ needs.build.outputs.commit_sha }}"'))
console.log('Gate contract: real Git definition/data/code races, omitted reusable dependency, immutable publication receipt and canonical recovery consumer passed (runner context simulated).')
