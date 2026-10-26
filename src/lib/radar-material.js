import { qualifyRadarFact, publicationTime, observedChange } from './radar-qualification.js'
import { normalizeEditorial, qualifiedOfferChange } from './radar-policy.js'

const day = 86400000
const clean = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&(?:amp;)?(?:Eacute|eacute);/g,'é').replace(/&(?:amp;)?(?:laquo|raquo|nbsp);/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim()
const bounded = (text, size=320) => text.length <= size ? text : text.slice(0,size).replace(/\s+\S*$/,'')+'…'
const numberWithUnit = /\d[\d\s\u202f\u00a0.,]*\s*(?:€|euros?|%|points?\b|millions?\b|milliards?\b|m²|mois\b|ans\b|fois\b)/i
const people = /ménages|foyers|salariés|français|clients|détenteurs|souscripteurs|épargnants|emprunteurs|locataires|propriétaires|résidents|particuliers|personnes|population|EQTP/i

export function compatibleComparison(event) {
  if(event.housing&&event.comparisonCompatible!==true)return false
  if(Date.parse(event.beforePeriod)>Date.parse(event.period))return false
  if (event.kind==='new' || event.field==='announcement' || event.before==null || event.after==null || !event.beforePeriod || !event.period) return false
  if (event.comparisonCompatible===false || event.beforeUnit && event.unit && event.beforeUnit!==event.unit || event.beforeScope && event.scope!==event.beforeScope) return false
  return ['number','string','boolean'].includes(typeof event.before) && typeof event.before===typeof event.after &&
    (typeof event.after!=='number' || Number.isFinite(event.after)&&Number.isFinite(event.before)&&Boolean(event.unit || numberWithUnit.test(event.afterText??'')))
}

// Facts are quotations or already validated values. Dates alone and marketing
// adjectives are never financial material. Every bullet retains its own proof.
export function tweetFacts(event) {
  const facts=[]
  const add=(kind,text,sourceUrl=event.sourceUrl)=>{
    text=clean(text)
    if(text && !facts.some(f=>f.text===text))facts.push({id:`${event.id}:${kind}:${facts.length}`,kind,text:bounded(text),sourceUrl})
  }
  if (event.afterText && (event.unit || numberWithUnit.test(event.afterText)) && typeof event.after!=='object' && clean(event.afterText).length<180) {
    const text = `${event.label ?? event.fieldLabel} : ${event.afterText}${event.unit&&!clean(event.afterText).includes(event.unit)?' '+event.unit:''}${event.factType==='statistical-publication'?' · '+(event.referencePeriod??event.period):''}`
    add('value',text)
  }
  if(compatibleComparison(event))add('comparison',`${event.fieldLabel??event.label} : ${event.beforeText??event.before} (${event.beforePeriod}) → ${event.afterText??event.after} (${event.period}).`)
  if(qualifiedOfferChange(event))for(const row of event.changeEvidence.changes.slice(0,3))add('clause',`${row.product?row.product+' : ':''}${row.before} → ${row.after}`)
  const raw=event.summary??event.evidence?.excerpt??''
  if(event.housing?.rateScope==='nouveaux crédits'&&/Taux Moyen \(en %\)/i.test(raw)){
    const rows=raw.split('\n').filter(row=>/^[A-ZÀÉ][a-zéû]+ \d{4} · \d+[,.]\d+ ·/.test(row))
    const row=rows.at(-1)?.split(' · ')
    if(row)add('rate-row',`${row[0]} : taux fixe moyen ${row[1]} % pour les nouveaux crédits du secteur concurrentiel aux particuliers. Durées détaillées dans la source ; assurance et frais à vérifier.`)
  }
  const body=clean(raw)
  for(const sentence of body.split(/(?<=[.!?])\s+(?=[A-ZÀÉÈÎÔÇ«])/))if(numberWithUnit.test(sentence)||/(?:désormais|à compter|disponible|lance|supprime|met en garde|obligation nouvelle).{0,120}(?:PEA|IBAN|clients|compte|carte|virement|arnaque|fraude|loyer|locataire|bailleur)/i.test(sentence))add('quotation',sentence)
  for(const product of event.products??[]) {
    if(!product.name || /^ETF\s*\d|produit\s*\d/i.test(product.name))continue
    const characteristics=[product.index, product.fees && `Frais documentés : ${product.fees}`, product.pea && /éligible/i.test(product.pea)?`PEA : ${product.pea}`:null].filter(Boolean)
    add('product',characteristics.length?`${product.name} — ${characteristics.join(' ; ')}`:`Produit nommé dans la source : ${product.name}`)
  }
  if(event.family==='investisseurs'&&event.field==='filing'&&event.beforePeriod!==event.period&&event.after?.positions?.length)add('filing',`${event.label} : ${event.after.positions.length} position(s) déclarée(s) au ${event.period}. Un poids déclaré ne prouve pas un achat.`)
  if(event.announcedProductCount>0&&event.announcementEvidence?.stage!=='candidate'&&event.evidence?.excerpt)add('announcement',`${event.announcedProductCount} ETF annoncés dans le communiqué ; noms ou caractéristiques restant à qualifier.`)
  const share=event.launchDetails
  if(event.field==='announcement'&&share?.isin&&event.evidence?.sourceHash&&(share.index||share.fees))add('share',`Part ${share.isin}${share.index?' · Exposition : '+share.index:''}${share.fees?' · Frais : '+share.fees:''}`)
  if(!facts.length && ['pea','lifecycle'].includes(event.field) && event.before!==event.after && event.before!=null)add('access',`${event.label} : ${event.beforeText} → ${event.afterText}.`)
  return facts
}

export function publicationAttention(event, now=Date.now()) {
  const at=publicationTime(event),change=observedChange(event)||qualifiedOfferChange(event,now),age=(now-Date.parse(at))/day
  const signals=[]
  if(Number.isFinite(age)&&age>=0&&age<=2)signals.push({kind:'recent',text:change?'Changement constaté entre deux contrôles depuis moins de 48 h ; date d’annonce inconnue.':'Publication originale ou changement documenté depuis moins de 48 h.'})
  else if(Number.isFinite(age)&&age>=0&&age<=7)signals.push({kind:'recent-week',text:change?'Changement constaté depuis moins de sept jours ; date d’annonce inconnue.':'Publication originale de moins de sept jours.'})
  const effective=(Date.parse(event.effectiveAt)-now)/day
  if(event.effectiveAt && event.statusEvidence && effective>=0&&effective<=7 && !/proposition|prévision|en discussion/i.test(event.status??''))signals.push({kind:'deadline',text:`Entrée en vigueur documentée : ${event.effectiveAt}.`})
  if(event.correctionOf && event.correctionPublishedAt && event.evidence?.sourceHash)signals.push({kind:'development',text:`Correction ou démenti sourcé du ${event.correctionPublishedAt}.`})
  // Explicitly qualified independent analyses only. Reprints, language versions,
  // outlet counts and navigation links do not establish independent treatments.
  const publishers=new Set(),hashes=new Set()
  for(const source of event.sources??[]) {
    if(source.role!=='independent-analysis'||source.independenceEvidence!=='publisher-ownership-reviewed'||!source.independenceKey||!source.sourceHash||!source.additionalFacts?.length||!source.publishedAt)continue
    const age=(now-Date.parse(source.publishedAt))/day
    if(age<0||age>2||hashes.has(source.usefulBodyHash??source.sourceHash))continue
    try{if(new URL(source.url).protocol!=='https:')continue;publishers.add(source.independenceKey);hashes.add(source.usefulBodyHash??source.sourceHash)}catch{/* Unknown source remains uncounted. */}
  }
  if(publishers.size>=2)signals.push({kind:'independent',text:`${publishers.size} traitements indépendants qualifiés depuis moins de 48 h.`})
  return {at,age,signals,independentTreatments:publishers.size}
}

export function publicationMaterial(event, now=Date.now()) {
  const qualification=qualifyRadarFact(event),title=normalizeEditorial(event.label??event.title),body=normalizeEditorial(event.summary??event.evidence?.excerpt),text=title+' '+body
  const facts=tweetFacts(event),comparison=compatibleComparison(event),change=qualifiedOfferChange(event,now)
  const observedSource=!/forecast|professional/.test(qualification.nature)&&/taux moyen.{0,30}observe|prix observes|indice de prix|donnees constatees|taux constates/.test(body)&&facts.length>0
  const statistic=event.factType==='statistical-publication'||event.family==='economie'&&event.unit&&event.evidence?.sourceHash||observedSource
  const announcement=event.announcementEvidence
  const rumour=/rumeur|information non confirmee/.test(title)&&!/dementi|dement/.test(title)
  const proposal=!statistic && (/envisag|pourrait|a l etude|souhaiterait/.test(title)||/proposition|projet de (?:placement|loi)|rapport.{0,100}propose|bientot le plan|l idee.{0,30}permettre/.test(text)||/propos|en discussion/.test(normalizeEditorial(event.status)))
  const advice=!statistic&&!change&&!comparison&&/pourquoi (?:ouvrir|choisir|investir)|comment (?:choisir|epargner|investir)|conseils?|guide pratique|astuces?/.test(title)
  const promotion=Boolean(event.promotionEndsAt)||/offre de bienvenue|prime de bienvenue|offre promotionnelle/.test(title)
  const explicitEvent=/lance(?:nt|ment)?|nouveau service|nouvelle offre|desormais|a partir du|entre en vigueur|baisse (?:ses|les) frais|hausse (?:ses|les) frais|modifi(?:e|ent).{0,30}(?:frais|taux|conditions)|suppression|supprime/.test(text)
  const observed=statistic&&facts.length>0
  const regulatory=/Application indiquée|Application annoncée|Loi promulguée|Loi adoptée définitivement|Promulgation indiquée/.test(event.officialStatus??event.status??'')&&Boolean(event.statusEvidence)&&facts.length>0
  const legacyLaunch=event.field==='announcement'&&event.launchDetails?.isin&&(event.launchDetails.fees||event.launchDetails.index)&&/launch|lance/.test(body)
  const filingProof=event.family==='investisseurs'&&event.field==='filing'&&event.beforePeriod!==event.period&&event.after?.positions?.length&&Boolean(event.sourceUrl)
  const security=event.topic==='securite'&&event.evidenceLevel==='official'&&/met en garde|alerte|escroquerie|fraude/.test(body)&&facts.length>0
  const confirmed=!proposal&&!rumour&&!/forecast|professional/.test(qualification.nature)&&Boolean(Boolean(event.correctionOf&&event.correctionPublishedAt&&event.evidence?.sourceHash&&facts.length)||security||filingProof||regulatory||legacyLaunch||change||comparison&&event.before!==event.after||announcement&&announcement.stage!=='candidate'&&Boolean(announcement.bodyEvidence??announcement.evidence)||event.factType==='consumer-announcement'&&explicitEvent&&facts.length>0)
  let nature=rumour?'rumour':advice?'general-advice':proposal?'proposal':qualification.nature
  if(!rumour&&!advice&&!proposal&&!/survey|intentions|forecast|professional/.test(nature))nature=observed?'observed-statistic':change||comparison?'effective-change':confirmed?'confirmed-announcement':'unestablished'
  const prospective=/rumour|forecast|proposal|professional-survey/.test(nature)
  const survey=/survey|intentions/.test(nature)
  const population=event.populationScope || event.population || clean(event.summary??'').match(/(?:l['’])?ensemble des ménages|[Pp]rêts du secteur concurrentiel aux particuliers/)?.[0] || null
  const knownPopulation=Boolean(population && people.test(population))
  if(population&&!qualification.population){qualification.population=population;qualification.reasons=[qualification.label,'Population citée dans la source : '+population]}
  const attention=publicationAttention(event,now)
  const missing=[]
  if(!facts.length)missing.push('Aucun chiffre, condition ou changement exploitable extrait.')
  if(!population)missing.push('Population précise non documentée ; le périmètre de la source est conservé.')
  if(!attention.at||!Number.isFinite(Date.parse(attention.at)))missing.push('Date de publication originale non établie.')
  if(event.before!=null&&!comparison&&event.field!=='announcement')missing.push('Avant/après non comparable ou conventions non documentées.')
  if(nature==='unestablished')missing.push('Nouveauté financière non établie : la date de l’article ne prouve pas un événement nouveau.')
  if(event.extraction?.status==='partial')missing.push('Extraction partielle : certaines lignes restent à qualifier.')
  if(event.products?.length&&event.products.some(p=>!p.isin))missing.push('ISIN non documenté pour au moins une part.')
  if(event.products?.length&&event.products.some(p=>!p.fees))missing.push('Frais non documentés pour au moins une part.')
  if(event.products?.length&&event.products.some(p=>p.pea!==true&&!/^(?:Éligible|Non éligible)\b/i.test(p.pea??'')))missing.push('Éligibilité PEA inconnue pour au moins une part.')
  if(event.products?.length&&event.products.some(p=>!p.availability))missing.push('Disponibilité chez les courtiers non documentée.')
  const novelty=observed||confirmed||survey||Boolean(event.correctionOf&&event.correctionPublishedAt)
  const tableProof=event.documentHash&&event.documentHash===event.evidence?.sourceHash&&event.products?.some(p=>p.name&&p.isin&&p.evidence)
  const sufficient=!advice&&!prospective&&novelty&&facts.length>0&&Boolean(event.evidence?.excerpt||comparison||tableProof||filingProof)&&Boolean(event.scope)
  const status=advice?'generic':sufficient?'sufficient':'verify'
  const mainFact=event.field==='announcement'&&event.products?.length>1?`${event.products.length} produits/parts documentés : ${announcement?.label??'annonce à qualifier'}.`:facts[0]?.text ?? clean(event.summary??event.label)
  const positioning=observed&&knownPopulation&&/median|mediane|decile|seuil/.test(normalizeEditorial(facts.map(f=>f.text).join(' ')))
  const usefulClause=!change||event.changeEvidence.changes.some(row=>/tenue de compte|liquidit|\bpea\b|livret|carte|courtage|frais de transfert|virement|retrait/i.test(normalizeEditorial(row.before+' '+row.after)))
  const money=confirmed&&!observed&&!prospective&&usefulClause&&/frais|taux|remuner|cout|tarif|credit|epargne|mensualite|revenu|salaire|acces|\bpea\b|iban|compte|carte|virement/.test(text)
  const composition=comparison&&/^(?:top10|countries:|sectors:)/.test(event.field??'')&&typeof event.after==='number'&&Math.abs(event.after-event.before)>=5&&!/other|autres|non ventile/i.test(event.field)
  const choice=(event.products?.filter(p=>p.name&&(p.index||p.fees)).length??0)>=2
  const broad=knownPopulation&&/France|national|français|ménages|millions de foyers|salariés du privé|secteur privé|ensemble des|tous les clients/i.test(`${event.scope} ${event.housing?.geography??''} ${population}`) || observed&&/France|national/i.test(event.scope??'')&&/inflation|logement|credit|crédit/.test(title)
  const nationalStatistic=observed&&/^https:\/\/www\.insee\.fr\/fr\/statistiques\//.test(event.sourceUrl??'')&&/salaire|patrimoine|niveau de vie|inflation|logement|prix/.test(text)
  const relativeChange=comparison&&typeof event.after==='number'&&event.before!==0?Math.abs((event.after-event.before)/event.before):null
  const costEliminated=comparison&&typeof event.after==='number'&&event.before>0&&event.after===0
  const accessChange=comparison&&typeof event.after==='boolean'&&event.before!==event.after&&event.field==='pea'
  const accessAnnouncement=confirmed&&/lance.{0,70}(?:pea|compte|iban|service bancaire)|nouveau.{0,30}(?:pea|iban|service bancaire)/.test(text)
  const significant=costEliminated||accessChange||accessAnnouncement||relativeChange>=.2&&relativeChange!==null
  const rapidEligible=sufficient&&!promotion&&!prospective&&!advice&&(!survey||nationalStatistic)&&(nationalStatistic||confirmed&&money&&significant)
  const nowReason=attention.signals.map(s=>s.text).join(' ') || (Number.isFinite(attention.age)&&attention.age>7?'Publication plus ancienne : contexte ou historique, sans regain de fraîcheur déduit de la collecte.':'Aucun indice d’actualité brûlante établi.')
  let angle=null,question=null
  if(positioning){angle=`Où se situer par rapport à ${event.afterText?.length<100?event.afterText:'ce seuil'} ? Garder la population et la période de l’étude.`;question='À quel point ce repère correspond-il à ta situation ?'}
  else if(comparison||change){angle=comparison?`${event.label} : que change le passage de ${event.beforeText} à ${event.afterText}, sous quelles conditions ?`:`${facts.find(f=>f.kind==='clause')?.text??mainFact} : qui est concerné et avec quelles limites ?`;question=money?'Ce changement modifierait-il ton choix ?':null}
  else if(event.products?.length){angle='Comparer les expositions et caractéristiques prouvées ; préciser les frais et accès encore inconnus.';question=choice?'Quelle différence documentée te paraît la plus utile ?':null}
  else if(survey){angle='Présenter les réponses des personnes interrogées, avec la méthode et le périmètre de l’enquête.';question='Te reconnais-tu dans les réponses de cette enquête ?'}
  else if(sufficient){angle='Présenter le fait sourcé, les personnes concernées et les conditions documentées.'}
  return {version:1,status,nature,qualification,mainFact,facts:facts.slice(0,3),population,knownPopulation,missing,novelty,comparison,change:!!change,confirmed:!!confirmed,observed,survey,prospective,promotion,broad,positioning,money,composition,choice,nationalStatistic,rapidEligible,attention,nowReason,angle,question}
}
