import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import Button from '../../design-system/Button'
import AssetPicker from '../../design-system/AssetPicker'
import { copyPublicationText, notifyPublication, startPublicationDownload } from '../../design-system/publicationActions.js'
import { INSURANCE } from '../../data/insurance.js'
import { TOPICS, DEFAULT_SCENARIO } from './data.js'
import { topicById, fundOptions, buildSheet, buildTweet, date } from './lib.js'
import { drawSheet } from './image.js'
import './style.css'

const SCENARIO_FIELDS=[['capital','Capital initial (€)',1,1000000000],['years','Durée (ans)',1,60],['returnRate','Rendement brut supposé (%)',-99,30],['feeA','Frais du scénario A / nouvel ETF (%)',0,10],['feeB','Frais du scénario B / ancien ETF (%)',0,10],['tradeCost','Coût total du changement (€)',0,1000000000],['delay','Années d’attente',0,60]]
export default function App() {
 const [id,setId]=useState(()=>topicById(new URLSearchParams(location.search).get('fiche')).id)
 const topic=topicById(id),canvas=useRef(null)
 const [scenario,setScenario]=useState(DEFAULT_SCENARIO),[isins,setIsins]=useState(null),[contractId,setContractId]=useState('linxea-spirit-2')
 const [draft,setDraft]=useState(''),[copied,setCopied]=useState(false),[imageError,setImageError]=useState('')
 const result=useMemo(()=>{try{return {sheet:buildSheet(id,{scenario,isins,contractId})}}catch(e){return {error:e.message}}},[id,scenario,isins,contractId])
 const generated=useMemo(()=>result.sheet?buildTweet(result.sheet):'',[result])
 useEffect(()=>{setDraft(generated);setCopied(false)},[generated])
 useEffect(()=>{
  if(!result.sheet || !canvas.current) return
  try {drawSheet(canvas.current,result.sheet);setImageError('')} catch(e) {setImageError(e.message)}
 },[result])
 function choose(next) {
  setId(next);setIsins(null)
  const url=new URL(location.href);url.searchParams.set('fiche',next);history.replaceState(null,'',url)
 }
 async function copy() {try{await copyPublicationText(draft);setCopied(true)}catch{notifyPublication('Le presse-papier est indisponible. Tu peux sélectionner le texte.','error')}}
 function download() {
  canvas.current?.toBlob(blob=>{
   if(!blob){notifyPublication('Impossible de préparer l’image.','error');return}
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`epargnant-libre-${id}.png`;startPublicationDownload(link);setTimeout(()=>URL.revokeObjectURL(url),1000)
  },'image/png')
 }
 const blocked=!!result.error || result.sheet?.blocked || !!imageError
 const options=fundOptions(topic),selection=isins ?? options.map(o=>o.isin)
 const fields=SCENARIO_FIELDS.filter(([key])=>topic.mode!=='switch' || ['capital','feeA','feeB','tradeCost'].includes(key)).filter(([key])=>!(['tradeCost','delay'].includes(key)) || (key==='tradeCost'&&topic.mode==='switch') || (key==='delay'&&topic.mode==='delay')).filter(([key])=> !(topic.mode==='delay'&&key==='feeB'))
 return <div className="practical-scope">
  <PageHeader title="Fiches pratiques" subtitle="Une question, les différences utiles et une image à garder." />
  <ToolWorkspace className="practical-columns" imageContent={<div className="practical-image-panel">{result.sheet && <canvas ref={canvas} role="img" aria-label={topic.title} className="practical-image" />}{imageError && <p role="alert">{imageError}</p>}</div>} actions={<><Button onClick={copy} disabled={blocked}>{copied?'Copié ✓':'Copier le texte'}</Button><Button variant="secondary" onClick={download} disabled={blocked}>Télécharger l’image PNG</Button></>}>
   <section className="tool-settings practical-settings">
    <AssetPicker label="Choisir une fiche" items={TOPICS.map(t=>({id:t.id,label:t.title,group:t.family,detail:t.hook}))} value={id} onChange={choose} />
    {topic.mode==='funds' && <fieldset className="practical-panel"><legend>Parts à comparer</legend><p>Deux ou trois ETF de cette famille, avec une éligibilité PEA documentée.</p>{options.map(o=><label className="practical-check" key={o.isin}><input type="checkbox" checked={selection.includes(o.isin)} onChange={e=>setIsins(e.target.checked?[...selection,o.isin]:selection.filter(i=>i!==o.isin))} /><span>{o.name}<small>{o.ticker} · {o.isin}</small></span></label>)}</fieldset>}
    {topic.mode==='gold' && <fieldset className="practical-panel"><legend>Contrat à examiner</legend><div className="practical-contracts">{INSURANCE.map(c=><button key={c.id} type="button" aria-pressed={contractId===c.id} onClick={()=>setContractId(c.id)}>{c.name}</button>)}</div></fieldset>}
    {['fees','delay','switch'].includes(topic.mode) && <fieldset className="practical-panel"><legend>Ton scénario</legend>{fields.map(([key,label,min,max])=><label className="practical-field" key={key}>{label}<input aria-label={label} type="number" step="any" min={min} max={max} value={Number.isNaN(scenario[key])?'':scenario[key]} onChange={e=>setScenario({...scenario,[key]:e.target.value===''?NaN:Number(e.target.value)})} /></label>)}</fieldset>}
    {result.error && <p className="practical-warning" role="alert">{result.error}</p>}
    {result.sheet?.warnings.length>0 && <div className="practical-warning" role="status">{result.sheet.warnings.map(w=><p key={w}>{w}</p>)}<p>Les chiffres précédemment validés restent visibles. Vérifie l’explication avant publication si la source a changé.</p></div>}
    <details className="practical-panel"><summary>Sources et dates</summary><p>Chaque chiffre garde sa date propre. Les paramètres fiscaux, ETF et contrats suivent les collectes communes de l’application.</p>{result.sheet?.sources.map((s,i)=><p key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a><small>Contrôle : {date(s.checkedAt)}{s.asOf?` · Publication / photographie : ${date(s.asOf)}`:''}</small></p>)}<Link to="/donnees-a-revoir">Voir les données à revoir</Link></details>
   </section>
   <section className="tool-preview practical-panel"><label htmlFor="practical-tweet">Texte prêt à publier</label><textarea id="practical-tweet" value={draft} onChange={e=>{setDraft(e.target.value);setCopied(false)}} rows={24}/><p>{draft.length} caractères</p><Button variant="secondary" onClick={()=>setDraft(generated)}>Rétablir le texte généré</Button><p className="practical-draft-note">Les modifications du texte ne changent pas les données de l’image.</p></section>
  </ToolWorkspace>
 </div>
}
