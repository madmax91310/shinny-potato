import './test-radar-requalification-queue.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { extraDiscovery,EXTRA_SOURCES } from './lib/radar-extra-sources.mjs'
import { planPublicationQueue,documentDelays,queueClass } from './lib/radar-queue.mjs'
import { recordRadarRun } from './lib/radar-run-metrics.mjs'
import { editorialExclusion,editorialTopic } from '../src/lib/radar-policy.js'
import { qualifyRadarFact } from '../src/lib/radar-qualification.js'
import { editorialState,editorialAssessment,groupSignals,recentEditorial } from '../src/lib/radar-editorial.js'
import { extractProducts,parseEtfDocument } from './lib/radar-news.mjs'
import { etfTableProducts } from './lib/radar-etf-table.mjs'
import { OFFER_SOURCES,offerSnapshot,compareOfferSnapshots,offerDiscovery,offerDates } from './lib/radar-offer-watch.mjs'
import { inseeDiscovery,INSEE_SEARCH,inseeQuery } from './lib/radar-insee-search.mjs'
import { collectPublications,PUBLICATION_SOURCES } from './lib/radar-publications.mjs'
import { relatePublications } from './lib/radar-relationships.mjs'
import { parseConsumer,CONSUMER_SOURCES } from './lib/radar-consumer.mjs'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { planNotifications } from './lib/radar-notifications.mjs'
const now=new Date('2026-10-25T16:00:00Z'),before=new Date(+now-3*3600000)
const fixture=n=>readFile(new URL(`./fixtures/radar-audit/${n}`,import.meta.url),'utf8')
const sources=[{id:'news'},{id:'archive-a'},{id:'archive-b'}]
const archives=Array.from({length:100},(_,i)=>[`archive-${i}`,{source:i%2?'archive-a':'archive-b',title:'Rapport archivé',discoveredAt:'2026-10-24T10:00:00Z',attempts:0,status:'pending',backfill:true}])
const recent=[['agios',{source:'news',title:'La Banque Postale : disparition des frais d’agios',publishedAt:'2026-10-24',discoveredAt:now.toISOString(),attempts:0,status:'pending'}],['salary',{source:'news',title:'Les salaires des Français en 2025',publishedAt:'2026-10-24',discoveredAt:now.toISOString(),attempts:0,status:'pending'}]]
const plan=planPublicationQueue([...archives,...recent],sources,now,{},6)
assert.equal(planPublicationQueue([...archives,...recent],sources,now,{},0).chosen.length,0,'A cache-only pass must respect an explicit zero budget')
assert.ok(recent.every(([key])=>plan.chosen.some(([u])=>u===key)),'Recent first attempts pass the backlog on the next admitted pass')
assert.ok(plan.chosen.some(([,d])=>d.source==='archive-a')&&plan.chosen.some(([,d])=>d.source==='archive-b'))
const originalPending=new Set(archives.map(([u])=>u));let progress={}
for(let i=0;i<60;i++){
 const burst=Array.from({length:6},(_,j)=>[`new-${i}-${j}`,{...recent[0][1],discoveredAt:new Date(+now+i*1800000).toISOString(),publishedAt:new Date(+now+i*1800000).toISOString().slice(0,10)}])
 const p=planPublicationQueue([...archives.filter(([u])=>originalPending.has(u)),...burst],sources,new Date(+now+i*1800000),progress,6)
 for(const[u]of p.chosen)originalPending.delete(u)
 progress={queuePass:i+1,nextSourceIndex:(i+1)%3}
}
assert.equal(originalPending.size,0,'Sustained new arrivals never starve the stored archives')
assert.ok(planPublicationQueue(archives,sources,now,{documentDurationsMs:[25000]},undefined).limit<planPublicationQueue(archives,sources,now,{documentDurationsMs:[1000]},undefined).limit,'Admission responds to measured document cost')
const oneA=planPublicationQueue([...recent,archives[0]],sources,now,{queuePass:2},1)
assert.equal(oneA.chosen[0][1].source,'archive-b','Even a one-document envelope reserves aging progress')
assert.equal(queueClass({...recent[0][1],attemptedAt:before.toISOString()},now),'recheck')
assert.equal(documentDelays({publishedAt:'2026-10-24',discoveredAt:now.toISOString()}).publicationToDetectionHours,null)
assert.equal(documentDelays({source:'insee-studies',hint:'2026-10-24T00:00:00Z',discoveredAt:now.toISOString(),observation:{publishedAt:'2026-10-24'}}).publicationToDetectionHours,null)
assert.equal(documentDelays({publishedAt:'Thu, 22 Oct 2026 17:18:00 +0200',discoveredAt:'2026-10-22T15:30:00Z',firstAttemptAt:'2026-10-22T15:31:00Z',availableAt:'2026-10-22T15:32:00Z',observation:{publishedAt:'2026-10-22'}}).detectionToFirstAttemptHours,1/60)
let run=recordRadarRun({}, {eventName:'push',runId:'push'},now);assert.equal(run.scheduledRuns.length,0)
run=recordRadarRun(run,{eventName:'schedule',runId:'schedule',createdAt:'2026-10-25T15:37:00Z',startedAt:'2026-10-25T15:41:00Z',sourceRevision:'verified'},now)
assert.equal(run.lastScheduledRun.workflowQueueSeconds,240);assert.equal(run.lastScheduledRun.triggerDelaySeconds,null)
assert.equal(recordRadarRun(run,{eventName:'workflow_dispatch',runId:'manual'},now).scheduledRuns.length,1)
assert.equal(editorialExclusion({label:'Des taux jusqu’à 4 % avant impôt : quel compte à terme ?'}),null)
assert.ok(editorialExclusion({label:'Impôts : le nouveau barème, avant impôt et après impôt'}))
for(const label of ['APL : nouvelles aides au logement','Prestations sociales : nouveau calendrier','Fiscalité du compte à terme'])assert.ok(editorialExclusion({label}))
assert.equal(editorialTopic('Le minimum forfaitaire d’agios disparaît'),'frais')
assert.equal(editorialTopic('Crise du pouvoir d’achat : les comportements des Français face aux risques'),'statistiques')
const base={id:'a'.repeat(24),family:'pouvoir-achat',field:'announcement',entity:'case',label:'Les taux du crédit immobilier augmentent',after:'taux observé',summary:'Les nouveaux crédits immobiliers des ménages français ont un taux moyen observé de 3,40 % en septembre 2026.',scope:'France, nouveaux crédits',period:'2026-10-25',publishedAt:'2026-10-25',detectedAt:now.toISOString(),checkedAt:now.toISOString(),evidenceLevel:'official',populationScope:'Ménages emprunteurs',sourceUrl:'https://www.banque-france.fr/credit',publicationId:'https://www.banque-france.fr/credit',factType:'consumer-announcement',status:'Annonce publiée',evidence:{sourceHash:'a'.repeat(64),excerpt:'Taux observés des nouveaux crédits immobiliers des ménages : 3,40 %.'}}
const forecast={...base,label:'Crédit immobilier : les nouveaux taux attendus sur 20 et 25 ans d’ici décembre',summary:'Un courtier prévoit une hausse des taux pour les ménages en décembre.'}
assert.equal(editorialState(forecast,+now),'watch');assert.ok(editorialAssessment(forecast,+now).score<editorialAssessment(base,+now).score)
const promoters={...base,family:'economie',factType:'statistical-publication',label:'Les perspectives de mises en chantier baissent dans la promotion immobilière'}
assert.equal(qualifyRadarFact(promoters).audience,'professional');assert.equal(editorialState(promoters,+now),'watch')
assert.equal(editorialState({...base,label:'Le prêt à taux zéro Bpifrance pour les commerçants',summary:'Financement de la trésorerie des entreprises.'},+now),'excluded')
assert.equal(editorialState({...base,label:'Le PTZ immobilier des primo-accédants',summary:'Financement du logement des particuliers.'},+now),'watch','Le PTZ reste dans le périmètre, mais un libellé générique sans chiffre ni changement ne suffit pas')
const survey={...base,label:'Baromètre des difficultés des Français à épargner',summary:'Selon cette enquête, 28 % des personnes interrogées prévoient de réduire leur épargne ; 2 000 adultes en France métropolitaine.',topic:'statistiques'}
assert.equal(qualifyRadarFact(survey).nature,'household-intentions');assert.equal(editorialState(survey,+now),'ready');assert.ok(!editorialAssessment(survey,+now).major)
assert.equal(recentEditorial({...base,publishedAt:'2026-06-01'},+now),false,'Fresh collection never rejuvenates an archive')
const venue=EXTRA_SOURCES.find(s=>s.id==='xetra')
const datedCard=await extraDiscovery('<a href="'+venue.url+'/New-ETF-listings">Oct 21, 2026 08:00:00 AM CEST News | Deutsche Börse New ETF listings</a>',venue,()=>assert.fail('No request'))
assert.equal(datedCard[0].publishedAt,'2026-10-21');assert.equal(datedCard[0].publishedInstant,'2026-10-21T08:00:00+02:00')
for(const date of ['21','16']){
 const text=await fixture(`xetra-2026-10-${date}.html`),parsed=etfTableProducts(text),products=extractProducts(text)
 assert.equal(parsed.extraction.status,'complete');assert.equal(products.length,6);assert.ok(products.every(p=>p.isin&&p.fees!==null&&p.pea===null&&p.availability===null))
 if(date==='21')assert.deepEqual(products.filter(p=>p.name.startsWith('Fidelity')).map(p=>p.fees),['0.500%','0.500%'])
 else for(const issuer of ['L&G','UniActive','Janus Henderson','iShares'])assert.ok(products.some(p=>p.name.startsWith(issuer)))
}
const malformed=(await fixture('xetra-2026-10-21.html')).replace('IE0001Y8K1A5','ISIN absent')
assert.equal(etfTableProducts(malformed).extraction.status,'partial');assert.equal(etfTableProducts(malformed).extraction.unparsedRows.length,1)
const partialSource={...PUBLICATION_SOURCES.find(s=>s.id==='xetra'),method:'links',url:'https://www.cashmarket.deutsche-boerse.com/news'}
const partialUrl='https://www.cashmarket.deutsche-boerse.com/partial-case'
const partialState={sources:{xetra:{lastSuccessAt:now.toISOString(),nextCheckAt:new Date(+now+12*3600000).toISOString()}},documents:{[partialUrl]:{url:partialUrl,source:'xetra',title:'New ETF Listings',status:'pending',attempts:0,discoveredAt:now.toISOString(),backfill:true}}}
const dated=body=>body.replace('<html>','<html><meta property="article:published_time" content="2026-10-21">')
const partial=await collectPublications(now,async()=>new Response(dated(malformed)),partialState,[partialSource],1)
assert.equal(partial.state.documents[partialUrl].status,'partial','Unexploited rows are not marked done')
assert.equal(partial.metrics.queue.recentFirstAttempted,0,'A row without a proved listing date cannot receive the recent-publication label')
const resumed=await collectPublications(new Date(+now+3*3600000),async()=>new Response(dated(await fixture('xetra-2026-10-21.html'))),partial.state,[partialSource],1)
assert.equal(resumed.state.documents[partialUrl].status,'done');assert.equal(resumed.observations[0].products.length,6);assert.ok(resumed.state.documents[partialUrl].recoveredAt)
const rawPdf=parseEtfDocument(await fixture('amundi-active-table.txt'),'Amundi élargit sa gamme ETF');assert.equal(rawPdf.products.length,3);assert.ok(rawPdf.products.every(p=>p.fees==='0.25%'&&p.feesBasis))
const incompleteAgain=structuredClone(resumed.state)
incompleteAgain.sources.xetra.nextCheckAt=new Date(+now+20*86400000).toISOString()
incompleteAgain.documents[partialUrl].nextAttemptAt=now.toISOString()
const retainedComplete=await collectPublications(new Date(+now+6*3600000),async()=>new Response(dated(malformed)),incompleteAgain,[partialSource],1)
assert.equal(retainedComplete.state.documents[partialUrl].status,'partial')
assert.equal(retainedComplete.state.documents[partialUrl].partialCandidate.products.length,5)
assert.equal(retainedComplete.observations[0].products.length,6,'The complete prior extraction is retained separately from a partial new candidate')
assert.equal(retainedComplete.observations[0].checkedAt,resumed.observations[0].checkedAt,'An incomplete new extraction never rejuvenates the last proof')
const pdf=JSON.parse(await fixture('amundi-supporting.json'))
assert.equal(pdf.products.length,3);assert.ok(pdf.products.every(p=>p.fees==='0.25%'&&p.pea===null&&p.availability===null))
const unknown='<table><tr><td>Name</td><td>ISIN</td><td>Asset class</td><td>TER</td></tr><tr><td>Unregistered Issuer World UCITS ETF</td><td>IE0001Y8K1A5</td><td>Active Equity ETF</td><td>0.15%</td></tr><tr><td>Issuer Gold ETC</td><td>IE000W2FBY21</td><td>ETC</td><td>0.45%</td></tr></table>'
assert.equal(extractProducts(unknown)[0].name,'Unregistered Issuer World UCITS ETF');assert.equal(etfTableProducts(unknown).extraction.excludedRows.length,1)
const source=OFFER_SOURCES[0],text='Conditions tarifaires au 6 août 2026\nCarte Gold : frais annuels 0 euros\nCarte Gold : frais de retrait 1 euro\nCarte Gold : frais de change 2 euros\nCarte Gold : versement minimum 300 euros\nCarte Gold : plafond de retrait 400 euros'
const initial=offerSnapshot(text,source,before),edited=offerSnapshot(text.replace('1 euro','2 euros'),source,now)
assert.equal(compareOfferSnapshots(initial,edited,source,source.url).changeEvidence.changes[0].product,'Gold CB Mastercard')
const added=offerSnapshot(text+'\nCarte Gold : frais de remplacement 10 euros',source,now)
assert.equal(compareOfferSnapshots(initial,added,source,source.url).changeEvidence.changes[0].type,'added')
const missing=offerSnapshot(text.replace('Carte Gold : frais de change 2 euros\n',''),source,now)
assert.equal(compareOfferSnapshots(initial,missing,source,source.url),null,'Missing extraction alone never proves removal')
const removed=offerSnapshot(text.replace('Carte Gold : frais de change 2 euros','Carte Gold : frais de change supprimés, tarif 0 euro'),source,now)
assert.ok(compareOfferSnapshots(initial,removed,source,source.url).changeEvidence.changes.some(c=>c.type==='withdrawn'))
const frequency=offerSnapshot(text.replace('frais annuels 0 euros','frais annuels 0 euros par mois'),source,before),annual=offerSnapshot(text.replace('frais annuels 0 euros','frais annuels 0 euros par an'),source,now)
assert.ok(compareOfferSnapshots(frequency,annual,source,source.url),'A changed calculation basis is a fact, not presentation')
const reordered=offerSnapshot(text.split('\n').reverse().join('\n'),source,now);assert.equal(compareOfferSnapshots(initial,reordered,source,source.url),null)
const reformatted=offerSnapshot(text.replace(/ : /g,'  :   '),source,now);assert.equal(compareOfferSnapshots(initial,reformatted,source,source.url),null)
assert.equal(compareOfferSnapshots({...initial,semanticVersion:undefined},edited,source,source.url),null,'Old parser references migrate silently')
const lbp=OFFER_SOURCES.find(s=>s.id==='lbp-tariffs'),lbpLinks=offerDiscovery('<a href="/content/dam/lbp/documents/tarifs/2027/tarifs-particuliers-2027.pdf">Tarifs particuliers 2027</a><a href="/content/dam/lbp/documents/tarifs/2027/tarifs-outre-mer-2027.pdf">Tarifs DOM 2027</a>',lbp)
assert.equal(lbpLinks.length,2);assert.notEqual(lbpLinks[0].referenceKey,lbpLinks[1].referenceKey)
assert.equal(offerDates('Tarifs au 1er janvier 2027').effectiveAt,'2027-01-01')
const initialEditions=await collectPublications(now,async requested=>new Response(requested===lbp.url?'<a href="/content/dam/lbp/documents/tarifs/2026/tarifs-particuliers-2026.pdf">Tarifs particuliers 2026</a><a href="/content/dam/lbp/documents/tarifs/2027/tarifs-particuliers-2027.pdf">Tarifs particuliers 2027</a>':requested.includes('/2027/')?text.replace('Carte Gold : frais de change 2 euros\n',''):text),{},[lbp],2)
assert.equal(initialEditions.observations.length,0,'A cold inventory of two annual editions is silent, not a change between two observations')
assert.equal(initialEditions.sources[0].silentBaselines,2);assert.equal(initialEditions.sources[0].queue.partial,0,'First independent editions are baselines, not extraction omissions')
let calls=0
const primary=PUBLICATION_SOURCES.find(s=>s.id==='insee-publications'),url='https://www.insee.fr/fr/statistiques/9087193'
const salaryHtml=await readFile(new URL('./fixtures/radar-publications/insee.html',import.meta.url),'utf8')
const prior={sources:{[primary.id]:{lastSuccessAt:before.toISOString(),nextCheckAt:new Date(+now+3600000).toISOString()}},documents:{[url]:{url,title:'Les salaires dans le secteur privé en 2025',publishedAt:'2026-10-22',source:primary.id,status:'pending',attempts:0,discoveredAt:before.toISOString(),backfill:true}}}
const failed=await collectPublications(now,async()=>{throw Error('503')},prior,[primary],1);assert.equal(failed.state.documents[url].status,'error')
const recovered=await collectPublications(new Date(+now+3*3600000),async requested=>{if(requested===primary.url)return new Response(null,{status:304});calls++;return new Response(salaryHtml)},failed.state,[primary],1);assert.ok(recovered.observations.length);assert.equal(calls,1);assert.ok(recovered.state.documents[url].recoveredAt)
const cat5={status:0,numFounds:1,documents:[{id:8996928,titre:'Pouvoir d’achat, inégalités de revenu et pauvreté',chapo:'Situation des ménages français',dateDiffusion:'2026-10-15T10:00:00Z',type:'statistiques',diffusion:false,famille:{categorie:{id:5},libelleFr:'Chiffres détaillés'}}]}
const discovered=await inseeDiscovery(JSON.stringify(cat5),INSEE_SEARCH,async()=>new Response(JSON.stringify(cat5)))
assert.ok(discovered.some(r=>r.url.endsWith('8996928')));assert.deepEqual(inseeQuery(0).filters[0].values,[12,5])
const official={...base,family:'economie',label:'Les salaires dans le secteur privé en 2025',factType:'statistical-publication',sourceUrl:url,publicationId:url,publishedAt:'2026-10-22',referencePeriod:'2025',evidence:{sourceHash:'b'.repeat(64),excerpt:'En 2025, salaire médian 2 238 euros nets par mois en EQTP ; seuil des 10 % : 4 441 euros.'},summary:'En 2025, salaire médian 2 238 euros nets par mois en EQTP ; seuil des 10 % : 4 441 euros.'}
const relay={...base,label:'Salaire net : les nouveaux chiffres de l’Insee',evidenceLevel:'journalistic',publishedAt:'2026-10-22',sourceUrl:'https://www.moneyvox.fr/salaires',publicationId:'https://www.moneyvox.fr/salaires',summary:'Selon l’étude INSEE publiée le 22 octobre 2026, le salaire médian atteint 2 238 euros nets par mois en 2025 ; les 10 % : 4 441 euros.',sources:[]}
const state={documents:{official:{observation:official},relay:{observation:relay}}};relatePublications(state)
assert.ok(relay.relationship);const grouped=groupSignals([{...official,id:'1'.repeat(24)},{...relay,id:'2'.repeat(24)}],+now)
assert.equal(grouped.length,1);assert.equal(grouped[0].event.sourceUrl,url)
const distinct={...relay,label:'Notre analyse : comment comparer son salaire',eventKey:undefined,dossierKey:undefined,relationship:undefined};const distinctState={documents:{a:{observation:official},b:{observation:distinct}}};relatePublications(distinctState);assert.equal(distinct.relationship,undefined)
const csa={...official,sourceUrl:'https://lobservatoire.creditlogement.fr/septembre',publicationId:'https://lobservatoire.creditlogement.fr/septembre',referencePeriod:'2026-09'}
assert.equal(groupSignals([{...csa,id:'3'.repeat(24),publishedAt:null,factType:'publication-watch'},{...csa,id:'4'.repeat(24)}],+now).length,1)
assert.equal(groupSignals([{...csa,id:'3'.repeat(24),correctionOf:csa.publicationId},{...csa,id:'4'.repeat(24)}],+now).length,2)
const announcement={...base,family:'etf',sourceUrl:'https://presse.credit-agricole.com/annonce',publicationId:'https://presse.credit-agricole.com/annonce',publishedAt:'2026-10-23',products:pdf.products,announcementEvidence:pdf.announcementEvidence,documentHash:'a'.repeat(64)}
const listing={...base,family:'etf',publisher:'Deutsche Börse / Xetra',sourceUrl:'https://www.cashmarket.deutsche-boerse.com/listing',publicationId:'https://www.cashmarket.deutsche-boerse.com/listing',publishedAt:'2026-10-21',products:extractProducts(await fixture('xetra-2026-10-21.html')),announcementEvidence:{type:'trading',stage:'trading'},documentHash:'b'.repeat(64)}
const stages={documents:{announcement:{observation:announcement},listing:{observation:listing}}};relatePublications(stages)
assert.ok(listing.productDossiers?.length);assert.equal(listing.dossierKey,undefined,'Mixed bulletin also carries Fidelity/Ossiam and stays separate')
const different={...listing,sourceUrl:'https://other.test/listing',publicationId:'https://other.test/listing',publisher:'London Stock Exchange',productDossiers:undefined,dossierKey:undefined}
relatePublications({documents:{announcement:{observation:announcement},different:{observation:different}}});assert.equal(different.productDossiers,undefined,'A venue not documented in the issuer announcement is not linked by ISIN alone')
const newerAnalysis={...listing,products:[listing.products[0]],productDossiers:undefined,dossierKey:undefined}
relatePublications({documents:{announcement:{observation:announcement},analysis:{observation:newerAnalysis}}});assert.equal(newerAnalysis.productDossiers,undefined,'One common product never establishes the whole event')
const media=CONSUMER_SOURCES.find(s=>s.id==='moneyvox')
const parsed=parseConsumer('<html><nav><a href="https://www.insee.fr/fr/statistiques/irrelevant">Offre</a></nav><article><h1>Salaire net : les nouveaux chiffres de l’Insee</h1><meta property="article:published_time" content="2026-10-22T15:00:00Z"><div class="article-body"><p>Selon la publication <a href="'+url+'">Les salaires dans le secteur privé</a>, le salaire médian est de 2 238 euros nets par mois en EQTP en 2025 ; les 10 % gagnent plus de 4 441 euros.</p></div></article></html>',media,relay.sourceUrl,now)
assert.ok(parsed.sources.some(r=>r.url===url));assert.ok(parsed.sources.every(r=>!r.url.includes('irrelevant')))
const init=advanceRadar(null,[official],{now}),history=structuredClone(init.state)
history.events=[{...official,id:'5'.repeat(24),after:official.summary,kind:'new',backfill:true}]
const upgraded=advanceRadar(history,[{...official,parserMigration:true}],{now});assert.ok(upgraded.state.events.some(e=>e.id==='5'.repeat(24)))
assert.equal(planNotifications(upgraded.state.events,{acknowledged:[]},now,'digest').events.length,0,'Requalification of archives never generates a retrospective alert')
console.log('Radar audit fixes: measured queue, fairness, time precision, scope/forecast qualification, all Xetra rows, semantic clauses, INSEE dossiers, proof grouping and quiet migrations passed. No notification sent.')
