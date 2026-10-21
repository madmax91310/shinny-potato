import { useEffect, useMemo, useState } from 'react'
import { loadExposureCatalog } from './records.js'
import { references, pct } from './engine.js'
import { exposureDisplay } from './exposure.js'
import catalogue from './catalog.json' with {type:'json'}
import { loadHoldings } from './holdings-loader.js'
import { catalogCoverage, sharedPositions } from './verification.js'
export default function Verification({profile,analysis}){
 const [query,setQuery]=useState(''),[onlyMissing,setOnlyMissing]=useState(false),[pairLimit,setPairLimit]=useState(20)
 const [catalogOpen,setCatalogOpen]=useState(false),[catalog,setCatalog]=useState([]),[catalogError,setCatalogError]=useState(false),[catalogRetry,setCatalogRetry]=useState(0)
 useEffect(()=>{if(!catalogOpen)return;let active=true;setCatalogError(false);loadExposureCatalog().then(refs=>{if(active)setCatalog(catalogCoverage(refs))}).catch(()=>{if(active)setCatalogError(true)});return()=>{active=false}},[catalogOpen,catalogRetry])
 const [holdings,setHoldings]=useState({}),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState(false)
 const [retry,setRetry]=useState(0)
 const assets=profile.lines.map(l=>l.asset).sort().join('|')
 useEffect(()=>{let active=true;setLoading(true);setHoldings({});setLoadError(false);loadHoldings(assets.split('|')).then(data=>{if(active)setHoldings(data)}).catch(()=>{if(active){setHoldings({});setLoadError(true)}}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false}},[assets,retry])
 const shared=useMemo(()=>sharedPositions(profile.lines,references,new Date(),holdings),[profile.lines,holdings])
 const complete=catalog.filter(r=>r.countries.coverage>=99.5&&r.sectors.coverage>=99.5).length
 const filtered=catalog.filter(r=>(!onlyMissing||r.countries.coverage<99.5||r.sectors.coverage<99.5)&&`${r.name} ${r.isin} ${r.tickers?.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
 return <section className="dca-verification" aria-label="Vérification des expositions">
 <h2>Vérifier les expositions</h2>
 <p className="dca-note">Les poids ci-dessous sont des parts du portefeuille entier. Une couverture partielle ne permet pas de conclure sur l’ensemble du portefeuille.</p>
 <div className="dca-fields">{['countries','sectors'].map(field=>{
  const e=analysis[field],d=exposureDisplay(e),lead=e.groups[0]?.rows[0]
  return <div className="dca-check-card" key={field}><b>{field==='countries'?'Géographie':'Secteurs'}</b><p>{pct(d.coverage)} ventilés · {pct(d.missing)} non ventilés{e.neutralWeight>0&&` · ${pct(e.neutralWeight)} hors classification`}</p>{lead&&<p>Première exposition observée : {lead.name}, {pct(lead.weight)}.</p>}</div>
 })}</div>
 <details><summary>Contribution de chaque actif aux pays et secteurs</summary>
 {['countries','sectors'].map(field=><div key={field}><h3>{field==='countries'?'Géographie':'Secteurs'}</h3>{analysis[field].groups.map((group,i)=><section key={group.classification+group.asOf}>
 <p>{i===0?'Graphique principal':'Ventilation séparée'} · {group.classification} · {group.oldest} → {group.asOf}</p>
 {group.rows.map(row=><details key={row.name}><summary>{row.name} : {pct(row.weight)} du portefeuille</summary>{row.contributions.map((c,i)=><p key={c.asset+i}>{c.label} : <b>{pct(c.weight)}</b> du portefeuille ({pct(c.withinAsset)} de cet actif).</p>)}</details>)}
 </section>)}</div>)}
 </details>
 <details><summary>Positions communes entre ETF et actions</summary>
 {loading&&<p role="status">Chargement des compositions complètes…</p>}{loadError&&<p role="alert">Impossible de charger les compositions. <button onClick={()=>setRetry(n=>n+1)}>Réessayer</button></p>}
 <p>Comparaison des entreprises par identifiants vérifiés ; les titres restent détaillés par ISIN. Les listes de principales positions sont partielles : aucun taux global de chevauchement n’est calculé à partir d’un top 10. Les poids additionnés concernent uniquement les deux supports comparés.</p>
 {!shared.pairs.length&&<p>Aucune paire ne dispose actuellement de positions identifiées avec des dates et des périmètres compatibles.</p>}
 {shared.pairs.slice(0,pairLimit).map((pair,i)=><details key={i}><summary>{pair.left} / {pair.right} · {pair.common.length} positions communes</summary><h3>{pair.left} / {pair.right}</h3><p>Positions identifiées : {pair.identifiedCoverage.map(pct).join(' / ')} de chaque support.{pair.full?` Chevauchement des entreprises des listes complètes : ${pct(pair.overlap)}.`:' Listes partielles : le reste du portefeuille n’est pas comparé.'}</p>
 {pair.common.length>30&&<p>Les 30 positions communes les plus pondérées sont affichées sur {pair.common.length}. Tous les titres entrent dans les calculs.</p>}
 {pair.common.length?pair.common.slice(0,30).map(row=><p key={row.isin}>{row.name} · {row.isin} : {pct(row.portfolioWeight)} du portefeuille via ces deux supports.</p>):<p>Aucune position commune identifiée dans ces listes. Cela ne prouve pas l’absence de chevauchement.</p>}
 {pair.sources.map((source,i)=><p key={i}><a href={source.url} target="_blank" rel="noreferrer">Source {i+1} ↗</a> · {source.asOf}</p>)}
 </details>)}
 {shared.pairs.length>pairLimit&&<button onClick={()=>setPairLimit(pairLimit+20)}>Afficher 20 autres comparaisons ({shared.pairs.length-pairLimit} restantes)</button>}
 {!!shared.unavailable.length&&<p>Sans liste exploitable : {shared.unavailable.join(' · ')}.</p>}
 </details>
 <details><summary>Poids cumulé des titres détenus en direct et via les ETF</summary>
 <p>Chaque ISIN est compté une seule fois en additionnant ses contributions. Les listes partielles donnent un minimum observé, jamais une mesure complète. Les classes d’actions et les ADR restent distincts. Les dates ou périmètres incompatibles restent séparés.</p>
 {shared.totals.map((group,i)=><section key={i}><h3>{group.scope==='index'?'Indices suivis':'Positions publiées'} · {group.oldest} → {group.asOf}</h3><p>{pct(group.coverage)} du portefeuille identifié sur {pct(group.portfolioWeight)} analysés.</p>
 {group.rows.slice(0,30).map(row=><details key={row.isin}><summary>{row.name} · {row.isin} : {pct(row.weight)} du portefeuille</summary><p>En direct : {pct(row.direct)} · Via les ETF : {pct(row.indirect)}</p>{row.contributions.map(c=><p key={c.asset}>{c.label} : {pct(c.weight)} · <a href={c.sourceUrl} target="_blank" rel="noreferrer">{c.asOf} ↗</a></p>)}</details>)}
 {group.rows.length>30&&<p>Les 30 titres les plus pondérés sont affichés sur {group.rows.length} titres identifiés. Le calcul utilise toutes les lignes.</p>}</section>)}
 </details>
 <details onToggle={e=>setCatalogOpen(e.currentTarget.open)}><summary>Couverture du catalogue{catalog.length?` · ${catalog.length} supports`:''}</summary>
 {!catalog.length&&<p role="status">{catalogError?<>Le catalogue n’a pas pu être chargé. <button onClick={()=>setCatalogRetry(n=>n+1)}>Réessayer</button></>:'Chargement du catalogue…'}</p>}
 <p>{complete} supports ont au moins 99,5 % de données exploitables dans chacun des deux champs, pris individuellement. Leur compatibilité dans un même graphique dépend aussi des méthodes et des dates. Les métaux et cryptomonnaies restent hors classification.</p>
 <label>Rechercher dans la couverture<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom, ticker ou ISIN"/></label>
 <label><input type="checkbox" checked={onlyMissing} onChange={e=>setOnlyMissing(e.target.checked)}/>Afficher seulement les couvertures incomplètes</label>
 <div className="dca-catalog-list">{filtered.map(r=><article key={r.asset}><b>{r.name}</b><p>{r.isin} · {r.kind==='equity'?'Action':r.kind.toUpperCase()}</p>{catalogue[r.asset]?.holdings&&<p>Positions : {catalogue[r.asset].holdings.complete?'composition complète publiée':'liste partielle'} · {pct(catalogue[r.asset].holdings.identifiedCoverage)} identifiés · {catalogue[r.asset].holdings.asOf}</p>}{catalogue[r.asset]?.holdingsStatus?.status==='failed'&&<p>Dernière collecte des positions en échec ; observation antérieure conservée avec sa date.</p>}{['countries','sectors'].map(f=><p key={f}>{f==='countries'?'Pays':'Secteurs'} : {pct(r[f].coverage)} · {r[f].reason}{r[f].date&&` · ${r[f].date}`}</p>)}</article>)}</div>
 </details>
 </section>
}
