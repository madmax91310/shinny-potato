import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { OFFER_SOURCES, offerSnapshot, compareOfferSnapshots, offerDiscovery, offerDates } from './lib/radar-offer-watch.mjs'
import { inseeDiscovery, INSEE_SEARCH } from './lib/radar-insee-search.mjs'
import { PUBLICATION_SOURCES, collectPublications, parsePublication } from './lib/radar-publications.mjs'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { editorialState, editorialAssessment } from '../src/lib/radar-editorial.js'
import { planNotifications } from './lib/radar-notifications.mjs'
const fixture=n=>readFile(new URL(`./fixtures/radar-depth/${n}`,import.meta.url),'utf8')
const now=new Date('2026-10-25T12:00:00Z'),later=new Date(+now+3*3600000),source=OFFER_SOURCES[0]
const raw='Conditions tarifaires au 6 août 2026\n'+await fixture('fortuneo-tariff.txt')
const before=offerSnapshot(raw,source,now)
assert.throws(()=>offerSnapshot('<html><h1>Conditions tarifaires</h1><p>Une page de remplacement</p></html>',source,now),'An HTML replacement of a PDF is not a new tariff')
assert.equal(before.dates.effectiveAt,'2026-08-06')
assert.ok(before.clauseCount>2)
assert.equal(compareOfferSnapshots(null,before,source,before.sourceUrl),null,'First observation is a silent reference')
assert.equal(compareOfferSnapshots(before,offerSnapshot(raw.replaceAll('  ',' '),source,later),source,before.sourceUrl),null,'Layout change is not a fee change')
assert.equal(compareOfferSnapshots(before,offerSnapshot(raw.replaceAll('GRATUIT','0 €'),source,later),source,before.sourceUrl),null,'Free and zero euros are equivalent')
// Declared simulation from a real tariff excerpt. Never published or notified.
const simulated=raw.replace(/^.*Tenue de compte.*GRATUIT.*$/gm,line=>line.replace('GRATUIT','2 €'))
const after=offerSnapshot(simulated,source,later)
const change=compareOfferSnapshots(before,after,source,before.sourceUrl)
assert.ok(change);
const restored=offerSnapshot(raw,source,new Date(+later+3600000)),repeated=offerSnapshot(simulated,source,new Date(+later+7200000))
assert.notEqual(compareOfferSnapshots(restored,repeated,source,before.sourceUrl).publicationId,change.publicationId,'A genuinely reinstated condition is a new transition, not a duplicate of a past change')
assert.equal(change.publishedAt,null);assert.equal(change.changeEvidence.changes.length,1)
assert.equal(editorialState(change,+later),'ready')
assert.equal(editorialAssessment({...change,changeEvidence:{...change.changeEvidence,changes:[{key:'special',before:'Frais document spécialisé : 2 €',after:'Frais document spécialisé : 2,10 €'}]}},+later).major,false,'A specialised clause does not automatically become a major alert')
assert.equal(editorialState({...change,publishedAt:'2027-01-01'},+later),'watch')
assert.equal(editorialState({...change,changeEvidence:null},+later),'watch','Undated page alone never qualifies')
assert.equal(editorialState({...change,promotionEndsAt:'2026-10-24'},+later),'watch')
assert.match(editorialAssessment(change,+later).criteria.find(r=>r.key==='freshness').reason,/annonce non datée/)
assert.equal(offerDates('Offre valable du 20.07.2026 au 31.10.2026.').promotionEndsAt,'2026-10-31')
assert.equal(offerDates('Offre jusqu’au 31 février 2026').promotionEndsAt,null)
const offer=offerSnapshot(await fixture('fortuneo-offers.html'),OFFER_SOURCES[1],now)
assert.ok(offer.clauseCount>=2);assert.ok(Object.values(offer.clauses).some(r=>/minimum|sous conditions/.test(r.quote)))
const inventory=`<a href="${before.sourceUrl}">Conditions tarifaires</a>`
assert.equal(offerDiscovery(inventory,source)[0].url,before.sourceUrl)
const bourso=OFFER_SOURCES.find(s=>s.id==='boursobank-tariffs')
assert.equal(offerDiscovery('<a href="https://www.boursorama.com/content/brochure_tarifaire/boursorama_bt.pdf">Brochure tarifaire</a>',bourso)[0].url,'https://www.boursorama.com/content/brochure_tarifaire/boursorama_bt.pdf')
assert.throws(()=>offerDiscovery('<a href="https://www.boursorama.com/other.pdf">Brochure</a>',bourso))
assert.throws(()=>offerDiscovery('<a href="https://unrelated.test/files/tarifs_fortuneo.pdf">Tarifs</a>',source))
const request=async url=>new Response(url===source.url?inventory:raw)
const first=await collectPublications(now,request,{},[source],2)
assert.equal(first.observations.length,0);assert.equal(first.sources[0].silentBaselines,1)
const disk=JSON.parse(JSON.stringify(first.state))
const second=await collectPublications(later,request,disk,[source],2)
assert.equal(second.observations.length,0)
const failed=await collectPublications(new Date(+later+3*3600000),async()=>{throw Error('Provider unavailable')},second.state,[source],2)
assert.deepEqual(failed.state.documents[before.sourceUrl].offerBaseline,second.state.documents[before.sourceUrl].offerBaseline)
const recoveryTime=new Date(+later+30*3600000)
const recovered=await collectPublications(recoveryTime,async url=>new Response(url===source.url?inventory:simulated),failed.state,[source],2)
assert.equal(recovered.observations.length,1);assert.equal(recovered.observations[0].backfill,false)
const baseline=advanceRadar(null,[{...change,entity:'previous-consumer-reference',period:'2026-10-01',checkedAt:now.toISOString(),value:'Previously followed official announcement'}],{now}),published=advanceRadar(baseline.state,recovered.observations,{now:recoveryTime})
assert.equal(published.newEvents.length,1);assert.ok(published.newEvents[0].changeEvidence)
assert.equal(advanceRadar(published.state,recovered.observations,{now:recoveryTime}).newEvents.length,0)
const planned=planNotifications(published.feed.events,{acknowledged:[]},recoveryTime,'digest')
assert.equal(planned.events.length,1,'Same reliability gate in screen and simulated digest')
assert.equal(planNotifications(published.feed.events,{acknowledged:planned.events.map(e=>e.id)},recoveryTime,'digest').events.length,0)
const csaSource=PUBLICATION_SOURCES.find(s=>s.id==='credit-logement'),csaHtml=await fixture('csa.html')
const csa=parsePublication(csaHtml,csaSource,'https://lobservatoire.creditlogement.fr/publications/analyse-marche-immobilier-septembre-2026',now)
assert.equal(csa.publishedAt,'2026-10-15');assert.equal(csa.sourceDeclaredPublicationDate,'2026-09-30');assert.equal(csa.referencePeriod,'2026-09');assert.equal(csa.factType,'statistical-publication');assert.match(csa.summary,/sur 15 ans.*sur 20 ans.*sur 25 ans/)
assert.equal(csa.housing.rateType,null,'Do not invent nominal/TAEG without the linked methodology');assert.equal(csa.housing.insurance,null)
const ambiguous=parsePublication(csaHtml.replace('Les deux temporalités ont été présentées en même temps à l’occasion de la conférence du 15 octobre 2026.',''),csaSource,csa.sourceUrl,now)
assert.equal(ambiguous.publishedAt,null);assert.equal(ambiguous.factType,'publication-watch')
assert.equal(editorialState(advanceRadar(baseline.state,[ambiguous],{now}).newEvents[0],+now),'watch')
// Parser migration bypasses an old weekly TTL once, within the same budget.
const csaKey=csa.sourceUrl,versioned={...csaSource,parserVersion:2}
const retained={sources:{[versioned.id]:{lastSuccessAt:now.toISOString(),nextCheckAt:new Date(+now+86400000).toISOString()}},documents:{[csaKey]:{url:csaKey,source:versioned.id,discoveredAt:'2026-10-01T10:00:00Z',attempts:1,status:'done',nextAttemptAt:new Date(+now+7*86400000).toISOString(),observation:ambiguous,backfill:false}}}
const migrated=await collectPublications(now,async()=>new Response(csaHtml),retained,[versioned],1)
assert.equal(migrated.observations[0].publishedAt,'2026-10-15');assert.equal(migrated.observations[0].parserMigration,true);assert.equal(migrated.observations[0].backfill,false,'Existing notification eligibility is not globally overwritten')
const migratedFeed=advanceRadar(advanceRadar(null,[ambiguous],{now}).state,migrated.observations,{now}).feed
assert.equal(planNotifications(migratedFeed.events,{acknowledged:[]},now,'digest').events.length,0,'Parser upgrade creates no retrospective alert')
assert.equal(migrated.state.documents[csaKey].parserVersion,2)
await collectPublications(new Date(+now+3600000),()=>assert.fail('Migration only once, then cache'),migrated.state,[versioned],1)
const fresh={sources:{[versioned.id]:{lastSuccessAt:'2026-10-01T10:00:00Z'}},documents:{}}
const discovered=await collectPublications(now,async url=>new Response(url===versioned.url?`<a href="${csaKey}">Analyse marché immobilier septembre 2026</a>`:csaHtml),fresh,[versioned],1)
assert.equal(discovered.observations[0].backfill,false,'A genuinely new document on a known source is not silenced by the parser version')
const json=JSON.parse(await fixture('insee-search.json'));json.numFounds=json.documents.length
const studies=await inseeDiscovery(JSON.stringify(json),INSEE_SEARCH,()=>assert.fail('No unbounded page'))
assert.ok(studies.some(r=>r.url.endsWith('/9087193')),'Salary study discovered from search, not from a saved article list')
assert.ok(studies.every(r=>!r.publishedAt),'Discovery hints do not replace the article’s publication date')
const foreign=parsePublication(await fixture('revolut-colombia.html'),PUBLICATION_SOURCES.find(s=>s.id==='revolut-news'),'https://www.revolut.com/fr-FR/news/colombia',now)
assert.match(foreign.rejected,/mention incidente/)
console.log('Radar depth: silent baselines, semantic changes, expiry, failure/recovery, durable receipts, CSA diffusion and INSEE discovery passed.')
