import {useState} from 'react'
import Card from '../../design-system/Card.jsx'
import Button from '../../design-system/Button.jsx'
import {blankObservation, GROUPS, validateObservation, signedFlow} from './lib.js'
import {FLOW_SOURCES, parsePastedFlows} from './paste.js'

export default function PasteImport({onImport}) {
  const [sourceId,setSourceId]=useState('express'), [group,setGroup]=useState('geography')
  const [text,setText]=useState(''), [preview,setPreview]=useState(null), [errors,setErrors]=useState([])
  const [staged,setStaged]=useState({rows:[],currency:null})
  const [showDetails,setShowDetails]=useState(false)
  const [meta,setMeta]=useState({url:'',start:'',end:'',publishedAt:'',periodKind:'explicit-range',periodEvidence:'',basis:'',label:'',scopeEvidence:'',productTypes:'ETF',rightsStatus:'',rightsEvidence:''})
  const source=FLOW_SOURCES.find(s=>s.id===sourceId)
  function change(key,value) {setMeta(m=>({...m,[key]:value}));setErrors([])}
  function analyse() {try {setPreview(parsePastedFlows(text,group));setErrors([])}catch(error){setErrors([error.message])}}
  function stage() {
    if (!preview?.rows.length || !preview.currency || preview.warnings.length) return
    if (staged.currency && staged.currency!==preview.currency) {setErrors(['Une semaine doit conserver une seule devise.']);return}
    if (preview.rows.some(r=>staged.rows.some(s=>s.group===r.group&&s.originalLabel.toLowerCase()===r.originalLabel.toLowerCase()))) {setErrors(['Cette rubrique contient une exposition déjà ajoutée. Vide la sélection pour la corriger.']);return}
    if (staged.rows.length+preview.rows.length>80) {setErrors(['Limite de 80 lignes par observation.']);return}
    setStaged({currency:preview.currency,rows:[...staged.rows,...preview.rows].map((r,i)=>({...r,id:`paste-${i+1}`}))});setText('');setPreview(null);setErrors([])
  }
  function save() {
    if (!staged.rows.length || !staged.currency) return
    const now=new Date().toISOString(), record=blankObservation()
    Object.assign(record,{id:`manual-${globalThis.crypto.randomUUID()}`,start:meta.start,end:meta.end,periodKind:meta.periodKind,periodEvidence:meta.periodEvidence,publishedAt:meta.publishedAt?new Date(meta.publishedAt).toISOString():'',retrievedAt:now,validatedAt:now,currency:staged.currency,rows:staged.rows})
    record.universe={basis:meta.basis,label:meta.label,evidence:meta.scopeEvidence,productTypes:meta.productTypes.split('/').map(s=>s.trim())}
    record.source={publisher:source.publisher,provider:source.provider,url:meta.url,locator:'Rubriques collées manuellement et vérifiées dans l’aperçu',rightsStatus:meta.rightsStatus,rightsEvidence:meta.rightsEvidence}
    const issues=validateObservation(record)
    if (issues.length) {setErrors(issues);setShowDetails(true);return}
    if (onImport(record)) {setStaged({rows:[],currency:null});setPreview(null);setText('');setErrors([])}
  }
  return <Card className="flows-paste-import"><h2>1. Ouvre une source</h2>
    <p>Relève les entrées et sorties de capitaux de la semaine.</p>
    <p className="flows-source-links">{FLOW_SOURCES.map(s=><a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>)}</p>
    <h2 className="flows-step">2. Colle les chiffres</h2>
    <div className="flows-date-row"><label>Source de l’extrait<select aria-label="Source de l’extrait" value={sourceId} onChange={e=>{setSourceId(e.target.value);setPreview(null);setText('');setStaged({rows:[],currency:null});setMeta(m=>({...m,url:'',basis:'',label:'',scopeEvidence:'',rightsStatus:'',rightsEvidence:''}));setErrors([])}}>{FLOW_SOURCES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
    <label>Rubrique à importer<select aria-label="Rubrique à importer" value={group} onChange={e=>{setGroup(e.target.value);setPreview(null)}}>{Object.entries(GROUPS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></div>
    <label>Informations copiées<textarea aria-label="Informations copiées" value={text} onChange={e=>{setText(e.target.value);setPreview(null)}} placeholder={'US exposures : +3,82 Md€\nEurope : +772,7 M€\nChina : −164,9 M€'} /></label>
    <p>Une rubrique à la fois, par exemple « Europe : +772,7 M€ ».</p>
    <details><summary>Quels formats puis-je coller ?</summary><p>Lignes signées, cartes copiées sur deux lignes ou phrases anglaises indiquant clairement une entrée ou une sortie. Les performances, encours et cumuls YTD sont exclus. Sépare les phrases ambiguës en lignes « exposition : montant signé ».</p></details>
    <Button onClick={analyse}>Analyser les informations</Button>
    {preview && <><h3>Aperçu de l’import</h3>{preview.rows.length>0 && <ul>{preview.rows.map(r=><li key={r.id}>{r.label} : {signedFlow(r.amount,preview.currency??'EUR')}</li>)}</ul>}{preview.warnings.map((issue,i)=><p role="alert" key={i}>{issue}</p>)}
      <Button disabled={!preview.rows.length||!preview.currency||!!preview.warnings.length} onClick={stage}>Ajouter cette rubrique à la semaine</Button>
    </>}
    {staged.rows.length>0 && <><h2 className="flows-step">3. Vérifie la semaine</h2><ul>{staged.rows.map(r=><li key={r.id}>{GROUPS[r.group]} · {r.label} : {signedFlow(r.amount,staged.currency)}</li>)}</ul><Button variant="secondary" onClick={()=>{setStaged({rows:[],currency:null});setErrors([])}}>Vider les lignes préparées</Button>
        <label>URL exacte de la page consultée<input type="url" value={meta.url} onChange={e=>change('url',e.target.value)} /></label>
        <div className="flows-date-row"><label>Début de période<input type="date" value={meta.start} onChange={e=>change('start',e.target.value)} /></label>
        <label>Fin de période<input type="date" value={meta.end} onChange={e=>change('end',e.target.value)} /></label></div>
      <details open={showDetails} onToggle={e=>setShowDetails(e.currentTarget.open)}><summary>Compléter les références de la source</summary>
      <fieldset><legend>Période et publication</legend>
        <label>Type de période<select value={meta.periodKind} onChange={e=>change('periodKind',e.target.value)}><option value="explicit-range">Dates explicites</option><option value="rolling-1w">Fenêtre glissante 1W</option></select></label>
        <label>Extrait indiquant les dates et la période complète<input value={meta.periodEvidence} onChange={e=>change('periodEvidence',e.target.value)} /></label>
        <label>Date et heure de publication (heure locale)<input type="datetime-local" value={meta.publishedAt} onChange={e=>change('publishedAt',e.target.value)} /></label>
      </fieldset>
      <fieldset><legend>Périmètre de la source</legend>
        <p>Une exposition Europe n’est pas un univers de fonds européens. Conserve le périmètre effectivement décrit par la source.</p>
        <label>Univers documenté<select value={meta.basis} onChange={e=>change('basis',e.target.value)}><option value="">À renseigner d’après la source</option><option value="europe-listed">Produits cotés en Europe</option><option value="europe-domiciled">Produits domiciliés en Europe</option><option value="global-covered">Univers mondial couvert par la source</option></select></label>
        <label>Libellé court du périmètre<input maxLength={80} value={meta.label} onChange={e=>change('label',e.target.value)} /></label>
        <label>Preuve du périmètre<input value={meta.scopeEvidence} onChange={e=>change('scopeEvidence',e.target.value)} /></label>
        <label>Types de produits<select value={meta.productTypes} onChange={e=>change('productTypes',e.target.value)}><option value="ETF">ETF</option><option value="ETF / ETC / ETP">ETF / ETC / ETP</option><option value="ETC">ETC</option><option value="ETP">ETP</option></select></label>
      </fieldset>
      <details><summary>Réutilisation de la source</summary><p>L’import manuel ne qualifie pas les droits. Les vérifications existantes s’appliquent aussi à ces lignes.</p>
        <label>Statut documenté<select value={meta.rightsStatus} onChange={e=>change('rightsStatus',e.target.value)}><option value="">À documenter</option><option value="open">Réutilisation ouverte</option><option value="licensed">Licence ou autorisation</option></select></label>
        <label>Référence ou preuve des conditions applicables<input value={meta.rightsEvidence} onChange={e=>change('rightsEvidence',e.target.value)} /></label>
      </details>
      </details>
      <Button onClick={save}>Vérifier et importer dans l’outil</Button>
    </>}
    {errors.map(issue=><p role="alert" key={issue}>{issue}</p>)}
  </Card>
}
