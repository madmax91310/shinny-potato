import { useState } from 'react'
import AssetPicker from '../../design-system/AssetPicker.jsx'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { rebalanceLabel } from './engine.js'

export default function PortfolioEditor({ definitions, onChange, assets }) {
  const [editing, setEditing] = useState(null)
  function update(index, patch) { onChange(definitions.map((d, i) => i === index ? { ...d, ...patch } : d)) }
  function updateLine(index, slot, patch) { update(index, { lines: definitions[index].lines.map((line, i) => i === slot ? { ...line, ...patch } : line) }) }
  return <div className="rk-portfolios">
    {definitions.map((definition, index) => <section className="rk-portfolio" key={definition.id}>
      <label className="rk-field">Nom du portefeuille {index + 1}<input aria-label={`Nom du portefeuille ${index + 1}`} maxLength={45} value={definition.label} onChange={e => update(index, { label: e.target.value })} /></label>
      {definition.lines.map((line, slot) => <div className="rk-portfolio-line" key={slot}>
        <button type="button" aria-label={`Actif ${slot + 1} du portefeuille ${index + 1}`} onClick={() => setEditing({ index, slot })}>{assets[line.id]?.shortLabel ?? 'Choisir un actif'}</button>
        <label>Poids (%)<input aria-label={`Poids ${slot + 1} du portefeuille ${index + 1}`} type="number" min="0.01" max="100" step="0.01" value={line.pct} onChange={e => updateLine(index, slot, { pct: e.target.value })} /></label>
        <button type="button" aria-label={`Retirer actif ${slot + 1} du portefeuille ${index + 1}`} disabled={definition.lines.length === 1} onClick={() => update(index, { lines: definition.lines.filter((_, i) => i !== slot) })}>×</button>
      </div>)}
      <p>Total : {definition.lines.reduce((sum, l) => sum + Number(l.pct), 0).toLocaleString('fr-FR')} %</p>
      <div className="rk-inline"><button type="button" disabled={definition.lines.length >= 6} onClick={() => {
        const id = Object.keys(assets).find(id => !definition.lines.some(l => l.id === id))
        update(index, { lines: [...definition.lines, { id, pct: '' }] }); setEditing({ index, slot: definition.lines.length })
      }}>Ajouter une ligne</button><button type="button" onClick={() => update(index, { lines: definition.lines.map((line, i) => ({ ...line, pct: i === definition.lines.length - 1 ? 100 - Math.floor(10000 / definition.lines.length) / 100 * i : Math.floor(10000 / definition.lines.length) / 100 })) })}>À parts égales</button></div>
      {editing?.index === index && definition.lines[editing.slot] && <div className="rk-manual"><AssetPicker label={`Support du portefeuille ${index + 1}`} value={definition.lines[editing.slot].id} items={Object.values(assets).filter(a => !definition.lines.some((l, i) => i !== editing.slot && l.id === a.id)).map(a => ({ ...a, name: a.label, label: a.shortLabel, detail: `${a.currency} · ${a.label}` }))} hideIdleResults clearSearchOnSelect onChange={id => { updateLine(index, editing.slot, { id }); setEditing(null) }} /><button type="button" onClick={() => setEditing(null)}>Fermer</button></div>}
      <label className="rk-field">Rééquilibrage du portefeuille {index + 1}<ChoicePicker aria-label={`Rééquilibrage du portefeuille ${index + 1}`} value={definition.rebalance} onChange={e => update(index, { rebalance: e.target.value })}>{['none', 'annual', 'monthly'].map(value => <option key={value} value={value}>{rebalanceLabel(value)}</option>)}</ChoicePicker></label>
      {definitions.length > 2 && <button type="button" onClick={() => onChange(definitions.filter((_, i) => i !== index))}>Retirer ce portefeuille</button>}
    </section>)}
    <button type="button" className="rk-text-button" disabled={definitions.length >= 6} onClick={() => {
      const id = `portfolio-${Date.now()}`
      onChange([...definitions, { id, label: `Portefeuille ${definitions.length + 1}`, rebalance: 'annual', lines: [{ id: 'world-net', pct: 60 }, { id: 'euroGov13', pct: 40 }] }])
    }}>Ajouter un portefeuille</button>
    <p className="rk-note">Sans versement ni retrait. Les opérations de rééquilibrage sont calculées après la clôture, sans frais de courtage ni fiscalité. Dans une grille annuelle, les pondérations évoluent depuis le début de la grille ; chaque fenêtre glissante repart des pondérations cibles.</p>
  </div>
}
