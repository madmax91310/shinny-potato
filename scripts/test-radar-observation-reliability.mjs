import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {advanceRadar,observationKey} from './lib/editorial-radar.mjs'
import {compositionEvidence,compositionEventKey} from './lib/radar-composition-evidence.mjs'
import {comparisonIssue} from '../src/lib/radar-composition.js'
import {publicationSelection,editorialAssessment,groupSignals} from '../src/lib/radar-editorial.js'
import {planNotifications} from './lib/radar-notifications.mjs'
import {makeRadarOverview,validateRadarOverview} from '../src/lib/radar-overview.js'
const now=new Date('2026-10-28T12:00:00Z'),url='https://www.ishares.com/official',isin='IE00B1TXHL60'
function rows(weights,date='2026-10-26',extra={}) {
 const block={asOf:date,rows:Object.entries(weights).map(([name,weightPct])=>({name,weightPct})),sourceComponent:'exposureBreakdowns.sector',...extra}
 const evidence=compositionEvidence(block,{isin,basis:'fund',sourceUrl:url,checkedAt:'2026-10-28',dimension:'sectors'})
 return block.rows.map(r=>({family:'etf',entity:isin,label:'iShares Listed Private Equity',field:'sectors:'+r.name,fieldLabel:'Poids du secteur '+r.name,value:r.weightPct,scope:isin+' · fund · sectors',period:date,checkedAt:'2026-10-28',unit:'%',sourceUrl:url,threshold:2,compositionEvidence:evidence,compositionEventKey:date+evidence.sourceHash}))
}
const advance=(state,obs)=>advanceRadar(state,obs,{now})
const baseline=rows({Financials:99.1,Other:.38,'Cash and/or Derivatives':.52},'2026-10-23')
const first=advance(null,baseline),partial=rows({'Cash and/or Derivatives':100})
const mixed=[...baseline.slice(0,2),partial[0]]
assert.equal(advance(first.state,mixed).newEvents.length,0,'Mixed snapshot dates cannot form a portfolio')
const pending=advance(first.state,partial)
assert.equal(pending.newEvents.length,0)
assert.deepEqual(pending.state.current,first.state.current,'Partial response cannot overwrite any valid row or refresh its dates')
assert.equal(Object.keys(pending.state.compositionReviews).length,1)
assert.equal(advance(pending.state,partial).state.compositionReviews[Object.keys(pending.state.compositionReviews)[0]].firstSeenAt,pending.state.compositionReviews[Object.keys(pending.state.compositionReviews)[0]].firstSeenAt)
const fresh=rows({Financials:99,Other:.4,'Cash and/or Derivatives':.6},'2026-10-27')
const resumed=advance(pending.state,fresh)
assert.equal(resumed.newEvents.length,0);assert(Object.values(resumed.state.compositionReviews)[0].resolvedAt)
assert.equal(resumed.state.current[observationKey(fresh[2])].value,.6)
const unrelated={...baseline[0],entity:'other',field:'ter',threshold:.00001,value:.2,compositionEvidence:undefined}
const separate=advance(advance(first.state,[unrelated]).state,[...partial,{...unrelated,value:.1}])
assert.equal(separate.newEvents.length,1,'A pending source must not block a real fee change elsewhere')
for(const key of ['currency','unit','basis','method','shareClass','entity','scope'])assert.match(comparisonIssue({...baseline[0],[key]:'old'},{...baseline[0],[key]:'new'}),/Conventions/,key)
const changedMethod=rows({Financials:90,Other:9.5,'Cash and/or Derivatives':.5},'2026-10-27',{method:'New sector classification'})
assert.equal(advance(first.state,changedMethod).newEvents.length,0,'A method change starts a silent comparable reference')
const extreme=rows({Financials:1,Other:0,'Cash and/or Derivatives':99})
assert.equal(advance(first.state,extreme).newEvents.length,0)
const confirmed=rows({Financials:105,Other:0,'Cash and/or Derivatives':-5},'2026-10-27',{method:'Net NAV, signed derivatives, no scaling'})
assert.equal(advance(first.state,confirmed).state.current[observationKey(confirmed[0])].value,105,'Signed exposure may exceed 100, never clipped')
const legitimate=rows({Financials:0,Other:0,'Cash and/or Derivatives':100})
const e=legitimate[0].compositionEvidence
e.confirmation={kind:'issuer-explanation',asOf:e.asOf,identity:e.identity,basis:e.basis,unit:e.unit,sourceHash:'a'.repeat(64),sourceUrl:url,method:'Issuer documents portfolio liquidation and exact NAV perimeter',coverage:'complete'}
const accepted=advance(first.state,legitimate)
assert.equal(accepted.newEvents.length,2,'Qualified extreme change remains a real possible event')
assert.equal(groupSignals(accepted.newEvents,+now).length,1,'One allocation snapshot, multiple preserved facts')
assert.equal(advance(accepted.state,legitimate).newEvents.length,0,'Recollection never becomes a new announcement')
const legacy={...accepted.newEvents.find(e=>/Cash/.test(e.field)),compositionEvidence:undefined,compositionEventKey:undefined,financialChangeEvidence:{...accepted.newEvents.find(e=>/Cash/.test(e.field)).financialChangeEvidence,beforeCheckedAt:'2026-10-25'}}
const ledger={schemaVersion:1,editorialVersion:3,acknowledged:[legacy.id]}
const migrated=advance({...first.state,current:{...first.state.current,[observationKey(partial[0])]:partial[0]},anchors:first.state.anchors,events:[legacy]},partial)
assert.equal(migrated.state.events[0].id,legacy.id);assert.equal(migrated.state.events[0].detectedAt,legacy.detectedAt)
assert.equal(migrated.state.events[0].observationStatus,'pending')
assert.equal(migrated.state.current[observationKey(partial[0])].value,.52)
assert.equal(migrated.state.current[observationKey(partial[0])].checkedAt,'2026-10-25')
assert.equal(publicationSelection(migrated.feed.events,{now:+now}).ready.length,0)
assert.equal(planNotifications(migrated.feed.events,ledger,now,'major').events.length,0)
assert.equal(makeRadarOverview(migrated.feed,publicationSelection(migrated.feed.events,{now:+now})).selection.length,0)
const corrected=advance(migrated.state,rows({Financials:99,Other:.4,'Cash and/or Derivatives':.6},'2026-10-26'))
assert.equal(corrected.newEvents.length,0,'A corrected observation never re-alerts the contaminated move')
assert.equal(corrected.state.events[0].id,legacy.id)
assert.throws(()=>validateRadarOverview({schemaVersion:1,policyVersion:3,checkedAt:now.toISOString(),groups:[],selection:[]}),/non reconnu/,'Old summary cannot advertise unqualified events on home')
const real=JSON.parse(readFileSync('scripts/fixtures/radar-publication/cases.json')).events
for(const title of ['La Bourse de Paris attendue en baisse à l’ouverture : les enjeux du mardi 27 octobre','Point de marché : la bourse termine la séance en hausse de 2 %','Résultats trimestriels : une banque présente 2 milliards d’euros']){
 const event={...real.find(e=>e.factType==='consumer-announcement'),label:title,publishedAt:'2026-10-28',originalPublishedAt:null,summary:'La banque publie 2 milliards d’euros.',evidence:{excerpt:'La banque publie 2 milliards d’euros.',sourceHash:'a'.repeat(64)}}
 assert.equal(editorialAssessment(event,+now).priority,false)
 assert.equal(editorialAssessment(event,+now).major,false)
}
console.log('Observation reliability: partial allocation, signed and qualified extreme moves, method change, source isolation, dossier grouping, repeated collection, correction, preserved dates/IDs and quiet migration passed. No notification sent.')

const common={asOf:'2026-10-26',sharedFundId:'official-fund-id',sharedFundEvidence:{fundId:'official-fund-id',kind:'same-fund-allocation',shareClassIndependent:true,method:'Same fund NAV allocation, unhedged classes explicitly documented',sourceUrl:url,sourceHash:'c'.repeat(64)}}
const snap=legitimate[0].compositionEvidence
assert.equal(compositionEventKey(common,snap,'sectors','PART-A','fund'),compositionEventKey(common,snap,'sectors','PART-B','fund'))
assert.notEqual(compositionEventKey({...common,sharedFundEvidence:null},snap,'sectors','PART-A','fund'),compositionEventKey(common,snap,'sectors','PART-B','fund'),'A matching name/index without fund proof never merges shares')
