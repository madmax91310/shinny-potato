import { createHash } from 'node:crypto'
import { cleanText } from './purchasing-power-news.mjs'
import { extractOfferConditions } from './radar-consumer.mjs'
import { normalizeEditorial, editorialExclusion } from '../../src/lib/radar-policy.js'

// Public entry points, not a maintained list of announcements. An undated
// document is a baseline until two comparable versions prove a monetary change.
export const OFFER_SOURCES = [
  {id:'fortuneo-tariffs',name:'Fortuneo · brochure tarifaire',url:'https://www.fortuneo.fr/tarifs',host:'www.fortuneo.fr',documentHost:'www.fortuneo.fr',documentPath:'/files/tarifs_fortuneo.pdf',kind:'tariff'},
  {id:'fortuneo-offers',name:'Fortuneo · offres et conditions',url:'https://www.fortuneo.fr/offres-speciales-fortuneo',host:'www.fortuneo.fr',kind:'offers'},
  {id:'boursobank-offers',name:'BoursoBank · offres et conditions',url:'https://www.boursobank.com/',host:'www.boursobank.com',kind:'offers'},
  {id:'boursobank-tariffs',name:'BoursoBank · brochure tarifaire',url:'https://www.boursobank.com/',host:'www.boursobank.com',documentHost:'www.boursorama.com',documentPath:'/content/brochure_tarifaire/boursorama_bt.pdf',kind:'tariff'},
].map(s=>({...s,method:'offer-watch',family:'pouvoir-achat',evidenceLevel:'official',cadenceMinutes:120,depth:s.kind==='tariff'?'Brochure officielle liée par le site ; suivi des lignes comparables, pas de couverture exhaustive des cellules':'Page publique des offres ; clauses chiffrées et conditions, pas de lancement déduit de la première observation'}))
const hash=s=>createHash('sha256').update(s).digest('hex')
const clean=s=>cleanText(s??'').replace(/\s+/g,' ').trim()
export function offerDiscovery(html,source) {
  if(source.method!=='offer-watch')return null
  if(source.kind==='offers') {
    if(!/<h1\b/i.test(html)||!(source.id==='boursobank-offers'?/BoursoBank/i.test(clean(html)):/offres de bienvenue/i.test(clean(html))))throw Error('Page des offres non reconnue')
    return [{url:source.url,title:source.name}]
  }
  const urls=[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].flatMap(m=>{
    try{const u=new URL(clean(m[1]),source.url);return u.protocol==='https:'&&u.hostname===source.documentHost&&u.pathname===source.documentPath&&!u.search&&!u.username&&!u.port?[u.href]:[]}catch{return[]}
  })
  if(!urls.length)throw Error('Brochure officielle absente du point d’entrée ; ancienne version conservée')
  return [...new Set(urls)].map(url=>({url,title:source.name}))
}
export function offerDates(text) {
  const t=normalizeEditorial(text).replace(/\s+/g,' '),fr=['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre']
  const iso=raw=>{const m=raw.match(/^(\d{1,2})(?:er)?[ ./]+([a-z]+|\d{1,2})[ ./]+(20\d{2})$/);if(!m)return null;const month=/^\d+$/.test(m[2])?+m[2]:fr.indexOf(m[2])+1;const d=`${m[3]}-${String(month).padStart(2,'0')}-${m[1].padStart(2,'0')}`;return month>0&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d?d:null}
  const date='(\\d{1,2}(?:er)?[ ./]+(?:[a-z]+|\\d{1,2})[ ./]+20\\d{2})'
  const effective=[...t.matchAll(new RegExp(`(?:tarifs? applicables? au|conditions tarifaires au|a compter du|a partir du)\\s+${date}`,'g'))].map(m=>iso(m[1])).filter(Boolean)
  const ends=[...t.matchAll(new RegExp(`(?:jusqu au|offre valable du ${date} au)\\s*${date}`,'g'))].map(m=>iso(m.at(-1))).filter(Boolean)
  const only=rows=>new Set(rows).size===1?rows[0]:null
  return {effectiveAt:only(effective),promotionEndsAt:only(ends)}
}
const monetary=/\d[\d\s.,]*\s*(?:€|euros?|%|ordres?\b)|\bgratuit\b/i
const financial=/compte|carte|mastercard|fosfo|gold|courtage|ordre|virement|retrait|versement|livret|frais|tarif|commission|pea|taux|fortuneo vie|remuner/i
// Preserve complete clauses, including all columns. No rate is assigned to an
// individual product from a multi-column table. Ambiguous duplicate keys drop out.
export function offerSnapshot(content,source,now) {
  const pdf=!/<html\b/i.test(content)
  let clauses=[]
  if(pdf) {
    if(!/conditions tarifaires|brochure tarifaire/i.test(content))throw Error('PDF tarifaire non reconnu')
    // Mixed retail/business brochures: conservatively omit any page mentioning
    // professionals, rather than infer retail eligibility from a detached row.
    clauses=content.split('\f').filter(page=>!/professionnel|bourso business/i.test(page)).join('\n').split(/\r?\n/).map(clean).filter(s=>s.length>15&&s.length<700&&monetary.test(s)&&financial.test(s)&&!/^\d|^conditions tarifaires|^tarifs applicables/i.test(s))
  }else{
    const body=content.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
    clauses=[...body.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m=>clean(m[2])).filter(s=>s.length>30&&s.length<1000&&monetary.test(s)&&financial.test(s))
    const cards=[...body.matchAll(/<article\b[^>]*data-content-type-id="ContentfulCardOffer"[^>]*>([\s\S]*?)<\/article>/gi)].map(m=>clean(m[1])).filter(s=>s.length>80&&s.length<2500&&monetary.test(s)&&financial.test(s))
    if(cards.length)clauses=cards
  }
  const rows=new Map(),ambiguous=new Set()
  for(const quote of clauses){
    if(/professionnel|bourso business/i.test(quote)||editorialExclusion({label:quote}))continue
    // Dates, numbers and gratuité are values; every other word must match.
    // This intentionally ignores unpaired/new/removed clauses and wording edits.
    const key=normalizeEditorial(quote).replace(/\b\d[\d\s.,]*\s*(?:€|euros?|%|mois|ans|jours|ordres?)|\bgratuit\b/g,' # ').replace(/\d+(?:[.,]\d+)*/g,'#').replace(/[^a-z#]+/g,' ').trim()
    if(key.length<12)continue
    const numbers=[...normalizeEditorial(quote).matchAll(/\b\d[\d\s.,]*\s*(?:€|euros?|%|mois|ans|jours|ordres?)(?![a-z])|\bgratuit\b/g)].map(m=>m[0].replace(/\s+/g,'').replace(/,(?=€|euros)/g,'').replaceAll('euros','€').replaceAll('euro','€').replace(/^(?:gratuit|0+(?:[,.]0+)?€)$/,'0€')).sort()
    const value=JSON.stringify({numbers,dates:offerDates(quote)})
    if(rows.has(key)&&rows.get(key).value!==value)ambiguous.add(key)
    else rows.set(key,{quote,value})
  }
  for(const key of ambiguous)rows.delete(key)
  if(rows.size<2)throw Error('Trop peu de clauses financières comparables : dernière référence conservée')
  return {version:1,sourceUrl:source.documentPath?`https://${source.documentHost}${source.documentPath}`:source.url,checkedAt:now.toISOString(),sourceHash:hash(content),clauses:Object.fromEntries(rows),dates:pdf?offerDates(content.slice(0,3500)):{effectiveAt:null,promotionEndsAt:null},conditions:extractOfferConditions(clauses.join(' ')),clauseCount:rows.size}
}
export function compareOfferSnapshots(before,after,source,url) {
  if(!before||before.version!==after.version||before.sourceUrl!==after.sourceUrl)return null
  const changes=Object.entries(after.clauses).flatMap(([key,row])=>before.clauses[key]&&before.clauses[key].value!==row.value?[{key,before:before.clauses[key].quote,after:row.quote}]:[])
  if(!changes.length)return null
  const excerpt=changes.map(c=>`Avant : ${c.before}\nAprès : ${c.after}`).join('\n\n')
  const clauseDates=offerDates(changes.map(c=>c.after).join(' ')),dates={effectiveAt:source.kind==='tariff'?after.dates.effectiveAt:clauseDates.effectiveAt,promotionEndsAt:clauseDates.promotionEndsAt},publicationId=`${url}#change-${hash(JSON.stringify(changes)).slice(0,20)}`
  return {family:'pouvoir-achat',entity:`publication-${hash(publicationId).slice(0,20)}`,field:'announcement',fieldLabel:'Conditions financières comparées',label:`${source.name} : changement de conditions observé`,value:changes,publicationId,sourceUrl:url,publisher:source.name,publishedAt:null,period:after.checkedAt,checkedAt:after.checkedAt,scope:'Clients et produits des clauses citées ; aucun périmètre régional étendu',populationScope:'Clients concernés par les clauses comparées ; voir conditions intégrales de la source',topic:source.kind==='tariff'?'frais':'epargne',topicLabel:source.kind==='tariff'?'Frais bancaires':'Offres d’épargne et bancaires',status:'Changement observé entre deux contrôles',factType:'consumer-announcement',summary:excerpt.slice(0,700),conditions:extractOfferConditions(changes.map(c=>c.after).join(' ')),...dates,changeEvidence:{version:1,beforeHash:before.sourceHash,afterHash:after.sourceHash,beforeCheckedAt:before.checkedAt,observedAt:after.checkedAt,sourceUrl:url,changes},evidenceLevel:'official',sources:[{url,role:'official',label:source.name}],evidence:{sourceHash:after.sourceHash,excerpt,method:'Deux versions comparables de clauses complètes. Dates de contrôle, pas dates d’annonce. Clauses nouvelles, disparues ou reformulées non promues.'},discovery:true,backfill:false,rule:'announcement',maxAgeDays:400,tool:null,reason:'Changement de montant dans une clause comparable prouvé par deux versions ; date de publication inconnue, périmètre limité aux conditions citées.',angle:'Quelles conditions ont changé pour les clients concernés ? Citer les deux versions et la date d’effet si elle est documentée.'}
}
