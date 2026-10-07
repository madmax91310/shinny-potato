import assert from 'node:assert/strict'
import { economicCalendar, savingsRates, householdObservation } from '../src/data/economic-data.js'
import { HOUSEHOLD_STATISTICS, buildHouseholdTweet } from '../src/data/household-statistics.js'
import { automationFailures } from '../src/pages/data-review/automation.js'
const future={benchmarks:{'scpi:2026':{year:2026,value:4.2}},savings:{next:{effectiveAt:'2027-02-01',rate:2}},households:{}}
assert.equal(economicCalendar('scpi',[1,2,3,4,5,6],future)[2026],4.2)
assert.equal(savingsRates({'2026-08':1.7},future)['2027-02'],2)
const record=HOUSEHOLD_STATISTICS.find(r=>r.id==='heating')
future.households.heating={value:12,population:'personnes',referencePeriod:'Début 2026',provisional:false,checkedAt:'2027-01-01'}
const updated=householdObservation(record,future)
assert.equal(updated.value,12);assert.equal(updated.referencePeriod,'Début 2026');assert.equal(updated.provisional,false)
const tweet=buildHouseholdTweet(updated)
assert(tweet.includes('2026'));assert(!tweet.includes('2025'));assert(tweet.includes('12'))
assert.deepEqual(automationFailures({schemaVersion:1,workflows:{ok:{status:'success',name:'OK'}}}),[])
const failure={status:'failure',name:'INSEE',completedAt:'2026-10-07T10:00:00Z',runUrl:'https://github.com/test/repo/actions/runs/1',dataFailures:{wealth:{name:'Patrimoine'}}}
assert.equal(automationFailures({schemaVersion:1,workflows:{insee:failure}})[0].name,'Patrimoine')
assert.throws(()=>automationFailures({}))
console.log('Economic consumers: future periods, annual returns, legal rates and failure-only alerts OK')
