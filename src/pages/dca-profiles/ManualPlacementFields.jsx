import { MANUAL_CATEGORIES } from './placements.js'

export default function ManualPlacementFields({line,onChange}) {
 return <div className="dca-manual-fields">
  <label>Nom du placement<input required maxLength={250} value={line.label} onChange={e=>onChange({label:e.target.value})}/></label>
  <label>Catégorie<select aria-label="Catégorie" value={line.category} onChange={e=>onChange({category:e.target.value})}>
   {MANUAL_CATEGORIES.map(category=><option key={category}>{category}</option>)}
  </select></label>
 </div>
}
