import { isManualLine, newManualLine } from './placements.js'
import ManualPlacementFields from './ManualPlacementFields.jsx'
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
export default function AllocationEditor({lines, onChange, dca = false, ordered = false, maxPositions = MAX_POSITIONS}) {
  const [manualDraft, setManualDraft] = useState(null)
  const [manualTarget, setManualTarget] = useState(null)
  const [changing, setChanging] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [editing, setEditing] = useState(null)
  const [order, setOrder] = useState([])
  function rows(field) {
    const sorted = [...lines].sort((a,b) => (Number.isFinite(b[field])?b[field]:0)-(Number.isFinite(a[field])?a[field]:0))
    if (!ordered) return lines
    if (editing !== field) return sorted
    // Keep keyed controls stationary until focus leaves this entire input group.
    const known = order.map(asset=>lines.find(line=>line.asset===asset)).filter(Boolean)
    return [...known,...sorted.filter(line=>!order.includes(line.asset))]
  }
  function groupEvents(field) { return {
    onFocusCapture: () => { if(editing!==field) { setOrder(rows(field).map(line=>line.asset)); setEditing(field) } },
    onBlurCapture: e => { if(!e.currentTarget.contains(e.relatedTarget)) setEditing(null) },
    onKeyDown: e => { if(e.key==='Enter'&&e.target.tagName==='INPUT'&&e.target.type==='number') e.target.blur() },
  } }

  function apply(action) { try { onChange(action()); setFeedback('Répartition mise à jour. Les versements sont conservés.') } catch(error) { setFeedback(error.message) } }
  const total = lines.reduce((sum, line) => sum + (Number.isFinite(line.weight) ? line.weight : 0), 0)
  const options = searchAssets('', '').filter(key => !lines.some(line => line.asset === key)).map(key => ({
    id:key, label:catalog[key]?.name || ASSETS[key][1], isin:references[key]?.isin,
    search:[...(references[key]?.aliases || []), ...(references[key]?.tickers || [])].join(' '),
    group:references[key]?.category || (references[key]?.kind === 'equity' ? 'Actions' : exposureGroup({name:catalog[key]?.name || ASSETS[key][1]})),
    badges:references[key]?.pea === true ? ['PEA'] : [],
  }))
  function edit(asset, patch) { if(patch.asset && patch.asset!==asset) setEditing(null); onChange(lines.map(line => line.asset === asset ? {...line, ...patch} : line)) }
  function startManual(line) {
    setManualTarget(line?.asset || null)
    setManualDraft(newManualLine({weight:line?.weight ?? Math.max(0,100-total),amount:line?.amount ?? 0}))
  }
  function commitManual(event) {
    event.preventDefault()
    if(!manualDraft.label.trim()){setFeedback('Indique le nom du placement.');return}
    if(!manualTarget && lines.length>=maxPositions){setFeedback(`Ajout refusé : ${maxPositions} positions maximum.`);return}
    if(manualTarget && !lines.some(line=>line.asset===manualTarget)){setManualDraft(null);return}
    const next={...manualDraft,label:manualDraft.label.trim()}
    onChange(manualTarget ? lines.map(line=>line.asset===manualTarget?next:line) : [...lines,next])
    setManualDraft(null);setChanging(null);setEditing(null);setFeedback('Placement manuel ajouté.')
  }
  function replaceLine(previous,next) {
    onChange(lines.map(line=>line.asset===previous.asset?{...next,weight:previous.weight,amount:previous.amount}:line))
    setChanging(null);setEditing(null)
  }
  return <>
    <h2>Mon allocation</h2>
    <p className="dca-note">Personnalise chaque ligne avec « Changer l’actif », ou ajoute un support. {Object.keys(ASSETS).length} actifs disponibles par nom, ticker ou ISIN.</p>
    <p className="dca-note" role="status">{lines.length} / {maxPositions} positions{lines.length===maxPositions?" · Limite atteinte : retire une position pour ajouter un actif.":""}</p>
    {lines.length>maxPositions&&<p role="alert">Publication bloquée : ce portefeuille dépasse {maxPositions} positions. Toutes ses données sont conservées. Retire des lignes pour poursuivre.</p>}
    <AssetPicker label="Ajouter un actif" items={options} value="" onChange={asset => {if(lines.length>=maxPositions){setFeedback(`Ajout refusé : ${maxPositions} positions maximum.`);return}onChange([...lines, newLine(asset, Math.max(0, 100 - total))])}} clearSearchOnSelect searchPlaceholder="Nom, ticker ou ISIN" optionsClassName="dca-simple-results" disabled={lines.length >= maxPositions} />
    <button type="button" disabled={lines.length>=maxPositions} onClick={()=>startManual()}>Ajouter un placement manuellement</button>
    {manualDraft&&<form className="dca-manual-form" onSubmit={commitManual}>
      <h3>{manualTarget?'Remplacer par un placement manuel':'Placement manuel'}</h3>
      <ManualPlacementFields line={manualDraft} onChange={patch=>setManualDraft({...manualDraft,...patch})}/>
      <div className="dca-fields"><label>Poids actuel (%)<input required type="number" min="0" max="100" step="0.01" value={manualDraft.weight} onChange={e=>setManualDraft({...manualDraft,weight:e.target.value===''?'':Number(e.target.value)})}/></label>
      {dca&&<label>Versement mensuel (€/mois, facultatif)<input type="number" min="0" max="1000000" step="0.01" value={manualDraft.amount} onChange={e=>setManualDraft({...manualDraft,amount:Number(e.target.value)})}/></label>}</div>
      <p className="dca-note">Le poids détenu et le versement sont indépendants. Aucun ISIN requis. Pour une assurance-vie, saisis ses supports une seule fois, sans ajouter le contrat en plus.</p>
      <button type="submit">{manualTarget?'Remplacer le placement':'Ajouter ce placement'}</button><button type="button" onClick={()=>setManualDraft(null)}>Annuler la saisie manuelle</button>
    </form>}
    {!lines.length && <p className="dca-note">Recherche ton premier actif pour commencer.</p>}
    {!!lines.length && <button type="button" onClick={() => apply(() => equalWeights(lines))}>Répartir à parts égales</button>}
    {feedback && <p role="status">{feedback}</p>}
    {ordered&&<p className="dca-note">Allocation par poids décroissants ; versements par montants décroissants. Le classement se met à jour en quittant le groupe ou avec Entrée.</p>}
    <section aria-label="Allocation actuelle" {...groupEvents("weight")}>
    {ordered&&<h3>Allocation actuelle</h3>}
    {rows("weight").map(line => {const index=lines.indexOf(line);return <div key={line.asset} className="dca-position">
     <div className={'dca-simple-line'}>
      <div><strong>{line.label}</strong><small>{line.isin}</small><button type="button" className="dca-change-asset" aria-label={`Changer l’actif position ${index+1}`} aria-expanded={changing===line.asset} onClick={()=>setChanging(changing===line.asset?null:line.asset)}>{changing===line.asset?'Annuler':'Changer l’actif'}</button></div>
      <label><span className="sr-only">Poids position {index+1}</span><input aria-label={`Poids position ${index+1}`} type="number" min="0" max="100" step="0.01" value={Number.isFinite(line.weight) ? line.weight : ''} onChange={e => edit(line.asset, {weight:e.target.value === '' ? NaN : Number(e.target.value)})} /><span>%</span></label>

      <button aria-label={`Retirer ${line.label}`} onClick={() => {setEditing(null);onChange(lines.filter((_,i) => i !== index))}}>×</button>
     </div>
     {isManualLine(line)&&<ManualPlacementFields line={line} onChange={patch=>edit(line.asset,patch)}/>}
     {changing===line.asset&&<div className="dca-replace-asset">
      <p className="dca-note">Le nouvel actif conserve le poids{dca?' et le versement mensuel':''} de cette ligne.</p>
      <AssetPicker label={`Remplacer l’actif position ${index+1}`} items={options} value="" onChange={asset=>{replaceLine(line,newLine(asset))}} searchPlaceholder="Nom, ticker ou ISIN" optionsClassName="dca-simple-results" />
      <button type="button" onClick={()=>startManual(line)}>Remplacer par un placement manuel</button>
     </div>}
     {Math.abs(total-100) > .001 && <button type="button" aria-label={`Affecter le solde à la position ${index+1}`} onClick={() => apply(() => assignRemainder(lines,index))}>Affecter le solde à cette ligne</button>}
    </div>})}
    </section>
    {dca&&<section aria-label="Versements mensuels" {...groupEvents("amount")}><h3>Versements mensuels</h3>
      {rows("amount").map(line=>{const index=lines.indexOf(line);return <div className="dca-simple-line dca-flow-line" key={line.asset}>
        <div><strong>{line.label}</strong><small>{line.isin}</small></div>
        <label><input aria-label={`DCA position ${index+1}`} type="number" min="0" max="1000000" step="0.01" value={Number.isFinite(line.amount)?line.amount:""} onChange={e=>edit(line.asset,{amount:e.target.value===""?NaN:Number(e.target.value)})}/><span>€/mois</span></label>
      </div>})}
    </section>}
    <p className="dca-total">Total : {pct(total)} / 100 %{Math.abs(total-100) > .001 && !!lines.length && <small>{total < 100 ? `Il manque ${pct(100-total)}.` : `${pct(total-100)} en trop.`}</small>}</p>
  </>
}
