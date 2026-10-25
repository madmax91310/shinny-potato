// Proof-based relationships in the existing publication store. A dossier links
// distinct stages; it never rewrites event IDs or equates a listing to a launch.
const normal = value => String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
const sourceKey=o=>JSON.stringify([o.family,o.publicationId,o.publishedAt??o.period])
const productKey=p=>normal(p.name).replace(/\bucits (?:fund )?etf\b.*$/,'').trim()
const prose=o=>normal(o.summary??o.evidence?.excerpt??'')
const financialNumbers=text=>new Set([...String(text??'').matchAll(/\b(\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)([.,]\d+)?\s*(%|€|euros?\b)/gi)].map(m=>Number((m[1]+(m[2]??'')).replace(/\s/g,'').replace(',','.'))+' '+(m[3]==='%'?'%':'EUR')))
const scalarNumbers=text=>new Set([...text.matchAll(/\b\d(?:[\d\s\u202f\u00a0]*\d)?(?:[,.]\d+)?/g)].map(m=>m[0].replace(/[\s\u202f\u00a0]/g,'').replace(',','.')).filter(x=>+x>=10 && !/^20\d\d$/.test(x)))
export function relatePublications(state) {
  const docs=Object.values(state.documents).filter(d=>d.observation), official=docs.map(d=>d.observation).filter(o=>o.evidenceLevel==='official'&&o.evidence?.sourceHash)
  for(const d of docs){
    const o=d.observation
    if(o.evidenceLevel==='journalistic'&&o.relationship?.type==='reprise'){delete o.eventKey;delete o.dossierKey;delete o.relationship}
    if(o.evidenceLevel!=='journalistic'||o.correctionOf||o.analysisContribution||/notre (?:analyse|enquete|calcul)|simulation|comparatif|decryptage|ce qu.on|pourquoi|comment /.test(normal(o.label)))continue
    const linked=o.sources?.filter(r=>['original-link-unverified','official-original-extracted'].includes(r.role))??[]
    for(const primary of official){
      if(primary.publishedAt!==o.publishedAt||primary.sourceUrl===o.sourceUrl)continue
      const explicit=linked.some(r=>r.url.replace(/\/$/,'')===primary.sourceUrl.replace(/\/$/,''))
      const shared=[...scalarNumbers(prose(o))].filter(n=>scalarNumbers(prose(primary)).has(n))
      const namedStudy=/\binsee\b/.test(prose(o))&&/etude|chiffres|publication/.test(prose(o))&&primary.sourceUrl.startsWith('https://www.insee.fr/fr/statistiques/')&&shared.length>=2&&/\b20\d\d\b/.test(prose(o))
      if(!explicit&&!namedStudy)continue
      const primaryFacts=financialNumbers(primary.summary??primary.evidence.excerpt),mediaFacts=financialNumbers(o.summary??o.evidence.excerpt)
      if(/moitie|median/.test(prose(primary)))primaryFacts.add('50 %')
      if(/sur dix/.test(prose(primary)))primaryFacts.add('10 %')
      if([...mediaFacts].some(n=>!primaryFacts.has(n)))continue
      // A citation with unrelated facts is not a reprise. Require corroborating
      // dated facts, or a matching named publication in the citation and title.
      const words=new Set(normal(primary.label).split(' ').filter(w=>w.length>=6)),common=normal(o.label).split(' ').filter(w=>words.has(w))
      if(shared.length<2 && common.length<2)continue
      o.eventKey=sourceKey(primary);o.dossierKey=primary.dossierKey??sourceKey(primary)
      o.relationship={type:'reprise',sourceUrl:primary.sourceUrl,sourceHash:primary.evidence.sourceHash,proof:explicit?'Citation dans le corps et faits de la publication corroborés':'Étude INSEE attribuée, même date, au moins deux chiffres corroborés',sharedFacts:shared}
      o.sources=[{url:primary.sourceUrl,role:'official-original-extracted',label:primary.publisher,sourceHash:primary.evidence.sourceHash},...(o.sources??[]).filter(r=>r.url!==primary.sourceUrl)]
      break
    }
  }
  // A multi-product issuer announcement can be linked to the corresponding
  // subset of a venue bulletin. Require the COMPLETE named product set (>=2),
  // an explicit launch statement, a documented listing date and compatible dates.
  const listings=official.filter(o=>o.family==='etf'&&['listing','trading','first-trading'].includes(o.announcementEvidence?.type))
  for(const announcement of official.filter(o=>o.family==='etf'&&['launch','announcement'].includes(o.announcementEvidence?.type))){
    const names=(announcement.products??[]).map(productKey).filter(Boolean)
    if(names.length<2 || !/lanc|launch/.test(normal(announcement.announcementEvidence.bodyEvidence??announcement.announcementEvidence.evidence)))continue
    for(const listing of listings){
      const listed=(listing.products??[]).map(productKey),matched=names.filter(n=>listed.includes(n))
      if(matched.length!==names.length||Math.abs(Date.parse(announcement.publishedAt)-Date.parse(listing.publishedAt))>7*86400000)continue
      const listingStatement=(announcement.calendarEvidence??announcement.supportingCalendarEvidence??'')+' '+(announcement.announcementEvidence.bodyEvidence??announcement.evidence.excerpt)
      if(!/cot|xetra|listing|listed|trading/.test(normal(listingStatement)))continue
      const venues=['xetra','euronext','london stock exchange','six swiss']
      const listingVenue=venues.filter(v=>normal(listing.publisher+' '+listing.label+' '+listing.scope).includes(v))
      if(listingVenue.length&&!listingVenue.some(v=>normal(listingStatement).includes(v)))continue
      const key=sourceKey(announcement)
      announcement.dossierKey=key
      listing.productDossiers??=[]
      if(!listing.productDossiers.some(r=>r.key===key))listing.productDossiers.push({key,publicationId:announcement.publicationId,names:announcement.products.filter(p=>listed.includes(productKey(p))).map(p=>p.name),sourceHash:announcement.evidence.sourceHash,proof:'Gamme complète nommée, lancement explicite et cotation documentée ; étapes conservées'})
      // A mixed venue bulletin stays a separate publication. Only a bulletin
      // entirely about the same product set becomes a stage of that dossier.
      if(matched.length===listed.length){listing.dossierKey=key;listing.relationship={type:'listing-stage',sourceUrl:announcement.sourceUrl,sourceHash:announcement.evidence.sourceHash,proof:'Même gamme complète et calendrier de cotation documenté'}}
    }
  }
}
