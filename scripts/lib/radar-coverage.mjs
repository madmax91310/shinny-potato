import { assertRadarAccess } from './radar-source-health.mjs'
import { cleanText } from './purchasing-power-news.mjs'
import { consumerRejection } from './radar-consumer.mjs'
import {documentText} from './radar-news.mjs'
import {createHash} from 'node:crypto'

// Only public, observed listing contracts. They feed the existing durable queue.
const bank = (id,name,url,format,path,depth) => ({id,name,url,host:new URL(url).hostname,method:'consumer-coverage',format,path,depth,family:'pouvoir-achat',evidenceLevel:'official',cadenceMinutes:60})
export const COVERAGE_SOURCES = [
 bank('bnp-bank','BNP Paribas · groupe','https://group.bnpparibas/rss/news/communique-de-presse','rss',null,'Fenêtre RSS officielle ; groupe international, aucune offre généralisée à la France'),
 bank('credit-agricole-news','Crédit Agricole · groupe et réseaux','https://presse.credit-agricole.com/fr/?lang=fra','ca',null,'Cartes datées de l’accueil ; groupe, filiales et caisses distingués dans le texte'),
 bank('sg-bank','Société Générale · groupe','https://www.societegenerale.com/fr/communiques-de-presse','sg','/fr/actualites/communiques-de-presse/','Première page de cartes datées ; archive non exhaustive'),
 bank('bpce-bank','BPCE · Banque Populaire et Caisse d’Épargne','https://newsroom.groupebpce.fr/','bpce','/actualites/','Cartes datées de l’accueil ; offre limitée aux réseaux / clients explicitement cités'),
 {...bank('cm-cic','Crédit Mutuel Alliance Fédérale · réseaux et CIC','https://www.creditmutuel.fr/fr/alliancefederale/presse/communiques-de-presse-et-actualites.html','cm','/fr/alliancefederale/presse/communiques-de-presse/','Première page de l’archive officielle ; fédérations et CIC seulement lorsque cités'),discoveryVersion:1},
 bank('lbp-bank','La Banque Postale · communiqués','https://www.labanquepostale.com/newsroom-publications.typo-pressrelease.html','lbp','/content/dam/lbp/documents/communiques-de-presse/','Deux pages de six communiqués PDF datés',),
 bank('saxo-news','Saxo Banque France','https://www.home.saxo/fr-fr/about-us/media-center','saxo','/fr-fr/content/commentaries/pr/press-release/','Articles français datés rendus dans le centre médias'),
 {id:'invesco',name:'Invesco · communiqués européens',url:'https://www.invesco.com/uk/en/about-us/media-hub.html',host:'www.invesco.com',method:'extra-coverage',format:'invesco',family:'etf',cadenceMinutes:120,depth:'Table datée 2026 et archives rendues ; documents PDF officiels, sans catalogue'},
 {id:'spdr-news',name:'State Street · communiqués',url:'https://newsroom.statestreet.com/rss/pressrelease.aspx',host:'newsroom.statestreet.com',method:'extra-coverage',format:'rss',family:'etf',cadenceMinutes:120,requireUcits:true,depth:'Fenêtre RSS mondiale ; seuls les communiqués explicitement UCITS sont exploitables en Europe'},
]
const clean=v=>cleanText(v??'')
const tag=(s,t)=>clean(s.match(new RegExp(`<${t}\\b[^>]*>([\\s\\S]*?)<\\/${t}>`,'i'))?.[1])
const fr=['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre']
const en=['january','february','march','april','may','june','july','august','september','october','november','december']
export function coverageDate(raw) {
 const text=clean(raw).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()
 let m=text.match(/\b(\d{2})[./](\d{2})[./](20\d{2})\b/),date
 if(m)date=`${m[3]}-${m[2]}-${m[1]}`
 else if((m=text.match(/\b(\d{1,2}) ([a-z]+) (20\d{2})\b/))&&fr.includes(m[2]))date=`${m[3]}-${String(fr.indexOf(m[2])+1).padStart(2,'0')}-${m[1].padStart(2,'0')}`
 else if((m=text.match(/\b([a-z]+) (\d{1,2}),? (20\d{2})\b/))&&en.some(name=>name===m[1]||m[1].length===3&&name.startsWith(m[1])))date=`${m[3]}-${String(en.findIndex(name=>name===m[1]||m[1].length===3&&name.startsWith(m[1]))+1).padStart(2,'0')}-${m[2].padStart(2,'0')}`
 if(!date || new Date(date).toISOString().slice(0,10)!==date)throw Error('Date de la carte officielle absente ou invalide')
 return date
}
function urlFor(href,source) {
 const url=new URL(clean(href),source.url)
 if(url.protocol!=='https:'||url.hostname!==source.host||url.username||url.password||url.port)throw Error('Document hors domaine officiel')
 url.hash='';return url.href.replace(/\/$/,'')
}
const normalizedTitle=text=>clean(text).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'')
export async function qualifyCmCardDate(rawDate,title,url,request,extractDocument=documentText) {
 const abbreviated=/^(\d{2})\/(\d{2})\/(\d{2})$/.exec(clean(rawDate))
 if(!abbreviated)throw Error('Date de carte non corroborable par le communiqué')
 const response=await request(url,{signal:AbortSignal.timeout(20000)})
 if(!response.ok)throw Error(`Article officiel : HTTP ${response.status}`)
 if(response.url&&new URL(response.url).hostname!=='www.creditmutuel.fr')throw Error('Redirection hors du domaine officiel')
 const html=await response.text();assertRadarAccess(html)
 const links=[...new Set([...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].filter(m=>/^Télécharger le communiqué(?:\s|$)/i.test(clean(m[2]))).map(m=>new URL(clean(m[1]),url).href))]
 if(links.length!==1)throw Error('Communiqué PDF lié absent ou ambigu')
 const pdfUrl=new URL(links[0])
 if(pdfUrl.origin!=='https://cdnwmsi.e-i.com'||pdfUrl.username||pdfUrl.password||pdfUrl.search||pdfUrl.hash||!pdfUrl.pathname.startsWith('/SITW/wm/global/1.0.0/corporate/communiques/')||!pdfUrl.pathname.endsWith('.pdf'))throw Error('Document hors du CDN officiel lié')
 const pdf=await request(pdfUrl.href,{signal:AbortSignal.timeout(20000)})
 if(!pdf.ok)throw Error(`Communiqué officiel : HTTP ${pdf.status}`)
 if(pdf.url&&new URL(pdf.url).hostname!==pdfUrl.hostname)throw Error('Redirection hors du CDN officiel')
 const bytes=Buffer.from(await pdf.arrayBuffer())
 if(bytes.length>2500000||bytes.subarray(0,5).toString()!=='%PDF-')throw Error('Communiqué PDF attendu')
 const text=await extractDocument(new Response(bytes,{headers:{'content-type':'application/pdf'}}))
 const firstLine=text.split(/\r?\n/).find(line=>line.trim())??''
 const publishedAt=coverageDate(firstLine),[year,month,day]=publishedAt.split('-')
 if(day!==abbreviated[1]||month!==abbreviated[2]||year.slice(-2)!==abbreviated[3])throw Error('Date du communiqué contradictoire avec la carte')
 const prefix=normalizedTitle(title.replace(/(?:\.{3}|…).*/,''))
 if(prefix.length<15||!normalizedTitle(text.slice(0,1600)).includes(prefix))throw Error('Identité du communiqué différente de la carte')
 return {publishedAt,publicationDateEvidence:{sourceUrl:pdfUrl.href,sha256:createHash('sha256').update(bytes).digest('hex'),articleSourceUrl:url,articleSha256:createHash('sha256').update(html).digest('hex'),publishedAt,cardDate:clean(rawDate),method:'Date complète du cartouche du communiqué PDF officiellement lié ; jour, mois, suffixe d’année et titre recoupés.'}}
}
function lbpPage(html,source) {
 assertRadarAccess(html)
 const rows=[]
 for(const block of html.split(/<div\b[^>]*class="o-newslist__push__content"/).slice(1)) {
  const href=block.match(/<a\b[^>]*href=["']([^"']+)["']/i)?.[1]
  if(!href)continue
  const url=urlFor(href,source)
  if(!new URL(url).pathname.startsWith(source.path))continue
  const title=tag(block,'h3')||tag(block,'h2')||tag(block,'a')
  if(!title||title.length>700)throw Error('Titre de la carte officielle LBP absent')
  rows.push({url,title,publishedAt:coverageDate(clean(block)),description:''})
 }
 if(!rows.length)throw Error('Liste officielle LBP vide ou format modifié')
 return rows
}
export async function coverageDiscovery(content,source,request,extractDocument=documentText) {
 if(!source.format)return null
 let pages=[content],archiveWarning=null
 const discoveryFailures=[]
 let dateProofAttempts=0
 if(source.format==='lbp') {
  const url=source.url.replace('.typo-pressrelease.html','.typo-pressrelease.p-2.html')
  // Preserve all first-page results when the deeper archive is temporarily down.
  // The failure is reported, rather than silently declared as full depth.
  try {
   const response=await request(url,{signal:AbortSignal.timeout(20000)})
   if(!response.ok)throw Error(`HTTP ${response.status}`)
   if(response.url && new URL(response.url).hostname!==source.host)throw Error('Redirection hors du domaine officiel')
   const archive=await response.text()
   lbpPage(archive,source) // Validate depth before accepting it; a soft denial is not an empty healthy archive.
   pages.push(archive)
  }catch(error){archiveWarning=`Archive La Banque Postale page 2 : ${error.message}`}

 }
 const rows=[]
 for(const html of pages) {
  if(source.format==='lbp'){rows.push(...lbpPage(html,source));continue}
  if(source.format==='rss') {
   if(!/<rss\b/i.test(html)||!/<\/rss>\s*$/i.test(html))throw Error('Flux RSS absent ou tronqué')
   for(const [,item] of html.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi))rows.push({url:urlFor(tag(item,'link'),source),title:tag(item,'title'),description:tag(item,'description').slice(0,700),publishedAt:new Date(tag(item,'pubDate')).toISOString().slice(0,10)})
   if(!rows.length)throw Error('Flux RSS anormalement vide')
   continue
  }
  let blocks
  if(source.format==='ca')blocks=html.split(/<div\b[^>]*class="[^"]*post-info\b/).slice(1)
  else if(source.format==='bpce')blocks=[...html.matchAll(/<h[23]\b[^>]*class="card-title"[^>]*>([\s\S]*?)(?=<h[23]\b[^>]*class="card-title"|$)/gi)].map(m=>m[0])
  else if(source.format==='cm')blocks=[...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)].map(m=>m[1])
  else if(source.format==='invesco')blocks=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>m[1])
  else blocks=[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>m[0])
  for(const block of blocks) {
   const href=source.format==='ca'?block.match(/class="post-overlink"\s+href="([^"]+)"/)?.[1]:block.match(/<a\b[^>]*href=["']([^"']+)["']/i)?.[1]
   if(!href)continue
   let url;try{url=urlFor(href,source)}catch{continue}
   if(source.path&&!new URL(url).pathname.startsWith(source.path))continue
   const title=(source.format==='bpce'?tag(block,'a'):null)||tag(block,'h3')||tag(block,'h2')||(source.format==='sg'?clean(block.match(/class="actu-thumb-title"[^>]*>([\s\S]*?)<\/div>/)?.[1]):tag(block,'a'))
   if(!title||title.length>700)continue
   if(source.format==='invesco'&&!/\bETF|UCITS|exchange.traded/i.test(title))continue
   const datePart=source.format==='ca'?block.match(/class="date"[^>]*>([\s\S]*?)<\/p>/)?.[1]:source.format==='cm'?block.match(/class="tile__article__date"[^>]*>([\s\S]*?)<\/p>/)?.[1]:source.format==='saxo'?block.match(/datetime="(\d{4}-\d{2}-\d{2})/)?.[1]:clean(block)
   let publishedAt,publicationDateEvidence
   try{publishedAt=source.format==='saxo'?datePart:coverageDate(datePart)}
   catch(error){
    if(source.format!=='cm')throw error
    // One undated/ambiguous card does not discard the other dated cards.
    // Never infer a century from collection time or from adjacent articles.
    try{
     if(dateProofAttempts>=2)throw Error('Limite de deux contrôles documentaires de date par archive')
     dateProofAttempts++
     const qualified=await qualifyCmCardDate(datePart,title,url,request,extractDocument)
     publishedAt=qualified.publishedAt;publicationDateEvidence=qualified.publicationDateEvidence
    }catch(qualificationError){discoveryFailures.push({url,title,field:'publishedAt',rawDate:clean(datePart),reason:`${error.message} ; ${qualificationError.message}`});continue}
   }
   if(!publishedAt)throw Error('Date officielle de la carte absente')
   const description=source.format==='ca'?clean(block.match(/class="content"[^>]*>([\s\S]*?)<\/div>/)?.[1]).slice(0,700):source.format==='bpce'?clean(block.match(/class="card-text"[^>]*>([\s\S]*?)<\/p>/)?.[1]).slice(0,700):''
   rows.push({url,title,publishedAt,description,...(publicationDateEvidence?{publicationDateEvidence}:{})})
  }
 }
 if(!rows.length)throw Error('Liste officielle vide ou contrat de découverte modifié'+(discoveryFailures.length?': '+discoveryFailures.map(r=>`${r.url} (${r.reason})`).join('; '):''))
 for(const row of rows) {
  if(source.family==='etf')row.listingRejection=/\bETF|UCITS|exchange.traded/i.test(row.title)?null:'Communiqué sans annonce ETF'
  else row.listingRejection=/\bETF|UCITS/i.test(row.title)?null:consumerRejection(row.title,row.description)
  if(/nomination|grande client[eè]le|cession de l.activit[eé]|r[eé]seaux [eé]nerg[eé]tiques|banque commerciale en belgique|march[eé] nordique|foncier rural|finances locales|d[eé]partements.*financier|financier.*d[eé]partements/i.test(row.title))row.listingRejection='Communication corporate, financement institutionnel ou offre étrangère sans conséquence pour les particuliers français'
 }
 const unique=[...new Map(rows.map(row=>[row.url,row])).values()]
 if(discoveryFailures.length){
  unique.discoveryFailures=discoveryFailures
  unique.expectedListingItems=new Set([...unique,...discoveryFailures].map(row=>row.url)).size
  archiveWarning=[archiveWarning,`Cartes non qualifiées (${discoveryFailures.length}/${unique.expectedListingItems}) : `+discoveryFailures.map(r=>`${r.url} — ${r.field} : ${r.reason} [${r.rawDate}]`).join('; ')].filter(Boolean).join('; ')
 }
 if(archiveWarning)unique.archiveWarning=archiveWarning
 return unique
}
