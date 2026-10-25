import assert from 'node:assert/strict'
import { readFile,mkdir,writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { PUBLICATION_SOURCES,parsePublication } from './lib/radar-publications.mjs'
import { parseEtfDocument } from './lib/radar-news.mjs'
import { CONSUMER_SOURCES,parseConsumer } from './lib/radar-consumer.mjs'
import { relatePublications } from './lib/radar-relationships.mjs'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { editorialState,editorialAssessment,groupSignals } from '../src/lib/radar-editorial.js'
import { consumerRejection } from './lib/radar-consumer.mjs'
import { planNotifications } from './lib/radar-notifications.mjs'
import { planPublicationQueue } from './lib/radar-queue.mjs'
const fixture=async name=>readFile(new URL(`./fixtures/radar-audit/${name}`,import.meta.url),'utf8')
const baseline=JSON.parse(await fixture('audit-baseline.json')),cases=JSON.parse(await fixture('audit-sample.json')),receipts=JSON.parse(await fixture('audit-receipts.json'))
const output=resolve(process.argv[2]??'/tmp/radar-audit-replay'),now=new Date('2026-10-25T16:00:00Z'),state=structuredClone(baseline.publications)
await mkdir(output,{recursive:true})
for(const day of ['21','16']){
 const document=Object.values(state.documents).find(d=>d.url.includes(`October-${day}-2026`))
 const parsed=parseEtfDocument(await fixture(`xetra-2026-10-${day}.html`),document.observation.label)
 document.observation={...document.observation,products:parsed.products,extraction:parsed.extraction,parserMigration:true}
}
const inseeSource=PUBLICATION_SOURCES.find(s=>s.id==='insee-publications'),dossierUrl='https://www.insee.fr/fr/statistiques/8996928'
const dossier=parsePublication(await fixture('insee-8996928.html'),inseeSource,dossierUrl,now)
state.documents[dossierUrl]={url:dossierUrl,source:'insee-studies',status:'done',observation:{...dossier,parserMigration:true,backfill:true}}
const bpce=Object.values(state.documents).find(d=>d.url.includes('crise-du-pouvoir-d-achat'))
bpce.observation={...parseConsumer(await fixture('bpce-survey.html'),PUBLICATION_SOURCES.find(s=>s.id==='bpce-bank'),bpce.url,now),parserMigration:true,backfill:true}
const media=Object.values(state.documents).find(d=>d.url.includes('110944'))
media.observation={...parseConsumer(await fixture('salary-media.html'),CONSUMER_SOURCES.find(s=>s.id==='moneyvox'),media.url,now),parserMigration:true,backfill:true}
try{
 const supporting=JSON.parse(await fixture('amundi-supporting.json'))
 const announcement=Object.values(state.documents).find(d=>d.url.includes('amundi-elargit'))
 announcement.observation={...announcement.observation,...supporting,parserMigration:true,backfill:true}
}catch(error){if(error.code!=='ENOENT')throw error}
relatePublications(state)
const observations=Object.values(state.documents).flatMap(d=>d.observation?[d.observation]:[])
const original=advanceRadar(null,Object.values(baseline.publications.documents).flatMap(d=>d.observation?[d.observation]:[]),{now}).state
original.events=structuredClone([...baseline.events,...JSON.parse(await fixture('audit-controls.json'))])
const result=advanceRadar(original,observations,{now,sourceRevision:'audit-fixes-replay-not-deployed'})
const groups=groupSignals(result.feed.events,+now),hash=value=>createHash('sha256').update(value).digest('hex')
const notes={B01:'Référence officielle des tarifs LBP 2027 qualifiée en collecte locale réelle ; première observation silencieuse. Article historique non découvert par ce raccordement.',B02:'Restitué, classé Frais. Priorité de première extraction vérifiée dans le scénario de file ; aucune mesure de production après déploiement.',B03:'Inchangé : N26 non raccordé et article hors du RSS courant.',B04:'Inchangé pour l’incident initial ; reprise préexistante à traiter. Aucune réactivation d’un incident résolu.',B05:'Inchangé : offre expirée avant activation ; aucune alerte rétrospective.',B07:`Qualification corrigée : ${consumerRejection('Des taux jusqu’à 4% avant impôt : quelle banque propose le meilleur compte à terme sans risque ?')??'titre admissible'}. Découverte historique toujours absente.`,B08:'Rejet corrigé, enquête de ménages admissible ; intentions et perceptions distinctes d’un changement effectif.',S01:'Original INSEE et reprise attribuée dans un dossier, original comme preuve principale ; IDs conservés.',S02:'Maintenu, dates et période préservées ; pas de nouvelle notification.',S03:'Maintenu, dates et périmètres préservés ; pas de nouvelle notification.',S04:'Dossier extrait en rejeu ; découverte depuis l’API et extraction également vérifiées dans la qualification réseau séparée.',I01:'Versions à suivre/enrichie regroupées par publication et période ; première mise en ligne reste incertaine, hors dénominateur.',I02:'Inchangé : source non raccordée, aucune extension générale.',E01:'Trois produits groupés, dates et inconnues préservées.',E02:'Complément PDF officiel pour nommer la gamme et relier la cotation Xetra ; étapes distinctes et bulletin mixte conservé.',E03:'Inchangé : communiqué primaire Franklin non raccordé.',E04:'Six lignes structurées ; deux Fidelity et Ossiam restitués, champs par ligne, cotation distincte du lancement.',E05:'Six lignes structurées ; L&G, deux UniActive, Janus Henderson et deux iShares ; inconnues préservées.',B09:'Maintenu : extension PEA distincte du lancement d’un PEA, archive silencieuse.',E06:'Maintenu : cotation Global X, sans disponibilité courtier déduite.'}
const normalize=url=>url.replace('https://cashmarket.','https://www.cashmarket.').replace(/\/$/,'')
const rows=cases.map(c=>{
 let relevant=result.feed.events.filter(e=>normalize(e.sourceUrl??'')===normalize(c.source))
 if(c.id==='B08')relevant=result.feed.events.filter(e=>e.sourceUrl.includes('crise-du-pouvoir-d-achat'))
 return {id:c.id,title:c.titre,source:c.source,publication:c.publication,inDenominator:c.dans_denominateur==='oui',before:c.resultat,after:notes[c.id],events:relevant.map(e=>({id:e.id,state:editorialState(e,+now),score:editorialAssessment(e,+now).score,nature:editorialAssessment(e,+now).qualification.nature,products:e.products?.length,topic:e.topic,publishedAt:e.publishedAt})),groups:groups.filter(g=>g.events.some(e=>relevant.some(r=>r.id===e.id))).map(g=>({primary:g.event.sourceUrl,eventIds:g.events.map(e=>e.id),relatedStages:g.relatedStages}))}
})
// Representative stock using the audit source proportions. This measures order
// in passes, not a promise of real GitHub timing or a new historical detection.
const counts=[['amf',139],['amundi',50],['insee',38],['invesco',24],['moneyvox',10]],queueSources=counts.map(([id])=>({id}))
const stock=counts.flatMap(([source,n])=>Array.from({length:n},(_,i)=>[source+i,{source,title:'Archive à qualifier',publishedAt:'2026-06-01',discoveredAt:'2026-10-25T14:00:00Z',attempts:0,status:'pending'}]))
stock.push(['agios',{source:'moneyvox',title:'La Banque Postale : suppression des frais d’agios',publishedAt:'2026-10-22',discoveredAt:'2026-10-25T05:55:01Z',attempts:0,status:'pending'}])
function passes(planner){let docs=structuredClone(stock),cursor=0;for(let pass=1;pass<=100;pass++){const choice=planner(docs,cursor,pass);if(choice.some(([u])=>u==='agios'))return pass;const chosen=new Set(choice.map(([u])=>u));docs=docs.filter(([u])=>!chosen.has(u));cursor=(queueSources.findIndex(s=>s.id===choice.at(-1)?.[1].source)+1)%queueSources.length}return null}
const legacy=(docs,cursor)=>{const ordered=[...queueSources.slice(cursor),...queueSources.slice(0,cursor)],sorted=[...docs].sort((a,b)=>b[1].discoveredAt.localeCompare(a[1].discoveredAt)),queues=ordered.map(s=>sorted.filter(([,d])=>d.source===s.id)),chosen=[];while(chosen.length<12&&queues.some(q=>q.length))for(const q of queues)if(q.length&&chosen.length<12)chosen.push(q.shift());return chosen}
const queue={mode:'simulation, representative source stock, same 12-document envelope',documents:stock.length,oldFirstAttemptPass:passes(legacy),newFirstAttemptPass:passes((docs,cursor,pass)=>planPublicationQueue(docs,queueSources,now,{nextSourceIndex:cursor,queuePass:pass},12).chosen),publication:'2026-10-22',observation:'No network and no fictitious editorial notification; elapsed workflow time is not simulated.'}
const notificationPlans=Object.fromEntries(['major','digest'].map(mode=>{const p=planNotifications(result.state.events,receipts,now,mode);return[mode,{events:p.events.map(e=>e.id),pending:p.pending}]}))
const retainedIds=baseline.events.every(e=>result.state.events.some(row=>row.id===e.id))
assert.equal(retainedIds,true,'All historical event IDs survive requalification')
assert.equal(notificationPlans.major.events.length,0);assert.equal(notificationPlans.digest.events.length,0)
assert.equal(rows.find(r=>r.id==='S01').groups.length,1)
assert.ok(rows.find(r=>r.id==='S01').groups[0].primary.startsWith('https://www.insee.fr/'))
assert.equal(rows.find(r=>r.id==='B02').events[0].topic,'frais')
assert.equal(rows.find(r=>r.id==='B08').events[0].state,'ready')
assert.equal(rows.find(r=>r.id==='S04').events[0].state,'ready')
assert.ok(['E04','E05'].every(id=>rows.find(r=>r.id===id).events.some(e=>e.products===6)))
assert.ok(rows.find(r=>r.id==='E02').groups.some(g=>g.relatedStages.length>0))
assert.equal(rows.find(r=>r.id==='I01').groups.length,1)
assert.equal(queue.newFirstAttemptPass,1);assert.ok(queue.oldFirstAttemptPass>queue.newFirstAttemptPass)
await writeFile(resolve(output,'report.json'),JSON.stringify({mode:'captured-document replay; live discovery verified separately',now:now.toISOString(),baseline:baseline.radarDataRevision,rows,queue,retainedIds,notificationPlans},null,2))
result.feed.notifications={status:'simulation',pending:0,sent:0,reason:'Simulation hors production ; aucun envoi'}
await writeFile(resolve(output,'feed.json'),JSON.stringify(result.feed,null,2))
await writeFile(resolve(output,'before-after.md'),'| Cas | Avant audit | Après / limite |\n|---|---|---|\n'+rows.map(r=>`| ${r.id} — [${r.title}](${r.source}) | ${r.before} | ${r.after} |`).join('\n')+'\n')
console.log(JSON.stringify({output,queue,retainedIds,notificationPlans,events:result.feed.events.length,groups:groups.length,reportHash:hash(JSON.stringify(rows))},null,2))
