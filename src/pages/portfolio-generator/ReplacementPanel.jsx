import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { useState } from 'react'
import AssetPicker from '../../design-system/AssetPicker'
import Button from '../../design-system/Button'
import { instrumentOption } from '../../data/asset-selection.js'
import { getReplacementCandidates } from './engine.js'

export default function ReplacementPanel({ portfolio, onReplace }) {
  const [assetId, setAssetId] = useState(portfolio.selection[0].id)
  const [replacementId, setReplacementId] = useState('')
  const original = portfolio.selection.find(asset => asset.id === assetId)
  const candidates = getReplacementCandidates(portfolio, assetId)
  const options = candidates.map(asset => ({ ...instrumentOption(asset), group: asset.sameBenchmark ? 'Même indice' : 'Autres supports compatibles' }))
  return <details className="pg-replacement">
    <summary>Remplacer un support</summary>
    <div className="pg-replacement-list">
      <label htmlFor="pg-replacement-line">Ligne à remplacer</label>
      <ChoicePicker id="pg-replacement-line" value={assetId} onChange={event => { setAssetId(event.target.value); setReplacementId('') }}>
        {portfolio.selection.map(asset => <option value={asset.id} key={asset.id}>{asset.name} · {asset.pct} %</option>)}
      </ChoicePicker>
      <p>Le poids reste à {original.pct} %. Les choix respectent la construction, le profil et la borne historique de risque.</p>
      {candidates.length ? <>
        <AssetPicker label="Support de remplacement" items={options} value={replacementId} onChange={setReplacementId}
          emptyOption={{ id: '', label: 'Choisir un support compatible' }} />
        <Button type="button" variant="secondary" disabled={!replacementId} onClick={() => onReplace(assetId, replacementId)}>Appliquer le remplacement</Button>
      </> : <p>Aucun autre support compatible dans la banque pour cette ligne.</p>}
    </div>
  </details>
}
