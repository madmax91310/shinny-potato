import assert from 'node:assert/strict'
import {emptyDraft,prepareManual,manualTweet,validDraft} from '../src/pages/etf-flows/manual.js'
import {validateObservation} from '../src/lib/etf-flows.js'
const draft={...emptyDraft(),start:'2026-10-12',end:'2026-10-16',url:'https://example.com/weekly-flows',scope:'Périmètre simulé de test',rows:[{label:'Europe',amount:'+772,7',unit:'M'},{label:'Chine',amount:'−0,1649',unit:'Md'}]}
const result=prepareManual(draft,new Date('2026-11-13'))
assert.deepEqual(result.errors,[])
assert.deepEqual(result.rows.map(r=>r.amount),[772700000,-164900000])
const tweet=manualTweet(draft,result.rows)
assert(tweet.includes('Europe : +772,7 M€')&&tweet.includes('Chine : −164,9 M€'))
assert(tweet.includes('12/10/2026')&&tweet.includes(draft.url)&&tweet.includes('manuellement'))
// The manual draft never acquires the status or rights of a qualified observation.
assert(validateObservation(draft,new Date('2026-11-13')).length)
assert(!Object.hasOwn(draft,'validatedAt')&&!Object.hasOwn(draft,'status'))
for(const patch of [
 {end:'2026-11-14'}, {end:'2026-10-30'}, {start:'2026-02-30'}, {url:'javascript:alert(1)'},
 {rows:[{label:'Europe',amount:'1,234.5',unit:'M'}]},
 {rows:[...draft.rows,{...draft.rows[0],label:'europe'}]},
 {rows:[{label:'Europe',amount:'10%',unit:'M'}]},
 {rows:[{label:'Europe',amount:'999999999999999999999',unit:'Md'}]}
])assert(prepareManual({...draft,...patch},new Date('2026-11-13')).errors.length)
assert.equal(prepareManual({...draft,rows:[{label:'Europe',amount:'0',unit:'M'}]}).rows[0].amount,0)
assert.equal(validDraft({...draft,rows:[{label:null,amount:0,unit:'M'}]}),false)
console.log('Manual flows: signed units, exact dated output, source retention, ambiguous amounts and false qualification rejected.')
