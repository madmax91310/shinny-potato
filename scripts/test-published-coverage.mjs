import assert from 'node:assert/strict'
import {publishedCoverageIssues} from './audit-published-coverage.mjs'
const row={type:'instrument',id:'EXACT-SHARE',field:'completeHoldings',present:true,automationConfigured:true,state:'current',checkedAt:'2026-10-21',asOf:'2026-10-15',sourceUrl:'https://issuer.example/exact-share'}
const inventory={coverage:{rows:[row]}}
assert.deepEqual(publishedCoverageIssues({rows:[row]},inventory,new Set([row.id])),[])
assert(publishedCoverageIssues({rows:[{...row,automationConfigured:false}]},inventory,new Set([row.id])).some(issue=>issue.includes('automationConfigured')),'A fresh checkout cannot publish the pre-generation configuration flag')
assert(publishedCoverageIssues({rows:[]},inventory,new Set([row.id])).some(issue=>issue.includes('missing public')),'A missing observation cannot disappear from the published report')
assert(publishedCoverageIssues({rows:[row,row]},inventory,new Set([row.id])).some(issue=>issue.includes('duplicate')))
const stale={...row,automationConfigured:false}
assert(publishedCoverageIssues({rows:[stale]},{coverage:{rows:[stale]}},new Set([row.id])).some(issue=>issue.includes('configured collector')),'Two equally stale reports cannot certify the current collector configuration')
for(const changed of [{checkedAt:'2026-10-20'},{asOf:'2026-10-14'},{sourceUrl:'https://issuer.example/other-share'},{state:'collection-error'}])assert(publishedCoverageIssues({rows:[{...row,...changed}]},inventory).length)
console.log('Published certificates: fresh-checkout ordering, independent collector configuration, dates, source identity and missing/duplicate observations passed.')
