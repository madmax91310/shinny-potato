import { useCallback, useEffect, useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import Button from '../../design-system/Button'
import { copyPublicationText, startPublicationDownload } from '../../design-system/publicationActions.js'
import { PROFILES, ASSETS } from './data.js'
import { buildTweetText, pickUnseenProfile } from './lib.js'
import { MAX_POSITIONS, prepareProfile, analyzeProfile, PROFILE_SCOPES, references, pct, euro, publicationReady } from './engine.js'
import { exposureDisplay } from './exposure.js'
import { renderDcaImage } from './image.js'
import { filterProfiles, searchAssets, migrateProfile, readSaved, writeSaved, readUsed, USED_KEY } from './management.js'
import Analytics from './Analytics.jsx'
import SimpleExposure from './SimpleExposure.jsx'
import catalog from './catalog.json' with {type:'json'}
import './dca-profiles.css'
const profiles=PROFILES.map(prepareProfile)
export default function App(){
 const [mode,setMode]=useState('exposure'),[dcaVisited,setDcaVisited]=useState(false)
 return <><nav className="dca-simple-tabs" aria-label="Choisir un outil"><button aria-pressed={mode==='exposure'} onClick={()=>setMode('exposure')}>Actifs & expositions</button><button aria-pressed={mode==='dca'} onClick={()=>{setDcaVisited(true);setMode('dca')}}>Le DCA de…</button></nav><div hidden={mode!=='exposure'}><SimpleExposure/></div><div hidden={mode!=='dca'}>{dcaVisited&&<DcaApp/>}</div></>
}
function DcaApp(){
 const [profile,setProfile]=useState(profiles[0]),[draft,setDraft]=useState(buildTweetText(profiles[0])),[feedback,setFeedback]=useState('')
 const [field,setField]=useState('all'),[assetFilter,setAssetFilter]=useState(''),[filters,setFilters]=useState({budget:'',lines:'',kind:'',unused:false})
 const [used,setUsed]=useState(()=>{try{return readUsed(localStorage)}catch{return []}}),[queries,setQueries]=useState({})
 const [savedState,setSavedState]=useState(()=>{try{return {items:readSaved(localStorage),error:''}}catch{return {items:[],error:'Impossible de lire les portefeuilles enregistrés. Le stockage existant a été conservé.'}}})
 const [savedId,setSavedId]=useState(''),[saveTitle,setSaveTitle]=useState(profiles[0].name)
 const [view,setView]=useState('settings'),[publicationTab,setPublicationTab]=useState('text'),[destination,setDestination]=useState(null)
 function navigate(step){
  if(step==='publish'){setView('preview');setPublicationTab('text')}else setView('settings')
  setDestination({id:step==='publish'?'dca-draft':step==='analyze'?'dca-analysis':'dca-compose'})
 }
 useEffect(()=>{
  if(!destination)return
  const target=document.getElementById(destination.id)
  target?.focus({preventScroll:true});target?.scrollIntoView({block:'start'})
 },[destination])
 const seen=useRef(new Set([profiles[0].id]))
 const a=analyzeProfile(profile),ready=publicationReady(profile)
 const renderImage=useCallback(()=>renderDcaImage(profile,field),[profile,field])
 const filtered=filterProfiles(profiles,filters,used)
 const setFilter=(key,value)=>setFilters({...filters,[key]:value})
 function setExposure(value){setField(value);setProfile({...profile,approved:false})}
 function update(next){setProfile(next);setDraft(buildTweetText(next));setFeedback('')}
 function edit(patch){update({...profile,...patch,approved:false})}
 function lineEdit(index,patch){edit({lines:profile.lines.map((l,i)=>i===index?{...l,...patch}:l)})}
 function select(next){if(!next)return;update(structuredClone(next));seen.current.add(next.id);setSavedId('');setSaveTitle(next.name);setQueries({})}
 function compose(){setField('all');update({...profile,mode:'participant',imageOnly:true,approved:false})}
 function participate(){update({...profile,mode:'participant',imageOnly:false,approved:false})}
 function duplicate(){setProfile({...structuredClone(profile),id:crypto.randomUUID(),mode:'participant',approved:false});setSavedId('');setSaveTitle(profile.name+' — copie');setFeedback('Copie créée. Tu peux la modifier et l’enregistrer séparément.')}
 function toggleUsed(){try{const next=used.includes(profile.id)?used.filter(id=>id!==profile.id):[...used,profile.id];localStorage.setItem(USED_KEY,JSON.stringify(next));setUsed(next);setFeedback(next.includes(profile.id)?'Profil marqué comme utilisé.':'Profil marqué comme non utilisé.')}catch{setFeedback('Le suivi ne peut pas être enregistré sur cet appareil.')}}
 function savePortfolio(){try{
  if(savedState.error)throw Error(savedState.error)
  if(!saveTitle.trim())throw Error('Donne un nom à la sauvegarde.')
  const item={id:savedId||crypto.randomUUID(),title:saveTitle.trim(),profile:structuredClone({...profile,approved:false}),draft,field}
  const items=savedId?savedState.items.map(x=>x.id===savedId?item:x):[...savedState.items,item]
  writeSaved(localStorage,items);setSavedState({items,error:''});setSavedId(item.id);setFeedback('Portefeuille enregistré sur cet appareil.')
 }catch(error){setFeedback(error.message||'Le stockage local est indisponible.')}}
 function loadPortfolio(id){const item=savedState.items.find(x=>x.id===id);if(!item)return;setProfile({...structuredClone(item.profile),approved:false});setDraft(item.draft);setField(item.field);setSavedId(id);setSaveTitle(item.title);setQueries({});setFeedback('Portefeuille restauré. Toute participation doit être validée à nouveau.')}
 function deletePortfolio(id){try{const items=savedState.items.filter(x=>x.id!==id);writeSaved(localStorage,items);setSavedState({items,error:''});if(savedId===id)setSavedId('');setFeedback('Sauvegarde supprimée. Le portefeuille affiché reste ouvert.')}catch{setFeedback('Suppression impossible sur cet appareil.')}}
 async function copy(){try{await copyPublicationText(draft);setFeedback('Texte copié.')}catch{setFeedback('Copie impossible. Sélectionne le texte.')}}
 async function download(){try{const link=document.createElement('a');link.href=(await renderImage()).toDataURL('image/png');link.download=`dca-${profile.id}.png`;startPublicationDownload(link);setFeedback('Téléchargement lancé.')}catch{setFeedback('Impossible de préparer l’image.')}}
 function save(){try{localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft,field}));setFeedback('Brouillon enregistré sur cet appareil.')}catch{setFeedback('Le stockage local est indisponible.')}}
 function restore(){try{const saved=JSON.parse(localStorage.getItem('el-dca-draft-v1'));if(saved?.profile)saved.profile=migrateProfile(saved.profile);if(!saved?.profile||analyzeProfile(saved.profile).errors.length||typeof saved.draft!=='string')throw Error();setProfile({...saved.profile,approved:false});setDraft(saved.draft);setField(['countries','sectors','both','all','overlap'].includes(saved.field)?saved.field:'countries');setSavedId('');setSaveTitle(saved.profile.name);setFeedback('Brouillon restauré.')}catch{setFeedback('Aucun brouillon valide enregistré.')}}
 return <div className="dca-profiles-scope">
 <PageHeader title="Portefeuille & DCA" subtitle="Retrouve les titres derrière tes ETF. Comprends tes concentrations. Prépare une publication à ton image." />
 <section className="dca-hero"><div><span className="dca-eyebrow">EXPOSITIONS · RECOUVREMENT · LE DCA DE…</span><h2>Plusieurs placements.<br/>Une vue d’ensemble.</h2><p>Une action peut se retrouver dans plusieurs ETF. Explore tes expositions et les titres détenus en commun, puis partage une synthèse lisible.</p><div className="dca-buttons"><button onClick={()=>{compose();navigate('compose')}}>Analyser mon portefeuille</button><button onClick={()=>{participate();navigate('compose')}}>Préparer un DCA</button></div></div><div className="dca-hero-art" aria-hidden="true"><div className="dca-hero-ring"><span>Au-delà<br/>des ETF</span></div><div className="dca-hero-tags"><span>Géographie</span><span>Secteurs</span><span>Titres communs</span></div></div></section>
 <nav className="dca-section-nav" aria-label="Parcours du portefeuille"><a href="#dca-compose" onClick={e=>{e.preventDefault();navigate('compose')}}>1. Composer</a><a href="#dca-analysis" onClick={e=>{e.preventDefault();navigate('analyze')}}>2. Analyser</a><a href="#dca-draft" onClick={e=>{e.preventDefault();navigate('publish')}}>3. Publier</a></nav>
 <ToolWorkspace view={view} onViewChange={setView} publicationTab={publicationTab} onPublicationTabChange={setPublicationTab} renderImage={renderImage} imageDisabled={!!a.errors.length} imageAlt={profile.imageOnly?'Expositions du portefeuille':`Portefeuille et versements de ${profile.name}`} actions={<>
 <Button onClick={copy} disabled={!ready||!draft.trim()}>Copier le texte</Button><Button variant="secondary" onClick={download} disabled={!ready}>Télécharger le PNG</Button>
 </>}>
 <section className="tool-settings" id="dca-compose" tabIndex={-1}>
 <div className="dca-mode"><button aria-pressed={!!profile.imageOnly} onClick={compose}>Composer un portefeuille</button><button aria-pressed={profile.mode==='prepared'&&!profile.imageOnly} onClick={()=>select(profiles[0])}>Profils préparés</button><button aria-pressed={profile.mode==='participant'&&!profile.imageOnly} onClick={participate}>Créer une participation</button></div>
 {profile.mode==='prepared'&&<>
 <details className="dca-filters"><summary>Filtrer les profils · {filtered.length} résultat{filtered.length>1?'s':''}</summary>
 <div className="dca-fields"><label>Budget mensuel<ChoicePicker aria-label="Budget mensuel" value={filters.budget} onChange={e=>setFilter('budget',e.target.value)}><option value="">Tous les budgets</option><option value="small">Jusqu’à 200 €</option><option value="medium">Plus de 200 à 500 €</option><option value="large">Plus de 500 à 1 000 €</option><option value="high">Plus de 1 000 €</option></ChoicePicker></label>
 <label>Nombre de placements<ChoicePicker aria-label="Nombre de placements" value={filters.lines} onChange={e=>setFilter('lines',e.target.value)}><option value="">Tous</option>{[2,3,4].map(n=><option key={n} value={n}>{n} placements</option>)}</ChoicePicker></label>
 <label>Contient au moins<ChoicePicker aria-label="Contient au moins" value={filters.kind} onChange={e=>setFilter('kind',e.target.value)}><option value="">Tous les types</option><option value="thematic">Un ETF sectoriel ou thématique</option><option value="equity">Une action en direct</option><option value="crypto">Une crypto</option><option value="metal">Un métal précieux</option></ChoicePicker></label></div>
 <label><input type="checkbox" checked={filters.unused} onChange={e=>setFilter('unused',e.target.checked)}/>Masquer les profils déjà utilisés</label>
 <button className="dca-remove" onClick={()=>setFilters({budget:'',lines:'',kind:'',unused:false})}>Effacer les filtres</button></details>
 {filtered.length?<ChoicePicker aria-label="Choisir un profil DCA" value={profile.id} onChange={e=>select(filtered.find(p=>p.id===e.target.value))}>{filtered.map(p=><option key={p.id} value={p.id}>{p.name} · {p.monthly} €/mois{used.includes(p.id)?' · utilisé':''}</option>)}</ChoicePicker>:<p role="status">Aucun profil ne correspond à ces filtres.</p>}
 <div className="dca-buttons"><Button variant="secondary" disabled={!filtered.some(p=>p.id!==profile.id)} onClick={()=>select(pickUnseenProfile(filtered,profile.id,seen.current))}>Autre profil aléatoire</Button><Button variant="secondary" onClick={toggleUsed}>{used.includes(profile.id)?'Marquer non utilisé':'Marquer utilisé'}</Button></div>
 {!filtered.some(p=>p.id===profile.id)&&<p className="dca-note">Le profil affiché reste ouvert, mais ne fait pas partie des résultats filtrés.</p>}
 </>}
 <div className="dca-buttons"><Button variant="secondary" disabled={!!a.errors.length} onClick={duplicate}>Dupliquer ce portefeuille</Button></div>
 <label><input type="checkbox" checked={!!profile.imageOnly} onChange={e=>{update({...profile,imageOnly:e.target.checked,approved:false});if(e.target.checked)setField('all')}}/>Répartition uniquement — sans nom ni montants</label>
 <label className="dca-visual-choice">Donut de l’image<ChoicePicker aria-label="Donut de l’image" value={field} onChange={e=>setExposure(e.target.value)}><option value="countries">Exposition géographique</option><option value="sectors">Exposition sectorielle</option><option value="both">Géographie et secteurs</option><option value="all">Répartition + géographie + secteurs</option><option value="overlap">Recouvrement et concentration</option></ChoicePicker></label>
 {!a.errors.length&&['countries','sectors'].filter(f=>field==='both'||field==='all'||field===f).map(f=>{
  const shown=exposureDisplay(a[f])
  return shown.missing>=.5?<p className="dca-note" role="status" key={f}>
   {f==='countries'?'Géographie':'Secteurs'} : {pct(shown.coverage)} du portefeuille ventilé dans ce graphique.
   {shown.omitted.map(o=>` ${o.label} (${pct(o.weight)}) : ${o.reason.toLowerCase()}.`).join('')}
   {' La part grise correspond à des données non intégrées, pas à une zone ou à un secteur.'}
  </p>:null
 })}
 <div className="dca-fields"><label>{profile.imageOnly?'Pseudonyme (facultatif, masqué à l’export)':'Pseudonyme'}<input maxLength={45} value={profile.name} onChange={e=>edit({name:e.target.value})}/></label><label>Périmètre<ChoicePicker aria-label="Périmètre du portefeuille" value={profile.scope} onChange={e=>edit({scope:e.target.value})}>{PROFILE_SCOPES.map(s=><option key={s} value={s}>{s}</option>)}</ChoicePicker></label></div>
 {!profile.imageOnly&&<details><summary>Présentation facultative</summary><div className="dca-fields"><label>Âge<input type="number" min="18" max="100" value={profile.age||''} onChange={e=>edit({age:Math.min(100,Math.max(0,Number(e.target.value)))})}/></label><label>Activité<input maxLength={70} value={profile.job||''} onChange={e=>edit({job:e.target.value})}/></label><label>Localisation générale<input maxLength={60} value={profile.location||''} onChange={e=>edit({location:e.target.value})}/></label><label>Revenu net mensuel (facultatif)<input type="number" min="0" value={profile.income||''} onChange={e=>edit({income:Math.max(0,Number(e.target.value))})}/></label></div></details>}
 <h2>{profile.imageOnly?'Répartition du portefeuille':'Portefeuille & versements'}</h2><p className="dca-note">{profile.imageOnly?'Saisis les actifs et leurs poids, pour un total de 100 %. Aucun montant ni versement mensuel n’est nécessaire.':'Une position peut être conservée sans versement, ou recevoir un premier versement avec un poids actuel de 0 %.'}</p>
 <label>Filtrer les actifs<ChoicePicker aria-label="Filtrer les actifs" value={assetFilter} onChange={e=>setAssetFilter(e.target.value)}><option value="">Tous</option><option value="pea">Éligibles PEA documentés</option><option value="nonpea">Non éligibles PEA documentés</option><option value="equity">Actions</option><option value="fund">ETF / ETC / crypto</option></ChoicePicker></label>
 {profile.lines.map((l,i)=><fieldset className="dca-position" key={i}><legend>Position {i+1}</legend>
 <label>Rechercher par nom, ticker ou ISIN<input type="search" aria-label={`Rechercher position ${i+1}`} value={queries[i]||''} onChange={e=>setQueries({...queries,[i]:e.target.value})} placeholder="World, Air Liquide, IE00…"/></label>
 <label>Actif<ChoicePicker aria-label={`Actif position ${i+1}`} value={l.asset} onChange={e=>{const asset=e.target.value;lineEdit(i,{asset,emoji:ASSETS[asset][0],label:catalog[asset]?.name||ASSETS[asset][1],isin:references[asset]?.isin||''})}}>{[...new Set([l.asset,...searchAssets(queries[i]||'',assetFilter)])].map(key=><option key={key} value={key}>{catalog[key]?.name||ASSETS[key][1]}</option>)}</ChoicePicker></label>
 {queries[i]&&!searchAssets(queries[i],assetFilter).length&&<p className="dca-note">Aucun résultat dans le catalogue. La position actuelle reste sélectionnée.</p>}
 {references[l.asset]&&<p className="dca-note">{references[l.asset].isin||'ISIN non qualifié'} · {references[l.asset].kind==='equity'?'Action':references[l.asset].kind.toUpperCase()} · {references[l.asset].pea===true?'Éligibilité PEA documentée':references[l.asset].pea===false?'Non éligible PEA':'Éligibilité PEA non documentée'}{references[l.asset].synthetic?' · Pour ce support synthétique, seules les données de l’indice suivi sont utilisées.':''}</p>}
 <div className="dca-fields"><label>Poids actuel (%)<input aria-label={`Poids position ${i+1}`} type="number" min="0" max="100" step="0.01" value={Number.isFinite(l.weight)?l.weight:''} onChange={e=>lineEdit(i,{weight:e.target.value===''?NaN:Number(e.target.value)})}/></label>{!profile.imageOnly&&<label>DCA (€/mois)<input aria-label={`DCA position ${i+1}`} type="number" min="0" max="1000000" step="0.01" value={Number.isFinite(l.amount)?l.amount:''} onChange={e=>lineEdit(i,{amount:e.target.value===''?NaN:Number(e.target.value)})}/></label>}</div>
 {references[l.asset]?.isin&&<label className="dca-reference">Support exact pour les expositions<ChoicePicker aria-label={`Support position ${i+1}`} value={l.isin||''} onChange={e=>lineEdit(i,{isin:e.target.value})}><option value="">Aucun support confirmé</option><option value={references[l.asset].isin}>{references[l.asset].name} · {references[l.asset].isin}</option></ChoicePicker></label>}
 <button className="dca-remove" onClick={()=>edit({lines:profile.lines.filter((_,j)=>j!==i)})}>Retirer la position {i+1}</button></fieldset>)}
 <Button variant="secondary" disabled={profile.lines.length>=MAX_POSITIONS} onClick={()=>{const asset=Object.keys(ASSETS).find(k=>!profile.lines.some(l=>l.asset===k));edit({lines:[...profile.lines,{asset,label:ASSETS[asset][1],emoji:ASSETS[asset][0],isin:'',weight:0,amount:0}]})}}>Ajouter une position</Button>
 <p className="dca-total">Total : {pct(profile.lines.reduce((s,l)=>s+(Number.isFinite(l.weight)?l.weight:0),0))}{!profile.imageOnly&&<> · {euro(profile.lines.reduce((s,l)=>s+(Number.isFinite(l.amount)?l.amount:0),0))} / mois</>}</p>
 {!!a.errors.length&&<div role="alert" className="dca-errors">{a.errors.map(e=><p key={e}>{e}</p>)}</div>}
 {!a.errors.length&&<details className="dca-evidence"><summary>Expositions, couverture et sources</summary>
 <p>Synthèse indicative des dernières observations compatibles : 93 jours maximum, avec au plus 45 jours d’écart. Chaque source conserve sa date. Les pays désignent le rattachement des titres, pas leurs lieux de chiffre d’affaires. Les répartitions publiées sont regroupées à titre indicatif ; les méthodes des émetteurs peuvent différer.</p>
 {['countries','sectors'].map(f=><div key={f}><h3>{f==='countries'?'Pays':'Secteurs'} · données disponibles {pct(exposureDisplay(a[f]).coverage)} dans le graphique</h3>
 {a[f].groups.map((g,i)=><section key={i}><p>{i===0?'Utilisé dans le donut':'Autre période'} · {g.oldest} → {g.asOf} · {g.classification} · {pct(g.coverage)} du portefeuille</p>
 {g.rows.map(r=><div className="dca-exposure" key={r.name}><span>{r.name}</span><b>{pct(r.weight)}</b></div>)}
 {g.observations.map(o=><p key={o.asset}><a href={o.sourceUrl} target="_blank" rel="noreferrer">{o.label} ↗</a> · {o.asOf} · {o.basis==='equity'?'Action':o.basis==='fund'?'Fonds':'Indice suivi'} · {o.method}</p>)}</section>)}
 {!!a[f].neutralWeight&&<p>Hors classification {f==='countries'?'géographique':'sectorielle'} : {a[f].neutralRows.map(r=>`${r.name} ${pct(r.weight)}`).join(' · ')}.</p>}
 {a[f].excluded.map(x=><p key={x.asset}>{x.label} : {x.reason} ({pct(x.weight)}).</p>)}
 <p>Part grise du donut : {pct(Math.max(0,100-(a[f].groups[0]?.coverage||0)-a[f].neutralWeight))}. Elle comprend les données absentes, invalides ou trop éloignées dans le temps.</p>
 </div>)}</details>}
 {profile.scope==='PEA'&&profile.lines.some(l=>references[l.asset]?.pea!==true)&&<p className="dca-note" role="status">Ce portefeuille contient des supports dont l’éligibilité PEA n’est pas établie : {profile.lines.filter(l=>references[l.asset]?.pea!==true).map(l=>l.label).join(' · ')}. Vérifie le périmètre choisi.</p>}

 <details className="dca-saved"><summary>Mes portefeuilles · {savedState.items.length}/50</summary>
 <label>Nom de la sauvegarde<input maxLength={80} value={saveTitle} onChange={e=>setSaveTitle(e.target.value)}/></label>
 <Button variant="secondary" disabled={!!a.errors.length||!!savedState.error} onClick={savePortfolio}>{savedId?'Mettre à jour la sauvegarde':'Enregistrer ce portefeuille'}</Button>
 {savedState.error&&<p role="alert">{savedState.error}</p>}
 {savedState.items.map(item=><div className="dca-saved-row" key={item.id}><span>{item.title}</span><button onClick={()=>loadPortfolio(item.id)} aria-label={`Ouvrir ${item.title}`}>Ouvrir</button><button onClick={()=>deletePortfolio(item.id)} aria-label={`Supprimer ${item.title}`}>Supprimer</button></div>)}
 <p className="dca-note">Sauvegardés uniquement sur cet appareil. La suppression des données du navigateur efface ces sauvegardes.</p></details>
 <div className="dca-buttons"><Button variant="secondary" onClick={save}>Enregistrer le brouillon</Button><Button variant="secondary" onClick={restore}>Restaurer le brouillon</Button></div><p className="dca-note">Brouillon stocké uniquement sur cet appareil. Aucun formulaire ni envoi à un tiers.</p>
 </section>
 <section className="tool-preview"> {profile.mode==='participant'&&<label className="dca-consent"><input type="checkbox" checked={profile.approved} onChange={e=>setProfile({...profile,approved:e.target.checked})}/>{profile.imageOnly?'Je valide les expositions à publier.':'La personne a validé le texte, le visuel et les informations à publier.'}</label>}<label className="dca-label" htmlFor="dca-draft">Texte prêt à publier</label><textarea id="dca-draft" value={draft} onChange={e=>{setDraft(e.target.value);setProfile({...profile,approved:false})}}/><p className="dca-note">{Array.from(draft).length} caractères · Les modifications du portefeuille régénèrent le texte.</p><Button variant="secondary" disabled={!!a.errors.length} onClick={()=>{setDraft(buildTweetText(profile));setProfile({...profile,approved:false})}}>Rétablir le texte</Button><p role="status" aria-live="polite">{feedback}</p></section>
 </ToolWorkspace>
 {!a.errors.length?<Analytics profile={profile} analysis={a}/>:<section id="dca-analysis" className="dca-analysis" tabIndex={-1} aria-label="Analyse du portefeuille"><h2>Complète ton allocation pour l’analyser</h2>{a.errors.map(error=><p key={error}>{error}</p>)}<Button variant="secondary" onClick={()=>navigate('compose')}>Revenir aux réglages</Button></section>}
 </div>
}
