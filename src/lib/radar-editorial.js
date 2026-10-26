import {investorFilingType,etfAnnouncement} from './radar-fact-types.js'
export {investorFilingType,etfAnnouncement} from './radar-fact-types.js'
import { qualifyRadarFact, publicationTime } from './radar-qualification.js'
import { publicationMaterial } from './radar-material.js'
import { editorialExclusion, consumerQuality } from './radar-policy.js'
import { replicationWordingEvent } from './replication-method.js'
// Shared by the UI and notifications: collecting a fact does not make it a post.
export const EDITORIAL_DAYS = 14
export const EDITORIAL_LIMIT = 5
export const SCORE_RULES = Object.freeze({ material:25, reach:25, novelty:20, reaction:20, comparison:10, priority:65, major:85, sourceCap:2, exposureCap:1, promotionCap:1 })
export const EDITORIAL_STATES = { excluded: 'Hors périmètre', ready: 'À exploiter', watch: 'À suivre', secondary: 'Variations secondaires' }
const normal = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

function evidenceState(event, now = Date.now()) {
  if (editorialExclusion(event) || event.editorialExcluded) return 'excluded'
  if (['professional-survey','forecast'].includes(qualifyRadarFact(event).nature)) return 'watch'
  if (event.supersededBy) return 'secondary'
  if (event.factType === 'consumer-announcement' && event.topic === 'carburants') {
    const cents=normal(event.label).match(/(?:hausse|baisse|augmentation|diminution) (?:de )?(\d+(?:[,.]\d+)?) centimes?/)
    if(cents && Number(cents[1].replace(',','.'))<5)return 'secondary'
  }
  if (event.factType === 'consumer-announcement' && event.topic === 'etf' && /encours|\baum\b|actifs sous gestion/.test(normal(event.label)) && !/lance|frais|\bpea\b|nouvelle exposition/.test(normal(event.label)))return 'secondary'
  if (event.factType === 'consumer-announcement') return consumerQuality(event,now).length ? 'watch' : 'ready'
  if (replicationWordingEvent(event) || event.status === 'wording-only') return 'secondary'
  if(['dataset-release','publication-watch'].includes(event.factType))return 'watch'
  const field = event.field ?? ''
  if (event.factType === 'source-revision') return 'secondary'
  if (event.status === 'source-conflict') return 'secondary'
  if (event.family === 'etf' && field === 'announcement') {
    const announcement = event.announcementEvidence ?? etfAnnouncement(event.label)
    if (event.documentHash && announcement && announcement.stage !== 'candidate' && (event.products?.length || Number.isInteger(event.announcedProductCount) && event.announcedProductCount>1) && (event.evidence?.excerpt || event.extraction&&event.products?.some(p=>p.evidence))) return 'ready'
    return announcement ? announcement.stage === 'trading' || announcement.stage === 'launched' && event.launchDetails?.isin && (event.launchDetails.fees || event.launchDetails.index) ? 'ready' : 'watch' : 'secondary'
  }
  if (event.factType === 'statistical-publication') return event.publishedAt && event.evidence?.excerpt && event.evidence?.sourceHash ? 'ready' : 'watch'
  if (event.family === 'economie' && event.publishedAt && event.unit && event.evidence?.sourceHash && event.kind !== 'new' && event.beforePeriod !== event.period) return 'ready'
  if (['etf', 'indices'].includes(event.family) && /^(top10|countries:|sectors:)/.test(field) && event.kind !== 'new' && event.beforePeriod !== event.period && typeof event.before === 'number' && typeof event.after === 'number' && Math.abs(event.after-event.before) >= 5 && !/other|autres|non ventile/i.test(normal(field))) return 'ready'
  // A newly connected catalogue record is never a product launch or a change.
  if (event.kind === 'new' && event.family !== 'pouvoir-achat') return 'secondary'
  if (event.family === 'pouvoir-achat') {
    const status = event.officialStatus ?? event.status ?? ''
    const concrete = /\d|€|euros|plafond|taux|tarif|frais|eligib|condition|date|versement|exoner|rembours/i.test(normal(`${event.label} ${event.summary}`))
    return concrete && /Application indiquée|Application annoncée|Loi promulguée|Loi adoptée définitivement|Promulgation indiquée/.test(status) ? 'ready' : 'watch'
  }
  if (event.family === 'etf') return /^(ter|pea|lifecycle|characteristics:(index|distribution|replicationMethod|productStructure))$/.test(field) ? 'ready' : 'secondary'
  if (event.family === 'courtiers') return 'ready'
  if (event.family === 'epargne') return 'ready'
  if (event.family === 'assurance') return /^(fees:|euro:)/.test(field) ? 'ready' : 'secondary'
  if (event.family === 'scpi') return /^(price|distribution|subscriptionFee|managementFee|minimum)$/.test(field) ? 'ready' : 'secondary'
  if (event.family === 'investisseurs' && field === 'filing') return investorFilingType(event) === 'publication' ? 'ready' : 'secondary'
  return 'secondary'
}

export function editorialState(event, now = Date.now()) {
  const state=evidenceState(event,now)
  if(state!=='ready')return state
  const material=publicationMaterial(event,now)
  return material.status==='generic'?'secondary':material.status==='sufficient'?'ready':'watch'
}

export function factType(event) {
  if (event.field === 'announcement' && ['listing','first-trading','trading','characteristic-change','share-class','france-distribution','merger','closure','delisting'].includes(event.announcementEvidence?.type)) return event.announcementEvidence.type
  if (event.factType) return event.factType
  if (event.kind === 'new' && event.field !== 'announcement' && event.family !== 'pouvoir-achat') return 'coverage'
  if (event.family === 'pouvoir-achat') return 'regulatory-measure'
  if (event.field === 'announcement') { const type = (event.announcementEvidence ?? etfAnnouncement(event.label))?.type; return ['listing','first-trading','trading','characteristic-change','share-class','france-distribution','merger','closure','delisting'].includes(type) ? type : 'product-announcement' }
  if (event.beforePeriod === event.period && (event.kind === 'publication' || event.family === 'economie')) return 'source-revision'
  if (event.family === 'economie' && event.publishedAt && event.evidence?.sourceHash) return 'statistical-publication'
  return 'characteristic-change'
}
export function reliability(event, now = Date.now()) {
  const reasons = []
  const exclusion = editorialExclusion(event)
  if (exclusion) reasons.push(exclusion)
  if (event.factType === 'consumer-announcement') reasons.push(...consumerQuality(event,now))
  try { if (new URL(event.sourceUrl).protocol !== 'https:') reasons.push('Source HTTPS manquante') } catch { reasons.push('Source manquante') }
  if (!event.scope || !event.period || !Number.isFinite(Date.parse(event.checkedAt))) reasons.push('Périmètre ou date de contrôle manquant')
  if (['source-conflict', 'wording-only'].includes(event.status)) reasons.push('Conflit ou libellé équivalent')
  if (event.after === null || event.after === undefined || typeof event.after === 'number' && !Number.isFinite(event.after)) reasons.push('Fait absent ou invalide')
  return { usable: reasons.length === 0, reasons }
}
export function editorialAssessment(event, now = Date.now(), rules = SCORE_RULES) {
  const state=editorialState(event,now),type=factType(event),material=publicationMaterial(event,now),quality=reliability(event,now)
  const qualification={...material.qualification,nature:material.nature,label:({rumour:'Rumeur ou information non confirmée','general-advice':'Conseil général sans nouveauté','proposal':'Proposition, pas un changement confirmé','unestablished':'Nouveauté à vérifier','effective-change':'Changement effectif documenté','confirmed-announcement':'Annonce confirmée'})[material.nature]??material.qualification.label}
  const broadEtf=event.products?.some(p=>/MSCI World|All.World|S&P 500|Euro Stoxx 50/i.test(p.index??p.name)||(p.pea===true||/^Éligible\b/i.test(p.pea??'')))
  const hasScope=Boolean(event.scope),hasPeriod=Boolean(event.referencePeriod??event.period)
  const matter=material.facts.length ? 12+(hasScope?5:0)+(hasPeriod?4:0)+(material.knownPopulation||material.change||event.conditions||material.facts.some(f=>f.kind==='product')?4:0) : 0
  const audience=material.broad?15:broadEtf?12:material.knownPopulation?10:5
  const consequence=material.money?10:material.observed||material.composition?5:0
  const age=material.attention.age
  const fresh=Number.isFinite(age)&&age>=0?(age<=2?8:age<=7?5:age<=14?2:0):0
  const novelty=material.novelty?Math.min(20,12+fresh+(material.attention.signals.some(s=>['deadline','development','independent'].includes(s.kind))?3:0)):0
  const budgetBenchmark=material.observed&&(/inflation|prix.*logement|taux.*crédit|taux.*credit/i.test(event.label??'')||material.facts.some(f=>f.kind==='rate-row'))
  const reaction=material.positioning?18:material.money||material.composition?15:budgetBenchmark?15:material.survey&&material.knownPopulation?12:material.choice?10:0
  const comparison=material.comparison||material.change?10:material.positioning?8:material.choice?6:0
  const raw=[
    ['material',matter,material.facts.length?'Faits, périmètre et période extraits':'Matière concrète non établie',!material.facts.length],
    ['reach',audience+consequence,`${material.broad?'Population large documentée':broadEtf?'Grande exposition ou PEA documenté':material.knownPopulation?'Population citée':'Portée inconnue'} ; ${material.money?'coût, rendement ou accès documenté':material.observed?'repère observé, sans effet individuel déduit':'conséquence inconnue'}`,!material.knownPopulation&&!broadEtf],
    ['novelty',novelty,material.novelty?material.nowReason:'Article récent, nouveauté non prouvée',!material.novelty],
    ['reaction',reaction,material.positioning?'Se situer dans une distribution documentée':material.money?'Arbitrage lié à une condition financière prouvée':material.composition?'Exposition modifiée ; aucun achat ni flux déduit':budgetBenchmark?'Repère de budget observé ; aucun ménage type inventé':material.survey&&material.knownPopulation?'Réponses déclarées ; méthode conservée':material.choice?'Choix entre des caractéristiques nommées':'Réaction non établie ; aucun point pour le sensationnalisme',reaction===0],
    ['comparison',comparison,material.comparison||material.change?'Avant/après compatible et conservé':material.positioning?'Seuil ou distribution permettant une comparaison':material.choice?'Différences de produits prouvées':'Comparaison absente ; outil facultatif sans pénalité',comparison===0]
  ]
  const criteria=raw.map(([key,points,reason,unknown])=>({key,points:Math.round(points*rules[key]/SCORE_RULES[key]),maximum:rules[key],reason,unknown}))
  const score=criteria.reduce((sum,row)=>sum+row.points,0)
  const priority=quality.usable&&state==='ready'&&material.status==='sufficient'&&score>=rules.priority
  return {score,criteria,qualification,material,reliability:quality,state,type,priority,major:priority&&material.rapidEligible&&score>=rules.major&&Number.isFinite(age)&&age>=0&&age<=2}
}
export const editorialScore = (event, now) => editorialAssessment(event, now).score
export function publicationKey(event) {
  if (event.correctionOf) return JSON.stringify(['correction',event.correctionOf,event.id])
  if (event.eventKey) return event.eventKey
  if (event.publicationId) return JSON.stringify([event.family, event.publicationId, event.publishedAt ?? event.period])
  return JSON.stringify([event.family, event.entity, event.period])
}
// Group exact publications, keeping all child facts and legacy read identifiers.
export function groupSignals(events, now = Date.now(), {notification=false}={}) {
  const groups = new Map(), studies=new Map(), dossierKeys=new Set(events.map(e=>e.dossierKey).filter(Boolean))
  const studyId=e=>e.publicationId&&e.referencePeriod?JSON.stringify([e.publicationId.replace(/\/$/,''),e.referencePeriod]):null
  for(const event of events)if(studyId(event)&&['statistical-publication','publication-watch'].includes(event.factType)&&!event.correctionOf){const prior=studies.get(studyId(event));if(!prior||!prior.publishedAt&&event.publishedAt)studies.set(studyId(event),event)}
  for (const event of events) {
    const state = editorialState(event,now)
    const sameDatedStudy=event.publicationId && event.referencePeriod && ['statistical-publication','publication-watch'].includes(event.factType) && !event.correctionOf
    const dossier=notification ? null : (event.dossierKey ?? (dossierKeys.has(publicationKey(event))?publicationKey(event):null) ?? (sameDatedStudy ? publicationKey(studies.get(studyId(event))??event) : null))
    const key=JSON.stringify([dossier ?? publicationKey(event),dossier ? 'dossier' : state])
    if (!groups.has(key)) groups.set(key, { id: key, state, event, events: [] })
    groups.get(key).events.push(event)
  }
  return [...groups.values()].map(group => {
    const official=e=>e.evidenceLevel==='official'||e.sourceUrl?.startsWith('https://www.insee.fr/fr/statistiques/')
    group.events.sort((a,b)=>(Number(b.entity==='salary-median')-Number(a.entity==='salary-median'))||Number(editorialState(b,now)==='ready')-Number(editorialState(a,now)==='ready')||Number(official(b))-Number(official(a))||editorialScore(b,now)-editorialScore(a,now)||b.detectedAt.localeCompare(a.detectedAt)||a.id.localeCompare(b.id))
    let event=group.events[0]
    const relatedStages=event.relatedStages??[]
    return { ...group, event, state:editorialState(event,now), assessment: editorialAssessment(event, now),readIds:group.events.filter(e=>!event.publicationId||e.publicationId===event.publicationId).map(e=>e.id), relatedStages }
  }).sort((a,b) => b.assessment.score-a.assessment.score || b.event.detectedAt.localeCompare(a.event.detectedAt) || a.id.localeCompare(b.id))
}
const eventExposure = event => event.exposureKey ?? event.launchDetails?.index ?? (event.products?.length === 1 ? event.products[0].index : null)
export function selectEditorial(groups, limit = EDITORIAL_LIMIT) {
  const selected = [], others = [], counts = new Map(), exposures = new Map(); let promotions=0
  for (const group of [...groups].sort((a,b)=>b.assessment.score-a.assessment.score||a.id.localeCompare(b.id))) {
    let host
    try { host = new URL(group.event.sourceUrl).hostname } catch { host = group.event.family }
    const exposure = eventExposure(group.event)
    if (selected.length < limit && (!group.assessment.material?.promotion || promotions < SCORE_RULES.promotionCap) && (counts.get(host) ?? 0) < SCORE_RULES.sourceCap && (!exposure || (exposures.get(exposure) ?? 0) < SCORE_RULES.exposureCap)) { selected.push(group); if(group.assessment.material?.promotion)promotions++; counts.set(host, (counts.get(host) ?? 0)+1); if (exposure) exposures.set(exposure,(exposures.get(exposure) ?? 0)+1) }
    else others.push(group)
  }
  return { selected, others }
}

export function recentEditorial(event, now = Date.now()) {
  const stamp = Date.parse(event.detectedAt), published = Date.parse(publicationTime(event))
  return stamp <= now && stamp >= now - EDITORIAL_DAYS * 86400000 && Number.isFinite(published) && published <= now && published >= now - EDITORIAL_DAYS * 86400000
}

// One selection contract for the home, Radar and notification planner.
export function publicationSelection(events,{now=Date.now(),limit=EDITORIAL_LIMIT}={}) {
  const groups=groupSignals(events,now)
  const ready=groups.filter(g=>g.state==='ready'&&g.assessment.reliability.usable&&recentEditorial(g.event,now))
  return {groups,ready,...selectEditorial(ready.filter(g=>g.assessment.priority),limit)}
}



export {factualTitle,readableInvestorFiling} from './radar-titles.js'
