import { useState, useMemo } from 'react'
import { PORTFOLIO_EXPOSURES } from '../data/portfolio-exposure-data.js'
import { portfolioExposure } from '../lib/portfolio-exposure.js'
const pct = n => n.toLocaleString('fr-FR',{maximumFractionDigits:2}) + ' %'

export default function PortfolioExposure({ lines, name = 'Portefeuille' }) {
  const [open,setOpen] = useState(false)
  const fields = useMemo(() => ['countries','sectors'].map(field => ({field,groups:portfolioExposure(lines,PORTFOLIO_EXPOSURES,field)})),[lines])
  return <details className="portfolio-exposure" onToggle={e=>setOpen(e.currentTarget.open)}>
    <summary>Expositions pays et secteurs · {name}</summary>
    {open && <><p>Poids dans le portefeuille actuel, sans reconstitution historique. Les dates, périmètres fonds/indice et classifications différents restent séparés. Aucune estimation des entreprises détenues en commun.</p>
      {fields.map(({field,groups})=><section key={field}><h4>{field==='countries'?'Pays':'Secteurs'}</h4>
        {!groups.length && <p>Aucune composition qualifiée pour cette sélection.</p>}
        {groups.map(g=><div key={[g.asOf,g.basis,g.classificationId].join('|')}><p>Au {g.asOf.split('-').reverse().join('/')} · {g.basis==='fund'?'Fonds':'Indices suivis'} · {g.classification}. Couverture des supports : {pct(g.coverage)} du portefeuille ; poids détaillé par la source : {pct(g.detailedCoverage)}.</p>
          <ul>{g.rows.slice(0,5).map(r=><li key={r.name}>{r.name} : {pct(r.weight)} du portefeuille</li>)}</ul>
          <p>Les lignes non détaillées et les supports hors de cette photographie ne sont pas réattribués. Pondérations arrondies par les sources.</p>
          {g.sources.map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer">Source {i+1} ↗ </a>)}
        </div>)}
      </section>)}</>}
  </details>
}
