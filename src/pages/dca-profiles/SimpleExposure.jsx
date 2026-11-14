import { validManualIdentity } from './placements.js'
import { useSelectedRecords } from '../../lib/use-selected-records.js'
import { exposureRecords } from './records.js'
import { readPreference, writePreference } from '../../lib/publication-preferences.js'
import { lazy, Suspense, useEffect, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import { ASSETS } from './data.js'
import { MAX_EXPOSURE_POSITIONS, analyzeProfile, references, pct } from './engine.js'
import { exposureDisplay, exposureView } from './exposure.js'
import AllocationEditor, { newLine, confirmLines } from './AllocationEditor.jsx'
import ImageExport from './ImageExport.jsx'
import ImageOptions from './ImageOptions.jsx'
import Portfolios from './Portfolios.jsx'
import { useImageExport } from './useImageExport.js'
const Analytics = lazy(() => import('./Analytics.jsx'))
const draftKey='simple-exposure-draft'
const validDraft=d=>d&&Array.isArray(d.lines)&&d.lines.length<=MAX_EXPOSURE_POSITIONS&&d.lines.every(l=>l&&(Object.hasOwn(ASSETS,l.asset)||validManualIdentity(l))&&typeof l.label==='string'&&l.label.length<=250&&(l.weight===null||Number.isFinite(l.weight)))&&['all','both','countries','sectors','overlap'].includes(d.field)&&[3,4,6].includes(d.exposureLimit)
export default function SimpleExposure({isin}){
 const [saved]=useState(()=>{const asset=Object.keys(references).find(key=>references[key]?.isin===isin&&ASSETS[key]);return asset?{lines:[newLine(asset,100)],field:'all',exposureLimit:4}:readPreference(draftKey,null,validDraft)})
 const [lines,setLines]=useState(()=>confirmLines(saved?.lines.map(l=>({...l,weight:l.weight===null?NaN:l.weight}))||[])),[field,setField]=useState(saved?.field||'all')
 const [saveError,setSaveError]=useState(false)
 const [exposureLimit,setExposureLimit]=useState(saved?.exposureLimit||4),[showAnalysis,setShowAnalysis]=useState(false),[showCompanies,setShowCompanies]=useState(saved?.showCompanies===true)
 const [multiImage,setMultiImage]=useState(saved?.multiImage===true)
 const [analysisView,setAnalysisView]=useState(saved?.analysisView)
 const [baseline,setBaseline]=useState(null)
 useEffect(()=>{setSaveError(!writePreference(draftKey,{lines,field,exposureLimit,showCompanies,analysisView,multiImage},validDraft))},[lines,field,exposureLimit,showCompanies,analysisView,multiImage])
 const profile={id:'expositions',name:'',scope:'Portefeuille investi',imageOnly:true,lines,exposureLimit,showCompanies,analysisView,multiImage}
 const records=useSelectedRecords(lines.map(line=>line.asset),exposureRecords)
 const analysis=analyzeProfile(profile,MAX_EXPOSURE_POSITIONS)
 const total=profile.lines.reduce((sum,line)=>sum+(Number.isFinite(line.weight)?line.weight:0),0)
 const totalHint=total<100?`Il manque ${pct(100-total)} dans l’allocation.`:`${pct(total-100)} en trop dans l’allocation.`
 const reason=!lines.length?'Ajoute un actif pour préparer ton image.':!records.ready?(records.error?'Les expositions n’ont pas pu être chargées.': 'Chargement des expositions…'):analysis.errors.map(error=>error.includes('totaliser 100')?totalHint:error).join(' ')
 const image=useImageExport(profile,field,!reason,MAX_EXPOSURE_POSITIONS)
 return <div className="dca-profiles-scope dca-simple">
  <PageHeader title="Actifs & expositions" subtitle="Saisis ton allocation, retrouve tes expositions et télécharge ton image."/>
  {saveError&&<p role="alert">Le brouillon ne peut pas être enregistré. Les données locales existantes sont conservées ; garde tes modifications avant de quitter la page.</p>}
  <div className="dca-simple-grid">
   <section className="dca-simple-card" aria-label="Composer les expositions">
    <AllocationEditor maxPositions={MAX_EXPOSURE_POSITIONS} lines={lines} onChange={setLines}/>
    <ImageOptions multiImage={multiImage} onMultiImageChange={setMultiImage} field={field} onFieldChange={setField} limit={exposureLimit} onLimitChange={setExposureLimit} showCompanies={showCompanies} onCompaniesChange={setShowCompanies}/>
    <Portfolios profile={profile} field={field} onLoad={item=>{setMultiImage(item.profile.multiImage===true);setLines(confirmLines(item.profile.lines));setExposureLimit(item.profile.exposureLimit||4);setField(item.field);setShowCompanies(item.profile.showCompanies===true);setAnalysisView(item.profile.analysisView)}}/>
   </section>
   <ImageExport image={image} reason={reason} filename="epargnant-libre-expositions.png" alt="Répartition et expositions du portefeuille">
    {records.error&&<button className="dca-secondary" onClick={records.retry}>Réessayer les données</button>}
   </ImageExport>
  </div>
    {!analysis.errors.length&&<details className="dca-note">
     <summary>Détails des données · pays {pct(exposureDisplay(analysis.countries).coverage)} · secteurs {pct(exposureDisplay(analysis.sectors).coverage)}</summary>
     <p>Synthèse indicative des répartitions publiées. Les méthodes des sources peuvent différer ; les ETF synthétiques utilisent une exposition d’indice documentée, sans leur panier de substitution. Les donuts sont rapportés au périmètre pays/secteurs indiqué. Les supports d’épargne, fonds en euros, métaux, cryptos et supports explicitement obligataires ou monétaires restent dans l’allocation, hors de ces donuts. Les données manquantes gardent leur poids dans les donuts ; elles ne sont pas redistribuées.</p>
     {['countries','sectors'].map(f=>{const e=analysis[f],d=exposureDisplay(e);return <div key={f}>
      <strong>{f==='countries'?'Géographie':'Secteurs'} : {pct(d.coverage)} ventilés{e.neutralWeight>0?` · ${pct(e.neutralWeight)} hors classification`:''}{d.missing>0.01?` · ${pct(d.missing)} non ventilés`:''}</strong>
      {d.omitted.map((o,i)=><p key={`${o.asset}-${i}`}>{o.label||o.asset} : {o.reason} ({pct(o.weight)}).</p>)}
      {e.groups[0]?.observations.map(o=><p key={o.asset}><a href={o.sourceUrl} target="_blank" rel="noreferrer">{o.label||o.asset}</a> · {o.asOf} · {o.basis==='index'?'exposition d’indice':o.basis==='equity'?'action':'fonds'}</p>)}
     </div>})}
    </details>}
  {!analysis.errors.length&&<details className="dca-analysis-drawer" onToggle={e=>setShowAnalysis(e.currentTarget.open)}>
   <summary>Voir l’analyse détaillée</summary>
    {!analysis.errors.length&&<details className="dca-note dca-exposure-detail">
     <summary>Tous les pays et secteurs</summary>
     {['countries','sectors'].map(f=>{const v=exposureView(analysis[f]);return <section key={f}>
      <h3>{f==='countries'?'Pays':'Secteurs'}</h3><p>{v.scope}</p>
      {v.eligible>0?<table><thead><tr><th>Exposition</th><th>Part du périmètre</th><th>Part du portefeuille</th></tr></thead><tbody>
       {v.rows.map(row=><tr key={row.name}><td>{row.name}</td><td>{pct(row.weight)}</td><td>{pct(row.portfolioWeight)}</td></tr>)}
       {v.missing>0.001&&<tr><td>Non ventilé ici</td><td>{pct(v.missing)}</td><td>{pct(v.portfolioMissing)}</td></tr>}
      </tbody></table>:<p>La géographie et les secteurs ne s’appliquent pas à ces actifs.</p>}
      {!!v.excludedAssets.length&&<p>Hors de ce donut : {v.excludedAssets.map(r=>`${r.name} (${pct(r.weight)} du portefeuille)`).join(', ')}.</p>}
     </section>})}
    </details>}
   {showAnalysis&&<Suspense fallback={<p role="status">Chargement de l’analyse…</p>}><Analytics profile={profile} analysis={analysis} baseline={baseline} onBaselineChange={setBaseline} onHoldingsChange={image.retry} onViewChange={setAnalysisView}/></Suspense>}
  </details>}
 </div>
}
