import assert from 'node:assert/strict'
import {connectConsumerFields} from './lib/consumer-field-evidence.mjs'
import {groupReviewIssues,closureRequirement,historicalResolutionProof} from '../src/pages/data-review/review-causes.js'
import {usageIssueKind} from '../src/pages/data-review/review-inbox.js'
const id='IE000TEST0001',url='https://issuer.example/exact-share',checkedAt='2026-10-21',asOf='2026-09-30'
const observation={family:'etf',entity:id,field:'aum',value:123,sourceUrl:url,checkedAt,period:asOf,unit:'EUR',scope:`${id} · share-class · EUR`}
const field={key:'aum',state:'scheduled-evidence',sourceIdentity:id,members:['aum'],checkedAt,sourceUrls:[url],consumerCode:'scripts/update-editorial-radar.mjs#collectObservationsSync'}
const asset={id:`radar:etf:${id}:aum`,fields:[field]}
const row={id,field:'aum',present:true,actionState:'current',requiresAction:false,automationConfigured:true,sourceUrl:url,checkedAt,asOf}
const config={observations:[observation],connections:[row],etfs:{[id]:{aum:{amount:123,currency:'EUR',scope:'share-class'}}}}
const result=(o={},c=config,a=asset)=>connectConsumerFields([a],{...c,observations:[{...observation,...o}]})[0].fields[0]
const unlinked=connectConsumerFields([{id:'radar:scpi:test:price',fields:[{...field,label:'Prix de souscription',key:'price'}]}],config)[0].fields[0]
assert.equal(unlinked.state,'scheduled-evidence');assert.match(unlinked.reason,/certificat source ciblé/);assert.equal(unlinked.checkedAt,checkedAt)
const good=result();assert.equal(good.state,'connected');assert.equal(good.checkedAt,checkedAt);assert.equal(good.qualificationEvidence.checkedAt,checkedAt)
for(const changed of [{value:124},{entity:'OTHER'},{sourceUrl:url+'?other'},{checkedAt:'2026-10-22'},{period:'2026-08-31'},{unit:'USD'},{scope:`${id} · fund · EUR`}])assert.notEqual(result(changed).state,'connected',JSON.stringify(changed))
for(const changed of [{actionState:'collection-error',requiresAction:true},{present:false},{automationConfigured:false},{actionState:'source-conflict'}])assert.notEqual(result({}, {...config,connections:[{...row,...changed}]}).state,'connected')
assert.notEqual(result({},config,{...asset,fields:[{...field,members:['aum','aum:missing']}]}).state,'connected')
assert.notEqual(result({},config,{...asset,fields:[{...field,state:'blocked'}]}).state,'connected')
const pea={...observation,field:'pea',value:false,unit:null,scope:`Part ${id}`};const peaResult=connectConsumerFields([{id:`radar:etf:${id}:pea`,fields:[{...field,key:'pea',members:['pea']}]}],{observations:[pea],connections:[{...row,field:'pea',asOf:null}],etfs:config.etfs,metadata:{[id]:{pea:{value:false}}}})[0].fields[0]
assert.equal(peaResult.state,'connected','Explicit false remains a valid documented value')
assert.equal(connectConsumerFields([{id:`radar:etf:${id}:pea`,fields:[{...field,key:'pea',members:['pea']}]}],{observations:[pea],connections:[{...row,field:'pea',asOf:null}],etfs:config.etfs,metadata:{[id]:{pea:{value:null}}}})[0].fields[0].state,'scheduled-evidence','Unknown PEA is never converted to false')
const country={...observation,field:'countries:France',value:7.25,unit:'%',completeComposition:false,scope:`${id} · fund · observed`}
const countryAsset={id:`radar:etf:${id}:countries`,fields:[{...field,key:'countries',members:['countries:France']}]}
const countryConfig={observations:[country],connections:[{...row,field:'countries'}],etfs:{[id]:{countries:{basis:'fund',method:'observed',complete:false,rows:[{name:'France',weightPct:7.25}]}}}}
assert.equal(connectConsumerFields([countryAsset],countryConfig)[0].fields[0].state,'connected','A compatible observed country weight does not require or fabricate full holdings')
assert.equal(countryConfig.etfs[id].countries.rows[0].weightPct,7.25,'Partial portfolio weights remain unchanged')
assert.notEqual(connectConsumerFields([countryAsset],{...countryConfig,observations:[{...country,value:100}]} )[0].fields[0].state,'connected','No renormalization of a partial observation')
assert.notEqual(connectConsumerFields([countryAsset],{...countryConfig,observations:[{...country,scope:`${id} · substitute-basket · observed`}]} )[0].fields[0].state,'connected')
assert.notEqual(connectConsumerFields([countryAsset],{...countryConfig,observations:[{...country,compositionEvidence:{status:'pending',reason:'Périmètre non corroboré'}}]})[0].fields[0].state,'connected','The shared Radar qualification introduced by concurrent work cannot be bypassed')
assert.equal(usageIssueKind({present:true},'blocked'),'qualification');assert.equal(usageIssueKind({present:false},'blocked'),'connection');assert.equal(usageIssueKind({present:true,actionState:'collection-error'},'blocked'),'failure');assert.equal(usageIssueKind({},'blocked'),'qualification','Unknown presence is not a proven missing value')
const incident={id:'one',kind:'failure',asset:id,stage:'Collecte',cause:'HTTP 403 on 2026-10-21',sourceUrls:[url]}
assert.equal(groupReviewIssues([incident,{...incident,id:'two',asset:'OTHER'}]).size,2,'Same host/message does not establish a common cause')
assert.equal(groupReviewIssues([incident,{...incident,id:'two',cause:'HTTP 403 on 2026-10-22'}]).size,2,'Different periods remain distinct')
const failed={...incident,workflow:'collect.yml',runId:123,attempt:1,failedSteps:[{job:'collect',step:'Read exact report'}]}
assert.equal(groupReviewIssues([failed,{...failed,id:'two',asset:'OTHER'}]).size,1,'Same producer attempt and failed step establish one intervention')
assert.equal(groupReviewIssues([failed,{...failed,id:'two',attempt:2}]).size,2)
assert.equal(groupReviewIssues([{...failed,runId:null},{...failed,id:'two',runId:null}]).size,2,'A matching step name without an execution identity is not proof of a common cause')
assert.equal(groupReviewIssues([{...failed,failedSteps:[null]},{...failed,id:'two',failedSteps:{length:1}}]).size,2,'Malformed proof rows cannot stop the other diagnostics')
assert.match(closureRequirement({kind:'connection'}),/publiée/)
console.log('Exact consumer field evidence, dates, scope, currency, partials, failures, false/unknown values and proven cause grouping passed.')

const bindingProof={kind:'verified-existing-field-binding',subject:'gap:usage:fund:monthly',checkedAt,sourceUrl:url,publishedFilesVerified:true,sourceFiles:{'source.json':'a'.repeat(40)},seriesFingerprint:'b'.repeat(64)}
const closed={id:'field:gap:usage:fund:monthly',resolvedAt:'2026-10-23',resolutionEvidence:bindingProof}
assert(historicalResolutionProof(closed,Date.parse('2026-10-24')))
assert(!historicalResolutionProof({...closed,resolutionEvidence:{...bindingProof,publishedFilesVerified:false}},Date.parse('2026-10-24')))
assert(!historicalResolutionProof({...closed,id:'field:other'},Date.parse('2026-10-24')))
