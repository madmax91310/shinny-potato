import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { COVERAGE_SOURCES, coverageDiscovery, coverageDate } from './lib/radar-coverage.mjs'
import { parsePublication, collectPublications, consolidateOfficialAnnouncements } from './lib/radar-publications.mjs'
import { CONSUMER_SOURCES, extractOfferConditions, semanticOfferFacts } from './lib/radar-consumer.mjs'
import { parseEtfDocument } from './lib/radar-news.mjs'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { editorialState, etfAnnouncement, groupSignals } from '../src/lib/radar-editorial.js'
import { planNotifications } from './lib/radar-notifications.mjs'
import { housingConventions, compatibleHousing } from '../src/lib/radar-housing.js'
const now=new Date('2026-10-25T12:00:00Z'),root=new URL('./fixtures/radar-coverage/',import.meta.url)
const manifest=JSON.parse(await readFile(new URL('manifest.json',root))), observations=[]
for(const example of manifest){
 const source=COVERAGE_SOURCES.find(s=>s.id===example.source),text=await readFile(new URL(source.id+'.txt',root),'utf8')
 const o=parsePublication(text,source,example.listing.url,now,example.listing)
 assert.equal(o.publishedAt,example.publishedAt);assert.equal(o.checkedAt,now.toISOString());assert.ok(o.evidence.sourceHash);observations.push(o)
 if(o.conditions)assert.equal(o.conditions.tauxNormal,null,'An absent normal rate is not filled from a promotional or unrelated rate')
}
const ca=observations.find(o=>o.publisher.startsWith('Crédit Agricole'))
assert.equal(ca.announcedProductCount,3);assert.equal(ca.products.length,0,'Names in an unreadable image are not invented')
assert.equal(editorialState({...ca,after:ca.value}),'ready','Explicit body proves a useful group announcement without fabricating product sheets')
assert.equal(editorialState({...ca,announcedProductCount:null,after:ca.value}),'watch')
for(const kind of ['merger','closure'])assert.equal(etfAnnouncement(kind==='merger'?'VanEck announces merger of two UCITS ETFs':'VanEck announces closure of a UCITS ETF').type,kind)
assert.equal(etfAnnouncement('VanEck announces additional listing of UCITS ETF').type,'listing')
assert.equal(etfAnnouncement('iShares ETF newly eligible for PEA').type,'characteristic-change')
assert.equal(coverageDate('Jun 26, 2025'),'2025-06-26');assert.throws(()=>coverageDate('31.02.2026'))
const bpce=COVERAGE_SOURCES.find(s=>s.id==='bpce-bank')
const cards='<h2 class="card-title"><a href="/actualites/first">Banque Populaire lance un compte</a></h2><span>21 octobre 2026</span><p class="card-text">Première annonce</p><h3 class="card-title"><a href="/actualites/second">Caisse d’Épargne annonce une offre régionale</a></h3><span>19 octobre 2026</span><p class="card-text">Seconde annonce</p>'
const discovered=await coverageDiscovery(cards,bpce,()=>assert.fail('No auxiliary request'))
assert.equal(discovered.length,2);assert.equal(discovered[0].title,'Banque Populaire lance un compte');assert.equal(discovered[0].publishedAt,'2026-10-21');assert.equal(discovered[1].publishedAt,'2026-10-19')
const lbp=COVERAGE_SOURCES.find(s=>s.id==='lbp-bank')
const pdfListing='<div class="o-newslist__push__content"><a href="/content/dam/lbp/documents/communiques-de-presse/2026/test.pdf"><h3>La Banque Postale lance une nouvelle épargne</h3></a><time>07/09/2026</time>'
const partial=await coverageDiscovery(pdfListing,lbp,async()=>new Response('down',{status:503}))
assert.equal(partial.length,1);assert.match(partial.archiveWarning,/503/,'First page remains usable, incomplete depth stays visible')
const grouped=parsePublication('<main><h1>Three new ETFs</h1><p>State Street launches three new ETFs in the US.</p></main>',COVERAGE_SOURCES.find(s=>s.id==='spdr-news'),'https://newsroom.statestreet.com/document',now,{title:'New ETFs',publishedAt:'2026-10-24'})
assert.match(grouped.rejected,/UCITS/)
const example=manifest.find(e=>e.source==='saxo-news'),source=COVERAGE_SOURCES.find(s=>s.id===example.source),url=example.listing.url
const text=await readFile(new URL(source.id+'.txt',root),'utf8')
const first=parsePublication(text,source,url,now,example.listing),presentation=parsePublication(text.replace(/<p>/g,'<p class="redesigned">'),source,url,now,example.listing)
assert.deepEqual(first.value,presentation.value)
assert.deepEqual(semanticOfferFacts('Versement de 100 euros pendant 3 mois.'),semanticOfferFacts('NOUVELLE PRÉSENTATION : pendant 3 mois, versement de 100 euros.'))
assert.notDeepEqual(semanticOfferFacts('Taux 3 %'),semanticOfferFacts('Taux 2 %'))
const conditions=extractOfferConditions('Offre réservée aux clients de la caisse régionale de Bretagne. Le taux promotionnel est de 4 % pendant 3 mois. Puis le taux normal est de 1 %. Versement minimum de 1 000 euros. Plafond de 10 000 euros.')
assert.match(conditions.pays,/Bretagne/);assert.match(conditions.tauxNormal,/1 %/);assert.match(conditions.tauxPromotionnel,/4 %/);assert.match(conditions.versement,/1 000/)
const rate=housingConventions('Nouveaux crédits : taux nominal hors assurance sur 20 ans, publication mensuelle pour les ménages résidents.')
assert.equal(rate.duration,'20 ans');assert.equal(rate.frequency,'monthly');assert.equal(rate.insurance,'assurance exclue')
assert.equal(housingConventions('Taux sur 20 ans et 25 ans').duration,null)
assert.equal(compatibleHousing(rate,{...rate,rateType:'TAEG'}),false)
const local=COVERAGE_SOURCES.find(s=>s.id==='bnp-bank'),doc=manifest.find(e=>e.source===local.id),body=await readFile(new URL(local.id+'.txt',root),'utf8')
const rss=`<rss><channel><item><title>${doc.listing.title}</title><link>${doc.listing.url}</link><pubDate>Wed, 09 Sep 2026 10:00:10 +0200</pubDate></item></channel></rss>`
let down=true
const request=async u=>new Response(u===local.url?rss:down?'down':body,{status:u!==local.url&&down?503:200,headers:{etag:'v1','content-type':'text/html'}})
const failed=await collectPublications(now,request,{},[local],1);assert.equal(failed.sources[0].queue.error,1)
down=false
const recovered=await collectPublications(new Date(+now+3*3600000),request,JSON.parse(JSON.stringify(failed.state)),[local],1)
assert.equal(recovered.observations.length,1);assert.equal(recovered.observations[0].backfill,true)
const baseline=advanceRadar(null,[],{now}),live=advanceRadar(baseline.state,recovered.observations,{now})
assert.equal(planNotifications(live.newEvents,{acknowledged:[]},now,'major').events.length,0)
assert.equal(planNotifications(live.newEvents,{acknowledged:[]},now,'daily').events.length,0)
const cached=await collectPublications(new Date(+now+3*3600000+1000),()=>assert.fail('Validated cache must be reused'),recovered.state,[local],1)
assert.equal(cached.state.documents[doc.listing.url].availableAt,recovered.state.documents[doc.listing.url].availableAt)
assert.equal(cached.state.documents[doc.listing.url].availabilityDelayHours,recovered.state.documents[doc.listing.url].availabilityDelayHours)
const unchanged=advanceRadar(live.state,cached.observations,{now});assert.equal(unchanged.newEvents.length,0);assert.deepEqual(unchanged.state.events.map(e=>e.id),live.state.events.map(e=>e.id))
assert.equal(groupSignals(live.feed.events.concat(live.feed.events),+now).length,groupSignals(live.feed.events,+now).length)
assert.throws(()=>parsePublication('<html><link rel="canonical" href="https://group.bnpparibas/wrong"></html>',local,doc.listing.url,now,doc.listing),/canonique/)
console.log('Coverage Radar: real bounded excerpts, separate dated cards, PDF listings, partial archive, national/regional clauses, unknown rates, semantic presentation guard, grouped ETF proof, US/UCITS rejection, housing conventions, persistence, outage recovery and silent migration verified. No notification sent.')

const primary={...ca,publicationId:'original',sourceUrl:'https://example.org/original',sources:[{url:'https://example.org/original',role:'official'}]},reproduction={...ca,publicationId:'copy',sourceUrl:'https://example.org/copy',sources:[{url:'https://example.org/copy',role:'official'}]}
const copies={documents:{a:{observation:primary,discoveredAt:'2026-10-23'},b:{observation:reproduction,discoveredAt:'2026-10-24'}}}
consolidateOfficialAnnouncements(copies);assert.equal(primary.eventKey,reproduction.eventKey);assert.equal(primary.sources.length,2)
const separate={...ca,label:ca.label+' obligataires',publicationId:'distinct'}
copies.documents.c={observation:separate};consolidateOfficialAnnouncements(copies);assert.equal(separate.eventKey,undefined)

const consumerEtf=parsePublication('<main><h1>Bourse Direct lance une nouvelle offre ETF</h1><p>Les clients particuliers peuvent accéder à une nouvelle offre ETF dans les conditions précisées par Bourse Direct dans cette annonce publiée pour les épargnants français.</p></main>',CONSUMER_SOURCES.find(s=>s.id==='bourse-direct-news'),'https://groupe.boursedirect.fr/etf',now,{title:'Bourse Direct lance une nouvelle offre ETF',publishedAt:'2026-10-24'})
assert.equal(consumerEtf.factType,'consumer-announcement','Existing consumer ETF news must not be misrouted into a statistical or issuer adapter')

const feeTitle='Invesco reduces fee on its MSCI World UCITS ETF to 0.05%, now the lowest-cost ETF for that exposure'
assert.equal(parseEtfDocument(feeTitle,feeTitle).announcementEvidence.type,'characteristic-change')
assert.equal(etfAnnouncement('VanEck announces delisting of UCITS ETFs on Euronext Milan').type,'delisting')

const previouslyRejected={sources:{[local.id]:{lastSuccessAt:'2026-10-24T00:00:00Z'}},documents:{[doc.listing.url]:{...doc.listing,publishedAt:'2026-09-09',source:local.id,status:'rejected',listingRejection:'Previously out of scope',listingRejected:true,discoveredAt:now.toISOString(),attempts:0,backfill:true}}}
const requalified=await collectPublications(now,request,previouslyRejected,[local],0)
assert.equal(requalified.state.documents[doc.listing.url].listingRejected,false,'A newly qualified listing must leave an obsolete rejection without losing its ID or backfill flag')
assert.equal(requalified.state.documents[doc.listing.url].status,'pending')

assert.equal(parseEtfDocument('<p>Amundi could announce the launch of three new ETFs.</p>','Amundi could launch three UCITS ETFs').announcedProductCount,null)

const differentParts={documents:{a:{observation:{...ca,products:[{isin:'IE00B4L5Y983'}]}},b:{observation:{...ca,products:[{isin:'IE00BK5BQT80'}]}}}}
consolidateOfficialAnnouncements(differentParts);assert.equal(differentParts.documents.a.observation.eventKey,undefined,'Different proven ISIN sets prevent an exact-headline collision')

assert.equal(housingConventions('Cette banque fête ses 20 ans et propose un versement mensuel.').duration,null)
assert.equal(housingConventions('Une mensualité et un versement mensuel').frequency,null,'Payment cadence does not prove statistical publication frequency')
// Historical simulation of a real document, on its next day: prove that backfill
// alone silences an otherwise admissible alert in an already initialized family.
const historicalNow=new Date('2026-09-10T12:00:00Z')
const wero=parsePublication(body,local,doc.listing.url,historicalNow,doc.listing)
const existing=advanceRadar(null,[{...wero,entity:'previous-bank-document',publicationId:'previous-bank-document'}],{now:historicalNow})
const fresh=advanceRadar(existing.state,[{...wero,backfill:false}],{now:historicalNow})
assert.equal(fresh.newEvents.length,1)
assert.equal(planNotifications(fresh.newEvents,{acknowledged:[]},historicalNow,'digest').events.length,0,'A rollout headline without sufficient client conditions is no longer automatically a priority alert')
const backfilled=advanceRadar(existing.state,[{...wero,backfill:true}],{now:historicalNow})
assert.equal(backfilled.newEvents.length,1,'History records the subject even when alerting is silenced')
for(const mode of ['major','digest'])assert.equal(planNotifications(backfilled.newEvents,{acknowledged:[]},historicalNow,mode).events.length,0)

// Structural reconciliation fixture: the title/body come from the captured real
// BNP release; this wrapper does not claim that a journalist published it.
const mediaSource=CONSUMER_SOURCES.find(s=>s.id==='moneyvox')
const linkedBody=body.replace('</main>',`<a href="${doc.listing.url}">Communiqué BNP Paribas</a></main>`)
const media=parsePublication(linkedBody,mediaSource,'https://www.moneyvox.fr/banque/reconciliation-fixture',now,doc.listing)
assert.ok(media.sources.some(s=>s.url===doc.listing.url&&s.role==='original-link-unverified'),'A newly qualified bank host can be retained as an explicit original, without being called confirmed')
const notDue=new Date(+now+3600000).toISOString()
const linkedSources={sources:Object.fromEntries([local,mediaSource].map(s=>[s.id,{lastSuccessAt:now.toISOString(),nextCheckAt:notDue,status:'ok'}])),documents:{[doc.listing.url]:{source:local.id,status:'done',discoveredAt:now.toISOString(),nextAttemptAt:notDue,observation:wero},[media.sourceUrl]:{source:mediaSource.id,status:'done',discoveredAt:now.toISOString(),nextAttemptAt:notDue,observation:media}}}
const reconciled=await collectPublications(now,()=>assert.fail('Persisted proof must not refetch'),linkedSources,[local,mediaSource],0)
assert.equal(reconciled.state.documents[media.sourceUrl].observation.eventKey,JSON.stringify([wero.family,wero.publicationId,wero.publishedAt]))
assert.ok(reconciled.state.documents[media.sourceUrl].observation.sources.some(s=>s.role==='official-original-extracted'))
assert.equal(ca.evidenceLevel,'official','Issuer publications carry the same explicit first-party level used by reconciliation')

const caOwner=COVERAGE_SOURCES.find(s=>s.id==='credit-agricole-news'),legacy=structuredClone(ca)
delete legacy.evidenceLevel;delete legacy.sources
const legacyState={sources:{[caOwner.id]:{lastSuccessAt:now.toISOString(),nextCheckAt:notDue,status:'ok'}},documents:{[legacy.sourceUrl]:{source:caOwner.id,status:'done',discoveredAt:now.toISOString(),nextAttemptAt:notDue,observation:legacy}}}
const upgraded=await collectPublications(now,()=>assert.fail('Retained official issuer proof must not be refetched'),legacyState,[caOwner],0)
assert.equal(upgraded.observations[0].evidenceLevel,'official');assert.equal(upgraded.observations[0].publishedAt,ca.publishedAt);assert.equal(upgraded.observations[0].checkedAt,ca.checkedAt);assert.equal(upgraded.observations[0].entity,ca.entity);assert.equal(upgraded.observations[0].evidence.sourceHash,ca.evidence.sourceHash)

const unrelated=parsePublication(linkedBody.replace(doc.listing.url,'https://unknown.invalid/article'),mediaSource,'https://www.moneyvox.fr/banque/reconciliation-fixture',now,doc.listing)
assert.ok(!unrelated.sources.some(s=>s.url.includes('unknown.invalid')),'An unregistered domain cannot become an original or confirmation')

// Synthetic parser contract only, never discovered or published as a real story:
// a broker's new ETF dealing service is not the creation of an ETF.
const bankEtfTitle='Saxo Banque lance une nouvelle offre de courtage ETF'
const bankEtf=parsePublication(`<main><h1>${bankEtfTitle}</h1><p>Les clients particuliers concernés accèdent à une nouvelle offre de courtage ETF selon les conditions décrites dans le communiqué. Cette offre de services concerne les investisseurs français.</p></main>`,COVERAGE_SOURCES.find(s=>s.id==='saxo-news'),'https://www.home.saxo/fr-fr/contract-fixture',now,{title:bankEtfTitle,publishedAt:'2026-10-24'})
assert.equal(bankEtf.family,'pouvoir-achat');assert.equal(bankEtf.factType,'consumer-announcement');assert.equal(bankEtf.announcementEvidence,undefined)
assert.equal(ca.family,'etf','The explicitly identified Amundi issuer relay keeps its proved group announcement')

const bnpIssuerTitle='BNP Paribas Asset Management lance de nouveaux ETF UCITS'
const issuerRelay=parsePublication(`<main><h1>${bnpIssuerTitle}</h1><p>BNP Paribas Asset Management lance de nouveaux ETF UCITS. BNP Paribas Easy World UCITS ETF.</p></main>`,local,'https://group.bnpparibas/communique-de-presse/contract-fixture',now,{title:bnpIssuerTitle,publishedAt:'2026-10-24'})
assert.equal(issuerRelay.family,'etf','A clearly named asset-management issuer can be relayed by its group without turning brokerage offers into fund creations')
