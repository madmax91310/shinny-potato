import { cleanText } from './purchasing-power-news.mjs'
export const EXTRA_SOURCES = [
  {id:'xetra',name:'Deutsche Börse / Xetra · cotations ETF',url:'https://www.cashmarket.deutsche-boerse.com/cash-en/Stay-Informed/newsroom/press-releases',method:'extra-links',host:'www.cashmarket.deutsche-boerse.com',family:'etf',path:'/cash-en/Stay-Informed/newsroom/press-releases/',depth:'Communiqués de cotation courants, tous émetteurs, sans catalogue ; une cotation ne prouve pas une création'},
  {id:'bnp',name:'BNP Paribas AM · communiqués',url:'https://www.bnpparibas-am.com/en/media-centre/',method:'extra-bnp',host:'www.bnpparibas-am.com',family:'etf',depth:'API publique de la page, deux pages de douze communiqués, sans catalogue'},
  {id:'xtrackers',name:'Xtrackers · salle de presse',url:'https://etf.dws.com/en-gb/about-us/press-releases/',method:'extra-links',host:'etf.dws.com',family:'etf',path:'/en-gb/about-us/press-releases/',depth:'Table datée de la salle de presse ETF, année courante rendue'},
  {id:'hanetf',name:'HANetf · communiqués UCITS',url:'https://hanetf.com/press-releases/',method:'extra-links',host:'hanetf.com',family:'etf',path:'/press-releases/',depth:'Communiqués rendus par le site, indépendants du catalogue'},
  {id:'notaires-paris',name:'Notaires du Grand Paris · conjoncture',url:'https://paris.notaires.fr/fr/liste-communiques-de-presse',method:'extra-links',host:'paris.notaires.fr',family:'economie',path:'/fr/presse/communication-immobiliere-',depth:'Première page des communications immobilières officielles'},
  {id:'credit-logement',name:'Observatoire Crédit Logement / CSA',url:'https://lobservatoire.creditlogement.fr/analyses-mensuelles/',method:'extra-links',host:'lobservatoire.creditlogement.fr',family:'economie',path:'/publications/analyse-marche-immobilier-',depth:'Publications mensuelles rendues, taux complémentaires avec méthode propre'},
  {id:'oll',name:'Observatoires locaux des loyers / ANIL',url:'https://www.observatoires-des-loyers.org/decouvrir-le-reseau/publications/publications-locales',method:'extra-links',host:'www.observatoires-des-loyers.org',family:'economie',path:'/decouvrir-le-reseau/publications/details/',depth:'Première page des résultats locaux publiés ; aucune série locale reconstruite'},
  {id:'dvf',name:'DVF · DGFiP / data.gouv.fr',url:'https://www.data.gouv.fr/api/1/datasets/demandes-de-valeurs-foncieres/',method:'extra-dvf',host:'www.data.gouv.fr',family:'economie',depth:'Métadonnées des livraisons semestrielles ; aucun téléchargement massif horaire'},
]
const clean = value => cleanText(value ?? '')
export const tagContent = (html, tag) => clean(html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`,'i'))?.[1])
export function checkedOfficial(value, source) {
  const url=new URL(clean(value),source.url)
  if(url.protocol!=='https:'||url.hostname!==source.host||url.username||url.password||url.port)throw Error('Lien externe au domaine officiel')
  for(const key of [...url.searchParams.keys()])if(/^utm_|^xtor$|^fbclid$/.test(key))url.searchParams.delete(key)
  url.hash='';return url.href.replace(/\/$/,'')
}
export async function extraDiscovery(content,source,request) {
  if(!source.method.startsWith('extra-'))return null
  if(source.id==='dvf'){
    const data=JSON.parse(content)
    if(data.slug!=='demandes-de-valeurs-foncieres'||!Array.isArray(data.resources)||data.license!=='lov2')throw Error('Contrat de livraison DVF ou licence modifié')
    return [{url:source.url,title:data.title,dataset:data}]
  }
  if(source.id==='bnp'){
    const cfg=JSON.parse(content.match(/var ajax_params = (\{[^;]+\});/)?.[1]??'{}')
    const endpoint=checkedOfficial(cfg.ajax_url,source)
    if(!endpoint.endsWith('/wp-admin/admin-ajax.php')||!cfg.nonce)throw Error('API publique BNP non trouvée dans la page')
    const rows=[]
    for(const page of [1,2]){
      const response=await request(endpoint,{method:'POST',signal:AbortSignal.timeout(20000),body:new URLSearchParams({action:'load_more_archive',nonce:cfg.nonce,page:String(page),posts_per_page:'12',taxonomy:'mediaroom',post_type:'mediaroom',term_id:'',start:'',end:'',post_content:''})})
      if(!response.ok)throw Error(`API publique BNP HTTP ${response.status}`)
      const json=await response.json()
      if(!json.success||!Array.isArray(json.data))throw Error('Format de liste BNP modifié')
      for(const post of json.data){
        if(!/\bETF|exchange.traded|UCITS/i.test(post.post_title))continue
        const date=post.post_date?.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/)
        if(!date)throw Error('Date officielle BNP absente')
        rows.push({url:checkedOfficial(post.url,source),title:clean(post.post_title),publishedAt:`${date[3].length===2?'20':''}${date[3]}-${date[2]}-${date[1]}`})
      }
    }
    // A real list can legitimately contain no relevant ETF article.
    return [...new Map(rows.map(row=>[row.url,row])).values()]
  }
  const rows=[]
  const blocks=source.id==='xtrackers'?[...content.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>m[1]):[content]
  for(const block of blocks)for(const [,href,raw]of block.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    let url;try{url=checkedOfficial(href,source)}catch{continue}
    if(!new URL(url).pathname.startsWith(source.path)||new URL(url).pathname.replace(/\/$/,'')===source.path.replace(/\/$/,''))continue
    const title=tagContent(raw,'h3')||clean(raw)
    if(!title||title.length>700)continue
    const row={url,title}
    if(source.id==='xtrackers'){
      const date=clean(block).match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/)
      if(!date)throw Error('Date de la table Xtrackers absente')
      row.publishedAt=`${date[3]}-${date[2]}-${date[1]}`
    }
    rows.push(row)
  }
  if(!rows.length)throw Error('Liste officielle vide ou format modifié')
  return [...new Map(rows.map(row=>[row.url,row])).values()]
}
const MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december']
const FR=['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre']
export function extraDate(html,source,listing={}){
  if(listing.publishedAt)return listing.publishedAt
  if(source.id==='xetra'){const d=clean(html.match(/class="dbx-tagline-date__topline"[^>]*>([\s\S]*?)<\/div>/)?.[1]).match(/([A-Za-z]{3}) (\d{1,2}), (20\d{2})/);if(d){const m=MONTHS.findIndex(x=>x.startsWith(d[1].toLowerCase()))+1;if(m)return `${d[3]}-${String(m).padStart(2,'0')}-${d[2].padStart(2,'0')}`}}
  const meta=html.match(/<meta[^>]*(?:property|name)=["'](?:article:published_time|datePublished)["'][^>]*content=["'](\d{4}-\d{2}-\d{2})/i)?.[1]
  if(meta)return meta
  const normalized=html.replace(/\\\//g,'/')
  const dates=[...normalized.matchAll(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/g)].map(m=>m[1])
  if(new Set(dates).size===1)return dates[0]
  const time=html.match(/<time\b[^>]*datetime=["'](\d{4}-\d{2}-\d{2})/i)?.[1]
  if(time)return time
  // Restrict unstructured date parsing to a publication header; never lastmod.
  const header=clean(html.slice(Math.max(0,html.indexOf('<h1')),html.indexOf('<h1')+7000)).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()
  const match=header.match(/(?:publie le|publie|published|publication|date de publication|le)\s*:?\s*(\d{1,2})[\s/.-]+([a-z]+|\d{2})[\s/.-]+(20\d{2})/)
  if(match){const month=/^\d+$/.test(match[2])?Number(match[2]):Math.max(MONTHS.indexOf(match[2]),FR.indexOf(match[2]))+1;if(month>0&&month<=12)return`${match[3]}-${String(month).padStart(2,'0')}-${match[1].padStart(2,'0')}`}
  throw Error(`Date de publication officielle absente (${source.id})`)
}
export function extraSummary(html,source){
  let main=source.id==='credit-logement' ? html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html : html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]??html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]??html.slice(html.indexOf('<h1'))
  main=main.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
  if(source.id==='credit-logement') {
    const table=[...main.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map(m=>m[1]).find(t=>/taux moyen|TAUX FIXES/i.test(clean(t)))
    if(table) {
      const rows=[...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(c=>clean(c[1])).join(' · '))
      return `Prêts du secteur concurrentiel aux particuliers, taux fixes (en %). Chaque ligne conserve ses durées distinctes.\n${rows.join('\n')}`
    }
  }
  let paragraphs=[...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>clean(m[1])).filter(text=>text.length>75&&/\d/.test(text)&&(/[%€]|euros|millions|milliards|m2|m²/i.test(text)||source.family==='etf')&&!/@|cookies|copyright|tous droits/i.test(text))
  if(!paragraphs.length) {
    const tables=[...main.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map(m=>m[1]);
    for(const table of tables.slice(0,2)){ const rows=[...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(c=>clean(c[1])).join(' · ')); if(rows.length>1) paragraphs.push(rows.join('\n')) }
  }
  if(!paragraphs.length)throw Error(`Résumé chiffré officiel absent (${source.id})`)
  return paragraphs.slice(0,3).join('\n\n')
}
export function creditLogementDiffusion(html) {
  // WordPress datePublished can name the statistical month. Only an explicit
  // statement that the results were presented on a dated conference qualifies.
  const text=clean(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]??html).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()
  const m=text.match(/(?:temporalites|resultats|analyses)[^.]{0,180}presente[^.]{0,100}conference du (\d{1,2}) ([a-z]+) (20\d{2})/)
  if(!m||!FR.includes(m[2]))return null
  const date=`${m[3]}-${String(FR.indexOf(m[2])+1).padStart(2,'0')}-${m[1].padStart(2,'0')}`
  return Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date?date:null
}
export function statisticalPeriod(title){
 const t=clean(title).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()
 const numeric=t.match(/\b(20\d{2}(?:-(?:q[1-4]|\d{2}))?)\b/)?.[1]
 const quarter=t.match(/(premier|deuxieme|troisieme|quatrieme|1er|2e|3e|4e) trimestre (20\d{2})/)
 if(quarter){const q={'premier':1,'deuxieme':2,'troisieme':3,'quatrieme':4,'1er':1,'2e':2,'3e':3,'4e':4}[quarter[1]];return`${quarter[2]}-Q${q}`}
 const months=[...t.matchAll(new RegExp(`\\b(${FR.join('|')})\\b`,'g'))].map(m=>FR.indexOf(m[1])+1)
 const year=t.match(/\b20\d{2}\b/)?.[0]
 if(year&&months.length)return[...new Set(months)].map(m=>`${year}-${String(m).padStart(2,'0')}`).join(' / ')
 return numeric?.replace('-q','-Q')??null
}
