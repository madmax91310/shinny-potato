// Supplemental qualification proof. Does not alter either exhaustive verifier
// or its receipts, and is not a replacement for the normal GitHub gate.
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {execFileSync} from 'node:child_process'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const scratch=mkdtempSync(join(tmpdir(),'qualified-pool-'))
const root=process.cwd(),id='etfLU1829219390',before=process.argv[2],after=process.argv[3],output=process.argv[4]??'test-artifacts/final-scope-subset.json'
assert(before&&after,'Supply both frozen verifier files and optional output path')
process.argv.push('--qualification-scope-audit')
async function expose(file,name){
 const source=readFileSync(file,'utf8'),needle='if (process.argv.includes("--scope-manifest")) {'
 assert.equal(source.split(needle).length,2)
 const exposed=source.replace(needle,'if(process.argv.includes("--qualification-scope-audit")){globalThis.__qualificationScope={items:ALL_ITEMS,render:buildTweetText4,extras:TEST_EXTRA};return;}\n'+needle)
 const target=join(scratch,name+'-qualification-export.mjs');writeFileSync(target,exposed);await import(pathToFileURL(target));return globalThis.__qualificationScope
}
const old=await expose(before,'before'),next=await expose(after,'after')
const previous=new Map(),oldOther=createHash('sha256'),newOther=createHash('sha256');let oldCount=0,newCount=0,compared=0
for(const item of old.items){const key=JSON.stringify(item);if(key.includes(id))previous.set(key,item);else{oldOther.update(key+'\n');oldCount++}}
const kept=new Set(),renderHash=createHash('sha256')
for(const item of next.items){const key=JSON.stringify(item);if(!key.includes(id)){newOther.update(key+'\n');newCount++;continue}
 assert(previous.has(key),'Unexpected new bank input: '+key);assert(!kept.has(key),'Duplicated input');kept.add(key)
 const actual=next.render(item,next.extras),expected=old.render(previous.get(key),old.extras)
 assert.equal(actual,expected,'Remaining bank output changed: '+key);renderHash.update(key+'\n'+actual+'\n');compared++
}
const oldDigest=oldOther.digest('hex'),newDigest=newOther.digest('hex');assert.equal(oldCount,newCount);assert.equal(oldDigest,newDigest)
const removed=[...previous.keys()].filter(key=>!kept.has(key)).map(JSON.parse)
assert.equal(old.items.length-next.items.length,removed.length)
for(const file of ['automated-monthly.json','automated-etf-monthly.json','non-bond-monthly-records.json']){
 const a=JSON.parse(execFileSync('git',['show','a3296c3:src/data/'+file],{cwd:root,maxBuffer:64*1024*1024})),b=JSON.parse(execFileSync('git',['show','3bec3e1:src/data/'+file],{cwd:root,maxBuffer:64*1024*1024}))
 for(const key of Object.keys(a))for(const field of ['points','anniversaryPoints'])assert.deepEqual(a[key][field],b[key][field],key+'/'+field)
}
const frontEndDiff=execFileSync('git',['diff','a3296c3','3bec3e1','--','src/**/*.js','src/**/*.jsx'],{cwd:root,encoding:'utf8'});assert.equal(frontEndDiff,'')
const result={checkedAt:new Date().toISOString(),scope:'Supplemental final-scope proof after BNKE identity restriction; normal exhaustive GitHub checks remain required',oldBundleSha256:createHash('sha256').update(readFileSync(before)).digest('hex'),newBundleSha256:createHash('sha256').update(readFileSync(after)).digest('hex'),oldPoolSize:old.items.length,newPoolSize:next.items.length,unaffectedInputs:oldCount,unaffectedInputSha256:oldDigest,remainingBankOutputsCompared:compared,remainingBankOutputsSha256:renderHash.digest('hex'),removedInputs:removed,numericObservationsUnchanged:true,frontEndLogicUnchanged:true,succeeded:true}
writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,removedInputs:removed.length}))
