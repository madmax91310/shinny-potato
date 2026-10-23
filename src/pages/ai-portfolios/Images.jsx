import {useMemo,useState,useEffect} from 'react'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import {FORMATS,PERIODS,publication,publicationTweet,periodBounds} from './publication.js'
import {renderCards} from './cards.js'
// Retain the prepared PNG as a browser resource. The native download does not
// import, render or encode anything when an old tab is used after deployment.
function ImageExport({canvas,filename,label,alt}){
 const preview=useMemo(()=>canvas.toDataURL('image/png'),[canvas])
 const [resource,setResource]=useState(null)
 useEffect(()=>{
  const bytes=Uint8Array.from(atob(preview.split(',')[1]),ch=>ch.charCodeAt(0))
  const href=URL.createObjectURL(new Blob([bytes],{type:'image/png'}))
  setResource({preview,href})
  return ()=>{setTimeout(()=>URL.revokeObjectURL(href),60000)}
 },[preview])
 return <div>{resource?.preview===preview?<a className="ai-download" href={resource.href} download={filename}>{label}</a>:<p role="status">Préparation du PNG…</p>}<img className="ai-image" src={preview} width={canvas.width} height={canvas.height} alt={alt}/></div>
}
export default function Images({comp,bundle,participant,chooseParticipant,copy}){
 const [format,setFormat]=useState('individual'),[period,setPeriod]=useState('all'),[end,setEnd]=useState(bundle.market.asOf),[selected,setSelected]=useState(comp?.config.participants.slice(0,3).map(p=>p.id)??[]),[title,setTitle]=useState(''),[subtitle,setSubtitle]=useState(''),[editor,setEditor]=useState(null)
 useEffect(()=>{setTitle('');setSubtitle('');setEditor(null)},[format,period,end,participant,selected])
 const output=useMemo(()=>{try{if(!comp||comp.status!=='launched')return {error:'Aucune compétition lancée. Les images apparaîtront après les premiers arrêtés, sans portefeuille inventé.'};const model=publication(comp,bundle.state.daily[comp.id]??[],bundle.market,{format,period,end,participants:selected,participant});return {model,canvases:renderCards(model,comp,bundle.market,{title,subtitle})}}catch(e){return {error:e.message}}},[bundle,comp,format,period,end,participant,selected,title,subtitle])
 const individual=['individual','moves','curve'].includes(format),text=output.model?publicationTweet(output.model):''
 return <section className="ai-panel"><h2>Images et textes pour X</h2><p>Titres et textes temporaires. Aucune retouche ne modifie les décisions, les modèles déclarés ou les calculs.</p><div className="ai-form-grid">
 <label className="ai-field"><span>Format de l’image</span><ChoicePicker aria-label="Format de l’image" value={format} onChange={e=>setFormat(e.target.value)}>{FORMATS.map(([id,name])=><option value={id} key={id}>{name}</option>)}</ChoicePicker></label>
 <label className="ai-field"><span>Période de l’image</span><ChoicePicker aria-label="Période de l’image" value={period} onChange={e=>setPeriod(e.target.value)}>{PERIODS.map(([id,name])=>{let disabled=false;try{periodBounds(comp,end,id)}catch{disabled=true}return <option key={id} value={id} disabled={disabled}>{name}{disabled?' · historique insuffisant':''}</option>})}</ChoicePicker></label>
 <label className="ai-field"><span>Arrêté de l’image</span><input type="date" value={end} min={comp?.startDate} max={bundle.market.asOf} onChange={e=>setEnd(e.target.value)}/></label></div>
 {individual?<label className="ai-field"><span>Participant de l’image</span><ChoicePicker aria-label="Participant de l’image" value={participant} onChange={e=>chooseParticipant(e.target.value)}>{comp?.config.participants.map(p=><option key={p.id} value={p.id}>{p.name} · {p.model}</option>)}</ChoicePicker></label>:<fieldset className="ai-actions"><legend>Participants présentés</legend>{comp?.config.participants.map(p=><label key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={e=>setSelected(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/>{p.name}</label>)}</fieldset>}
 <div className="ai-form-grid"><label className="ai-field"><span>Titre temporaire</span><input maxLength={80} value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="ai-field"><span>Sous-titre temporaire</span><input maxLength={100} value={subtitle} onChange={e=>setSubtitle(e.target.value)}/></label></div>
 {output.error?<p role="status" className="ai-alert">{output.error}</p>:<><p>{output.model.start} → {output.model.end}. {output.model.opening?'Capital initial avant frais d’entrée comme base de départ.':'Après la clôture de début, jusqu’à la clôture de fin incluse.'} Les courbes sont rebasées sur cette période. Référence : {output.model.reference?.name} · {output.model.reference?.isin} · {output.model.reference?.ticker} {output.model.reference?.mic}. {output.model.reference?.instrumentType==='ETF'?'Performance du fonds identifié, pas de l’indice exact.':'Performance de l’instrument de référence identifié.'} Conversion historique en devise commune ; la convention de la compétition archivée est conservée.</p>
 <label className="ai-field"><span>Tweet temporaire</span><textarea rows="5" value={editor??text} onChange={e=>setEditor(e.target.value)}/></label><button onClick={()=>copy(editor??text)}>Copier le tweet</button>
 <p>{output.canvases.length>1?`${output.canvases.length} images : toutes les lignes sont conservées.`:'Une image prête à télécharger.'}</p>{output.canvases.map((canvas,i)=><ImageExport key={i} canvas={canvas} filename={`portefeuilles-ia-${format}-${end}-${i+1}.png`} label={`Télécharger PNG ${i+1}/${output.canvases.length}`} alt={`Aperçu ${FORMATS.find(x=>x[0]===format)[1]} · image ${i+1}`}/>)}</>}
 </section>
}
