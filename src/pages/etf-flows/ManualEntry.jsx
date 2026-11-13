import {useCallback, useEffect, useRef, useState} from 'react'
import Card from '../../design-system/Card.jsx'
import Button from '../../design-system/Button.jsx'
import PageHeader from '../../design-system/PageHeader.jsx'
import ToolWorkspace from '../../design-system/ToolWorkspace.jsx'
import {copyPublicationText} from '../../design-system/publicationActions.js'
import {readLocalPreferenceRecord,writeLocalPreference} from '../../lib/publication-preferences.js'
import {FLOW_SOURCES} from './paste.js'
import {MANUAL_KEY,emptyDraft,emptyLine,validDraft,prepareManual,manualTweet} from './manual.js'
import './App.css'

export default function ManualEntry() {
  const [initial]=useState(()=>readLocalPreferenceRecord(MANUAL_KEY,emptyDraft(),validDraft))
  const [draft,setDraft]=useState(initial.value), [view,setView]=useState('settings')
  const [approved,setApproved]=useState(false), [message,setMessage]=useState(''), [showErrors,setShowErrors]=useState(false)
  const raw=useRef(initial.raw), saving=useRef(initial.readable)
  const {errors,rows}=prepareManual(draft), ready=!errors.length
  const text=ready?manualTweet(draft,rows):''
  useEffect(()=>{
    if(!saving.current)return
    const current=readLocalPreferenceRecord(MANUAL_KEY,null,validDraft)
    if(!current.readable||current.raw!==raw.current||!writeLocalPreference(MANUAL_KEY,draft,validDraft)) {
      saving.current=false;setMessage('Sauvegarde indisponible ou autre onglet modifié. Ta saisie reste dans cette session.');return
    }
    raw.current=JSON.stringify(draft)
  },[draft])
  function change(key,value){setDraft(d=>({...d,[key]:value}));setApproved(false);setMessage('')}
  function changeRow(index,key,value){setDraft(d=>({...d,rows:d.rows.map((r,i)=>i===index?{...r,[key]:value}:r)}));setApproved(false);setMessage('')}
  const renderImage=useCallback(async()=>{
    const checked=prepareManual(draft)
    if(checked.errors.length||!approved)throw Error('Vérifie la saisie et coche la relecture.')
    const {renderFlowImage}=await import('./image.js')
    return renderFlowImage({start:draft.start,end:draft.end,currency:draft.currency,universe:{label:draft.scope.trim()}},checked.rows,false,{manual:true})
  },[draft,approved])
  async function copy(){
    const checked=prepareManual(draft)
    if(checked.errors.length||!approved)return
    try{await copyPublicationText(manualTweet(draft,checked.rows));setMessage('Tweet copié.')}catch(e){setMessage(e.message)}
  }
  function preview(){setShowErrors(true);if(ready)setView('preview')}
  return <div className="etf-flows flows-manual">
    <PageHeader title="Où va l’argent des ETF ?" subtitle="Relève les chiffres sur un site, remplis les lignes et récupère ton tweet ou ton image." />
    <ToolWorkspace view={view} onViewChange={setView} renderImage={renderImage} imageDisabled={!ready||!approved} imageFilename={`flux-etf-${draft.end||'brouillon'}.png`} imageAlt="Sélection de flux nets relevés manuellement" actions={<Button disabled={!ready||!approved} onClick={copy}>Copier le tweet</Button>}>
      <div className="tool-settings">
        <Card><h2>1. Consulte une source</h2><p className="flows-source-links">{FLOW_SOURCES.map(s=><a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>)}</p></Card>
        <Card><h2>2. Renseigne la période et les flux</h2>
          <div className="flows-date-row"><label>Du<input type="date" value={draft.start} onChange={e=>change('start',e.target.value)} /></label><label>Au<input type="date" value={draft.end} onChange={e=>change('end',e.target.value)} /></label></div>
          <label>Lien de la page consultée<input type="url" placeholder="https://…" value={draft.url} maxLength={2000} onChange={e=>change('url',e.target.value)} /></label>
          <label>Périmètre indiqué par la source<input value={draft.scope} maxLength={80} placeholder="Ex. ETF cotés en Europe" onChange={e=>change('scope',e.target.value)} /></label>
          <fieldset className="flows-inline"><legend>Devise des chiffres</legend>{['EUR','USD'].map(c=><label className="flows-check" key={c}><input type="radio" name="manual-currency" value={c} checked={draft.currency===c} onChange={()=>change('currency',c)} />{c==='EUR'?'Euro (€)':'Dollar ($)'}</label>)}</fieldset>
          <p>Montant positif = entrée d’argent. Montant négatif = sortie. Recopie uniquement les flux nets de la même période, devise et du même périmètre.</p>
          {draft.rows.map((r,i)=><fieldset className="flows-manual-line" key={i}><legend>Flux {i+1}</legend>
            <label>Pays, secteur ou indice<input aria-label={`Nom du flux ${i+1}`} value={r.label} maxLength={60} placeholder="Ex. Europe" onChange={e=>changeRow(i,'label',e.target.value)} /></label>
            <label>Montant<input aria-label={`Montant du flux ${i+1}`} type="text" inputMode="text" maxLength={30} placeholder="Ex. +772,7 ou −164,9" value={r.amount} onChange={e=>changeRow(i,'amount',e.target.value)} /></label>
            <div className="flows-inline" role="group" aria-label={`Unité du flux ${i+1}`}>{['M','Md'].map(u=><label className="flows-check" key={u}><input type="radio" name={`manual-unit-${i}`} checked={r.unit===u} onChange={()=>changeRow(i,'unit',u)} />{u==='M'?'Millions':'Milliards'}</label>)}</div>
            {draft.rows.length>1&&<Button variant="secondary" onClick={()=>change('rows',draft.rows.filter((_,n)=>n!==i))}>Retirer le flux {i+1}</Button>}
          </fieldset>)}
          <Button variant="secondary" disabled={draft.rows.length>=10} onClick={()=>change('rows',[...draft.rows,emptyLine()])}>Ajouter un flux</Button>
          <p>La saisie est conservée sur cet appareil. Ce sont tes chiffres relevés manuellement, sans validation automatique de la source.</p>
          {!initial.readable&&<p role="alert">Un ancien brouillon est illisible. Il est conservé ; cette saisie reste dans la session.</p>}
          <label className="flows-check"><input type="checkbox" checked={approved} disabled={!ready} onChange={e=>setApproved(e.target.checked)} />J’ai vérifié les chiffres sur la source.</label>
          <Button onClick={preview}>Voir le résultat</Button>
          {showErrors&&errors.map(e=><p role="alert" key={e}>{e}</p>)}
        </Card>
      </div>
      <Card className="tool-preview"><h2>3. Ton tweet et ton image</h2>{ready?<><label>Tweet<textarea aria-label="Tweet" readOnly value={text} /></label>{!approved&&<p>Coche la relecture pour activer la copie et le téléchargement.</p>}</>:<p>Remplis les champs à gauche pour préparer le résultat.</p>}</Card>
    </ToolWorkspace>
    {message&&<p role="status" className="flows-feedback">{message}</p>}
  </div>
}
