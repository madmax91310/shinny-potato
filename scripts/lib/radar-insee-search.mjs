import { cleanText } from './purchasing-power-news.mjs'
import { editorialExclusion, normalizeEditorial } from '../../src/lib/radar-policy.js'
export const INSEE_CATEGORIES = [12,5] // Publications + dossiers/chiffres détaillés; no commune-table catalogue crawl.
export const INSEE_SEARCH = {id:'insee-studies',name:'INSEE · recherche des études parues',url:'https://www.insee.fr/fr/solr/consultation',host:'www.insee.fr',method:'insee-search',family:'economie',cadenceMinutes:60,parserVersion:3,depth:'API publique : catégories publications et dossiers/chiffres détaillés ; 2 × 30 résultats + 30 dossiers ménages + 30 logements ; RSS indépendants'}
export const inseeQuery = (start,q='*:*',categories=INSEE_CATEGORIES)=>({q,start,rows:30,filters:[{field:'categorieId',tag:'tagCategorieId',values:categories},{field:'rubrique',tag:'tagRubrique',values:['statistiques']}],sortFields:[{field:'dateDiffusion',order:'desc'}]})
export async function inseeDiscovery(content,source,request) {
  if(source.method!=='insee-search')return null
  const pages=[JSON.parse(content)]
  const queries=[...(pages[0].numFounds>30?[inseeQuery(30),inseeQuery(0,'prix des logements anciens')]:[]),inseeQuery(0,'salaires OR patrimoine OR "niveau de vie" OR "pouvoir d’achat" OR inflation OR logement',[5])]
  for(const query of queries) {
    const r=await request(source.url,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json','User-Agent':'EpargnantLibre-Radar/2.0'},body:JSON.stringify(query),signal:AbortSignal.timeout(20000)})
    if(!r.ok)throw Error(`Recherche INSEE complémentaire HTTP ${r.status}`)
    pages.push(await r.json())
  }
  const rows=[]
  for(const page of pages){
    if(page.status!==0||!Array.isArray(page.documents)||(!page.documents.length&&page.numFounds!==0))throw Error('Recherche INSEE vide ou contrat modifié')
    for(const doc of page.documents){
      if(doc.type!=='statistiques'||!INSEE_CATEGORIES.includes(doc.famille?.categorie?.id)||!Number.isInteger(doc.id)||!doc.dateDiffusion)continue
      const title=cleanText(doc.titre),description=cleanText(doc.chapo??doc.metaDescription??'')
      const relevant=/salaires?|remuneration|patrimoine|niveau.*vie|inegalite|inflation|pouvoir d achat|consommation|depenses.*menages|logement|epargne|revenu|pauvrete/.test(normalizeEditorial(title+' '+description))
      rows.push({url:`https://www.insee.fr/fr/statistiques/${doc.id}`,title,description,hint:doc.dateDiffusion,metadataDiffusion:doc.diffusion,processingPriority:/^Insee Première$|^Indices Notaires|^Indice des prix des logements|^Chiffres détaillés$/.test(doc.famille.libelleFr??'')?1:0,listingRejection:editorialExclusion({label:title})??(relevant?null:'Étude hors des thèmes ménages suivis')})
    }
  }
  return [...new Map(rows.map(row=>[row.url,row])).values()]
}
