import { cleanText } from './purchasing-power-news.mjs'
import { editorialExclusion, normalizeEditorial } from '../../src/lib/radar-policy.js'
export const INSEE_SEARCH = {id:'insee-studies',name:'INSEE · recherche des études parues',url:'https://www.insee.fr/fr/solr/consultation',host:'www.insee.fr',method:'insee-search',family:'economie',cadenceMinutes:60,depth:'API publique de recherche : deux pages de 30 études grand public par diffusion + 30 résultats logements anciens ; RSS indépendants'}
export const inseeQuery = (start,q='*:*')=>({q,start,rows:30,filters:[{field:'categorieId',tag:'tagCategorieId',values:[12]},{field:'rubrique',tag:'tagRubrique',values:['statistiques']},{field:'diffusion',values:[true]}],sortFields:[{field:'dateDiffusion',order:'desc'}]})
export async function inseeDiscovery(content,source,request) {
  if(source.method!=='insee-search')return null
  const pages=[JSON.parse(content)]
  for(const query of pages[0].numFounds>30?[inseeQuery(30),inseeQuery(0,'prix des logements anciens')]:[]) {
    const r=await request(source.url,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json','User-Agent':'EpargnantLibre-Radar/2.0'},body:JSON.stringify(query),signal:AbortSignal.timeout(20000)})
    if(!r.ok)throw Error(`Recherche INSEE complémentaire HTTP ${r.status}`)
    pages.push(await r.json())
  }
  const rows=[]
  for(const page of pages){
    if(page.status!==0||!Array.isArray(page.documents)||!page.documents.length)throw Error('Recherche INSEE vide ou contrat modifié')
    for(const doc of page.documents){
      // Broad-public studies; detailed geographical tables are not studies.
      if(doc.type!=='statistiques'||doc.diffusion!==true||doc.famille?.categorie?.id!==12||!Number.isInteger(doc.id)||!doc.dateDiffusion)continue
      const title=cleanText(doc.titre),description=cleanText(doc.chapo??doc.metaDescription??'')
      const relevant=/salaires?|remuneration|patrimoine|niveau.*vie|inegalite|inflation|consommation|depenses.*menages|logement|epargne|revenu|pauvrete/.test(normalizeEditorial(title+' '+description+' '+(doc.themes??[]).map(t=>t.libelleFr).join(' ')))
      rows.push({url:`https://www.insee.fr/fr/statistiques/${doc.id}`,title,description,hint:doc.dateDiffusion,processingPriority:/^Insee Première$|^Indices Notaires|^Indice des prix des logements/.test(doc.famille.libelleFr??'')?1:0,listingRejection:editorialExclusion({label:title})??(relevant?null:'Étude hors des thèmes ménages suivis')})
    }
  }
  // Empty in-scope subset is healthy when the full real list is present.
  return [...new Map(rows.map(row=>[row.url,row])).values()]
}
