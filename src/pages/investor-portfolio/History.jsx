import { useEffect, useState } from 'react'
import { normalizePortfolio, percentage } from './data.js'
export default function History({portfolio}) {
  const [rows,setRows]=useState([portfolio]),[error,setError]=useState('')
  useEffect(()=>{
    const controller=new AbortController();setRows([portfolio]);setError('')
    const slug=portfolio.identity.slug
    const archives=portfolio.filingHistory.filter(r=>r.snapshotUrl===`data/investors/archive/${slug}/${r.periodEnd}.json` && /^\d{4}-(03-31|06-30|09-30|12-31)$/.test(r.periodEnd) && r.periodEnd<portfolio.snapshot.periodEnd).slice(0,7)
    Promise.all(archives.map(async r=>{
      const response=await fetch(import.meta.env.BASE_URL+r.snapshotUrl,{signal:controller.signal})
      if(!response.ok)throw Error('Une archive est indisponible.')
      const p=normalizePortfolio(await response.json())
      if(p.identity.slug!==slug || p.snapshot.periodEnd!==r.periodEnd)throw Error('Archive incohérente.')
      return p
    })).then(previous=>{if(!controller.signal.aborted)setRows([portfolio,...previous].sort((a,b)=>b.snapshot.periodEnd.localeCompare(a.snapshot.periodEnd)))}).catch(e=>{if(e.name!=='AbortError')setError(e.message)})
    return ()=>controller.abort()
  },[portfolio])
  return <details className="portfolio-exposure"><summary>Évolution des photographies 13F archivées</summary>
    <p>La collecte conserve automatiquement les anciens trimestres. Les poids restent rapportés au total déclaré, options incluses dans le dénominateur ; les cinq premières entreprises ci-dessous excluent les options.</p>
    {error&&<p role="alert">{error} La photographie actuelle reste disponible.</p>}
    {rows.map(p=><p key={p.snapshot.periodEnd}>{p.snapshot.periodEnd} : {p.holdings.length} entreprises ou fonds hors options ; cinq premières positions regroupées : {percentage(p.holdings.slice(0,5).reduce((s,r)=>s+r.weight,0))}. <a href={p.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a></p>)}
    {rows.length<2&&<p>Une seule photographie archivée exploitable pour le moment ; aucune trajectoire antérieure n’est inventée.</p>}
    <p>Une variation de poids ne mesure pas les achats : elle dépend aussi des cours et des autres positions. Les nombres d’actions ne sont comparés que lorsqu’ils sont fournis dans les mouvements déclarés.</p>
  </details>
}
