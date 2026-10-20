import {useEffect,useState} from 'react'
import AssetAutomationProfiles from './AssetAutomationProfiles.jsx'
const TYPES={reference:'Sources officielles',series:'Séries et historiques',insurance:'Assurance-vie',actor:'Acteurs',scpi:'SCPI',company:'Entreprises',household:'Statistiques des ménages',instrument:'Instruments',index:'Indices',broker:'Courtiers',lexicon:'Lexique'}
const MODES={'scheduled-output':'Mise à jour programmée du fichier','event-output':'Mise à jour sur événement','mixed-or-derived':'Données mixtes ou calculées','manual-or-editorial':'Mise à jour manuelle ou contenu éditorial',unmapped:'Raccordement à qualifier'}
const KINDS={live:'Donnée courante',history:'Historique à alimenter',archive:'Archive',simulation:'Hypothèse ou proxy de simulation',editorial:'Contenu éditorial',reference:'Référence',unavailable:'Publication absente ou à confirmer',unclassified:'À qualifier'}
const STATES={'connector-needed':'Source à raccorder','tracked-index-needed':'Composition de l’indice à raccorder','lookthrough-needed':'Fonds détenus à détailler','collection-error':'Erreur de collecte','source-conflict':'Sources contradictoires',manual:'Champ manuel','not-published':'Non publié','undated-observation':'Date de la donnée à qualifier','undated-check':'Contrôle non daté','check-overdue':'Contrôle en retard',unqualified:'Périmètre à qualifier',missing:'Donnée absente','publication-old':'Publication attendue'}
function SourceAccess({proof}){
 if(!proof||proof.qualification!=='access-check-only')return null
 const label={'accessible-unqualified':'Source accessible ; champ toujours à qualifier','changed-unqualified':'Source modifiée ; qualification du champ à reprendre',unavailable:'Source inaccessible lors du dernier contrôle','not-configured':'Document exact à configurer'}[proof.status]??'Accès à la source à vérifier'
 return <p>{label}. Contrôle d’accès : {proof.lastAccessAttemptAt??'Non documenté'}. Ce contrôle ne renouvelle pas la donnée financière.</p>
}
const base=()=>`${import.meta.env.BASE_URL}data/`
async function read(name,signal){const response=await fetch(base()+name,{signal});if(!response.ok)throw Error('Inventaire indisponible');const report=await response.json();if(report.schemaVersion!==1||!report.summary)throw Error('Inventaire invalide');return report}
export default function DataAutomationInventory(){
 const [summary,setSummary]=useState(null),[report,setReport]=useState(null),[failed,setFailed]=useState(false),[loading,setLoading]=useState(false),[query,setQuery]=useState(''),[view,setView]=useState('fields'),[kind,setKind]=useState('all')
 useEffect(()=>{const controller=new AbortController();read('data-automation-summary.json',controller.signal).then(setSummary).catch(e=>{if(e.name!=='AbortError')setFailed(true)});return()=>controller.abort()},[])
 async function expand(event){if(!event.currentTarget.open||report||loading)return;setLoading(true);setFailed(false);try{const r=await read('data-automation-inventory.json');if(!Array.isArray(r.fields)||!Array.isArray(r.pea))throw Error();setReport(r)}catch{setFailed(true)}finally{setLoading(false)}}
 const normalized=query.trim().toLocaleLowerCase('fr'),fields=report?.fields.filter(f=>[f.id,f.name,f.field,TYPES[f.type],MODES[f.mode],KINDS[f.nature?.kind]].join(' ').toLocaleLowerCase('fr').includes(normalized)&&(kind==='all'||f.nature?.kind===kind))??[]
 const actions=report?.backlog?.filter(r=>[r.id,r.name,r.label,STATES[r.actionState],r.reason].join(' ').toLocaleLowerCase('fr').includes(normalized))??[]
 return <section className="dr-reminders" aria-labelledby="data-inventory-title">
  <h2 id="data-inventory-title">Inventaire de toutes les données</h2>
  <p>Sources, contrôles et mises à jour des données utilisées par les outils. Une mise à jour programmée peut conserver une ancienne valeur après un échec ; les champs sont à vérifier individuellement.</p>
  {summary&&<><p>{summary.summary.catalogRecords} fiches · {summary.summary.catalogFields} champs de catalogue · {summary.summary.registries} modules examinés.</p><p>Statuts PEA documentés automatiquement : {summary.summary.peaQualified} ; restant à qualifier : {summary.summary.peaRemaining}.</p><p>{summary.summary.actionableConnections??'—'} raccordements ou contrôles demandent une action. Les archives et les hypothèses sont identifiées séparément.</p><p>Inventaire généré le {summary.generatedAt.slice(0,10)}. Les dates de contrôle des sources restent propres à chaque donnée.</p></>}
  {failed&&<p role="status">L’inventaire n’a pas pu être chargé. Les fichiers restent accessibles ci-dessous ; rouvre le détail pour réessayer.</p>}
  <details onToggle={expand}><summary>Consulter les familles, les champs et les statuts PEA restants</summary>
   {loading&&<p role="status">Chargement de l’inventaire…</p>}
   {report&&<><ul>{Object.entries(report.summary.catalogTypes).map(([type,count])=><li key={type}>{TYPES[type]??type} : {count} fiches</li>)}</ul>
    <label>Afficher <select value={view} onChange={e=>setView(e.target.value)}><option value="fields">Tous les champs</option><option value="actions">Raccordements à traiter</option><option value="assets">Bilan par actif</option></select></label>
    {view==='fields'&&<label>Nature des données <select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Toutes les natures</option>{Object.entries(KINDS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>}
    <label>Rechercher dans l’inventaire <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ISIN, frais, entreprise…" /></label>
    {view==='assets'?<AssetAutomationProfiles report={report} query={query}/>:view==='fields'?<><p>{fields.length} champs correspondants · {Math.min(fields.length,50)} affichés</p>
    <div className="dr-list">{fields.slice(0,50).map(f=><article className="dr-item" key={`${f.type}:${f.id}:${f.fieldIndex}`}><h3>{f.name} · {f.field}</h3><p>{KINDS[f.nature?.kind]??'À qualifier'} · {MODES[f.mode]??f.mode}</p><p>{f.action}</p><dl><dt>Dernier contrôle</dt><dd>{f.checkedAt??'Non documenté'}</dd><dt>Photographie de la donnée</dt><dd>{f.asOf??'Non documentée'}</dd></dl>{f.sourceUrls.map(url=><p key={url}><a href={url} target="_blank" rel="noreferrer">Source ↗</a></p>)}</article>)}</div></>:<>
     <p>{actions.length} raccordements correspondants · {Math.min(actions.length,50)} affichés</p>
     <div className="dr-list">{actions.slice(0,50).map(r=><article className="dr-item" key={`${r.type}:${r.id}:${r.field}`}><h3>{r.name} · {r.label}</h3><p>{STATES[r.actionState]??r.actionState}</p><p>{r.nextAction}</p>{r.reason&&<p>{r.reason}</p>}<SourceAccess proof={r.sourceAccess}/><dl><dt>Contrôle de la valeur conservée</dt><dd>{r.checkedAt??'Non documenté'}</dd><dt>Dernière tentative</dt><dd>{r.lastAttemptAt??'Non documentée'}</dd><dt>Dernier succès</dt><dd>{r.lastSuccessAt??'Non documenté'}</dd></dl>{[...new Set([r.sourceUrl,...(r.configuredSourceUrls??[])].filter(Boolean))].map(url=><p key={url}><a href={url} target="_blank" rel="noreferrer">Source ↗</a></p>)}</article>)}</div>
    </>}
    <h3>Statuts PEA restant à qualifier</h3><ul>{report.pea.filter(p=>!p.qualified).map(p=><li key={p.isin}>{p.isin} : {p.state==='source-conflict'?'sources contradictoires':'déclaration explicite à qualifier'}. {p.nextAction}</li>)}</ul>
   </>}
  </details>
  <p><a href={base()+'data-automation-inventory.json'} download>Télécharger l’inventaire complet (JSON)</a></p>
  <p><a href={base()+'data-connections-backlog.csv'} download>Télécharger les raccordements à traiter (CSV)</a></p>
  <p><a href={base()+'pea-automation.csv'} download>Télécharger le suivi des statuts PEA (CSV)</a></p>
  <p><a href={base()+'asset-automation.csv'} download>Télécharger le bilan par actif et par champ (CSV)</a></p>
 </section>
}
