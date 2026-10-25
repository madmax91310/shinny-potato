import { housingConventions } from '../../src/lib/radar-housing.js'
import { OFFICIAL_SOURCES } from '../../src/pages/broker-comparator/evidence.js'
import { ALLOWED_MEDIA_HOSTS } from '../../src/data/allowed-media.js'
import { createHash } from 'node:crypto'
import { cleanText } from './purchasing-power-news.mjs'
import { editorialExclusion, editorialTopic, normalizeEditorial, RADAR_TOPICS, frenchRevolutScope } from '../../src/lib/radar-policy.js'

// Adapters enter the EXISTING durable publications queue. No financial registry
// write, catalogue requirement, model call or notification side effect here.
export const CONSUMER_SOURCES = [
  ['bourse-direct-news','Bourse Direct','https://groupe.boursedirect.fr/feed','official'],
  ['energie-info','Médiateur national de l’énergie','https://www.energie-info.fr/feed/','official'],
  ['afg','AFG · épargne salariale','https://www.afg.asso.fr/fr/feed/','professional-association'],
  ['amf-alerts','AMF · communiqués','https://www.amf-france.org/fr/flux-rss/display/28','official'],
  ['moneyvox','MoneyVox · actualités','https://www.moneyvox.fr/actu/rss.php','journalistic'],
].map(([id,name,url,evidenceLevel])=>({id,name,url,host:new URL(url).hostname,method:'consumer-rss',family:'pouvoir-achat',evidenceLevel,cadenceMinutes:30,depth:'Fenêtre RSS publiée ; aucun historique exhaustif supposé'}))
CONSUMER_SOURCES.push({id:'boursobank-news',name:'BoursoBank Groupe · communiqués',url:'https://www.boursobank-group.com/fr/espace-presse/communiques-de-presse',host:'www.boursobank-group.com',method:'consumer-links',path:'/fr/espace-presse/communiques-de-presse/',family:'pouvoir-achat',evidenceLevel:'official',cadenceMinutes:30,depth:'Première page rendue (12 communiqués au contrôle) ; pagination disponible, non parcourue intégralement'})
CONSUMER_SOURCES.push({id:'revolut-news',name:'Revolut · salle de presse France',url:'https://www.revolut.com/fr-FR/news/',host:'www.revolut.com',method:'consumer-links',path:'/fr-FR/news/',family:'pouvoir-achat',evidenceLevel:'official',cadenceMinutes:30,depth:'Articles rendus dans la première page France ; annonces étrangères écartées'})
export function consumerRejection(title, summary='') {
  const exclusion=editorialExclusion({label:title})
  if(exclusion)return exclusion
  if(!editorialTopic(title,summary))return 'Sujet hors du périmètre des particuliers'
  if(/fondation|mecenat|partenaire titre|tour de la|agricultur|ecoles|scolaires|festival|tennis|cyclisme|footbal|octobre rose|partenariat.*(?:sport|cycl|tennis|football)|nomination|nominations|resultats (?:du|au)|feuille de route|organisation|partenariat.*(?:ia |cloud|musique|sport|roland)|laureat|prix bnp|podcast|webinaire|award|oscars|distingue|meilleurs .*20\d\d|anniversaire|celebre|journal de la bourse|3 infos|tout ce qui change|les dates de vos|mon locataire|resultat net|chiffre d affaires|titrisation|croquer|don en ligne/.test(normalizeEditorial(title)))return 'Communication institutionnelle, promotion de marque ou récapitulatif composite sans annonce financière utile isolée'
  return null
}
const primaryBrokerHosts=new Set(Object.values(OFFICIAL_SOURCES).flatMap(source=>{try{const url=new URL(source.url);return url.protocol==='https:'?[url.hostname]:[]}catch{return[]}}))
const hash = value => createHash('sha256').update(value).digest('hex')
const tag = (html,name) => cleanText(html.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`,'i'))?.[1] ?? '')
function checkedUrl(value,source) {
  const url=new URL(cleanText(value),source.url)
  if(url.protocol!=='https:' || url.hostname!==source.host || url.username || url.password || url.port)throw Error('Lien hors domaine de la source qualifiée')
  url.hash=''; for(const name of [...url.searchParams.keys()])if(/^(utm_|xtor$|fbclid$)/i.test(name))url.searchParams.delete(name)
  return url.href.replace(/\/$/,'')
}
export function discoverConsumer(html,source) {
  if(!source.method.startsWith('consumer-'))return null
  if(source.evidenceLevel==='journalistic' && !ALLOWED_MEDIA_HOSTS.includes(source.host))throw Error('Média non autorisé par le projet')
  const rows=[]
  if(source.method==='consumer-rss') {
    if(!/<rss\b/i.test(html)||!/<channel\b/i.test(html)||!/<\/rss>\s*$/i.test(html))throw Error('Flux RSS absent ou tronqué')
    for(const [,item]of html.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
      const title=tag(item,'title'),description=tag(item,'description')
      // Keep rejected documents in the queue too: their reason is inspectable.
      rows.push({url:checkedUrl(tag(item,'link'),source),title,description:description.slice(0,700),publishedAt:tag(item,'pubDate'),listingRejection:consumerRejection(title,description)})
    }
    if(!rows.length)throw Error('Flux vide anormal : aucun élément RSS')
  } else {
    for(const [,href,attrs,body]of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)) {
      let url;try{url=checkedUrl(href,source)}catch{continue}
      if(!new URL(url).pathname.startsWith(source.path)||new URL(url).pathname.replace(/\/$/,'')===source.path.replace(/\/$/,''))continue
      const title=cleanText(attrs.match(/\btitle="([^"]+)"/)?.[1] ?? '')||tag(body,'h2')||tag(body,'h3')||cleanText(body)
      if(title.length>15&&title.length<500)rows.push({url,title,listingRejection:consumerRejection(title)})
    }
    if(!rows.length)throw Error('Liste de publications vide ou non extractible')
  }
  return [...new Map(rows.map(row=>[row.url,row])).values()].sort((a,b)=>source.id==='revolut-news' ? Number(/france|french|francais/i.test(b.title))-Number(/france|french|francais/i.test(a.title)) : 0)
}
const FR=['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre']
export function announcedDates(text) {
  const normalized=normalizeEditorial(text), dates={}
  for(const [name,pattern]of [['effectiveAt',/(?:a partir du|des le|en vigueur le|applicable le)\s+(\d{1,2})(?:er)?\s+([a-z]+)\s+(20\d{2})/],['promotionEndsAt',/(?:offre valable jusqu au|promotion jusqu au)\s+(\d{1,2})(?:er)?\s+([a-z]+)\s+(20\d{2})/]]) {
    const match=normalized.match(pattern)
    if(!match||!FR.includes(match[2]))continue
    const date=`${match[3]}-${String(FR.indexOf(match[2])+1).padStart(2,'0')}-${match[1].padStart(2,'0')}`
    if(Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date)dates[name]=date
  }
  return dates
}
export function parseConsumer(html,source,url,now,listing={}) {
  const title=tag(html,'h1')||listing.title
  if(!title||title.length>700)throw Error('Titre de publication absent')
  const rejection=consumerRejection(title,listing.description)
  if(rejection)return {rejected:rejection,title}
  const topic=editorialTopic(title,listing.description)
  let date=html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/)?.[1]??html.match(/(?:property|name)=["']article:published_time["'][^>]*content=["'](\d{4}-\d{2}-\d{2})/)?.[1]
  if(!date&&source.id==='boursobank-news') {
    const header=html.slice(html.indexOf('<h1'))
    const raw=normalizeEditorial(cleanText(header.match(/class="item__date"[^>]*>([\s\S]*?)<\/div>/)?.[1]??'')), match=raw.match(/(\d{1,2}) ([a-z]+)\.? (20\d{2})/)
    const month=match ? FR.findIndex(name=>name===match[2] || match[2].length>=3 && name.startsWith(match[2])) : -1
    if(month>=0)date=`${match[3]}-${String(month+1).padStart(2,'0')}-${match[1].padStart(2,'0')}`
  }
  if(!date&&listing.publishedAt&&Number.isFinite(Date.parse(listing.publishedAt)))date=new Date(listing.publishedAt).toISOString().slice(0,10)
  if(!date||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('Date de publication non extractible ; lastmod et collecte non substitués')
  if(Date.parse(date)>+now)throw Error('Publication future, distincte d’une application future')
  const plain=!/<(?:html|main|article)\b/i.test(html)
  const article=plain ? html : (source.id==='boursobank-news'?html.match(/class="news-detail__description html"[^>]*>([\s\S]*?)<\/div>/)?.[1]:null)??html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]??html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]??''
  const paragraphs=plain ? article.split(/\n\s*\n/).map(p=>p.replace(/\s+/g,' ').trim()).filter(p=>p.length>90&&!/contacts? presse|a propos|à propos/i.test(p)) : [...article.matchAll(/<(?:p|li)\b[^>]*>([\s\S]*?)<\/(?:p|li)>/gi)].map(m=>cleanText(m[1])).filter(p=>p.length>90&&!/cookies|javascript|abonnez|newsletter|tous droits|politique de confidentialite/i.test(normalizeEditorial(p)))
  const summary=(paragraphs.slice(0,2).join(' ')||listing.description||'').slice(0,700)
  if(summary.length<70)throw Error('Résumé de l’article absent ; page accessible mais extraction non qualifiée')
  if(source.id==='revolut-news'&&!frenchRevolutScope(title,summary))return{rejected:'Annonce Revolut sans portée française documentée ; une mention incidente parmi les licences mondiales ne suffit pas',title}
  const wording=normalizeEditorial(title+' '+summary)
  const novelty=(Boolean(source.format)&&/deploie|mobilis|maintient.*gratuit|porte a|commercialis|supprim/.test(wording))||/nouve|annonce|desormais|lance|ouvre|s ouvre|etend|evolu|change|hausse|baisse|augment|diminu|premiere fois|depass|arnaqu|en garde|rec(?:eiv|u)|licen[cs]e|integre|corrig|dement|rectificatif/.test(wording)
  const status=/dement|rectificatif|correction|corrige/.test(normalizeEditorial(title))?'Correction / démenti':/proposition de loi|projet de loi|en discussion|pourrait/.test(normalizeEditorial(title))?'Proposition / en discussion':novelty?'Annonce publiée':'Information sans nouveauté établie'
  const dates=announcedDates(title+' '+paragraphs.join(' '))
  const conditions=source.format ? extractOfferConditions(paragraphs.join(' ')) : undefined
  const modified=html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/)?.[1]??html.match(/(?:property|name)=["']article:modified_time["'][^>]*content=["'](\d{4}-\d{2}-\d{2})/)?.[1]
  if(status==='Correction / démenti' && modified && Number.isFinite(Date.parse(modified)) && new Date(modified).toISOString().slice(0,10)===modified && Date.parse(modified)<=+now && modified>=date)dates.correctionPublishedAt=modified
  const populationScope=source.id==='revolut-news'?'Périmètre français explicitement cité ; conditions décrites dans l’annonce':source.id==='bourse-direct-news'?'Clients Bourse Direct concernés par le produit cité ; conditions de l’annonce':source.id==='boursobank-news'?'Clients BoursoBank dans les conditions du communiqué':source.id==='afg'?'Épargne salariale et retraite collective couvertes par l’enquête AFG':summary.split(/(?<=[.!?])\s+/)[0]
  // Explicit original-document links are retained, not labelled confirmations
  // merely because they are hyperlinks. No fuzzy thematic event merging.
  const sources=[{url,role:source.evidenceLevel,label:source.name}]
  const originalLinks=[...article.matchAll(/<a\b[^>]*href=["'](https:\/\/[^"']+)["']/gi)].map(m=>cleanText(m[1])).filter(value=>{try{return primaryBrokerHosts.has(new URL(value).hostname) || source.primaryHosts?.includes(new URL(value).hostname) || CONSUMER_SOURCES.some(source=>source.host===new URL(value).hostname) || /(?:^|\.)(?:gouv\.fr|banque-france\.fr|amf-france\.org|energie-info\.fr|revolut\.com|boursedirect\.fr)$/.test(new URL(value).hostname)}catch{return false}})
  for(const original of [...new Set(originalLinks)].slice(0,4))sources.push({url:original,role:'original-link-unverified',label:'Document cité ; confirmation à contrôler'})
  const angles={banques:'Quels services changent pour les clients français, et à quelle date ?',frais:'Quels clients paient ces frais ? Comparer les anciennes conditions seulement si elles sont documentées.',credit:'Comparer les taux de même nature, durée et période ; distinguer moyenne et offre individuelle.',immobilier:'De quels biens, de quelle zone et de quelle période parle cette publication ?',location:'Quels locataires et bailleurs sont concernés, et à quelle étape en est la règle ?',statistiques:'Que révèle ce repère sur la situation des ménages dans le périmètre étudié ?',epargne:'Quelles conditions changent pour les détenteurs de cette épargne ?',etf:'Quelle exposition ou condition nouvelle est annoncée, avec quels champs encore inconnus ?',energie:'Quels contrats et horaires sont concernés ? Distinguer prix de l’énergie et facture totale.',carburants:'Que sait-on du prix à la pompe, à quelle échelle et pour quels carburants ?',securite:'Comment reconnaître le risque signalé et quelles démarches recommande la source ?',travail:'Quels salariés ou dispositifs couvre cette publication ? Distinguer encours, versements et rendements.'}
  const reference=normalizeEditorial(summary).match(/\bau (\d{1,2}) ([a-z]+) (20\d{2})/), referenceMonth=reference ? FR.indexOf(reference[2])+1 : 0
  const referencePeriod=referenceMonth ? `${reference[3]}-${String(referenceMonth).padStart(2,'0')}-${reference[1].padStart(2,'0')}` : null
  const statistical=source.id==='afg' && /enquete|resultats/.test(normalizeEditorial(summary))
  const excerpt=summary
  return {family:source.family,entity:`publication-${hash(url).slice(0,20)}`,field:'announcement',fieldLabel:'Actualité des particuliers',label:title,value:source.format?{status,...dates,facts:semanticOfferFacts(title+' '+paragraphs.join(' ')),...(status==='Correction / démenti'?{correction:hash(summary)}:{})}:{title,summary,status,...dates},sourceUrl:url,publicationId:url,publisher:source.name,publishedAt:date,period:date,checkedAt:now.toISOString(),scope:`Annonce ${source.name} · ${url}`,populationScope,...(conditions?{conditions}:{}),...(['credit','immobilier','location'].includes(topic)?{housing:housingConventions(title+' '+paragraphs.join(' '),source.id)}:{}),topic,topicLabel:RADAR_TOPICS[topic],summary,status,...dates,evidenceLevel:source.evidenceLevel,sources,factType:statistical?'statistical-publication':'consumer-announcement',referencePeriod,evidence:{sourceHash:hash(html),excerpt,method:(plain?'PDF officiel converti par pdftotext -layout ; titre et date de la carte officielle. ':'')+'Titre, date de publication et deux premiers paragraphes ; résumé limité à 700 caractères. Pas de confirmation officielle déduite d’un article de presse.'},discovery:true,rule:'announcement',maxAgeDays:400,tool:null,reason:`${RADAR_TOPICS[topic]} : annonce datée ; ${source.evidenceLevel==='journalistic'?'information journalistique attribuée, confirmation officielle non établie':'source identifiée'}. Public limité au périmètre cité.`,angle:`${title} — ${angles[topic]}`}
}

// Clauses are quoted with their subject intact. No rate is assigned globally to
// a product, and absent conditions stay explicitly unknown.
export function extractOfferConditions(text) {
 const clauses=text.split(/(?<=[.!?;])\s+/).map(s=>s.trim()).filter(s=>s.length>15&&s.length<1200)
 const patterns={clients:/clients?|particuliers|residents?|r[eé]serv[eé]|souscripteurs/i,pays:/france|fran[cç]ais|belgique|allemagne|r[eé]gion|d[eé]partement|caisse r[eé]gionale/i,formule:/formule|offre|abonnement|premium|elite/i,duree:/pendant|mois|dur[eé]e/i,plafond:/plafond|maximum|jusqu.[aà].*euros/i,versement:/versement|d[eé]p[oô]t minimum|minimum de/i,tauxPromotionnel:/promotion|bonifi[eé]|boost[eé]/i,tauxNormal:/taux (?:normal|standard|de base)|puis.*%/i,frais:/frais|commission|tarif/i}
 return Object.fromEntries(Object.entries(patterns).map(([key,re])=>[key,clauses.filter(s=>re.test(s)).slice(0,3).join(' ')||null]))
}
export function semanticOfferFacts(text) {
 const t=normalizeEditorial(text).replace(/\s+/g,' ')
 return {amounts:[...new Set(t.match(/\b\d+(?:[ .,]\d+)*(?:\s*(?:%|euros?|€|mois|ans|jours))/g)??[])].sort(),pea:/\bpea\b/.test(t),eligible:/non eligible/.test(t)?false:/eligible/.test(t)?true:null,access:/r[eé]serv[eé]|reserve|sous condition/.test(t)?'conditional':null}
}
