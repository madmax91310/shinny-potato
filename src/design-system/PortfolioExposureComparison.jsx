import { PORTFOLIO_EXPOSURES } from '../data/portfolio-exposure-data.js'
import { comparePortfolioExposure } from '../lib/portfolio-exposure.js'
const pct = n => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
export default function PortfolioExposureComparison({ left, right }) {
  const fields = ['countries','sectors'].map(field => ({field, groups:comparePortfolioExposure(left,right,PORTFOLIO_EXPOSURES,field)}))
  return <details><summary>Comparer les expositions actuelles de A et B</summary>
    <p>Ces compositions actuelles expliquent ce que tu détiens aujourd’hui. Elles n’expliquent pas à elles seules les performances passées.</p>
    {fields.map(({field,groups})=><section key={field}><h4>{field==='countries'?'Pays':'Secteurs'}</h4>
      {!groups.length && <p>Les photographies disponibles ne couvrent pas les deux portefeuilles à 100 % avec la même date et le même périmètre. Consulte le détail de chaque portefeuille ci-dessus.</p>}
      {groups.map(g=><div key={`${g.asOf}:${g.basis}:${g.classification}`}><p>Au {g.asOf} · {g.basis==='fund'?'Fonds':'Indices suivis'} · {g.classification}</p><ul>{g.rows.slice(0,3).map(r=><li key={r.name}>{r.name} : {pct(r.a)} % pour A, {pct(r.b)} % pour B. {Math.abs(r.difference)<.05?'Des poids proches.':`B en détient ${pct(Math.abs(r.difference))} points de ${r.difference>0?'plus':'moins'}.`}</li>)}</ul>{g.sources.map(url=><a key={url} href={url} target="_blank" rel="noreferrer">Source ↗ </a>)}</div>)}
    </section>)}
  </details>
}
