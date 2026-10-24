import PagedList from './PagedList.jsx'
import {useState} from 'react'

const FIELDS={performance:'Performances annuelles officielles',monthly:'Historiques mensuels',countries:'Pays',sectors:'Secteurs',completeHoldings:'Positions complètes',returns:'Performances d’indices',facts:'Répartitions et fiches d’indices'}
const STATES={current:'Observation à jour','waiting-first-year':'Première année complète attendue','not-published':'Non publié','tracked-index-needed':'Composition de l’indice à raccorder','connector-needed':'Source à raccorder','collection-error':'Collecte en erreur','source-conflict':'Sources contradictoires',unqualified:'À qualifier','check-overdue':'Contrôle en retard','not-applicable':'Non applicable','outside-equity-scope':'Hors périmètre actions','publication-old':'Publication ancienne',archived:'Archive'}

export default function PriorityMarketData({report,query}){
 const [field,setField]=useState('performance'),[incidentsOnly,setIncidentsOnly]=useState(false)
 const rows=report.connections.filter(r=>r.field===field&&(!incidentsOnly||r.requiresAction)&&[r.id,r.name].join(' ').toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr')))
 const summary=report.summary.priorityMarkets?.[field]
 return <section aria-label="Performances et compositions">
  <p>Les dates concernent chaque observation. Un historique de cotation calculé reste distinct d’un calendrier officiel NAV. Une liste complète peut contenir des positions dont l’identité reste inconnue.</p>
  <label>Données prioritaires <select value={field} onChange={e=>setField(e.target.value)}>{Object.entries(FIELDS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
  <label><input type="checkbox" checked={incidentsOnly} onChange={e=>setIncidentsOnly(e.target.checked)}/> Uniquement les points à traiter</label>
  {summary&&<p>{summary.current} observations à jour sur {summary.total} lignes suivies · {summary.actions} points à traiter{summary.waiting>0&&` · ${summary.waiting} premières années attendues`}{summary.calculatedAlternative>0&&` · ${summary.calculatedAlternative} calendriers de cotation calculés disponibles en complément`}</p>}
  <p>{rows.length} résultats</p>
  <PagedList key={query} label="Pages du détail">{rows.map(r=><article className="dr-item" key={`${r.type}:${r.id}:${r.field}`}>
   <h3>{r.name}</h3><p>{r.id} · {STATES[r.actionState]??r.actionState}</p>
   <dl><dt>Photographie ou période</dt><dd>{r.asOf??'Non documentée'}</dd><dt>Contrôle de la donnée conservée</dt><dd>{r.checkedAt??'Non documenté'}</dd></dl>
   {r.reason&&<p>{r.reason}</p>}
   {r.sourceUrl&&<p><a href={r.sourceUrl} target="_blank" rel="noreferrer">Source de la donnée ↗</a></p>}
   {Number(r.unidentifiedWeightPct)>0&&<p>Identités non qualifiées : {r.unidentifiedWeightPct.toLocaleString('fr-FR',{maximumFractionDigits:4})} % du portefeuille. Ce poids reste inconnu dans les recouvrements.</p>}
   {r.marketCalendar&&r.actionState!=='current'&&<div><h4>Calendrier de cotation calculé · {r.marketCalendar.currency}</h4><p>{Object.entries(r.marketCalendar.years).map(([year,value])=>`${year} : ${value.toLocaleString('fr-FR',{maximumFractionDigits:2})} %`).join(' · ')}</p><p>{r.marketCalendar.note}</p><p>Contrôle : {r.marketCalendar.checkedAt}. <a href={r.marketCalendar.source} target="_blank" rel="noreferrer">Source des cours ↗</a></p></div>}
   {r.equityAllocation&&r.actionState!=='current'&&<div><h4>Répartition de la poche actions</h4><p>Cette ventilation concerne les actions et exclut les liquidités et les autres actifs du fonds. Elle complète le suivi de la ventilation officielle du fonds entier.</p><p>{r.equityAllocation.rows.map(row=>`${row.name} : ${row.weightPct.toLocaleString('fr-FR',{maximumFractionDigits:2})} %`).join(' · ')}</p>{r.equityAllocation.unclassified?.length>0&&<p>Non classé : {r.equityAllocation.unclassified.reduce((sum,row)=>sum+row.weightPct,0).toLocaleString('fr-FR',{maximumFractionDigits:2})} % de la poche actions.</p>}<p>Photographie : {r.equityAllocation.asOf} · contrôle : {r.equityAllocation.checkedAt}. <a href={r.equityAllocation.sourceUrl} target="_blank" rel="noreferrer">Source de la ventilation ↗</a></p></div>}
  </article>)}</PagedList>
 </section>
}
