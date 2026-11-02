import assert from 'node:assert/strict'
import {explainCalendarRounding} from './audit-financial-reserves.mjs'
// Immutable official Amundi 2024 EUR example. No live price or FX is frozen.
const isin='FR0011871128',year=2024,left=32.84506920671928,right=32.85
const history={isin,historyConvention:'fund-nav-total-return'}
const record={isin,valuationBasis:'fund-nav-total-return',navCurrency:'EUR',calendarProof:{checks:[{year,start:'2023-12-29',end:'2024-12-31',dailyDerived:left,published:right,publishedDecimalPlaces:2}]}}
const args={isin,year,history,record,left,right}
const result=explainCalendarRounding(args)
assert(result);assert(Math.abs(result.convertedRoundingInterval[0]-32.845)<1e-12);assert(Math.abs(result.convertedRoundingInterval[1]-32.855)<1e-12)
assert.equal(explainCalendarRounding({...args,history:{...history,historyConvention:'adjusted'}}),null,'A tiny quote/NAV residual does not prove rounding')
assert.equal(explainCalendarRounding({...args,record:{...record,isin:'FR0013412020'}}),null,'Exact share required')
assert.equal(explainCalendarRounding({...args,record:{...record,navCurrency:null}}),null,'Native currency required')
assert.equal(explainCalendarRounding({...args,year:2023}),null,'Exact period required')
assert.equal(explainCalendarRounding({...args,left:32.84}),null,'Unexplained amplitude is not certified')
assert.equal(explainCalendarRounding({...args,right:32.86}),null,'Calendar must match the actual consumer')
for(const change of [{publishedDecimalPlaces:null},{start:'2024-01-01'},{end:'2025-01-01'},{dailyDerived:32.83}]){
 const altered={...record,calendarProof:{checks:[{...record.calendarProof.checks[0],...change}]}}
 assert.equal(explainCalendarRounding({...args,record:altered}),null,'Insufficient source contract remains unqualified')
}
console.log('Réserves ciblées : identité, bornes, devise, précision publiée et refus des faux rapprochements validés.')
