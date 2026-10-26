import ChoicePicker from './ChoicePicker.jsx'
import { ANNIVERSARY_INDEX_VARIANTS } from '../data/index-history-conventions.js'
import { loadHistoryRecord } from '../data/history-browser.js'
import { useEffect, useState } from 'react'
import { historicalWindows } from '../lib/history-windows.js'
const pct=n=>`${n.toLocaleString('fr-FR',{maximumFractionDigits:2})} %`
export default function HistoricalContext({asset, assetId = asset?.id, minDate = asset?.minDate}) {
  const [years,setYears]=useState(3)
  const [open,setOpen]=useState(false),[loaded,setLoaded]=useState(null),[error,setError]=useState(false),[retry,setRetry]=useState(0)
  useEffect(()=>{if(!open||!asset?.historyId)return;let active=true;setLoaded(null);setError(false);loadHistoryRecord(asset.historyId).then(record=>{if(active)setLoaded({id:asset.historyId,points:record.points})}).catch(()=>{if(active)setError(true)});return()=>{active=false}},[open,asset?.historyId,retry])
  const points=asset?.historyId?(loaded?.id===asset.historyId?loaded.points:null):asset?.points
  if(!asset)return null
  const result=points&&historicalWindows(points.filter(p => !minDate || p.date >= minDate),years)
  return <details className="portfolio-exposure" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Ce que change la date de départ</summary>
    <p>Placement unique, sans versement supplémentaire, dans la devise de la série ({asset.currency}). Fenêtres mensuelles de même durée ; aucune interpolation des points manquants.</p>
    <label>Durée comparée <ChoicePicker aria-label="Durée comparée" value={years} onChange={e=>setYears(Number(e.target.value))}>{[1,3,5,10].map(y=><option key={y} value={y}>{y} an(s)</option>)}</ChoicePicker></label>
    {!points ? <p role="status">{error?<><span>Historique indisponible. </span><button onClick={()=>setRetry(retry+1)}>Réessayer</button></>:'Chargement de l’historique…'}</p> : !result ? <p>Historique mensuel continu insuffisant pour cette durée.</p> : <><p>{result.count} fenêtres disponibles, recalculées depuis l’historique de cet actif.</p>
      <p>Rendement annualisé le plus faible : {pct(result.min.annualized)} ({result.min.start} → {result.min.end}).</p>
      <p>Rendement annualisé le plus élevé : {pct(result.max.annualized)} ({result.max.start} → {result.max.end}).</p>
      <p>Plus forte baisse depuis un sommet mensuel, parmi ces fenêtres : {pct(result.worstDrawdown.drawdown)}. Les baisses à l’intérieur d’un mois ne sont pas mesurées.</p></>}
    <p>{asset.methodNote || ANNIVERSARY_INDEX_VARIANTS[assetId] || asset.returnNote || (asset.priceMethod==='adjusted'?'Série ajustée, distributions réinvesties selon la méthode de la source.':'Variation de la série de prix ; aucun dividende ajouté.')}</p>
    <p>Les fenêtres se chevauchent. Ces extrêmes historiques ne constituent pas des probabilités ni des prévisions.</p>
  </details>
}
