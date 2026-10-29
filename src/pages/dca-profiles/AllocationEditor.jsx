import AssetPicker from '../../design-system/AssetPicker.jsx'
import { useState } from 'react'
import { exposureGroup } from '../../data/asset-labels.js'
import { ASSETS } from './data.js'
import catalog from './catalog.json' with { type: 'json' }
import { MAX_POSITIONS, references, pct } from './engine.js'
import { searchAssets } from './management.js'
import { equalWeights, assignRemainder } from './allocation-actions.js'
export function confirmLines(lines) {
  return lines.map(line => ({...line, isin:line.isin || references[line.asset]?.isin || ''}))
}
export function newLine(asset, weight = 0) {
  return {asset, label: catalog[asset]?.name || ASSETS[asset][1], emoji: ASSETS[asset][0], isin: references[asset]?.isin || '', weight, amount: 0}
}
export default function AllocationEditor({lines, onChange, dca = false}) {
  const [changing, setChanging] = useState(null)
  const [feedback, setFeedback] = useState('')
  function apply(action) { try { onChange(action()); setFeedback('Répartition mise à jour. Les versements sont conservés.') } catch(error) { setFeedback(error.message) } }
  const total = lines.reduce((sum, line) => sum + (Number.isFinite(line.weight) ? line.weight : 0), 0)
  const options = searchAssets('', '').filter(key => !lines.some(line => line.asset === key)).map(key => ({
    id:key, label:catalog[key]?.name || ASSETS[key][1], isin:references[key]?.isin,
    search:[...(references[key]?.aliases || []), ...(references[key]?.tickers || [])].join(' '),
    group:references[key]?.kind === 'equity' ? 'Actions' : exposureGroup({name:catalog[key]?.name || ASSETS[key][1]}),
    badges:references[key]?.pea === true ? ['PEA'] : [],
  }))
  function edit(index, patch) { onChange(lines.map((line, i) => i === index ? {...line, ...patch} : line)) }
  return <>
    <h2>Mon allocation</h2>
    <p className="dca-note">Personnalise chaque ligne avec « Changer l’actif », ou ajoute un support. {Object.keys(ASSETS).length} actifs disponibles par nom, ticker ou ISIN.</p>
    <AssetPicker label="Ajouter un actif" items={options} value="" onChange={asset => onChange([...lines, newLine(asset, Math.max(0, 100 - total))])} clearSearchOnSelect searchPlaceholder="Nom, ticker ou ISIN" optionsClassName="dca-simple-results" disabled={lines.length >= MAX_POSITIONS} />
    {!lines.length && <p className="dca-note">Recherche ton premier actif pour commencer.</p>}
    {!!lines.length && <button type="button" onClick={() => apply(() => equalWeights(lines))}>Répartir à parts égales</button>}
    {feedback && <p role="status">{feedback}</p>}
    {dca && !!lines.length && <p className="dca-note">Pour chaque actif : poids actuel en % et versement en €/mois.</p>}
    {lines.map((line,index) => <div key={line.asset} className="dca-position">
     <div className={`dca-simple-line${dca ? ' dca-line-with-flow' : ''}`}>
      <div><strong>{line.label}</strong><small>{line.isin}</small><button type="button" className="dca-change-asset" aria-label={`Changer l’actif position ${index+1}`} aria-expanded={changing===line.asset} onClick={()=>setChanging(changing===line.asset?null:line.asset)}>{changing===line.asset?'Annuler':'Changer l’actif'}</button></div>
      <label><span className="sr-only">Poids position {index+1}</span><input aria-label={`Poids position ${index+1}`} type="number" min="0" max="100" step="0.01" value={Number.isFinite(line.weight) ? line.weight : ''} onChange={e => edit(index, {weight:e.target.value === '' ? NaN : Number(e.target.value)})} /><span>%</span></label>
      {dca && <label><span className="sr-only">DCA position {index+1}</span><input aria-label={`DCA position ${index+1}`} type="number" min="0" max="1000000" step="0.01" value={Number.isFinite(line.amount) ? line.amount : ''} onChange={e => edit(index, {amount:e.target.value === '' ? NaN : Number(e.target.value)})}/><span>€/mois</span></label>}
      <button aria-label={`Retirer ${line.label}`} onClick={() => onChange(lines.filter((_,i) => i !== index))}>×</button>
     </div>
     {changing===line.asset&&<div className="dca-replace-asset">
      <p className="dca-note">Le nouvel actif conserve le poids{dca?' et le versement mensuel':''} de cette ligne.</p>
      <AssetPicker label={`Remplacer l’actif position ${index+1}`} items={options} value="" onChange={asset=>{edit(index,{...newLine(asset),weight:line.weight,amount:line.amount});setChanging(null)}} searchPlaceholder="Nom, ticker ou ISIN" optionsClassName="dca-simple-results" />
     </div>}
     {Math.abs(total-100) > .001 && <button type="button" aria-label={`Affecter le solde à la position ${index+1}`} onClick={() => apply(() => assignRemainder(lines,index))}>Affecter le solde à cette ligne</button>}
    </div>)}
    <p className="dca-total">Total : {pct(total)} / 100 %{Math.abs(total-100) > .001 && !!lines.length && <small>{total < 100 ? `Il manque ${pct(100-total)}.` : `${pct(total-100)} en trop.`}</small>}</p>
  </>
}
