import {editorialTreatments,treatmentFor} from '../lib/radar-workflow-state.js'
import { Link } from 'react-router-dom'
import useRadarOverview from '../lib/use-radar-overview.js'
import { readIds } from '../lib/radar-read-state.js'
import './radar-now.css'
export default function RadarNow() {
  const {status,data}=useRadarOverview(),read=new Set(readIds()),treatments=editorialTreatments()
  const subjects=status==='ready'?data.selection.filter(row=>treatmentFor(row.eventIds,treatments)==='active'&&row.readEventIds.some(id=>!read.has(id))).slice(0,3):[]
  return <section className="home-radar-now" aria-labelledby="radar-now-title">
    <div className="home-section-heading"><h2 id="radar-now-title">À publier maintenant</h2><Link to="/radar-editorial">Ouvrir le Radar →</Link></div>
    {status==='loading'?<p role="status">Recherche des sujets du Radar…</p>:status==='error'?<p role="status">Radar momentanément indisponible : l’absence de nouveautés ne peut pas être confirmée.</p>:subjects.length?<ul>{subjects.map(row=><li key={row.id}><Link to={row.to}>{row.title}</Link><p>{row.mainFact}</p><small>{row.publishedAt?`Publication : ${row.publishedAt}`:row.observedAt?`Changement constaté : ${row.observedAt.slice(0,10)}`:'Publication non datée'} · {row.reason}</small></li>)}</ul>:<p>Aucun nouveau sujet prioritaire non lu pour le moment. Les autres sujets restent accessibles dans le Radar.</p>}
  </section>
}
