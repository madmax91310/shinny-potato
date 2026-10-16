import { readPreference, writePreference } from '../../lib/publication-preferences.js'
import { useEffect, useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import AssetPicker from '../../design-system/AssetPicker.jsx'
import { exposureGroup } from '../../data/asset-labels.js'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { startPublicationDownload } from '../../design-system/publicationActions.js'
import { ASSETS } from './data.js'
import catalog from './catalog.json' with {type:'json'}
import { MAX_POSITIONS, analyzeProfile, references, pct } from './engine.js'
import { searchAssets } from './management.js'
import { exposureDisplay, exposureView } from './exposure.js'
import { renderDcaImage } from './image.js'

const draftKey='simple-exposure-draft'
const validDraft=d=>d&&Array.isArray(d.lines)&&d.lines.length<=MAX_POSITIONS&&d.lines.every(l=>l&&Object.hasOwn(ASSETS,l.asset)&&typeof l.label==='string'&&l.label.length<=250&&(l.weight===null||Number.isFinite(l.weight)))&&['all','both','countries','sectors'].includes(d.field)&&[3,4,6].includes(d.exposureLimit)
export default function SimpleExposure({isin}){
 const [saved]=useState(()=>{const asset=Object.keys(references).find(key=>references[key]?.isin===isin&&ASSETS[key]);return asset?{lines:[{asset,label:catalog[asset]?.name||ASSETS[asset][1],emoji:ASSETS[asset][0],isin,weight:100,amount:0}],field:'all',exposureLimit:4}:readPreference(draftKey,null,validDraft)})
 const [lines,setLines]=useState(()=>saved?.lines.map(l=>({...l,weight:l.weight===null?NaN:l.weight}))||[]),[field,setField]=useState(saved?.field||'all')
 const [exposureLimit,setExposureLimit]=useState(saved?.exposureLimit||4)
 useEffect(()=>{writePreference(draftKey,{lines,field,exposureLimit})},[lines,field,exposureLimit])
 const [preview,setPreview]=useState(''),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState('')
 const revision=useRef(0)
 useEffect(()=>()=>{revision.current++},[])
 const profile={id:'expositions',name:'',scope:'Portefeuille investi',imageOnly:true,lines,exposureLimit}
 const analysis=analyzeProfile(profile)
 const total=lines.reduce((sum,line)=>sum+(Number.isFinite(line.weight)?line.weight:0),0)
 const options=searchAssets('','').filter(key=>!lines.some(line=>line.asset===key)).map(key=>({id:key,label:catalog[key]?.name||ASSETS[key][1],isin:references[key]?.isin,search:[...(references[key]?.aliases||[]),...(references[key]?.tickers||[])].join(' '),group:references[key]?.kind==='equity'?'Actions':exposureGroup({name:catalog[key]?.name||ASSETS[key][1]}),badges:references[key]?.pea===true?['PEA']:[]}))
 function invalidate(){revision.current++;setPreview('');setFeedback('');setBusy(false)}
 function add(asset){
  invalidate()
  setLines([...lines,{asset,label:catalog[asset]?.name||ASSETS[asset][1],emoji:ASSETS[asset][0],isin:references[asset]?.isin||'',weight:Math.max(0,100-total),amount:0}])
 }
 async function generate(){
  const version=++revision.current
  setBusy(true);setFeedback('')
  try{const canvas=await renderDcaImage(profile,field);if(version===revision.current)setPreview(canvas.toDataURL('image/png'))}
  catch{if(version===revision.current)setFeedback('Impossible de générer l’image. Réessaie.')}
  finally{if(version===revision.current)setBusy(false)}
 }
 function download(){const link=document.createElement('a');link.href=preview;link.download='epargnant-libre-expositions.png';startPublicationDownload(link);setFeedback('Téléchargement lancé.')}
 return <div className="dca-profiles-scope dca-simple">
  <PageHeader title="Actifs & expositions" subtitle="Ajoute tes actifs, indique leurs pourcentages et choisis les donuts de ton image."/>
  <div className="dca-simple-grid">
   <section className="dca-simple-card" aria-label="Composer les expositions">
    <h2>Mes actifs</h2>
    <AssetPicker label="Ajouter un actif" items={options} value="" onChange={add} hideIdleResults clearSearchOnSelect searchPlaceholder="Nom, ticker ou ISIN" optionsClassName="dca-simple-results" disabled={lines.length>=MAX_POSITIONS}/>
    {!lines.length&&<p className="dca-note">Recherche ton premier actif pour commencer.</p>}
    {lines.map((line,index)=><div className="dca-simple-line" key={line.asset}>
     <div><strong>{line.label}</strong><small>{line.isin}</small></div>
     <label><span className="sr-only">Poids de {line.label}</span><input aria-label={`Poids de ${line.label}`} type="number" min="0" max="100" step="0.01" value={Number.isFinite(line.weight)?line.weight:''} onChange={e=>{invalidate();setLines(lines.map((item,i)=>i===index?{...item,weight:e.target.value===''?NaN:Number(e.target.value)}:item))}}/><span>%</span></label>
     <button aria-label={`Retirer ${line.label}`} onClick={()=>{invalidate();setLines(lines.filter((_,i)=>i!==index))}}>×</button>
    </div>)}
    <p className="dca-total">Total : {pct(total)} / 100 %</p>
    {!!lines.length&&!!analysis.errors.length&&<div role="status" className="dca-note">{analysis.errors.map(error=><p key={error}>{error}</p>)}</div>}
    <label>Donuts de l’image<ChoicePicker aria-label="Donuts de l’image" value={field} onChange={e=>{invalidate();setField(e.target.value)}}>
     <option value="all">Répartition + géographie + secteurs</option>
     <option value="both">Géographie + secteurs</option>
     <option value="countries">Géographie uniquement</option>
     <option value="sectors">Secteurs uniquement</option>
    </ChoicePicker></label>
    <label>Catégories par donut<ChoicePicker aria-label="Catégories par donut" value={String(exposureLimit)} onChange={e=>{invalidate();setExposureLimit(Number(e.target.value))}}>
     <option value="3">3 catégories</option><option value="4">4 catégories</option><option value="6">6 catégories</option>
    </ChoicePicker></label>
    {!analysis.errors.length&&<details className="dca-note">
     <summary>Données de l’image · pays {pct(exposureDisplay(analysis.countries).coverage)} · secteurs {pct(exposureDisplay(analysis.sectors).coverage)}</summary>
     <p>Synthèse indicative des répartitions publiées. Les méthodes des sources peuvent différer ; les ETF synthétiques utilisent une exposition d’indice documentée, sans leur panier de substitution. Les donuts sont rapportés à la poche actions. Or, cryptos, matières premières et obligations et supports explicitement monétaires restent dans l’allocation. Les données manquantes gardent leur poids dans les donuts ; elles ne sont pas redistribuées.</p>
     {['countries','sectors'].map(f=>{const e=analysis[f],d=exposureDisplay(e);return <div key={f}>
      <strong>{f==='countries'?'Géographie':'Secteurs'} : {pct(d.coverage)} ventilés{e.neutralWeight>0?` · ${pct(e.neutralWeight)} hors classification`:''}{d.missing>0.01?` · ${pct(d.missing)} non ventilés`:''}</strong>
      {d.omitted.map((o,i)=><p key={`${o.asset}-${i}`}>{o.label||o.asset} : {o.reason} ({pct(o.weight)}).</p>)}
      {e.groups[0]?.observations.map(o=><p key={o.asset}><a href={o.sourceUrl} target="_blank" rel="noreferrer">{o.label||o.asset}</a> · {o.asOf} · {o.basis==='index'?'exposition d’indice':o.basis==='equity'?'action':'fonds'}</p>)}
     </div>})}
    </details>}
    {!analysis.errors.length&&<details className="dca-note dca-exposure-detail">
     <summary>Tous les pays et secteurs</summary>
     {['countries','sectors'].map(f=>{const v=exposureView(analysis[f]);return <section key={f}>
      <h3>{f==='countries'?'Pays':'Secteurs'}</h3><p>{v.scope}</p>
      {v.eligible>0?<table><thead><tr><th>Exposition</th><th>Part de la poche actions</th><th>Part du portefeuille</th></tr></thead><tbody>
       {v.rows.map(row=><tr key={row.name}><td>{row.name}</td><td>{pct(row.weight)}</td><td>{pct(row.portfolioWeight)}</td></tr>)}
       {v.missing>0.001&&<tr><td>Non ventilé ici</td><td>{pct(v.missing)}</td><td>{pct(v.portfolioMissing)}</td></tr>}
      </tbody></table>:<p>La géographie et les secteurs ne s’appliquent pas à ces actifs.</p>}
      {!!v.excludedAssets.length&&<p>Hors de ce donut : {v.excludedAssets.map(r=>`${r.name} (${pct(r.weight)} du portefeuille)`).join(', ')}.</p>}
     </section>})}
    </details>}
    <Button disabled={!!analysis.errors.length||busy} onClick={generate}>{busy?'Génération…':'Générer l’image'}</Button>
   </section>
   <section className="dca-simple-card dca-simple-preview" aria-label="Image des expositions" aria-busy={busy}>
    {preview?<><img src={preview} alt="Répartition et expositions du portefeuille"/><Button onClick={download}>Télécharger le PNG</Button></>:<p>Ton image apparaîtra ici.</p>}
    <p role="status" aria-live="polite">{feedback}</p>
   </section>
  </div>
 </div>
}
