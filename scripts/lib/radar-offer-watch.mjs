import { articleBody } from './radar-article-body.mjs'
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
  {id:'lbp-tariffs',name:'La Banque Postale · tarifs particuliers',url:'https://www.labanquepostale.fr/particulier/footer/tarifs.html',host:'www.labanquepostale.fr',kind:'tariff',documentHost:'www.labanquepostale.fr',documentPrefix:'/content/dam/lbp/documents/tarifs/'},
].map(s=>({...s,parserVersion:3,method:'offer-watch',family:'pouvoir-achat',evidenceLevel:'official',cadenceMinutes:120,depth:s.kind==='tariff'?'Brochure officielle liée par le site ; suivi des lignes comparables, pas de couverture exhaustive des cellules':'Page publique des offres ; clauses chiffrées et conditions, pas de lancement déduit de la première observation'}))
const sameClauseValue=(a,b)=>{
  const terms=normalizeEditorial(a.quote).match(/[a-z]{4,}/g)?.filter(w=>!normalizeEditorial(a.product).includes(w)&&!['carte','frais','euros','clients','client','pour','avec'].includes(w))??[]
  return a.product===b.product&&a.value===b.value&&terms.some(w=>normalizeEditorial(b.quote).includes(w))
}
const hash=s=>createHash('sha256').update(s).digest('hex')
const clean=s=>cleanText(s??'').replace(/\s+/g,' ').trim()
export function offerDiscovery(html,source) {
  if(source.method!=='offer-watch')return null
  const body=source.kind==='tariff'?html:(/<main\b/i.test(html)?articleBody(html):'')||html.replace(/<(nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
  if(source.kind==='offers'&&(!/<h1\b/i.test(html)||!(source.id==='boursobank-offers'?/BoursoBank/i.test(clean(html)):/offres de bienvenue/i.test(clean(html)))))throw Error('Page des offres non reconnue')
  const rows=source.kind==='offers'?[{url:source.url,title:source.name,offerReference:true,documentKind:'offers',referenceKey:source.id+':entry'}]:[]
  for(const [,href,text]of body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    let u;try{u=new URL(clean(href),source.url)}catch{continue}
    const label=clean(text)
    if(u.protocol!=='https:'||![source.host,source.documentHost].includes(u.hostname)||u.username||u.port||u.hash||u.search)continue
    if(source.kind==='tariff'&&u.href.replace(/\/$/,'')===source.url.replace(/\/$/,''))continue
    const original=source.documentPath&&u.pathname===source.documentPath
    const tariff=source.documentPrefix&&u.pathname.startsWith(source.documentPrefix)&&/tarifs-(?:particuliers|outre-mer)-20\d\d\.pdf$/.test(u.pathname)
    const condition=/(?:tarifs?|brochure).*20\d\d|conditions? (?:de l.offre|generales|particulieres|tarifaires)|brochure tarifaire|avis de modification|reglement.*offre/i.test(label)
    if(!original&&!tariff&&!condition)continue
    const region=/DOM|outre.mer/i.test(label+' '+u.pathname)?'Outre-mer':'périmètre du document'
    const role=(original||tariff)?'brochure':normalProduct(label+' '+u.pathname)||null
    rows.push({url:u.href.replace(/\/$/,''),title:label||source.name,offerReference:true,documentKind:/\.pdf$/i.test(u.pathname)?'tariff':'offers',documentLabel:label,documentRegion:region,referenceKey:role?source.id+':'+role+':'+region:null})
  }
  if(!rows.length)throw Error('Aucun document ou condition officiel qualifié ; référence précédente conservée')
  return [...new Map(rows.map(row=>[row.url,row])).values()]
}
const normalProduct=text=>{
  const t=normalizeEditorial(text)
  const products=[['Fosfo',/fosfo/],['Gold CB Mastercard',/gold/],['Livret +',/livret/],['PEA',/\bpea\b/],['Compte-titres',/compte.titres|courtage/],['Carte Visa Premier',/visa premier/],['Carte Visa Classic',/visa classic/],['Compte bancaire',/tenue de compte|compte bancaire/]]
  const matches=products.filter(([,pattern])=>pattern.test(t));return matches.length===1?matches[0][0]:null
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
export function offerSnapshot(content,source,now,document={}) {
  source={...source,kind:document.documentKind??source.kind}
  const documentUrl=document.url??(source.documentPath?`https://${source.documentHost}${source.documentPath}`:source.url)
  const pdf=!/<html\b/i.test(content)
  if(source.kind==='tariff'&&!pdf || source.kind==='offers'&&pdf)throw Error('Type de document différent du contrat qualifié ; référence conservée')
  let clauses=[]
  if(pdf) {
    if(!/conditions tarifaires|brochure tarifaire|document d.information tarifaire/i.test(content))throw Error('PDF tarifaire non reconnu')
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
    const key=normalizeEditorial(quote).replace(/\bpar (?:mois|an|trimestre|operation|ordre)\b/g,' baseperiodique ').replace(/nouveaux clients|clients existants/g,' clientele ').replace(/\b\d[\d\s.,]*\s*(?:€|euros?|%|mois|ans|jours|ordres?)|\bgratuit\b/g,' # ').replace(/\d+(?:[.,]\d+)*/g,'#').replace(/[^a-z#]+/g,' ').trim()
    if(key.length<12)continue
    const numbers=[...normalizeEditorial(quote).matchAll(/\b\d[\d\s.,]*\s*(?:€|euros?|%|mois|ans|jours|ordres?)(?![a-z])|\bgratuit\b/g)].map(m=>m[0].replace(/\s+/g,'').replace(/,(?=€|euros)/g,'').replaceAll('euros','€').replaceAll('euro','€').replace(/^(?:gratuit|0+(?:[,.]0+)?€)$/,'0€')).sort()
    const basis=normalizeEditorial(quote).match(/\bpar (?:mois|an|trimestre|operation|ordre)\b|nouveaux clients|clients existants/g)??[]
    const value=JSON.stringify({numbers,basis,dates:offerDates(quote)})
    if(rows.has(key)&&rows.get(key).value!==value)ambiguous.add(key)
    else rows.set(key,{quote,value,product:normalProduct(quote)??normalProduct(document.documentLabel??''),scope:{institution:source.name.split(' · ')[0],clientele:/nouveaux clients|premiere ouverture|1.re ouverture/i.test(quote)?'Nouveaux clients, conditions citées':/clients existants/i.test(quote)?'Clients existants':null,pays:/(?:clients?|residents?|domicilies).{0,45}en France/i.test(quote)?'France':null,region:document.documentRegion??null},conditions:extractOfferConditions(quote)})
  }
  for(const key of ambiguous)rows.delete(key)
  if(rows.size<2)throw Error('Trop peu de clauses financières comparables : dernière référence conservée')
  return {version:1,semanticVersion:2,sourceUrl:documentUrl,referenceKey:document.referenceKey??source.id,documentLabel:document.documentLabel??null,documentRegion:document.documentRegion??null,productContexts:[...new Set([...rows.values()].map(r=>r.product).filter(Boolean))],withdrawalEvidence:(pdf?content.split(/\r?\n/).map(clean):[...content.matchAll(/<(?:p|li)\b[^>]*>([\s\S]*?)<\/(?:p|li)>/gi)].map(m=>clean(m[1]))).filter(q=>q.length>15&&q.length<1000&&/supprim|retir|n.est plus|fin de l.offre|cesse/i.test(q)),checkedAt:now.toISOString(),sourceHash:hash(content),clauses:Object.fromEntries(rows),dates:pdf?offerDates(content.slice(0,3500)):{effectiveAt:null,promotionEndsAt:null},conditions:extractOfferConditions(clauses.join(' ')),clauseCount:rows.size}
}
export function compareOfferSnapshots(before,after,source,url) {
  if(!before||before.version!==after.version||before.semanticVersion!==after.semanticVersion||before.semanticVersion!==2||before.referenceKey!==after.referenceKey||before.documentRegion!==after.documentRegion)return null
  const changes=Object.entries(after.clauses).flatMap(([key,row])=>before.clauses[key]&&before.clauses[key].value!==row.value?[{key,type:'changed',product:row.product??null,scope:row.scope??null,conditions:row.conditions??null,before:before.clauses[key].quote,after:row.quote}]:[])
  // New/withdrawn conditions require an unchanged product context and stable
  // extraction coverage. Missing text alone is never evidence of withdrawal.
  const common=Object.keys(after.clauses).filter(k=>before.clauses[k])
  const stable=common.length/Math.max(1,Object.keys(before.clauses).length)>=.8
  if(stable){
    for(const [key,row]of Object.entries(after.clauses))if(!before.clauses[key]&&row.product&&before.productContexts?.includes(row.product)&&!/supprim|retir|n.est plus|fin de l.offre/i.test(row.quote)&&!Object.values(before.clauses).some(old=>sameClauseValue(old,row)))changes.push({key,type:'added',product:row.product,scope:row.scope,conditions:row.conditions,before:'Clause absente de la version complète précédente',after:row.quote})
    for(const [key,row]of Object.entries(before.clauses))if(!after.clauses[key]&&row.product&&after.productContexts?.includes(row.product)){
      const terms=normalizeEditorial(row.quote).match(/[a-z]{4,}/g)?.filter(w=>!normalizeEditorial(row.product).includes(w))??[]
      const withdrawal=after.withdrawalEvidence.find(q=>normalProduct(q)===row.product&&new Set(terms.filter(w=>normalizeEditorial(q).includes(w))).size>=2)
      if(withdrawal)changes.push({key,type:'withdrawn',product:row.product,scope:row.scope,conditions:row.conditions,before:row.quote,after:withdrawal})
    }
  }
  if(!changes.length)return null
  const excerpt=changes.map(c=>`Avant : ${c.before}\nAprès : ${c.after}`).join('\n\n')
  const clauseDates=offerDates(changes.map(c=>c.after).join(' ')),dates={effectiveAt:source.kind==='tariff'?after.dates.effectiveAt:clauseDates.effectiveAt,promotionEndsAt:clauseDates.promotionEndsAt},publicationId=`${url}#change-${hash(JSON.stringify([changes,before.sourceHash,before.checkedAt])).slice(0,20)}`
  return {family:'pouvoir-achat',entity:`publication-${hash(publicationId).slice(0,20)}`,field:'announcement',fieldLabel:'Conditions financières comparées',label:`${source.name} : changement de conditions observé`,value:changes,publicationId,sourceUrl:url,publisher:source.name,publishedAt:null,period:after.checkedAt,checkedAt:after.checkedAt,scope:'Clients et produits des clauses citées ; aucun périmètre régional étendu',populationScope:'Clients concernés par les clauses comparées ; voir conditions intégrales de la source',topic:source.kind==='tariff'?'frais':'epargne',topicLabel:source.kind==='tariff'?'Frais bancaires':'Offres d’épargne et bancaires',status:'Changement observé entre deux contrôles',factType:'consumer-announcement',summary:excerpt.slice(0,700),conditions:extractOfferConditions(changes.map(c=>c.after).join(' ')),...dates,changeEvidence:{version:1,beforeHash:before.sourceHash,afterHash:after.sourceHash,beforeCheckedAt:before.checkedAt,observedAt:after.checkedAt,sourceUrl:url,changes},evidenceLevel:'official',sources:[{url,role:'official',label:source.name}],evidence:{sourceHash:after.sourceHash,excerpt,method:'Deux versions comparables de clauses complètes. Dates de contrôle, pas dates d’annonce. Associations par produit conservées. Ajouts qualifiés avec couverture stable ; retrait uniquement sur mention explicite, jamais sur disparition seule.'},discovery:true,backfill:false,rule:'announcement',maxAgeDays:400,tool:null,reason:'Changement de montant dans une clause comparable prouvé par deux versions ; date de publication inconnue, périmètre limité aux conditions citées.',angle:'Quelles conditions ont changé pour les clients concernés ? Citer les deux versions et la date d’effet si elle est documentée.'}
}
export function unexplainedOfferOmissions(before,after) {
  if(!before||before.semanticVersion!==after.semanticVersion)return []
  return Object.entries(before.clauses).flatMap(([key,row])=>{
    if(after.clauses[key])return []
    // A semantically identical rewording does not establish a new condition.
    if(Object.values(after.clauses).some(next=>sameClauseValue(row,next)))return []
    const terms=normalizeEditorial(row.quote).match(/[a-z]{4,}/g)?.filter(w=>!normalizeEditorial(row.product).includes(w))??[]
    if(row.product&&after.withdrawalEvidence.some(q=>normalProduct(q)===row.product&&new Set(terms.filter(w=>normalizeEditorial(q).includes(w))).size>=2))return []
    return [{key,product:row.product,quote:row.quote,reason:'Clause non retrouvée ; aucune suppression prouvée. Dernière référence valide conservée.'}]
  })
}
