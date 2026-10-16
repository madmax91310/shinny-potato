import AssetPicker from '../../design-system/AssetPicker.jsx'
import { instrumentOption } from '../../data/asset-selection.js'
import { CATALOG } from './lib.js'
export default function AllocationEditor({ label, lines, onChange }) {
  const total = lines.reduce((sum, line) => sum + Number(line.pct || 0), 0)
  const update = (index, patch) => onChange(lines.map((line, i) => i === index ? {...line, ...patch} : line))
  function add() {
    const next = CATALOG.find(item => item.instrumentType === 'EQUITY' && !lines.some(line => line.id === item.id))
    if (next) onChange([...lines, {id: next.id, pct: Math.max(1, 100 - total)}])
  }
  function equalize() {
    const share = Math.floor(100 / lines.length), remainder = 100 % lines.length
    onChange(lines.map((line, i) => ({...line, pct: share + (i < remainder ? 1 : 0)})))
  }
  return <section className="pd-editor-side">
    <h3>Portefeuille {label} <span className={total === 100 ? 'pd-total-ok' : 'pd-total-bad'}>{total} % / 100 %</span></h3>
    {lines.map((line, index) => <div className="pd-editor-line" key={index}>
      <div className="pd-asset-field"><span>Actif {index + 1}</span>
        <AssetPicker compact label={`Actif ${index + 1} du portefeuille ${label}`} value={line.id} onChange={id => update(index, {id})}
          items={CATALOG.filter(item => item.id === line.id || !lines.some(row => row.id === item.id)).map(item => ({...instrumentOption(item),group:item.instrumentType==='EQUITY'?'Actions':instrumentOption(item).group}))}/>

      </div>
      <label className="pd-weight"><span>Poids (%)</span><input aria-label={`Poids actif ${index + 1} du portefeuille ${label}`} type="number" min="1" max="100" step="1" value={line.pct} onChange={event => update(index, {pct: event.target.value === '' ? '' : Number(event.target.value)})} /></label>
      <button type="button" aria-label={`Retirer actif ${index + 1} du portefeuille ${label}`} disabled={lines.length === 1} onClick={() => onChange(lines.filter((_, i) => i !== index))}>×</button>
    </div>)}
    <div className="pd-controls">
      <button type="button" className="pd-add" disabled={lines.length >= 6} onClick={add}>Ajouter un actif à {label}</button>
      <button type="button" className="pd-add" onClick={equalize}>Répartir à parts égales sur {label}</button>
    </div>
  </section>
}

