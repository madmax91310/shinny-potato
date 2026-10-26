import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useSelectedRecords } from '../../lib/use-selected-records.js'
import { exposureRecords } from './records.js'
import PageHeader from '../../design-system/PageHeader'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import Button from '../../design-system/Button'
import { copyPublicationText } from '../../design-system/publicationActions.js'
import { ALL_PROFILES, ASSETS } from './data.js'
import { buildTweetText, pickUnseenProfile } from './lib.js'
import { MAX_POSITIONS, prepareProfile, analyzeProfile, PROFILE_SCOPES, references, euro, pct } from './engine.js'
import { filterProfiles, profileSelection, migrateProfile } from './management.js'
import { readUsageHistory, toggleUsageHistory } from './usage-history.js'
import AllocationEditor, { confirmLines } from './AllocationEditor.jsx'
import ImageExport from './ImageExport.jsx'
import ImageOptions from './ImageOptions.jsx'
import Portfolios from './Portfolios.jsx'
import { useImageExport } from './useImageExport.js'
const Analytics = lazy(() => import('./Analytics.jsx'))
const profiles=ALL_PROFILES.map(prepareProfile)
const draftKey='el-dca-draft-v1'
function initialDraft(){
 try {
  const raw=localStorage.getItem(draftKey)
  if(!raw)return {profile:profiles[0],draft:buildTweetText(profiles[0]),field:'all'}
  const saved=JSON.parse(raw),p=migrateProfile(saved?.profile)
  if(!p||typeof p.id!=='string'||typeof p.name!=='string'||p.name.length>45||!PROFILE_SCOPES.includes(p.scope)||!Array.isArray(p.lines)||p.lines.length>MAX_POSITIONS||!p.lines.every(l=>l&&ASSETS[l.asset]&&typeof l.label==='string'&&l.label.length<=250&&(l.weight===null||Number.isFinite(l.weight))&&(p.imageOnly&&l.amount===undefined||l.amount===null||Number.isFinite(l.amount)))||typeof saved.draft!=='string'||saved.draft.length>20000)throw Error()
  return {...saved,profile:{...p,approved:false,lines:confirmLines(p.lines.map(l=>({...l,weight:l.weight===null?NaN:l.weight,amount:p.imageOnly&&!Number.isFinite(l.amount)?0:l.amount===null?NaN:l.amount})))},field:['all','both','countries','sectors','overlap'].includes(saved.field)?saved.field:'all'}
 }catch{return {profile:profiles[0],draft:buildTweetText(profiles[0]),field:'all',error:'L’ancien brouillon est illisible. Il est conservé sur cet appareil ; utilise une sauvegarde dans « Mes portefeuilles ».'}}
}
export default function DcaApp(){
 const [initial]=useState(initialDraft)
 const [profile,setProfile]=useState(initial.profile),[draft,setDraft]=useState(initial.draft),[field,setField]=useState(initial.field)
 const [feedback,setFeedback]=useState(''),[showAnalysis,setShowAnalysis]=useState(false),[portfolioReset,setPortfolioReset]=useState(0)
 const [filters,setFilters]=useState({selection:profileSelection(initial.profile),budget:'',lines:'',kind:'',unused:false})
 const [usage,setUsage]=useState(()=>readUsageHistory())
 const used=usage.ids
 const seen=useRef(new Set([profile.id])),preparedPicker=useRef(null)
 useEffect(()=>{
  if(initial.error)return
  try{localStorage.setItem(draftKey,JSON.stringify({profile,draft,field}))}catch{setFeedback('Le brouillon ne peut pas être enregistré sur cet appareil.')}
 },[profile,draft,field,initial.error])
 const records=useSelectedRecords(profile.lines.map(line=>line.asset),exposureRecords)
 const a=analyzeProfile(profile)
 const total=profile.lines.reduce((sum,line)=>sum+(Number.isFinite(line.weight)?line.weight:0),0)
 const totalHint=total<100?`Il manque ${pct(100-total)} dans l’allocation.`:`${pct(total-100)} en trop dans l’allocation.`
 const reason=!records.ready?(records.error?'Les expositions n’ont pas pu être chargées.':'Chargement des expositions…'):a.errors.map(error=>error.includes('totaliser 100')?totalHint:error).join(' ')
 const image=useImageExport(profile,field,!reason)
 const filtered=filterProfiles(profiles,filters,used)
 const setFilter=(key,value)=>setFilters({...filters,[key]:value})
 function update(next){setProfile({...next,approved:false});setDraft(buildTweetText(next));setFeedback('')}
 function edit(patch){update({...profile,...patch})}
 function select(next){if(!next)return;setPortfolioReset(n=>n+1);if(preparedPicker.current)preparedPicker.current.open=false;update(structuredClone(next));seen.current.add(next.id)}
 function changeSelection(selection){
  const nextFilters={...filters,selection}
  setFilters(nextFilters)
  const next=filterProfiles(profiles,nextFilters,used)[0]
  if(next)select(next)
 }
 function participate(){edit({mode:'participant',imageOnly:false})}
 function toggleUsed(){
  // Commit in the event, never in a React updater that may be deferred/replayed.
  const next=toggleUsageHistory(usage,profile.id)
  setUsage(next)
 }
 async function copy(){try{await copyPublicationText(draft);setFeedback('Texte copié.')}catch{setFeedback('Copie impossible. Sélectionne le texte.')}}
 return <div className="dca-profiles-scope dca-simple">
 <PageHeader title="Le DCA d’un abonné" subtitle="Choisis un profil ou saisis une participation, puis récupère le texte et l’image."/>
 {initial.error&&<p role="alert">{initial.error}</p>}
 {usage.error&&<p role="alert">{usage.error}</p>}
 <div className="dca-simple-grid">
  <section className="dca-simple-card" id="dca-compose" aria-label="Composer le DCA">
   <div className="dca-mode"><button aria-pressed={profile.mode==='prepared'} onClick={()=>{const next=filterProfiles(profiles,filters,used)[0];if(next)select(next);else setFeedback('Aucun profil ne correspond dans cette sélection. Modifie les filtres.')}}>Profils préparés</button><button aria-pressed={profile.mode==='participant'} onClick={participate}>Créer une participation</button></div>
   {profile.mode==='prepared'&&<label>Sélection de profils<ChoicePicker aria-label="Sélection de profils" value={filters.selection} onChange={e=>changeSelection(e.target.value)}><option value="classic">Profils classiques</option><option value="controversial">Profils polémiques</option></ChoicePicker></label>}
   {profile.mode==='prepared'&&!filtered.length&&<p role="status">Aucun résultat dans cette sélection avec les filtres actuels. Le profil de {profile.name} reste ouvert ; modifie les filtres pour choisir un autre profil.</p>}
   {profile.mode==='prepared'&&<details ref={preparedPicker} className="dca-prepared"><summary>Choisir un profil préparé · {profile.name}</summary>
 <details className="dca-filters"><summary>Filtrer les profils · {filtered.length} résultat{filtered.length>1?'s':''}</summary>
 <div className="dca-fields"><label>Budget mensuel<ChoicePicker aria-label="Budget mensuel" value={filters.budget} onChange={e=>setFilter('budget',e.target.value)}><option value="">Tous les budgets</option><option value="small">Jusqu’à 200 €</option><option value="medium">Plus de 200 à 500 €</option><option value="large">Plus de 500 à 1 000 €</option><option value="high">Plus de 1 000 €</option></ChoicePicker></label>
 <label>Nombre de placements<ChoicePicker aria-label="Nombre de placements" value={filters.lines} onChange={e=>setFilter('lines',e.target.value)}><option value="">Tous</option>{[2,3,4,5].map(n=><option key={n} value={n}>{n} placements</option>)}</ChoicePicker></label>
 <label>Contient au moins<ChoicePicker aria-label="Contient au moins" value={filters.kind} onChange={e=>setFilter('kind',e.target.value)}><option value="">Tous les types</option><option value="thematic">Un ETF sectoriel ou thématique</option><option value="equity">Une action en direct</option><option value="crypto">Une crypto</option><option value="metal">Un métal précieux</option></ChoicePicker></label></div>
 <label><input type="checkbox" checked={filters.unused} onChange={e=>setFilter('unused',e.target.checked)}/>Masquer les profils déjà utilisés</label>
 <button className="dca-remove" onClick={()=>setFilters({selection:filters.selection,budget:'',lines:'',kind:'',unused:false})}>Effacer les filtres</button></details>
 {filtered.length?<ChoicePicker key={filters.selection} aria-label="Choisir un profil DCA" value={profile.id} onChange={e=>select(filtered.find(p=>p.id===e.target.value))}>{filtered.map(p=><option key={p.id} value={p.id}>{p.name} · {p.monthly} €/mois{used.includes(p.id)?' · utilisé':''}</option>)}</ChoicePicker>:<p role="status">Aucun profil ne correspond à ces filtres dans cette sélection. Modifie les filtres ou change de sélection.</p>}
 <div className="dca-buttons"><Button variant="secondary" disabled={!filtered.some(p=>p.id!==profile.id)} onClick={()=>select(pickUnseenProfile(filtered,profile.id,seen.current))}>Autre profil aléatoire</Button><Button variant="secondary" onClick={toggleUsed}>{used.includes(profile.id)?'Marquer non utilisé':'Marquer utilisé'}</Button></div>
 {!filtered.some(p=>p.id===profile.id)&&<p className="dca-note">Le profil affiché reste ouvert, mais ne fait pas partie des résultats filtrés.</p>}
   </details>}
   <label>Pseudonyme<input maxLength={45} value={profile.name} onChange={e=>edit({name:e.target.value})}/></label>
   <details><summary>Présentation facultative</summary><div className="dca-fields">
    <label>Âge<input type="number" min="18" max="100" value={profile.age||''} onChange={e=>edit({age:Math.min(100,Math.max(0,Number(e.target.value)))})}/></label>
    <label>Activité<input maxLength={70} value={profile.job||''} onChange={e=>edit({job:e.target.value})}/></label>
    <label>Localisation générale<input maxLength={60} value={profile.location||''} onChange={e=>edit({location:e.target.value})}/></label>
    <label>Revenu net mensuel (facultatif)<input type="number" min="0" value={profile.income||''} onChange={e=>edit({income:Math.max(0,Number(e.target.value))})}/></label>
   </div></details>
   <AllocationEditor lines={profile.lines} onChange={lines=>edit({lines})} dca={!profile.imageOnly}/>
   {!profile.imageOnly&&<p className="dca-note">Versements : {euro(profile.lines.reduce((s,l)=>s+(Number.isFinite(l.amount)?l.amount:0),0))} / mois</p>}
   <ImageOptions field={field} onFieldChange={setField} limit={profile.exposureLimit||4} onLimitChange={exposureLimit=>edit({exposureLimit})} showCompanies={profile.showCompanies===true} onCompaniesChange={showCompanies=>edit({showCompanies})}/>
   <details><summary>Détails du portefeuille</summary>
    <label>Périmètre<ChoicePicker aria-label="Périmètre du portefeuille" value={profile.scope} onChange={e=>edit({scope:e.target.value})}>{PROFILE_SCOPES.map(s=><option key={s} value={s}>{s}</option>)}</ChoicePicker></label>
    <label><input type="checkbox" checked={!!profile.imageOnly} onChange={e=>{edit({imageOnly:e.target.checked});if(e.target.checked)setField('all')}}/>Répartition uniquement — sans nom ni montants</label>
    {profile.scope==='PEA'&&profile.lines.some(l=>references[l.asset]?.pea!==true)&&<p className="dca-note">L’éligibilité PEA de certains supports n’est pas établie. Vérifie le périmètre choisi.</p>}
   </details>
   <Portfolios resetSignal={portfolioReset} profile={profile} draft={draft} field={field} onLoad={item=>{setFilters(current=>({...current,selection:profileSelection(item.profile)}));setProfile({...item.profile,lines:confirmLines(item.profile.lines),approved:false});setDraft(item.draft);setField(item.field)}}/>
  </section>
  <div className="dca-publication-column">
   <ImageExport image={image} reason={reason} filename={`dca-${profile.id}.png`} alt={profile.imageOnly?'Expositions du portefeuille':`Portefeuille et versements de ${profile.name}`}>
    {records.error&&<button className="dca-secondary" onClick={records.retry}>Réessayer les données</button>}
   </ImageExport>
   <section className="dca-simple-card dca-text-card">
    <label htmlFor="dca-draft">Texte prêt à publier</label><textarea id="dca-draft" value={draft} onChange={e=>{setDraft(e.target.value);setProfile({...profile,approved:false})}}/>
    <div className="dca-buttons"><Button onClick={copy} disabled={!draft.trim()}>Copier le texte</Button><Button variant="secondary" onClick={()=>{setDraft(buildTweetText(profile));setProfile({...profile,approved:false})}}>Rétablir le texte</Button></div>
    {profile.mode==='participant'&&<label className="dca-consent"><input type="checkbox" checked={!!profile.approved} onChange={e=>setProfile({...profile,approved:e.target.checked})}/>La personne a validé le texte, le visuel et les informations à publier.</label>}
    {profile.mode==='participant'&&!profile.approved&&<p className="dca-note">Brouillon à faire valider avant publication. Le téléchargement reste disponible.</p>}
    <p role="status" aria-live="polite">{feedback}</p>
   </section>
  </div>
 </div>
 {!a.errors.length&&<details className="dca-analysis-drawer" onToggle={e=>setShowAnalysis(e.currentTarget.open)}><summary>Voir l’analyse détaillée</summary>{showAnalysis&&<Suspense fallback={<p role="status">Chargement de l’analyse…</p>}><Analytics profile={profile} analysis={a}/></Suspense>}</details>}
 </div>
}
