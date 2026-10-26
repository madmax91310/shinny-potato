import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { CONSUMER_SOURCES, discoverConsumer, parseConsumer, announcedDates } from './lib/radar-consumer.mjs'
import { editorialExclusion, editorialTopic, RADAR_TOPICS } from '../src/lib/radar-policy.js'
import { editorialAssessment, editorialState, groupSignals, publicationKey } from '../src/lib/radar-editorial.js'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { collectPublications } from './lib/radar-publications.mjs'
import { planNotifications, notificationState, notifyRadar } from './lib/radar-notifications.mjs'
const now=new Date('2026-10-24T16:00:00Z'), fixture=async name=>readFile(new URL(`./fixtures/radar-consumer/${name}`,import.meta.url),'utf8')
const manifest=JSON.parse(await fixture('manifest.json')), observations=[]
for(const example of manifest){
 const listing=JSON.parse(await fixture(example.case+'-listing.json')),source=CONSUMER_SOURCES.find(s=>s.id===listing.source),row=listing.rows.find(row=>row.url===example.url)
 assert.ok(row,'Real source listing contains the known document (capture, not a live discovery claim)')
 const observation=parseConsumer(await fixture(example.case+'.html'),source,row.url,now,row)
 assert.equal(observation.publishedAt,example.publishedAt);assert.equal(observation.checkedAt,now.toISOString());assert.ok(observation.evidence.excerpt.length<=700);assert.equal(observation.tool,null)
 observations.push(observation)
}
const energy=observations.find(row=>row.topic==='energie'), pea=observations.find(row=>row.publisher==='Bourse Direct')
assert.equal(observations.find(row=>row.publisher.startsWith('AFG')).referencePeriod,'2026-06-30');assert.equal(energy.effectiveAt,'2026-11-01');assert.equal(energy.publishedAt,'2026-10-23');assert.equal(pea.publishedAt,'2026-10-12')
assert.equal(observations.find(row=>row.publisher.startsWith('AMF')).status,'Annonce publiée','Proposant des investissements is not a legislative proposition')
assert.equal(observations.find(row=>row.publisher.startsWith('MoneyVox')).evidenceLevel,'journalistic')
const asEvent=row=>({...row,id:'a'.repeat(24),after:row.value,before:null,detectedAt:now.toISOString(),kind:'new'})
assert.equal(editorialState(asEvent(energy),+now),'ready');assert.equal(editorialAssessment(asEvent(energy),+now).major,false,'Coverage and a future date alone do not establish the new financial conditions for a rapid alert')
assert.equal(editorialAssessment({...asEvent(pea),publishedAt:'2026-10-24'},+now).major,false,'An extension of securities lending is not automatically a major launch of a broadly accessible PEA')
assert.equal(editorialAssessment(asEvent(observations.find(row=>row.publisher.startsWith('Revolut'))),+now).major,false,'Old discovery is never a fresh major alert')
for(const title of ['Impôts : nouveau barème','Prime d’activité : revalorisation','APL : nouveau montant','Allocation chômage : nouveaux droits','Chèque énergie : dernière ligne droite','Loi de finances 2027','Fiscalité du PEA : nouvelle règle','Hausse des prestations sociales']){
 assert.ok(editorialExclusion({label:title}));assert.equal(editorialTopic(title,'Un taux de 5 % pour les particuliers'),null)
 const event={...asEvent(energy),label:title};assert.equal(editorialAssessment(event,+now).priority,false);assert.equal(planNotifications([event],{acknowledged:[]},now,'major').events.length,0)
}
assert.equal(editorialTopic('PTZ : nouveau plafond applicable'), 'credit')
assert.equal(editorialTopic('Niveau de vie des ménages','Le niveau de vie tient compte des prestations sociales.'),'statistiques')
assert.equal(editorialTopic('Prix du gaz TTC : nouveau prix repère'),'energie')
assert.equal(Object.keys(RADAR_TOPICS).length,12)
assert.equal(editorialTopic('L’AMF met en garde le public contre des acteurs non autorisés'),'securite')
assert.equal(editorialState({...asEvent(energy),topic:'carburants',label:'Gazole : baisse de 1 centime cette semaine'},+now),'secondary')
assert.equal(editorialState({...asEvent(energy),topic:'etf',label:'ETF : les encours progressent de 2 %'},+now),'secondary')
assert.equal(editorialAssessment({...asEvent(energy),evidenceLevel:'rumour'},+now).priority,false)
assert.equal(editorialState({...asEvent(energy),status:'Proposition / en discussion'},+now),'watch')
assert.equal(editorialAssessment({...asEvent(energy),publishedAt:'2026-12-01'},+now).priority,false)
assert.equal(editorialState({...asEvent(energy),promotionEndsAt:'2026-10-20'},+now),'watch')
assert.deepEqual(announcedDates('Offre valable jusqu’au 31 octobre 2026, applicable le 1er novembre 2026'),{promotionEndsAt:'2026-10-31',effectiveAt:'2026-11-01'})
const source=CONSUMER_SOURCES.find(s=>s.id==='energie-info'), html=await fixture('heures.html'), url=energy.sourceUrl
const rss=`<rss><channel><item><title>${energy.label}</title><link>${url}?utm_source=one</link><pubDate>Fri, 23 Oct 2026 11:48:39 +0000</pubDate></item><item><title>${energy.label}</title><link>${url}</link><pubDate>Fri, 23 Oct 2026 11:48:39 +0000</pubDate></item><item><title>Chèque énergie : demande</title><link>https://www.energie-info.fr/aid</link><pubDate>Fri, 23 Oct 2026 11:48:39 +0000</pubDate></item></channel></rss>`
assert.equal(discoverConsumer(rss,source).length,2,'Tracking aliases deduplicate; rejection retained')
let outage=true
const request=async requested=>new Response(requested===source.url?rss:outage?'down':html,{status:requested!==source.url&&outage?503:200,headers:{etag:'proof','content-type':'text/html; charset=utf-8'}})
const failed=await collectPublications(now,request,{},[source],1)
assert.equal(failed.sources[0].queue.error,1);assert.equal(failed.sources[0].queue.rejected,1)
outage=false
const recovered=await collectPublications(new Date(+now+3*3600000),request,failed.state,[source],1)
assert.equal(recovered.observations.length,1);assert.equal(recovered.observations[0].backfill,true)
assert.equal(recovered.sources[0].queue.error,0);assert.ok(recovered.metrics.requests>0);assert.ok(recovered.metrics.bytes>0)
const baseline=advanceRadar(null,[],{now}), first=advanceRadar(baseline.state,[energy],{now})
const next=advanceRadar(first.state,[{...energy,entity:energy.entity+'new',sourceUrl:url+'/new',publicationId:url+'/new'}],{now})
assert.equal(next.newEvents.length,1);assert.equal(next.feed.calendar[0].date,'2026-11-01');assert.equal(next.newEvents[0].populationScope,energy.populationScope)
const ledger=notificationState(first.state,null,now)
assert.equal(planNotifications([{...next.newEvents[0],backfill:true}],ledger,now,'major').events.length,0)
const correction=advanceRadar(next.state,[{...energy,entity:energy.entity+'new',sourceUrl:url+'/new',publicationId:url+'/new',label:'Correction : horaires des heures creuses',status:'Correction / démenti',value:{...energy.value,title:'Correction : horaires des heures creuses',status:'Correction / démenti'}}],{now})
const corrected=correction.newEvents[0];assert.equal(corrected.correctionOf,url+'/new');assert.ok(correction.state.events.find(e=>e.publicationId===url+'/new'&&e.id!==corrected.id)?.supersededBy)
assert.notEqual(publicationKey(corrected),publicationKey(first.state.events[0]??asEvent(energy)))
const frozen=structuredClone(next.state);frozen.events.push({...next.newEvents[0],id:'b'.repeat(24),label:'APL : versement'})
const migrated=advanceRadar(frozen,[],{now});assert.ok(migrated.state.events.some(e=>e.id==='b'.repeat(24)));assert.ok(!migrated.feed.events.some(e=>e.id==='b'.repeat(24)))
const quotaNow=new Date('2026-10-23T16:00:00Z')
const statistical=JSON.parse(await readFile(new URL('./fixtures/radar-publication/cases.json',import.meta.url),'utf8')).events.find(e=>e.entity==='salary-median')
const majors=Array.from({length:6},(_,i)=>({...statistical,backfill:false,migratedEditorial:false,checkedAt:quotaNow.toISOString(),id:String(i).padStart(24,'a'),entity:'news'+i,publicationId:url+'/'+i}))
const capped=planNotifications(majors,{acknowledged:[],majorDay:'2026-10-24',majorGroups:99},quotaNow,'major')
assert.equal(capped.events.length,2);assert.equal(capped.deferred,4);assert.match(capped.reason,/conservé/)
assert.equal(groupSignals([majors[0],{...majors[0],id:'c'.repeat(24)}],+now).length,1)
// Every API below is a local simulation. No credentials, remote API or user notification.
let tracker=null,comments=[],fail=true
const api=async(path,method='GET',body)=>{
 if(path==='')return{has_issues:true}
 if(path.startsWith('assignees/'))return null
 if(path.startsWith('issues?'))return tracker?[tracker]:[]
 if(path==='issues'&&method==='POST'){tracker={...body,number:1,user:{login:'github-actions[bot]'},assignees:[{login:'madmax91310'}]};return tracker}
 if(path==='issues/1/comments'&&method==='POST'){if(fail)throw Error('HTTP 503');comments.push({body:body.body,user:{login:'github-actions[bot]'}});return {}}
 if(path.startsWith('issues/1/comments?'))return comments
 if(path==='issues/1'&&method==='PATCH'){Object.assign(tracker,body);return tracker}
 throw Error(path)
}
const send=ledger=>notifyRadar({events:[majors[0]],ledger,api,repo:'madmax91310/shinny-potato',now:quotaNow,mode:'major'})
await assert.rejects(send({acknowledged:[]}),/503/);fail=false
const sent=await send({acknowledged:[]});assert.equal(sent.sent,1);assert.match(comments[0].body,/radar-editorial\?subject=/);assert.match(comments[0].body,/Statistique observée/)
assert.equal((await send(sent.ledger)).sent,0)
console.log('Consumer Radar: real excerpts, 12 themes, exclusions, dates, unknown evidence, expired promotions, duplicate discovery, persistent recovery, silent backfill, calendar, correction history, quota overflow and simulated notification receipts verified. No real notification sent.')
// An explicit link is only consolidated after the original was extracted,
// with the same publication day and identifying title words. Theme is insufficient.
const mediaSource=CONSUMER_SOURCES.find(s=>s.id==='moneyvox'),mediaUrl='https://www.moneyvox.fr/energie/actualites/example'
const media={...energy,entity:'media-reference',sourceUrl:mediaUrl,publicationId:mediaUrl,evidenceLevel:'journalistic',sources:[{url:energy.sourceUrl,role:'original-link-unverified',label:'Document cité'}]}
const future=new Date(+now+86400000).toISOString()
const linkedState={sources:Object.fromEntries([source,mediaSource].map(s=>[s.id,{lastSuccessAt:now.toISOString(),nextCheckAt:future,status:'ok'}])),documents:{[url]:{source:source.id,discoveredAt:now.toISOString(),nextAttemptAt:future,status:'done',observation:energy},[mediaUrl]:{source:mediaSource.id,discoveredAt:now.toISOString(),nextAttemptAt:future,status:'done',observation:media}}}
const linked=await collectPublications(now,()=>assert.fail('Cached documents should not refetch'),linkedState,[source,mediaSource],0)
assert.equal(groupSignals(linked.observations.map(asEvent),+now).length,1)
assert.equal(linked.observations.find(row=>row.entity==='media-reference').sources[0].role,'official-original-extracted')
const separate=structuredClone(linkedState);separate.documents[mediaUrl].observation.label='Autre annonce concernant les heures creuses';separate.documents[mediaUrl].observation.publishedAt='2026-10-22'
const unrelated=await collectPublications(now,()=>assert.fail('No request'),separate,[source,mediaSource],0)
assert.equal(groupSignals(unrelated.observations.map(asEvent),+now).length,2)
const oldCorrection={...asEvent(energy),id:'d'.repeat(24),publishedAt:'2026-01-01',status:'Correction / démenti',correctionOf:url,correctionPublishedAt:'2026-10-24'}
assert.equal(planNotifications([oldCorrection],{acknowledged:[],acknowledgedPublications:[publicationKey(asEvent(energy))]},now,'digest').events.length,0,'A correction is retained but the date alone does not make a weak event a priority')
console.log('Explicit original linkage, distinct publication dates and dated correction of an old event verified.')
// A real later correction of an initially silent archive must not remain
// permanently muted; the durable item flag also stays cleared on a later fetch.
const correctedHtml=html.replace(energy.label,'Correction : horaires des heures creuses').replace('</head>','<meta property="article:modified_time" content="2026-10-24" /></head>')
const laterRequest=async requested=>new Response(requested===source.url?rss:correctedHtml,{headers:{'content-type':'text/html; charset=utf-8'}})
const afterCorrection=await collectPublications(new Date(+now+5*3600000),laterRequest,recovered.state,[source],1)
assert.equal(afterCorrection.observations[0].backfill,false,'Later dated correction leaves the initial silent archive')
assert.equal(afterCorrection.observations[0].scope,recovered.observations[0].scope,'Article wording cannot change the observation identity')
const correctionAgain=await collectPublications(new Date(+now+7*3600000),laterRequest,afterCorrection.state,[source],1)
assert.equal(correctionAgain.observations[0].backfill,false,'Cleared backfill marker persists across normal producer passes')
console.log('Post-backfill correction and stable observation scope verified.')

// Actual public global listing: France remains a required scope, never inferred
// from the listing locale. Old publication dates cannot become new alerts.
const {gunzipSync}=await import('node:zlib')
const recoveryRoot=new URL('../reports/donnees-consolidees-2026-10-24/preuves/reprise-20261026/',import.meta.url)
const recoveredRevolut=CONSUMER_SOURCES.find(s=>s.id==='revolut-news')
const recoveredLinks=discoverConsumer(gunzipSync(await readFile(new URL('revolut-listing.html.gz',recoveryRoot))).toString(),recoveredRevolut)
const frenchLink=recoveredLinks.find(r=>r.url.endsWith('/revolut_receives_french_banking_licence'))
assert(frenchLink)
const recoveredFrench=parseConsumer(gunzipSync(await readFile(new URL('revolut-france.html.gz',recoveryRoot))).toString(),recoveredRevolut,frenchLink.url,now,frenchLink)
assert.equal(recoveredFrench.publishedAt,'2026-08-10')
assert.equal(editorialAssessment(asEvent(recoveredFrench),+now).major,false)
assert.match(recoveredRevolut.depth,/couverture partielle/)
console.log('Recovered official global Revolut listing: French article identified, original August date and partial coverage preserved.')
