import assert from 'node:assert/strict'
import {producerContract,sourceResults} from './producer-result-contract.mjs'
import {indexQualificationReport} from './index-qualification-report.mjs'
const contract=producerContract('radar-test','feed',[{id:'radar-source:a',instrument:'a',fields:['publication listing'],selected:true},{id:'radar-source:b',instrument:'b',fields:['publication listing'],selected:true}])
const now=new Date().toISOString(),old='2026-01-01T00:00:00Z'
let r=sourceResults(contract.plan,[{id:'a',url:'https://example.com/a',status:'ok',checkedAt:now}], [{url:'https://example.com/a',status:304}])
assert.equal(r.successes[0].status,'unchanged-verified')
let report=contract.finish({contractResults:r});assert.equal(report.resultContract.outcomes.find(r=>r.id==='radar-source:b').kind,'omission')
r=sourceResults(contract.plan,[{id:'a',status:'ok',checkedAt:old,nextCheckAt:'2099-01-01'}]);assert.equal(r.successes.length,0);assert.equal(r.skipped[0].status,'waiting')
r=sourceResults(contract.plan,[{id:'a',status:'error',attemptedAt:now,error:'403'}]);assert.equal(r.errors[0].error,'403')
r=sourceResults(contract.plan,[{id:'a',status:'ok',checkedAt:now},{id:'a',status:'ok',checkedAt:now}]);assert.match(r.errors[0].error,/dupliqué/)
const validation=indexQualificationReport({one:{available:false,reason:'Insufficient composition'}},[],now,['one','missing'])
assert(validation.errors.some(r=>r.id==='qualification:missing'&&r.error.includes('absent')))
assert.throws(()=>indexQualificationReport({outside:{}},[],now,['one']),/outside/)
assert.throws(()=>indexQualificationReport({},[],now,['one','one']),/Duplicate/)
console.log('Producer contracts: 304, unrequested cache, partial failure, duplicates, missing index field and independent input scope verified.')
