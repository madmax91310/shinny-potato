import { useState } from 'react'
import { historicalWindows } from '../lib/history-windows.js'
const pct=n=>`${n.toLocaleString('fr-FR',{maximumFractionDigits:2})} %`
export default function HistoricalContext({asset, minDate = asset?.minDate}) {
  const [years,setYears]=useState(3)
  if(!asset?.points)return null
  const result=historicalWindows(asset.points.filter(p => !minDate || p.date >= minDate),years)
  return <details className="portfolio-exposure"><summary>Ce que change la date de départ</summary>
    <p>Placement unique, sans versement supplémentaire, dans la devise de la série ({asset.currency}). Fenêtres mensuelles de même durée ; aucune interpolation des points manquants.</p>
    <label>Durée comparée <select value={years} onChange={e=>setYears(Number(e.target.value))}>{[1,3,5,10].map(y=><option key={y} value={y}>{y} an(s)</option>)}</select></label>
    {!result ? <p>Historique mensuel continu insuffisant pour cette durée.</p> : <><p>{result.count} fenêtres disponibles, recalculées depuis l’historique de cet actif.</p>
      <p>Rendement annualisé le plus faible : {pct(result.min.annualized)} ({result.min.start} → {result.min.end}).</p>
      <p>Rendement annualisé le plus élevé : {pct(result.max.annualized)} ({result.max.start} → {result.max.end}).</p>
      <p>Plus forte baisse depuis un sommet mensuel, parmi ces fenêtres : {pct(result.worstDrawdown.drawdown)}. Les baisses à l’intérieur d’un mois ne sont pas mesurées.</p></>}
    <p>{asset.methodNote ?? asset.returnNote ?? (asset.priceMethod==='adjusted'?'Série ajustée, distributions réinvesties selon la méthode de la source.':'Variation de la série de prix ; aucun dividende ajouté.')}</p>
    <p>Les fenêtres se chevauchent. Ces extrêmes historiques ne constituent pas des probabilités ni des prévisions.</p>
  </details>
}
