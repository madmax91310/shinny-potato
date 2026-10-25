import { cleanText } from './purchasing-power-news.mjs'
import { consumerRejection } from './radar-consumer.mjs'

// Only public, observed listing contracts. They feed the existing durable queue.
const bank = (id,name,url,format,path,depth) => ({id,name,url,host:new URL(url).hostname,method:'consumer-coverage',format,path,depth,family:'pouvoir-achat',evidenceLevel:'official',cadenceMinutes:60})
export const COVERAGE_SOURCES = [
 bank('bnp-bank','BNP Paribas · groupe','https://group.bnpparibas/rss/news/communique-de-presse','rss',null,'Fenêtre RSS officielle ; groupe international, aucune offre généralisée à la France'),
 bank('credit-agricole-news','Crédit Agricole · groupe et réseaux','https://presse.credit-agricole.com/fr/?lang=fra','ca',null,'Cartes datées de l’accueil ; groupe, filiales et caisses distingués dans le texte'),
 bank('sg-bank','Société Générale · groupe','https://www.societegenerale.com/fr/communiques-de-presse','sg','/fr/actualites/communiques-de-presse/','Première page de cartes datées ; archive non exhaustive'),
 bank('bpce-bank','BPCE · Banque Populaire et Caisse d’Épargne','https://newsroom.groupebpce.fr/','bpce','/actualites/','Cartes datées de l’accueil ; offre limitée aux réseaux / clients explicitement cités'),
 bank('cm-cic','Crédit Mutuel Alliance Fédérale · réseaux et CIC','https://www.creditmutuel.fr/fr/alliancefederale/presse/communiques-de-presse-et-actualites.html','cm','/fr/alliancefederale/presse/communiques-de-presse/','Première page de l’archive officielle ; fédérations et CIC seulement lorsque cités'),
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
export async function coverageDiscovery(content,source,request) {
 if(!source.format)return null
 let pages=[content],archiveWarning=null
 if(source.format==='lbp') {
  const url=source.url.replace('.typo-pressrelease.html','.typo-pressrelease.p-2.html')
  // Preserve all first-page results when the deeper archive is temporarily down.
  // The failure is reported, rather than silently declared as full depth.
  try {
   const response=await request(url,{signal:AbortSignal.timeout(20000)})
   if(!response.ok)throw Error(`HTTP ${response.status}`)
   pages.push(await response.text())
  }catch(error){archiveWarning=`Archive La Banque Postale page 2 : ${error.message}`}

 }
 const rows=[]
 for(const html of pages) {
  if(source.format==='rss') {
   if(!/<rss\b/i.test(html)||!/<\/rss>\s*$/i.test(html))throw Error('Flux RSS absent ou tronqué')
   for(const [,item] of html.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi))rows.push({url:urlFor(tag(item,'link'),source),title:tag(item,'title'),description:tag(item,'description').slice(0,700),publishedAt:new Date(tag(item,'pubDate')).toISOString().slice(0,10)})
   if(!rows.length)throw Error('Flux RSS anormalement vide')
   continue
  }
  let blocks
  if(source.format==='ca')blocks=html.split(/<div\b[^>]*class="[^"]*post-info\b/).slice(1)
  else if(source.format==='bpce')blocks=[...html.matchAll(/<h[23]\b[^>]*class="card-title"[^>]*>([\s\S]*?)(?=<h[23]\b[^>]*class="card-title"|$)/gi)].map(m=>m[0])
  else if(source.format==='lbp')blocks=html.split(/<div\b[^>]*class="o-newslist__push__content"/).slice(1)
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
   const datePart=source.format==='ca'?block.match(/class="date"[^>]*>([\s\S]*?)<\/p>/)?.[1]:source.format==='saxo'?block.match(/datetime="(\d{4}-\d{2}-\d{2})/)?.[1]:clean(block)
   const publishedAt=source.format==='saxo'?datePart:coverageDate(datePart)
   if(!publishedAt)throw Error('Date officielle de la carte absente')
   const description=source.format==='ca'?clean(block.match(/class="content"[^>]*>([\s\S]*?)<\/div>/)?.[1]).slice(0,700):source.format==='bpce'?clean(block.match(/class="card-text"[^>]*>([\s\S]*?)<\/p>/)?.[1]).slice(0,700):''
   rows.push({url,title,publishedAt,description})
  }
 }
 if(!rows.length)throw Error('Liste officielle vide ou contrat de découverte modifié')
 for(const row of rows) {
  if(source.family==='etf')row.listingRejection=/\bETF|UCITS|exchange.traded/i.test(row.title)?null:'Communiqué sans annonce ETF'
  else row.listingRejection=/\bETF|UCITS/i.test(row.title)?null:consumerRejection(row.title,row.description)
  if(/nomination|grande client[eè]le|cession de l.activit[eé]|r[eé]seaux [eé]nerg[eé]tiques|banque commerciale en belgique|march[eé] nordique|foncier rural|finances locales|d[eé]partements.*financier|financier.*d[eé]partements/i.test(row.title))row.listingRejection='Communication corporate, financement institutionnel ou offre étrangère sans conséquence pour les particuliers français'
 }
 const unique=[...new Map(rows.map(row=>[row.url,row])).values()]
 if(archiveWarning)unique.archiveWarning=archiveWarning
 return unique
}
