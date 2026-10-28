import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {verifyBlackRockAllocation,qualifyCompositionCandidates} from './lib/radar-composition-verification.mjs'
const real=JSON.parse(readFileSync('scripts/fixtures/radar-composition-2026-10-28.json')),template={...real.events[0],value:100}
const result=verifyBlackRockAllocation(real.qualificationInput,template,real.sourceHash,'2026-10-28T15:00:00Z')
assert.equal(result.status,'pending');assert.match(result.reason,/Dates incompatibles/)
assert.equal(result.evidence.allocationDate,'2026-10-26');assert.equal(result.evidence.positionsDate,'2026-10-27')
const body=structuredClone(real.qualificationInput),c=body.componentsByNameMap,p=c.exposureBreakdowns.containersByNameMap.sector.dataPointsByNameMap,h=c.holdings.containersByNameMap.all.dataPointsByNameMap,m=c.fundamentalsAndRisk.containersByNameMap.default.dataPointsByNameMap
p.type.value=['Financials','Cash and/or Derivatives'];p.fund.value=[110,-10]
h.asOfDate.value=20261026
for(const [key,value]of Object.entries({holdingPercent:[55,55,-10],sectorName:['Financials','Financials','Cash and/or Derivatives'],assetClass:['Equity','Equity','Cash'],isin:['US0000000001','US0000000002','-'],ticker:['ONE','TWO','CASH'],exchange:['X','X','-'],marketCurrencyCode:['USD','USD','USD']}))h[key].value=value
m.numHoldings={value:2,active:true,asOfDate:20261026}
const confirmed=verifyBlackRockAllocation(body,template,'a'.repeat(64),'2026-10-28T15:00:00Z')
assert.equal(confirmed.status,'confirmed');assert.equal(confirmed.rows[0].value,110);assert.equal(confirmed.rows[1].value,-10)
const cash=structuredClone(body),cashPoints=cash.componentsByNameMap.holdings.containersByNameMap.all.dataPointsByNameMap,cashSectors=cash.componentsByNameMap.exposureBreakdowns.containersByNameMap.sector.dataPointsByNameMap
cashSectors.type.value=['Cash and/or Derivatives'];cashSectors.fund.value=[100]
for(const key of ['holdingPercent','sectorName','assetClass','isin','ticker','exchange','marketCurrencyCode'])cashPoints[key].value=[cashPoints[key].value[2]]
cashPoints.holdingPercent.value=[100];cash.componentsByNameMap.fundamentalsAndRisk.containersByNameMap.default.dataPointsByNameMap.numHoldings.value=0
assert.equal(verifyBlackRockAllocation(cash,template,'b'.repeat(64),'2026-10-28').status,'confirmed','A real fully corroborated all-cash allocation remains possible')
h.holdingPercent.value=[55,-10];assert.notEqual(verifyBlackRockAllocation(body,template,'a'.repeat(64),'2026-10-28').status,'confirmed','Truncated columns cannot qualify')
let calls=0;const fetchImpl=async()=>{calls++;return new Response(JSON.stringify(real.qualificationInput),{status:200,headers:{'Content-Type':'application/json',etag:'known'}})}
const now=new Date('2026-10-28T15:00:00Z'),observations=[template],first=await qualifyCompositionCandidates(observations,null,{now,fetchImpl})
assert.equal(calls,1);assert.equal(first.errors.length,1);assert.equal(first.entries[Object.keys(first.entries)[0]].status,'pending')
await qualifyCompositionCandidates(observations,{compositionVerification:first},{now,fetchImpl});assert.equal(calls,1,'One-hour cache for unchanged candidate')
const resumed=await qualifyCompositionCandidates(observations,{compositionVerification:first},{now:new Date(+now+3600000),fetchImpl:async(url,args)=>{assert.equal(args.headers['If-None-Match'],'known');return new Response(null,{status:304})}})
assert.equal(resumed.metrics.requests,1)
const failed=await qualifyCompositionCandidates(observations,null,{now,fetchImpl:async()=>{throw Error('outage')}})
assert.equal(failed.errors.length,1);assert.equal(observations[0].value,100,'Failure never mutates source or accepted baseline')
const recovery=await qualifyCompositionCandidates(observations,{compositionVerification:failed},{now:new Date(+now+3600000),fetchImpl})
assert.equal(recovery.errors[0].entity,template.entity);assert.match(recovery.errors[0].reason,/Dates incompatibles/)
const forbidden=await qualifyCompositionCandidates([{...template,sourceUrl:'https://example.com/private'}],null,{now,fetchImpl})
assert.equal(forbidden.metrics.requests,0)
console.log('Complementary composition verification: recorded iShares date mismatch, complete same-date signed portfolio, truncated response, cache/conditional request, bounded retry and allowed official source passed. No financial registry changed.')

const crowded=[template,{...template,entity:'OTHER1'},{...template,entity:'OTHER2'}]
const bounded=await qualifyCompositionCandidates(crowded,null,{now,fetchImpl})
assert.equal(bounded.metrics.requests,2);assert.equal(bounded.metrics.deferred,1)
const following=await qualifyCompositionCandidates(crowded,{compositionVerification:bounded},{now,fetchImpl})
assert.equal(following.metrics.requests,1,'Oldest never-attempted candidate progresses before cached retries')

const validRows=[{...template}],validFetch=async()=>new Response(JSON.stringify(cash),{status:200,headers:{etag:'confirmed'}})
const good=await qualifyCompositionCandidates(validRows,null,{now,fetchImpl:validFetch})
assert.equal(Object.values(good.entries)[0].status,'confirmed')
const confirmedAt=validRows[0].checkedAt,again=[{...template}]
await qualifyCompositionCandidates(again,{compositionVerification:good},{now:new Date(+now+3600000),fetchImpl:async()=>new Response(null,{status:304})})
assert(again[0].compositionEvidence.confirmation);assert.equal(again[0].checkedAt,confirmedAt,'304 reuses exact qualified evidence without rejuvenating its date')
