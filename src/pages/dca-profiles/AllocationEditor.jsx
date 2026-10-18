import AssetPicker from '../../design-system/AssetPicker.jsx'
import { exposureGroup } from '../../data/asset-labels.js'
import { ASSETS } from './data.js'
import catalog from './catalog.json' with { type: 'json' }
import { MAX_POSITIONS, references, pct } from './engine.js'
import { searchAssets } from './management.js'
export function confirmLines(lines) {
  return lines.map(line => ({...line, isin:line.isin || references[line.asset]?.isin || ''}))
}
export function newLine(asset, weight = 0) {
  return {asset, label: catalog[asset]?.name || ASSETS[asset][1], emoji: ASSETS[asset][0], isin: references[asset]?.isin || '', weight, amount: 0}
}
export default function AllocationEditor({lines, onChange, dca = false}) {
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
    <AssetPicker label="Ajouter un actif" items={options} value="" onChange={asset => onChange([...lines, newLine(asset, Math.max(0, 100 - total))])} hideIdleResults clearSearchOnSelect searchPlaceholder="Nom, ticker ou ISIN" optionsClassName="dca-simple-results" disabled={lines.length >= MAX_POSITIONS} />
    {!lines.length && <p className="dca-note">Recherche ton premier actif pour commencer.</p>}
    {dca && !!lines.length && <p className="dca-note">Pour chaque actif : poids actuel en % et versement en €/mois.</p>}
    {lines.map((line,index) => <div className={`dca-simple-line${dca ? ' dca-line-with-flow' : ''}`} key={line.asset}>
      <div><strong>{line.label}</strong><small>{line.isin}</small></div>
      <label><span className="sr-only">Poids position {index+1}</span><input aria-label={`Poids position ${index+1}`} type="number" min="0" max="100" step="0.01" value={Number.isFinite(line.weight) ? line.weight : ''} onChange={e => edit(index, {weight:e.target.value === '' ? NaN : Number(e.target.value)})} /><span>%</span></label>
      {dca && <label><span className="sr-only">DCA position {index+1}</span><input aria-label={`DCA position ${index+1}`} type="number" min="0" max="1000000" step="0.01" value={Number.isFinite(line.amount) ? line.amount : ''} onChange={e => edit(index, {amount:e.target.value === '' ? NaN : Number(e.target.value)})}/><span>€/mois</span></label>}
      <button aria-label={`Retirer ${line.label}`} onClick={() => onChange(lines.filter((_,i) => i !== index))}>×</button>
    </div>)}
    <p className="dca-total">Total : {pct(total)} / 100 %{Math.abs(total-100) > .001 && !!lines.length && <small>{total < 100 ? `Il manque ${pct(100-total)}.` : `${pct(total-100)} en trop.`}</small>}</p>
  </>
}
