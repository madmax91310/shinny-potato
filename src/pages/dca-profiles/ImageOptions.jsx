import ChoicePicker from '../../design-system/ChoicePicker.jsx'
export default function ImageOptions({field, onFieldChange, limit = 4, onLimitChange, multiImage = false, onMultiImageChange, showCompanies = false, onCompaniesChange}) {
  return <details className="dca-image-options"><summary>Personnaliser l’image</summary>
    {onMultiImageChange&&<label><input type="checkbox" checked={multiImage} onChange={e=>onMultiImageChange(e.target.checked)}/> Plusieurs images : un donut par image (jusqu’à 50 positions)</label>}
    {multiImage&&<p>La répartition conserve toutes les lignes sur une seule image, dont la hauteur s’adapte. Les pays et les secteurs sont exportés séparément.</p>}
    <label>Donuts de l’image<ChoicePicker aria-label="Donuts de l’image" value={field} onChange={e => onFieldChange(e.target.value)}>
      <option value="all">Répartition + géographie + secteurs</option><option value="both">Géographie + secteurs</option><option value="countries">Géographie uniquement</option><option value="sectors">Secteurs uniquement</option><option value="overlap">Recouvrement et concentration</option>
    </ChoicePicker></label>
    <label>Catégories par donut<ChoicePicker aria-label="Catégories par donut" value={String(limit)} onChange={e => onLimitChange(Number(e.target.value))}>
      <option value="3">3 catégories</option><option value="4">4 catégories</option><option value="6">6 catégories</option>
    </ChoicePicker></label>
    {onCompaniesChange&&field!=='overlap'&&<label><input type="checkbox" checked={showCompanies} onChange={e=>onCompaniesChange(e.target.checked)}/> Ajouter le top 10 des entreprises</label>}
  </details>
}
