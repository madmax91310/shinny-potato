import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
export default function FinancialReconciliation(){
 const [report,setReport]=useState(null),[error,setError]=useState(false),[query,setQuery]=useState('')
 useEffect(()=>{const controller=new AbortController();fetch(`${import.meta.env.BASE_URL}data/financial-reconciliation.json`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(r=>{if(r.schemaVersion!==1||!Array.isArray(r.rows)||r.summary.total!==r.rows.length)throw Error();setReport(r)}).catch(e=>{if(e.name!=='AbortError')setError(true)});return()=>controller.abort()},[])
 if(error)return <p role="status">Le suivi des écarts financiers n’a pas pu être chargé.</p>
 if(!report)return null
 const rows=report.rows.filter(r=>(r.open||r.residualOpen)&&`${r.isin} ${r.name} ${r.year} ${r.original.marketSymbol}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')))
 return <section className="dr-reminders" aria-label="Écarts financiers à expliquer">
  <h2>{report.summary.open} écarts financiers encore inexpliqués</h2>
  <p>{report.summary.total} comparaisons initiales conservées : {report.summary.corrected} erreurs corrigées sur preuve, {report.summary.correctedWithResidual} erreur corrigée avec un résidu marché/NAV encore à attribuer et {report.summary.nonComparable} comparaison non pertinente. Une nouvelle collecte ne clôture pas une différence entre une cotation et une valeur liquidative.</p>
  <details><summary>Consulter les cas et les pièces manquantes</summary>
   <label>Rechercher un écart financier<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ISIN, cotation, année…"/></label>
   <p>{rows.length} cas correspondants</p>
   {rows.map(r=><article className="dr-item" key={r.id}>
    <h3>{r.isin} · {r.year} · {r.original.marketSymbol}</h3><p>{r.status} : {r.reason}</p>
    {r.currentConsumer&&<p>Usage actuel : {r.currentConsumer.secured}. Ce raccordement conserve l’enquête sur la divergence historique.</p>}
    {r.missingPiece&&<p>Pièces manquantes : {r.missingPiece}</p>}
    {r.latestCheck&&<p>Dernière tentative : {r.latestCheck.attemptedAt}. Calendrier officiel : {r.latestCheck.officialStatus==='validated'?'validé':'non qualifié'}. Historique de cotation : {r.latestCheck.marketStatus==='provider-validated'?'contrôlé auprès du fournisseur':'non qualifié'}. {r.open?'La cause initiale reste à expliquer.':'La correction documentée conserve le suivi du résidu.'}</p>}
    {r.resolutionEvidence&&<p><a href={r.resolutionEvidence} target="_blank" rel="noreferrer">Preuve de correction et reliquat ↗</a></p>}
    {r.latestCheck?.runUrl&&<p><a href={r.latestCheck.runUrl} target="_blank" rel="noreferrer">Dernier contrôle GitHub ↗</a></p>}
    <Link to={`/bibliotheque-donnees?id=${r.isin}`}>Ouvrir les données de la part</Link>
    <p><a href={r.proof} target="_blank" rel="noreferrer">Comparaison initiale et preuves ↗</a></p>
   </article>)}
  </details>
  <p><a href={`${import.meta.env.BASE_URL}data/financial-reconciliation.json`} download>Télécharger les {report.summary.total} comparaisons (JSON)</a></p>
 </section>
}
