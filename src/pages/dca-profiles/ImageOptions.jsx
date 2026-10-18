import ChoicePicker from '../../design-system/ChoicePicker.jsx'
export default function ImageOptions({field, onFieldChange, limit = 4, onLimitChange}) {
  return <details className="dca-image-options"><summary>Personnaliser l’image</summary>
    <label>Donuts de l’image<ChoicePicker aria-label="Donuts de l’image" value={field} onChange={e => onFieldChange(e.target.value)}>
      <option value="all">Répartition + géographie + secteurs</option><option value="both">Géographie + secteurs</option><option value="countries">Géographie uniquement</option><option value="sectors">Secteurs uniquement</option><option value="overlap">Recouvrement et concentration</option>
    </ChoicePicker></label>
    <label>Catégories par donut<ChoicePicker aria-label="Catégories par donut" value={String(limit)} onChange={e => onLimitChange(Number(e.target.value))}>
      <option value="3">3 catégories</option><option value="4">4 catégories</option><option value="6">6 catégories</option>
    </ChoicePicker></label>
  </details>
}
