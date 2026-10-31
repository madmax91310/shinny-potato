import assert from 'node:assert/strict'
import './test-bdf-debt-charts.mjs'
import './test-insee-book-routing.mjs'
import { readFile } from 'node:fs/promises'
import { PUBLICATION_SOURCES, collectPublications, discoverPublications, parsePublication, canonicalUrl } from './lib/radar-publications.mjs'
import { advanceRadar, meaningful } from './lib/editorial-radar.mjs'
import { collectObservations } from './update-editorial-radar.mjs'
import { editorialAssessment, editorialState, etfAnnouncement, groupSignals, selectEditorial, factType } from '../src/lib/radar-editorial.js'
import { enrichEtfLaunches, parseEtfDocument } from './lib/radar-news.mjs'
import { migrateNotificationPolicy, notificationState, planNotifications } from './lib/radar-notifications.mjs'
import { scheduledRadar } from './lib/radar-schedule.mjs'
import { validateFeed } from '../src/pages/editorial-radar/client.js'
const now = new Date('2026-10-24T15:00:00Z')
const fixture = key => readFile(new URL(`./fixtures/radar-publications/${key}.html`, import.meta.url),'utf8')
const source = id => PUBLICATION_SOURCES.find(row=>row.id===id)
const inseeUrl='https://www.insee.fr/fr/statistiques/9087193'
const amundiUrl='https://www.amundietf.fr/fr/professionnels/a-propos/news/investors-notice/amundi-renforce-sa-gamme-d-etf-thematiques-lies-a-l-ia'
const insee=parsePublication(await fixture('insee'),source('insee-publications'),inseeUrl,now)
assert.equal(insee.publishedAt,'2026-10-22'); assert.equal(insee.referencePeriod,'2025'); assert.notEqual(insee.period,insee.referencePeriod)
assert.equal(insee.checkedAt,now.toISOString()); assert.match(insee.summary,/EQTP/)
const amundi=parsePublication(await fixture('amundi'),source('amundi'),amundiUrl,now)
assert.equal(amundi.publishedAt,'2026-10-14','Website publication date differs from the 13 October dateline')
assert.equal(amundi.products.length,3)
for(const p of amundi.products){assert.equal(p.isin,null);assert.equal(p.fees,null);assert.equal(p.pea,null);assert.equal(p.availability,null)}
assert.equal(etfAnnouncement(amundi.label).stage,'candidate'); assert.equal(amundi.announcementEvidence.stage,'announced')
assert.match(amundi.evidence.excerpt,/20 octobre/)
assert.equal(parsePublication(await fixture('inflation'),source('insee-conjoncture'),'https://www.insee.fr/fr/statistiques/9080209',now).factType,'statistical-publication')
assert.equal(parsePublication(await fixture('drees'),source('drees'),'https://drees.solidarites-sante.gouv.fr/publication/test',now).referencePeriod,null,'Edition 2026 does not imply 2026 statistical data')
const wisdom=parsePublication(await fixture('wisdomtree'),source('wisdomtree'),'https://www.wisdomtree.com/fr/press-room/test',now)
assert.ok(wisdom.products.filter(p=>p.isin).length>=2)
assert.ok(wisdom.products.filter(p=>p.isin).every(p=>p.fees==='0,65%'))
// Multi-product row boundaries, including distinct fees; no PEA or broker inferred.
const grouped=parseEtfDocument('<p>Amundi lance trois nouveaux ETF UCITS.</p><table><tr><th>Nom</th><th>ISIN</th><th>TER</th></tr><tr><td>Amundi Alpha UCITS ETF</td><td>IE0002XZSHO1</td><td>0.15%</td></tr><tr><td>Amundi Beta UCITS ETF</td><td>FR001400U5Q4</td><td>0.35%</td></tr><tr><td>Amundi Gamma UCITS ETF</td><td>IE000BI8OT95</td><td>0.55%</td></tr></table>','Amundi enrichit son offre ETF')
assert.deepEqual(grouped.products.map(p=>p.fees),['0.15%','0.35%','0.55%']);assert.ok(grouped.products.every(p=>p.pea===null&&p.availability===null))
assert.equal(etfAnnouncement('Amundi cote 21 nouveaux ETF sur Euronext Paris').type,'trading')
// Read live values from shared data. Never freeze the living dataset's numbers or dates.
const collected=await collectObservations(), liveSalary=collected.observations.find(o=>o.entity==='salary-median')
assert.equal(liveSalary.unit,'€ nets par mois');assert.equal(liveSalary.label,'Salaire médian du privé')
const salary=JSON.parse(await readFile(new URL('./fixtures/radar-publications/salary-observations.json',import.meta.url),'utf8')).find(o=>o.entity==='salary-median')
assert.equal(salary.unit,'€ nets par mois');assert.equal(salary.label,'Salaire médian du privé');assert.match(salary.populationScope,/équivalent temps plein/)
const before={...salary,period:String(Number(salary.period)-1),publishedAt:'2025-10-23',publicationId:'https://www.insee.fr/fr/statistiques/8657156',value:salary.value-48}
const initial=advanceRadar(null,[before],{now})
const updated=advanceRadar(initial.state,[salary],{now})
const event=updated.newEvents[0]
assert.match(event.title,/Salaire médian du privé : .*€ nets par mois en/);assert.equal(editorialState(event),'ready');assert.ok(editorialAssessment(event,+now).priority)
assert.equal(event.beforePeriod,before.period);assert.equal(event.publishedAt,salary.publishedAt);assert.equal(event.checkedAt,salary.checkedAt)
assert.equal(meaningful(before,{...salary,value:before.value}),true,'New statistical publication exists even when its value is unchanged')
assert.equal(meaningful(salary,{...salary,publicationId:inseeUrl+'/new-study'}),true,'Distinct official publication of same period')
const legacy=structuredClone(updated.state);delete legacy.events[0].unit;delete legacy.events[0].evidence;legacy.events[0].label='Figure 4 technique'
const migrated=advanceRadar(legacy,[salary],{now})
assert.equal(migrated.state.events[0].id,event.id);assert.equal(migrated.state.events[0].detectedAt,event.detectedAt);assert.equal(migrated.newEvents.length,0)
const ledger=migrateNotificationPolicy(legacy,notificationState(legacy,{schemaVersion:1,acknowledged:[]},now))
assert.equal(planNotifications(migrated.state.events,ledger,now).events.length,0,'No retroactive migration alerts')
const empty=advanceRadar(null,[],{now}), outside=advanceRadar(empty.state,[amundi,insee],{now})
assert.equal(outside.newEvents.length,2,'Discovery independent of the catalogue; bounded backfill includes ten-day-old announcements')
assert.equal(editorialState(outside.newEvents.find(e=>e.family==='etf')),'ready')
assert.equal(validateFeed(outside.feed),outside.feed,'Unrelated tool link is optional')
const samePublication={...event,id:'b'.repeat(24),entity:'salary-top10',fieldLabel:'Hauts salaires'}
assert.equal(groupSignals([event,samePublication],+now).length,1)
assert.equal(groupSignals([event,{...samePublication,publicationId:inseeUrl+'/other'}],+now).length,2)
assert.equal(canonicalUrl(inseeUrl+'?utm_source=alias#table'),inseeUrl)
const duplicateDiscovery=discoverPublications(`<rss><item><title>Salaires</title><link>${inseeUrl}</link></item><item><title>Salaires</title><link>${inseeUrl}?utm_source=rss</link></item></rss>`,source('insee-publications'))
assert.equal(duplicateDiscovery.length,1)
const secondary={...event,family:'etf',entity:'a-fund',factType:undefined,field:'aum',before:100,after:125}
assert.equal(editorialState(secondary),'secondary');assert.equal(planNotifications([secondary],{acknowledged:[]},now).events.length,0)
const composition={...secondary,field:'top10',before:45,after:52}
assert.equal(editorialState(composition),'ready');assert.ok(editorialAssessment(composition,+now).priority)
assert.equal(editorialState({...composition,after:47}),'secondary')
assert.equal(factType({...secondary,kind:'new'}),'coverage')
assert.equal(editorialAssessment({...event,sourceUrl:'javascript:alert(1)'},+now).priority,false,'A high score never validates doubtful evidence')
const old={...event,id:'c'.repeat(24),publishedAt:'2025-01-01',detectedAt:now.toISOString()}
assert.equal(editorialAssessment(old,+now).major,false);assert.equal(planNotifications([old],{acknowledged:[]},now).events.length,0)
const all=Array.from({length:10},(_,i)=>({...event,id:i.toString(16).padStart(24,'0'),publicationId:`${inseeUrl}/${i}`}))
const selected=selectEditorial(groupSignals(all,+now));assert.equal(selected.selected.length,2);assert.equal(selected.others.length,8)
const retained=advanceRadar({...updated.state,events:[...updated.state.events,...Array.from({length:550},(_,i)=>({...secondary,id:`tech-${i}`}))]},[],{now})
assert.ok(retained.feed.events.some(e=>e.id===event.id),'Technical noise cannot evict an important event from the feed')
// Durable queue: failed discovery/document recovers without losing the last proof.
const rss=`<rss><item><title>Salaires</title><link>${inseeUrl}</link></item></rss>`
let offline=true
const request=async url=>new Response(url.includes('/flux/')?rss:offline?'Unavailable':await fixture('insee'),{status:!url.includes('/flux/')&&offline?503:200,headers:{'content-type':'text/html','etag':'fixture'}})
const failed=await collectPublications(now,request,{},[source('insee-publications')],1)
assert.equal(failed.state.documents[inseeUrl].status,'error');assert.equal(failed.observations.length,0)
offline=false
const resumed=await collectPublications(new Date(+now+3*3600000),request,failed.state,[source('insee-publications')],1)
assert.equal(resumed.observations.length,1);assert.equal(resumed.observations[0].publishedAt,'2026-10-22')
const unchanged=await collectPublications(new Date(+now+4*3600000),request,resumed.state,[source('insee-publications')],1)
assert.equal(unchanged.observations.length,1)
const saved=unchanged.observations[0].checkedAt
const outage=await collectPublications(new Date(+now+8*86400000),async()=>{throw Error('HTTP 503')},unchanged.state,[source('insee-publications')],1)
assert.equal(outage.observations[0].checkedAt,saved,'Outage never rejuvenates last valid data')
assert.throws(()=>discoverPublications('<html>Vérification de sécurité</html>',source('dares')),/refusé/)
const lots=Array.from({length:10},(_,i)=>({...amundi,entity:`queued-${i}`,sourceUrl:amundiUrl+`-${i}`,documentUrl:amundiUrl+`-${i}`}))
const q1=await enrichEtfLaunches(lots,now,async()=>new Response(await fixture('amundi'),{headers:{'content-type':'text/html'}}))
assert.equal(Object.values(q1.queue).filter(q=>q.status==='pending').length,2)
const q2=await enrichEtfLaunches([],new Date(+now+3600000),async()=>new Response(await fixture('amundi'),{headers:{'content-type':'text/html'}}),undefined,q1.queue)
assert.equal(Object.values(q2.queue).filter(q=>q.status==='done').length,10)
assert.equal(scheduledRadar(new Date('2026-07-01T06:15Z')).enabled,true)
assert.equal(scheduledRadar(new Date('2026-12-01T06:15Z')).enabled,false)
assert.equal(scheduledRadar(new Date('2026-12-01T07:15Z')).enabled,true)
assert.equal(scheduledRadar(new Date('2026-10-25T19:15Z')).enabled,true)
console.log('Radar publications: reference INSEE/Amundi cases, units, publication/data/collection dates, source proofs, group products, unknowns, scoring, diversity, durable retries, outage, migration, retention and DST verified.')

// Major events and daily recap use the same score/reliability as the screen.
const justPublished={...event,publishedAt:now.toISOString().slice(0,10),migratedEditorial:undefined}
const manyMajor=Array.from({length:6},(_,i)=>({...justPublished,id:(i+20).toString(16).padStart(24,'0'),publicationId:inseeUrl+`/major-${i}`}))
assert.equal(planNotifications(manyMajor,{acknowledged:[]},now,'major').events.length,2)
assert.equal(planNotifications(manyMajor,{acknowledged:[],majorDay:'2026-10-24',majorGroups:2},now,'major').events.length,2)
assert.equal(planNotifications(manyMajor,{acknowledged:[],majorDay:'2026-10-24',majorGroups:3},now,'major').events.length,2)
assert.equal(planNotifications(manyMajor,{acknowledged:[],lastDigest:'2026-10-24'},now,'digest').events.length,0)
assert.equal(planNotifications([event,samePublication],{acknowledged:[]},now,'digest').events.length,2,'Two facts are one publication group')
const {notifyRadar}=await import('./lib/radar-notifications.mjs')
let tracker=null,comments=[],failComment=true
const api=async(path,method='GET',body)=>{
 if(path.startsWith('issues?'))return tracker?[tracker]:[]
 if(path==='')return{has_issues:true}
 if(path.startsWith('assignees/'))return null
 if(path==='issues'&&method==='POST'){tracker={...body,number:1,user:{login:'github-actions[bot]'},assignees:[{login:'madmax91310'}]};return tracker}
 if(path.startsWith('issues/1/comments')){
  if(method==='GET')return comments
  if(failComment)throw Error('HTTP 503 after issue creation')
  const comment={body:body.body,user:{login:'github-actions[bot]'}};comments.push(comment);return comment
 }
 if(path==='issues/1'&&method==='PATCH'){Object.assign(tracker,body);return tracker}
 throw Error('Unexpected mock call '+path)
}
const send=ledger=>notifyRadar({events:[event,samePublication],ledger,now,api,repo:'madmax91310/shinny-potato',mode:'digest'})
await assert.rejects(send({schemaVersion:1,acknowledged:[]}),/503/)
failComment=false
const delivery=await send({schemaVersion:1,acknowledged:[]})
assert.equal(delivery.sent,2);assert.equal(comments.length,1,'One grouped comment after retry, not lost because issue body existed')
const recovery=await send({schemaVersion:1,acknowledged:[]})
assert.equal(recovery.sent,0);assert.equal(recovery.recovered,2);assert.equal(comments.length,1,'Crash before ledger commit recovers durable bot receipts')
assert.equal(planNotifications([{...samePublication,id:'f'.repeat(24)}],delivery.ledger,new Date(+now+86400000),'digest').events.length,0,'Another channel/fact of the same publication does not notify twice')
console.log('Notification simulation: same ranked groups, per-run noise cap, no daily discard, single daily recap, failure after tracker creation, retry and durable receipts verified. No real notification sent.')

const {parsePurchasingFeed,PURCHASING_SOURCES}=await import('./lib/purchasing-power-news.mjs')
const study=parsePurchasingFeed('<rss><channel><item><title>Étude : les niveaux de vie des ménages</title><description>En 2025, le niveau de vie médian atteint 25 000 euros par an selon cette étude.</description><link>https://www.vie-publique.fr/en-bref/etude</link><pubDate>2026-10-22</pubDate></item></channel></rss>',PURCHASING_SOURCES.find(s=>s.id==='vie-publique-actualites'),now).observations[0]
assert.equal(study.factType,'statistical-publication')
const studyEvent=advanceRadar(advanceRadar(null,[],{now}).state,[study],{now}).newEvents[0]
// A silent family bootstrap remains intentional; the publication itself qualifies without a legal status.
assert.equal(editorialState({...study,after:study.value}),'ready')
assert.equal(studyEvent,undefined)

const repeatStudy=advanceRadar(advanceRadar(null,[insee],{now}).state,[{...insee,publishedAt:'2026-10-23',period:'2026-10-23'}],{now})
assert.equal(repeatStudy.newEvents.length,1,'A new official statistical publication is detected even with an unchanged numerical summary')

assert.equal(etfAnnouncement('UCITS ETF now trading on Xetra').type,'trading','Trading alone does not prove the first listing worldwide')
assert.equal(etfAnnouncement('UCITS ETF additional listing on Euronext Paris').type,'listing')
assert.equal(etfAnnouncement('UCITS ETF first trading date announced').type,'first-trading')

assert.equal(etfAnnouncement('UCITS ETF will begin trading tomorrow').type,'trading','A future trading date is not a launch claim')

// A conditional response after an outage restores health without inventing a
// new extraction, publication or availability date. No event is re-emitted.
const recovered304=await collectPublications(new Date(+now+9*86400000),async()=>new Response(null,{status:304}),outage.state,[source('insee-publications')],1)
const cachedDocument=Object.values(unchanged.state.documents)[0],recoveredDocument=Object.values(recovered304.state.documents)[0]
assert.equal(recoveredDocument.status,'done')
assert.equal(recoveredDocument.error,undefined)
assert.deepEqual(recoveredDocument.observation,cachedDocument.observation)
assert.equal(recoveredDocument.availableAt,cachedDocument.availableAt)
assert.equal(recovered304.sources[0].status,'ok')
assert.equal(recovered304.sources[0].queue.error,0)
assert.deepEqual(recovered304.errors,[])
const replay304=advanceRadar(advanceRadar(null,unchanged.observations,{now}).state,recovered304.observations,{now:new Date(+now+9*86400000)})
assert.equal(replay304.newEvents.length,0)
const noCache304=await collectPublications(now,async url=>new Response(url.includes('/flux/')?rss:null,{status:url.includes('/flux/')?200:304}),{},[source('insee-publications')],1)
assert.match(noCache304.errors[0].reason,/304 sans extraction/)
