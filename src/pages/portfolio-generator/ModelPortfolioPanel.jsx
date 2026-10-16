import { MODEL_FAMILIES, MODEL_ASSET_ROLES, MODEL_METHOD, getModelFamily } from './modelPortfolios.js'
import { getAsset } from '../../data/portfolio-assets.js'
import Button from '../../design-system/Button'

export default function ModelPortfolioPanel({ familyId, presetId, onSelect, onEdit }) {
  const family = getModelFamily(familyId)
  const preset = family.presets.find(item => item.id === presetId)
  return <div className="pg-panel pg-model-portfolios">
    <div className="pg-panel-title">Portefeuilles modèles</div>
    <label className="pg-manual-label" htmlFor="pg-model-family">Choisir un portefeuille modèle</label>
    <select id="pg-model-family" className="pg-manual-select" value={familyId}
      onChange={event => { const next = getModelFamily(event.target.value); onSelect(next.id, next.presets[0].id) }}>
      {MODEL_FAMILIES.map(item => <option key={item.id} value={item.id}>{item.emoji} {item.label}</option>)}
    </select>
    {family.presets.length > 1 && <>
      <label className="pg-manual-label" htmlFor="pg-model-preset">Choisir une variante</label>
      <select id="pg-model-preset" className="pg-manual-select" value={presetId} onChange={event => onSelect(familyId, event.target.value)}>
        {family.presets.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </>}
    <section className="pg-model-explanation" aria-label="Comprendre ce portefeuille">
      <h3>Le principe</h3>
      <p>{family.explanation}</p>
      <h3>L’adaptation utilisée</h3>
      <p>{family.adaptation}</p>
    </section>
    <p className="pg-model-description">{preset.description}</p>
    <h3 className="pg-model-roles-title">Le rôle des poches</h3>
    <ul className="pg-model-roles">{preset.assets.map(row => <li key={row.id} title={getAsset(row.id).name}>
      <strong>{row.role} · {row.pct.toLocaleString('fr-FR')} %</strong>
      <span>{MODEL_ASSET_ROLES[row.id]}</span>
    </li>)}</ul>
    <p className="pg-fine-print">{MODEL_METHOD}</p>
    <Button type="button" variant="secondary" className="w-full" onClick={() => onEdit(preset)}>Modifier cette allocation</Button>
  </div>
}
