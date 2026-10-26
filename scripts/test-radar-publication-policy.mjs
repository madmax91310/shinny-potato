import assert from 'node:assert/strict'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {editorialAssessment as assess,editorialState,publicationSelection,publicationKey,recentEditorial} from '../src/lib/radar-editorial.js'
import {publicationMaterial,publicationAttention} from '../src/lib/radar-material.js'
import {editorialExclusion} from '../src/lib/radar-policy.js'
import {makeRadarOverview,validateRadarOverview,overviewUnread} from '../src/lib/radar-overview.js'
import {notifyRadar,planNotifications,migrateNotificationPolicy,TRACKER_MARKER} from './lib/radar-notifications.mjs'
import {relatePublications} from './lib/radar-relationships.mjs'
import {radarToolActions} from './lib/radar-tool-actions.mjs'
import {radarSuggestion} from '../src/pages/hey-grok/radar-suggestion.js'
import {tweetStatus} from '../src/pages/hey-grok/lib.js'

const captured=JSON.parse(await readFile(new URL('./fixtures/radar-publication/cases.json',import.meta.url),'utf8'))
const cases=captured.events,now=+new Date('2026-10-26T16:00:00Z'),salary=cases.find(e=>e.entity==='salary-median')
const advice=cases.find(e=>e.label.includes('Hello bank')),proposal=cases.find(e=>e.label.includes('dépendance ?')),fuel=cases.find(e=>e.label.startsWith('Carburant'))
const bpce=cases.find(e=>e.publisher?.startsWith('BPCE')||e.sourceUrl.includes('groupebpce'))
const candidate={...salary,backfill:false,migratedEditorial:false}
const fresh=+new Date('2026-10-23T12:00:00Z'),ledger={schemaVersion:1,editorialVersion:3,acknowledged:[]}
assert.equal(assess(salary,fresh).material.status,'sufficient')
assert.equal(assess(salary,fresh).major,true,'A documented national INSEE statistical release is eligible for a rapid alert')
assert.ok(assess(salary,now).priority,'A study about the prior year remains timely by its original publication')
assert.equal(assess(salary,now).major,false,'A four-day-old study is not rejuvenated into a rapid alert')
assert.equal(assess(advice,now).material.status,'generic');assert.equal(assess(advice,now).major,false)
assert.equal(assess(proposal,now).qualification.nature,'proposal');assert.equal(editorialState(proposal,now),'watch')
assert.equal(assess(proposal,now).major,false);assert.equal(assess(proposal,now).material.confirmed,false)
assert.equal(editorialState(fuel,now),'excluded','The principal subject is an exemption ceiling, not the price of fuel')
assert.ok(assess(salary,now).score>assess(advice,now).score)
assert.ok(assess(salary,now).score>assess(proposal,now).score)
assert.equal(editorialState(bpce,now),'ready');assert.equal(assess(bpce,now).major,false)
assert.match(assess(bpce,now).qualification.label,/Sondage|Enquête/)
assert.ok(assess(bpce,now).material.facts.length)
assert.equal(editorialExclusion({label:'Comptes à terme : taux de 4 % avant impôt'}),null)
assert.equal(editorialExclusion({label:'Fiscalité des comptes à terme : nouveau barème'} )!==null,true)
const forecast={...salary,id:'f'.repeat(24),label:'Crédit immobilier : les taux pourraient remonter en décembre',factType:'consumer-announcement',summary:'Prévision de taux à 3,5 %, sans modification observée des offres.',evidenceLevel:'journalistic',populationScope:'Ménages emprunteurs'}
assert.equal(editorialState(forecast,now),'watch');assert.equal(assess(forecast,now).major,false)
assert.match(assess(forecast,now).qualification.label,/Prévision/)
assert.equal(assess({...salary,title:'INCROYABLE CHOC RECORD ! '+salary.title},now).score,assess(salary,now).score,'Sensational adjectives do not create points')
assert.equal(assess({...salary,tool:null,toolActions:[]},now).score,assess({...salary,tool:'/not-an-input',toolActions:[{}]},now).score,'An excellent fact does not need a compatible tool')
const xtb={...salary,label:'Banque XTB : frais documentés',entity:'test-bank'},other={...xtb,label:'Banque Fortuneo : frais documentés'}
assert.equal(assess({...xtb,partnership:true},now).score,assess({...other,partnership:false},now).score,'Partnerships never enter the policy')
const incompatible={...salary,beforeUnit:'USD',unit:'EUR'}
assert.equal(assess(incompatible,now).material.comparison,false)
assert.equal(publicationMaterial({...salary,comparisonCompatible:false},now).facts.some(f=>f.kind==='comparison'),false)

// A delayed press reproduction preserves the original date and publication key.
const original={...salary,evidenceLevel:'official'},media={...salary,id:'e'.repeat(24),family:'pouvoir-achat',evidenceLevel:'journalistic',sourceUrl:'https://www.moneyvox.fr/reprise',publicationId:'https://www.moneyvox.fr/reprise',publishedAt:'2026-10-24',sources:[{url:salary.sourceUrl,role:'original-link-unverified'}],evidence:{...salary.evidence,sourceHash:'b'.repeat(64)}}
const related={documents:{original:{observation:original},media:{observation:media}}}
relatePublications(related)
assert.equal(media.originalPublishedAt,salary.publishedAt);assert.equal(publicationKey(media),publicationKey(original))
assert.equal(assess(media,now).material.attention.at,salary.publishedAt)
assert.equal(recentEditorial({...media,originalPublishedAt:'2026-09-01'},now),false)
const copies=Array.from({length:10},(_,i)=>({url:`https://www.moneyvox.fr/reprise-${i}`,role:'official-original-extracted',sourceHash:String(i).repeat(64),publishedAt:'2026-10-26'}))
assert.equal(publicationAttention({...salary,sources:copies},now).independentTreatments,0)
const independent=[{url:'https://www.moneyvox.fr/analysis',role:'independent-analysis',sourceHash:'a',usefulBodyHash:'same',additionalFacts:['fact'],publishedAt:'2026-10-26',independenceKey:'reviewed-editorial-group-a',independenceEvidence:'publisher-ownership-reviewed'},
 {url:'https://www.cafedelabourse.com/analysis',role:'independent-analysis',sourceHash:'b',usefulBodyHash:'same',additionalFacts:['fact'],publishedAt:'2026-10-26',independenceKey:'reviewed-editorial-group-b',independenceEvidence:'publisher-ownership-reviewed'}]
assert.equal(publicationAttention({...salary,sources:independent},now).independentTreatments,1,'Copies of one useful body never prove independent attention')
assert.equal(publicationAttention({...salary,sources:independent.map((s,i)=>({...s,usefulBodyHash:'body-'+i}))},now).independentTreatments,2,'Declared simulation of independently qualified publisher groups; not a real trend claim')

const selected=publicationSelection(cases,{now}),overview=makeRadarOverview({checkedAt:new Date(now).toISOString(),sourceRevision:'fixture'},selected)
assert.equal(validateRadarOverview(overview),overview)
assert.ok(overview.selection.length<=5);assert.deepEqual(overview.selection.map(s=>s.id),selected.selected.map(g=>g.event.id))
assert.equal(overviewUnread(overview,overview.groups.flat()),0)
assert.equal(overviewUnread({...overview,groups:[]}),0)
assert.equal(makeRadarOverview({checkedAt:new Date(now).toISOString()},publicationSelection([advice,proposal,fuel],{now})).selection.length,0,'Three spaces are never filled with weak material')
assert.throws(()=>validateRadarOverview({...overview,checkedAt:'bad'}),/reconnu/)
const sameStudy=publicationSelection([original,media],{now});assert.equal(sameStudy.groups.length,1)
assert.deepEqual(sameStudy.groups[0].readIds,[salary.id],'A new press copy does not reopen a read original publication')

const before=[{...salary,editorial:{state:'ready',reliability:{usable:true}}},{...media,editorial:{state:'watch',reliability:{usable:true}}}]
const migrated=migrateNotificationPolicy({events:before},{...ledger,editorialVersion:2},new Date(fresh))
assert.ok(!migrated.acknowledged.includes(salary.id),'Already eligible surplus is retained')
assert.ok(migrated.acknowledged.includes(media.id),'Newly promoted historical content rolls out silently')
assert.equal(migrated.editorialVersion,3)
assert.equal(planNotifications([original,media],{...ledger,acknowledged:[original.id]},new Date(now),'digest').events.length,0,'Adding a source cannot repeat an acknowledged event')
assert.equal(planNotifications([advice,proposal,fuel],ledger,new Date(now),'major').events.length,0)
assert.equal(planNotifications([candidate],ledger,new Date(fresh),'major').events.length,1)

// Isolated, in-memory API: no credentials, publisher or notification network calls.
function server(){
  const s={issue:null,comments:[],posts:0,loseResponse:false}
  s.api=async(path,method='GET',body)=>{
    if(path.startsWith('issues?'))return s.issue?[s.issue]:[]
    if(path==='')return {has_issues:true}
    if(path.startsWith('assignees/'))return null
    if(path==='issues'&&method==='POST')return s.issue={...body,number:1,assignees:[{login:'madmax91310'}],state:'open',html_url:'https://github.com/test/issue/1',user:{login:'github-actions[bot]'}}
    if(path.startsWith('issues/1/comments')&&method==='GET')return s.comments
    if(path==='issues/1'&&method==='PATCH')return Object.assign(s.issue,body)
    if(path==='issues/1/comments'&&method==='POST'){
      s.posts++;s.comments.push({...body,user:{login:'github-actions[bot]'}})
      if(s.loseResponse){s.loseResponse=false;throw Error('Response lost after POST')}
      return s.comments.at(-1)
    }
    throw Error('Unexpected simulated API path '+path)
  }
  return s
}
const api=server(),two=[candidate,{...candidate,id:'d'.repeat(24),entity:'salary-top10',label:'Hauts salaires'}]
const sent=await notifyRadar({events:two,ledger,api:api.api,repo:'madmax91310/shinny-potato',now:new Date(fresh),mode:'major'})
assert.equal(api.posts,1);assert.equal(sent.sent,2);assert.equal((api.comments[0].body.match(/\n### /g)??[]).length,1)
assert.match(api.comments[0].body,/Pourquoi maintenant|Matière pour le tweet/);assert.match(api.comments[0].body,/radar-editorial\?subject=/)
assert.ok(api.issue.body.includes(TRACKER_MARKER))
assert.equal((await notifyRadar({events:two,ledger:sent.ledger,api:api.api,repo:'madmax91310/shinny-potato',now:new Date(fresh),mode:'major'})).sent,0)
const failed=server();failed.loseResponse=true
await assert.rejects(notifyRadar({events:two,ledger,api:failed.api,repo:'madmax91310/shinny-potato',now:new Date(fresh),mode:'major'}),/Response lost/)
const recovered=await notifyRadar({events:two,ledger,api:failed.api,repo:'madmax91310/shinny-potato',now:new Date(fresh),mode:'major'})
assert.equal(failed.posts,1);assert.equal(recovered.recovered,2)
const digest=await notifyRadar({events:two,ledger,api:server().api,repo:'madmax91310/shinny-potato',now:new Date(fresh),mode:'digest'})
assert.equal(planNotifications(two,digest.ledger,new Date(fresh),'digest').events.length,0)

const actions=radarToolActions(salary,fresh)
assert.ok(actions.length<=2);assert.ok(actions.some(a=>a.kind==='grok'))
const grok=actions.find(a=>a.kind==='grok');assert.ok(tweetStatus(grok.state.radar.text).canCopy);assert.equal(radarSuggestion(grok.state).id,salary.id)
assert.equal(radarSuggestion({radar:{...grok.state.radar,sourceUrl:'javascript:bad'}}),null)
assert.deepEqual(radarToolActions(advice,now),[])
const report={mode:'Frozen real documents and declared counterexamples; no discovery or planned-production claim',at:new Date(now).toISOString(),rows:cases.map(e=>{const a=assess(e,now);return {id:e.id,title:e.title,sourceUrl:e.sourceUrl,publishedAt:e.publishedAt,before:e.priorEditorial,after:{state:a.state,score:a.score,priority:a.priority,major:a.major,nature:a.material.nature,material:a.material.status,reasons:a.criteria.map(c=>c.reason)}}}),selected:overview.selection,simulatedNotifications:api.comments.map(c=>c.body),noRealSend:true}
if(process.argv[2]){await mkdir(process.argv[2],{recursive:true});await writeFile(process.argv[2]+'/publication-policy.json',JSON.stringify(report,null,2));await writeFile(process.argv[2]+'/summary.json',JSON.stringify(overview,null,2))}
console.log('Publication policy: real INSEE, BPCE, generic advice, proposal, exclusions, relative ranking, original dates, copy deduplication, qualified tools, silent migration and simulated durable notifications passed. No user notification sent.')

const corrected={...candidate,id:'7'.repeat(24),correctionOf:salary.publicationId,correctionPublishedAt:'2026-10-26',status:'Correction / démenti'}
assert.equal(planNotifications([corrected],{...ledger,acknowledged:[salary.id],acknowledgedPublications:[publicationKey(salary)]},new Date(now),'digest').events.length,1,'A substantive qualified correction has a separate receipt and remains linked to the original')

// Deterministic observed fee changes retain two actual observations. Neither a
// first catalogue entry nor a page's collection time becomes an announcement.
const {advanceRadar}=await import('./lib/editorial-radar.mjs')
const {publicationTime,observedChange}=await import('../src/lib/radar-qualification.js')
const feeRow={family:'etf',entity:'FR001400U5Q4',label:'ETF Monde',field:'ter',fieldLabel:'Frais annuels',value:.2,unit:'% / an',scope:'Part FR001400U5Q4',period:'2026-10-25',checkedAt:'2026-10-25T10:00:00Z',sourceUrl:'https://www.amundietf.fr/product'}
const baseline=advanceRadar(null,[feeRow],{now:new Date(now)}),changed=advanceRadar(baseline.state,[{...feeRow,value:.15,checkedAt:'2026-10-26T10:00:00Z'}],{now:new Date(now)})
assert.equal(baseline.newEvents.length,0)
const fee=changed.newEvents[0]
assert.ok(observedChange(fee));assert.equal(fee.publishedAt,undefined)
assert.equal(publicationTime(fee),'2026-10-26T10:00:00Z');assert.ok(recentEditorial(fee,now))
assert.match(publicationMaterial(fee,now).nowReason,/date d’annonce inconnue/)
assert.equal(observedChange({...fee,financialChangeEvidence:{...fee.financialChangeEvidence,scope:'Other share'}}),null)
assert.equal(observedChange({...fee,financialChangeEvidence:{...fee.financialChangeEvidence,beforeHash:fee.financialChangeEvidence.afterHash}}),null)
assert.equal(publicationTime({...fee,financialChangeEvidence:null,detectedAt:'2026-10-26'}),null)
assert.equal(radarToolActions({...fee,entity:'IE0000000000'},now).some(a=>a.kind==='etf-sheet'),false,'No link to a sheet without an exact qualified product')
const legacyMode=await notifyRadar({events:[candidate],ledger,api:server().api,repo:'madmax91310/shinny-potato',now:new Date(fresh),mode:'all'})
assert.equal(legacyMode.ledger.lastDigest,'2026-10-23','The legacy entry point also obeys the one daily digest policy')
assert.ok(legacyMode.ledger.acknowledgedPublications.includes(publicationKey(candidate)))

const historicalFee=cases.find(e=>e.id==='0862ef590bd97645ff84caae')
assert.equal(radarToolActions(historicalFee,now).find(a=>a.kind==='etf-sheet').to,'/fiches-etf?isin=IE00B14X4Q57')
assert.equal(recentEditorial(historicalFee,now),false,'A historical observation without an announcement date is not rejuvenated during policy migration')

assert.equal(publicationSelection([{...candidate,backfill:true}],{now:fresh}).selected.length,0,'An archive cannot fill À publier maintenant')
assert.equal(publicationSelection([{...candidate,migratedEditorial:true}],{now:fresh}).selected.length,0,'Historical parser migrations remain accessible without being promoted now')

assert.match(publicationMaterial(salary,now).angle,/2\s*238|2 238/,'The distribution angle uses the extracted threshold')
assert.ok(publicationMaterial(fee,now).angle.includes(fee.beforeText)&&publicationMaterial(fee,now).angle.includes(fee.afterText),'A change angle keeps both proven values, without inventing a cost')

assert.equal(assess({...candidate,publishedAt:'2026-10-15',originalPublishedAt:null},now).priority,false,'An old study without a new development stays accessible without filling publish-now slots')
