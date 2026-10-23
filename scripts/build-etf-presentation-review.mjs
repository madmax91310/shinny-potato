// Rebuild the delivery matrix from the saved collection receipts and active registries.
// This is a documentary review, not a substitute for an issuer collector.
import fs from 'node:fs'
import { ETFS } from '../src/data/etf-cards.js'
import { getInstrumentFacts } from '../src/data/instrument-facts.js'
import { PEA_REVIEWS_BY_ISIN } from '../src/data/instrument-pea.js'
import { getInstrumentAnnualPerformance } from '../src/data/instrument-returns.js'
import { getPresentationCopy } from '../src/pages/etf-sheets/editorial.js'
import { buildText } from '../src/pages/etf-sheets/lib.js'
const dir=new URL('../reports/etf-presentations/',import.meta.url)
const read=name=>JSON.parse(fs.readFileSync(new URL(name,dir)))
const initial=read('initial-inventory.json'),receipts=read('source-checks.json')
const browser=fs.existsSync(new URL('browser-results.json',dir))?read('browser-results.json'):null
const official=url=>{try{return /(^|\.)(blackrock\.com|ishares\.com|amundietf\.(fr|com)|ssga\.com|vanguard\.(com|co\.uk)|fr\.vanguard|fund-docs\.vanguard\.com|invesco\.com|wisdomtree\.(com|eu)|vaneck\.com|globalxetfs\.eu|etf\.dws\.com|coinshares\.com|bitwiseinvestments\.com|21shares\.com|avantisinvestors\.com|bnpparibas-am\.com|hsbc\.(com|co\.uk)|assetmanagement\.hsbc\.co\.uk|euronext\.com|borsaitaliana\.it|msci\.com)$/.test(new URL(url).hostname)}catch{return false}}
const rows=ETFS.map(e=>{
 const c=getPresentationCopy(e),f=getInstrumentFacts(e.isin),r=receipts.sheets[e.isin],fresh=r?.record??{},m=r?.metadata?.observed??{},pea=PEA_REVIEWS_BY_ISIN[e.isin]
 const blockers=[],checks={}
 const proof=(value,source,asOf=null,checkedAt=null)=>({value,sourceUrl:source??null,asOf,checkedAt,official:official(source)})
 checks.identity=proof(e.name,fresh.sourceUrl,null,r?.collectedAt?.slice(0,10));checks.identity.isin=e.isin
 checks.listing=proof(e.listing,m.preferredListing?.sourceUrl??e.listing?.sourceUrl,null,m.preferredListing?.checkedAt??e.listing?.checkedAt)
 if(!m.preferredListing?.value?.length)blockers.push('Cotation choisie non retrouvée dans les observations nouvelles ; preuve antérieure conservée')
 const staticFields={distribution:'distribution',domicile:'domicile',replicationMethod:'replicationMethod'}
 for(const [key,sourceKey]of Object.entries(staticFields)){
  const observed=m[sourceKey],value=f[key]??(key==='distribution'?e.distribution:null)
  const direct=fresh.characteristics?.[sourceKey]??fresh[sourceKey]
  const source=direct!=null?(fresh.characteristics?.sourceUrl??fresh.sourceUrl):observed?.sourceUrl??f.characteristicsSource?.url
  checks[key]=proof(value,source,fresh.characteristics?.asOf,observed?.checkedAt??r?.collectedAt?.slice(0,10))
  if(!value||!checks[key].official)blockers.push(`${key} : preuve officielle de la caractéristique à compléter`)
 }
 checks.ter=proof(e.ter,fresh.characteristics?.sourceUrl??fresh.sourceUrl,fresh.characteristics?.asOf,r?.collectedAt?.slice(0,10))
 checks.aum=proof(c.aum,fresh.aum?.sourceUrl??fresh.sourceUrl,fresh.aum?.asOf,r?.collectedAt?.slice(0,10))
 if(!fresh.aum?.amount)blockers.push('Encours : montant officiel daté non recueilli')
 checks.positions=proof(c.positions,fresh.metrics?.numHoldings?.sourceUrl??f.positionsSource?.url,fresh.metrics?.numHoldings?.asOf??f.positionsAsOf,fresh.metrics?.numHoldings?.checkedAt??f.positionsSource?.checkedAt)
 const type=f.instrumentType??(/\bETC\b/.test(e.name)?'ETC':'ETF')
 if(type==='ETF'&&!c.positions)blockers.push('Nombre de positions : absence de comptage daté exploitable ; champ omis du texte')
 const hedge=m.currencyHedge??f.automatedFields?.currencyHedge
 checks.hedge=proof(f.currencyHedge,hedge?.sourceUrl??hedge?.url??f.characteristicsSource?.url,null,hedge?.checkedAt??f.characteristicsSource?.checkedAt)
 if(typeof f.currencyHedge!=='boolean'||!checks.hedge.official)blockers.push('Couverture de change : confirmation officielle explicite à compléter (aucune déduction par la devise)')
 const peaProof=m.pea?.sourceUrl&&official(m.pea.sourceUrl)?m.pea:pea
 checks.pea=proof(e.pea,peaProof?.sourceUrl,null,peaProof?.checkedAt)
 if(typeof e.pea!=='boolean'||!checks.pea.official)blockers.push('PEA : preuve émetteur officielle explicite absente ou secondaire ; statut du registre conservé sans le certifier')
 if(r?.metadata?.errors?.some(x=>x.qualificationRequired&&x.field==='pea'))blockers.push('PEA : contradiction non résolue entre déclarations exactes de sources ; aucune valeur choisie')
 const p=getInstrumentAnnualPerformance(e.isin)
 checks.performance=proof(p,p?.source??p?.sourceUrl,p?.asOf,p?.checkedAt)
 if(p?.sourceKind==='adjusted-market-price')blockers.push('Performances : cours ajustés de la part exacte, sans calendrier annuel officiel complet recertifié')
 checks.benchmark=proof(fresh.characteristics?.index??fresh.index??f.benchmark,fresh.characteristics?.sourceUrl??fresh.sourceUrl,fresh.characteristics?.asOf,r?.collectedAt?.slice(0,10))
 if(!checks.benchmark.value&&!/ETC|ETP|ETN/.test(type))blockers.push('Indice exact et sa méthode : champ absent du collecteur ; description qualitative conservée')
 checks.composition=proof(fresh.holdings,fresh.holdings?.sourceUrl??fresh.sourceUrl,fresh.holdings?.asOf,r?.collectedAt?.slice(0,10))
 checks.duration=proof(fresh.metrics?.modelOad?.value,fresh.metrics?.modelOad?.sourceUrl,fresh.metrics?.modelOad?.asOf,fresh.metrics?.modelOad?.checkedAt)
 const before=initial.sheets.find(x=>x.id===e.id)
 if(!before)throw Error('Fiche absente de l’inventaire initial : '+e.id)
 const after=buildText(e),observedBrowser=browser?.results.find(x=>x.id===e.id)
 return {id:e.id,isin:e.isin,name:e.name,status:blockers.length?'partielle — bloquée pour certification complète':'vérifiée',corrected:after!==before.before,editorialReviewed:true,collectorStatus:r?.status??'not-collected',checks,blockers,
  application:{display:observedBrowser?.display??false,copy:observedBrowser?.copy??false},
  corrections:['Structure A–H et mention finale','Texte spécifique revu','Périmètre encours et devises séparés',...(fresh.metrics?.numHoldings?['Comptage automatique daté']:[]),'Composition datée commune à l’aperçu et à la copie'],after}
})
if(rows.length!==initial.count||initial.sheets.some(x=>!rows.some(r=>r.id===x.id)))throw Error('Inventaire non réconcilié')
const summary={inventoried:initial.count,reviewed:rows.length,fullyVerified:rows.filter(r=>r.status==='vérifiée').length,corrected:rows.filter(r=>r.corrected).length,blocked:rows.filter(r=>r.blockers.length).length,displayed:rows.filter(r=>r.application.display).length,copied:rows.filter(r=>r.application.copy).length}
fs.writeFileSync(new URL('review-matrix.json',dir),JSON.stringify({initialCommit:initial.commit,collectionDate:receipts.checkedAt,summary,rows},null,2)+'\n')
const cell=s=>String(s??'—').replaceAll('|',' / ').replaceAll('\n',' ')
const lines=['# Matrice exhaustive — Présentation ETF','',`Inventaire : ${initial.count}. Revue : ${summary.reviewed}. Entièrement vérifiées : ${summary.fullyVerified}. Corrigées : ${summary.corrected}. Certification bloquée : ${summary.blocked}.`,'',
 '« Partielle » signifie que la collecte et la revue ont été réalisées mais qu’un champ matériel reste sans preuve officielle suffisante. Une correction éditoriale ne certifie pas les chiffres. Les dates des observations ne sont jamais remplacées par la date du contrôle. Les preuves détaillées par champ, valeurs, devises, méthodes et périmètres sont dans [review-matrix.json](review-matrix.json) et les résultats des collecteurs dans [source-checks.json](source-checks.json).','',
 '| Fiche / ISIN | Statut et corrections | Sources principales | Dates des données | Application | Blocage exact |','|---|---|---|---|---|---|']
for(const r of rows){const c=r.checks;const urls=[...new Set([c.identity.sourceUrl,c.listing.sourceUrl,c.pea.sourceUrl,c.hedge.sourceUrl].filter(Boolean))];lines.push(`| ${cell(r.name)} · \`${r.isin}\` · \`${r.id}\` | ${r.status}. ${r.corrections.join(' ; ')} | ${urls.map((u,i)=>`[${i+1}](${u})`).join(' ')} | Encours ${cell(c.aum.asOf)} ; positions ${cell(c.positions.asOf)} ; composition ${cell(c.composition.asOf)} ; contrôle collecte ${receipts.sheets[r.isin].collectedAt?.slice(0,10)} | Affichage ${r.application.display?'OK':'à tester'} / copie ${r.application.copy?'OK':'à tester'} | ${cell(r.blockers.join(' ; ')||'Aucun')} |`)}
fs.writeFileSync(new URL('review-matrix.md',dir),lines.join('\n')+'\n')
console.log(summary)
