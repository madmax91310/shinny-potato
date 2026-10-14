import { useId, useState } from 'react'
import { chartGeometry, formatValue } from './valuationPresentation.js'

export default function ValuationChart({chart, selected}) {
  const titleId=useId(), [hover,setHover]=useState(null)
  const geometry=chartGeometry(chart)
  if (!geometry) return <div className="valuation-empty">L’historique de trésorerie comparable n’est pas encore disponible pour cette entreprise.</div>
  const g=geometry, all=[...chart.history,...chart.forecast.flatMap(s=>s.points.map(p=>({...p,scenario:s.name})))], last=chart.history.at(-1)
  const years=[g.minTime, ...(chart.forecast.length?[last.time]:[]), g.maxTime]
  function inspect(event) {
    const bounds=event.currentTarget.getBoundingClientRect(), target=(event.clientX-bounds.left)/bounds.width*720
    const candidates=[...chart.history,...(chart.forecast[selected]?.points??[])]
    setHover(candidates.reduce((a,b)=>Math.abs(g.x(a.time)-target)<Math.abs(g.x(b.time)-target)?a:b))
  }
  return <figure className="valuation-chart" data-testid="valuation-chart">
    <figcaption><strong>{chart.title}</strong><span>{chart.unit}</span></figcaption>
    <svg viewBox="0 0 720 280" role="img" aria-labelledby={titleId} onPointerMove={inspect} onPointerLeave={()=>setHover(null)}>
      <title id={titleId}>{chart.title}. {chart.history.length} points de départ{chart.forecast.length?' et trois projections hypothétiques':''}. Les valeurs exactes sont disponibles sous le graphique.</title>
      {g.ticks.map((v,i)=><g key={i}><line x1={g.left} x2={g.right} y1={g.y(v)} y2={g.y(v)} className="valuation-grid"/><text x={g.left-10} y={g.y(v)+4} textAnchor="end">{formatValue(v)}</text></g>)}
      {chart.forecast.length>0&&<><line x1={g.x(last.time)} x2={g.x(last.time)} y1={g.top} y2={g.bottom} className="valuation-boundary"/><text x={g.x(last.time)+9} y={14}>Hypothèses →</text></>}
      <path d={g.path(chart.history)} className="valuation-history-line"/>
      {chart.history.map(p=><circle key={p.time} cx={g.x(p.time)} cy={g.y(p.value)} r="3.5" className="valuation-history-point"><title>{p.end} : {formatValue(p.value,2)} {chart.unit}</title></circle>)}
      {chart.forecast.map((s,i)=><path key={s.name} d={g.path(s.points)} className={`valuation-forecast-line scenario-${i} ${selected===i?'selected':''}`}/>)}
      {[...new Set(years)].map((time,i)=><text key={time} x={g.x(time)} y="255" textAnchor={i===0?'start':i===years.length-1?'end':'middle'}>{new Date(time).getUTCFullYear()}</text>)}
      {hover&&<><line x1={g.x(hover.time)} x2={g.x(hover.time)} y1={g.top} y2={g.bottom} className="valuation-boundary"/><circle cx={g.x(hover.time)} cy={g.y(hover.value)} r="5" fill="#175b48"/></>}
    </svg>
    <div className="valuation-chart-caption">{hover?`${hover.label} · ${formatValue(hover.value,2)} ${chart.unit}`:chart.forecast.length?(chart.title.startsWith('Bénéfice')?'Point initial : BPA du modèle · pointillés : hypothèses, pas des prévisions.':'Trait plein : données publiées · pointillés : scénarios, pas des prévisions.'):'Données publiées uniquement · aucune projection FCF sans base par action qualifiée.'}</div>
    <details className="valuation-chart-data"><summary>Valeurs et sources du graphique</summary><div className="company-history-scroll"><table><thead><tr><th>Période</th><th>Série</th><th>{chart.unit}</th></tr></thead><tbody>{all.map((p,i)=><tr key={i}><td>{p.sourceUrl?<a href={p.sourceUrl} target="_blank" rel="noreferrer">{p.label}</a>:p.label}</td><td>{p.scenario??(p.sourceUrl?'Publié':'Base du modèle')}</td><td>{formatValue(p.value,2)}</td></tr>)}</tbody></table></div></details>
  </figure>
}
