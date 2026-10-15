import { useCallback, useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import Button from '../../design-system/Button'
import { copyPublicationText, startPublicationDownload } from '../../design-system/publicationActions.js'
import { PROFILES, ASSETS } from './data.js'
import { buildTweetText, pickUnseenProfile } from './lib.js'
import { prepareProfile, analyzeProfile, references, pct, euro, publicationReady } from './engine.js'
import { renderDcaImage } from './image.js'
import './dca-profiles.css'
const profiles=PROFILES.map(prepareProfile)
export default function App(){
 const [profile,setProfile]=useState(profiles[0]),[draft,setDraft]=useState(buildTweetText(profiles[0])),[feedback,setFeedback]=useState('')
 const seen=useRef(new Set([profiles[0].id]))
 const a=analyzeProfile(profile),ready=publicationReady(profile)
 const renderImage=useCallback(()=>renderDcaImage(profile),[profile])
 function update(next){setProfile(next);setDraft(buildTweetText(next));setFeedback('')}
 function edit(patch){update({...profile,...patch,approved:false})}
 function lineEdit(index,patch){edit({lines:profile.lines.map((l,i)=>i===index?{...l,...patch}:l)})}
 function select(next){update(structuredClone(next));seen.current.add(next.id)}
 async function copy(){try{await copyPublicationText(draft);setFeedback('Texte copié.')}catch{setFeedback('Copie impossible. Sélectionne le texte.')}}
 function download(){try{const link=document.createElement('a');link.href=renderImage().toDataURL('image/png');link.download=`dca-${profile.id}.png`;startPublicationDownload(link);setFeedback('Téléchargement lancé.')}catch{setFeedback('Impossible de préparer l’image.')}}
 function save(){try{localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft}));setFeedback('Brouillon enregistré sur cet appareil.')}catch{setFeedback('Le stockage local est indisponible.')}}
 function restore(){try{const saved=JSON.parse(localStorage.getItem('el-dca-draft-v1'));if(!saved?.profile||analyzeProfile(saved.profile).errors.length||typeof saved.draft!=='string')throw Error();setProfile({...saved.profile,approved:false});setDraft(saved.draft);setFeedback('Brouillon restauré.')}catch{setFeedback('Aucun brouillon valide enregistré.')}}
 return <div className="dca-profiles-scope">
 <PageHeader title="Le DCA de…" subtitle="Le portefeuille en pourcentage, les versements en euros. Deux lectures complémentaires, sans dévoiler le capital." />
 <ToolWorkspace renderImage={renderImage} imageDisabled={!!a.errors.length} imageAlt={`Portefeuille et versements de ${profile.name}`} actions={<>
 <Button onClick={copy} disabled={!ready||!draft.trim()}>Copier le texte</Button><Button variant="secondary" onClick={download} disabled={!ready}>Télécharger le PNG</Button>
 </>}>
 <section className="tool-settings">
 <div className="dca-mode"><button aria-pressed={profile.mode==='prepared'} onClick={()=>select(profiles[0])}>Profils préparés</button><button aria-pressed={profile.mode==='participant'} onClick={()=>update({id:'personnalise',name:'',scope:'PEA + CTO',mode:'participant',approved:false,lines:[{asset:'world',label:ASSETS.world[1],emoji:ASSETS.world[0],isin:'',weight:100,amount:0}]})}>Créer une participation</button></div>
 {profile.mode==='prepared'&&<><ChoicePicker aria-label="Choisir un profil DCA" value={profile.id} onChange={e=>select(profiles.find(p=>p.id===e.target.value))}>{profiles.map(p=><option key={p.id} value={p.id}>{p.name} · {p.monthly} €/mois</option>)}</ChoicePicker><Button variant="secondary" onClick={()=>select(pickUnseenProfile(profiles,profile.id,seen.current))}>Autre profil aléatoire</Button></>}
 <div className="dca-fields"><label>Pseudonyme<input maxLength={45} value={profile.name} onChange={e=>edit({name:e.target.value})}/></label><label>Périmètre<ChoicePicker value={profile.scope} onChange={e=>edit({scope:e.target.value})}>{['Portefeuille investi','PEA + CTO','PEA','CTO','Ensemble des placements'].map(s=><option key={s}>{s}</option>)}</ChoicePicker></label></div>
 <details><summary>Présentation facultative</summary><div className="dca-fields"><label>Âge<input type="number" min="18" max="100" value={profile.age||''} onChange={e=>edit({age:Math.min(100,Math.max(0,Number(e.target.value)))})}/></label><label>Activité<input maxLength={70} value={profile.job||''} onChange={e=>edit({job:e.target.value})}/></label><label>Localisation générale<input maxLength={60} value={profile.location||''} onChange={e=>edit({location:e.target.value})}/></label><label>Revenu net mensuel (facultatif)<input type="number" min="0" value={profile.income||''} onChange={e=>edit({income:Math.max(0,Number(e.target.value))})}/></label></div></details>
 <h2>Portefeuille & versements</h2><p className="dca-note">Une position peut être conservée sans versement, ou recevoir un premier versement avec un poids actuel de 0 %.</p>
 {profile.lines.map((l,i)=><fieldset className="dca-position" key={i}><legend>Position {i+1}</legend><label>Actif<ChoicePicker value={l.asset} onChange={e=>{const asset=e.target.value;lineEdit(i,{asset,emoji:ASSETS[asset][0],label:ASSETS[asset][1],isin:profile.mode==='prepared'?references[asset]?.isin||'':''})}}>{Object.entries(ASSETS).map(([key,[,label]])=><option key={key} value={key}>{label}</option>)}</ChoicePicker></label>
 <div className="dca-fields"><label>Poids actuel (%)<input aria-label={`Poids position ${i+1}`} type="number" min="0" max="100" step="0.01" value={Number.isFinite(l.weight)?l.weight:''} onChange={e=>lineEdit(i,{weight:e.target.value===''?NaN:Number(e.target.value)})}/></label><label>DCA (€/mois)<input aria-label={`DCA position ${i+1}`} type="number" min="0" max="1000000" step="0.01" value={Number.isFinite(l.amount)?l.amount:''} onChange={e=>lineEdit(i,{amount:e.target.value===''?NaN:Number(e.target.value)})}/></label></div>
 {references[l.asset]&&<label className="dca-reference">Support exact pour les expositions<ChoicePicker aria-label={`Support position ${i+1}`} value={l.isin||''} onChange={e=>lineEdit(i,{isin:e.target.value})}><option value="">Aucun support confirmé</option><option value={references[l.asset].isin}>{references[l.asset].name} · {references[l.asset].isin}</option></ChoicePicker></label>}
 <button className="dca-remove" onClick={()=>edit({lines:profile.lines.filter((_,j)=>j!==i)})}>Retirer la position {i+1}</button></fieldset>)}
 <Button variant="secondary" disabled={profile.lines.length>=8} onClick={()=>{const asset=Object.keys(ASSETS).find(k=>!profile.lines.some(l=>l.asset===k));edit({lines:[...profile.lines,{asset,label:ASSETS[asset][1],emoji:ASSETS[asset][0],isin:'',weight:0,amount:0}]})}}>Ajouter une position</Button>
 <p className="dca-total">Total : {pct(profile.lines.reduce((s,l)=>s+(Number.isFinite(l.weight)?l.weight:0),0))} · {euro(profile.lines.reduce((s,l)=>s+(Number.isFinite(l.amount)?l.amount:0),0))} / mois</p>
 {!!a.errors.length&&<div role="alert" className="dca-errors">{a.errors.map(e=><p key={e}>{e}</p>)}</div>}
 {!a.errors.length&&<details className="dca-evidence"><summary>Expositions, couverture et sources</summary><p>Poids rapportés au portefeuille total. Les photographies de dates et de périmètres différents restent séparées. Les pays ne représentent pas les lieux de chiffre d’affaires. Les recoupements d’entreprises ne sont pas chiffrés sans compositions complètes.</p>{['countries','sectors'].map(field=><div key={field}><h3>{field==='countries'?'Pays':'Secteurs'} · couverture {pct(a[field].coverage)}</h3>{a[field].groups.map((g,i)=><section key={i}><p>{g.asOf} · {g.basis==='fund'?'Fonds':'Indice suivi'} · {g.classification} · {pct(g.coverage)} du portefeuille</p>{g.rows.map(r=><div className="dca-exposure" key={r.name}><span>{r.name}</span><b>{pct(r.weight)}</b></div>)}{g.sources.map((url,j)=><a key={url} href={url} target="_blank" rel="noreferrer">Source {j+1} ↗ </a>)}</section>)}<p>Hors couverture : {pct(Math.max(0,100-a[field].coverage))}. Cela peut inclure des actifs sans ventilation ou sans support exact confirmé.</p></div>)}</details>}
 {profile.mode==='participant'&&<label className="dca-consent"><input type="checkbox" checked={profile.approved} onChange={e=>setProfile({...profile,approved:e.target.checked})}/>La personne a validé le texte, le visuel et les informations à publier.</label>}
 <div className="dca-buttons"><Button variant="secondary" onClick={save}>Enregistrer le brouillon</Button><Button variant="secondary" onClick={restore}>Restaurer le brouillon</Button></div><p className="dca-note">Brouillon stocké uniquement sur cet appareil. Aucun formulaire ni envoi à un tiers.</p>
 </section>
 <section className="tool-preview"><label className="dca-label" htmlFor="dca-draft">Texte prêt à publier</label><textarea id="dca-draft" value={draft} onChange={e=>{setDraft(e.target.value);setProfile({...profile,approved:false})}}/><p className="dca-note">{Array.from(draft).length} caractères · Les modifications du portefeuille régénèrent le texte.</p><Button variant="secondary" disabled={!!a.errors.length} onClick={()=>{setDraft(buildTweetText(profile));setProfile({...profile,approved:false})}}>Rétablir le texte</Button><p role="status" aria-live="polite">{feedback}</p></section>
 </ToolWorkspace></div>
}
