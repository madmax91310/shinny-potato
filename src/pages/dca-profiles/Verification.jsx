import { useMemo, useState } from 'react'
import { references, pct } from './engine.js'
import { exposureDisplay } from './exposure.js'
import { catalogCoverage, sharedPositions } from './verification.js'
export default function Verification({profile,analysis}){
 const [query,setQuery]=useState(''),[onlyMissing,setOnlyMissing]=useState(false)
 const catalog=useMemo(()=>catalogCoverage(references),[])
 const shared=useMemo(()=>sharedPositions(profile.lines,references),[profile.lines])
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
 <details><summary>Positions communes entre ETF</summary>
 <p>Comparaison par ISIN des titres publiés. Les listes de principales positions sont partielles : aucun taux global de chevauchement n’est calculé à partir d’un top 10. Les poids additionnés concernent uniquement les deux ETF comparés.</p>
 {!shared.pairs.length&&<p>Aucune paire ne dispose actuellement de positions identifiées avec des dates et des périmètres compatibles.</p>}
 {shared.pairs.map((pair,i)=><section key={i}><h3>{pair.left} / {pair.right}</h3><p>Positions identifiées : {pair.identifiedCoverage.map(pct).join(' / ')} de chaque support.{pair.full?` Chevauchement des listes complètes : ${pct(pair.overlap)}.`:' Listes partielles : le reste du portefeuille n’est pas comparé.'}</p>
 {pair.common.length?pair.common.map(row=><p key={row.isin}>{row.name} · {row.isin} : {pct(row.portfolioWeight)} du portefeuille via ces deux supports.</p>):<p>Aucune position commune identifiée dans ces listes. Cela ne prouve pas l’absence de chevauchement.</p>}
 {pair.sources.map((source,i)=><p key={i}><a href={source.url} target="_blank" rel="noreferrer">Source {i+1} ↗</a> · {source.asOf}</p>)}
 </section>)}
 {!!shared.unavailable.length&&<p>Sans liste exploitable : {shared.unavailable.join(' · ')}.</p>}
 </details>
 <details><summary>Couverture du catalogue · {catalog.length} supports</summary>
 <p>{complete} supports ont au moins 99,5 % de données exploitables dans chacun des deux champs, pris individuellement. Leur compatibilité dans un même graphique dépend aussi des méthodes et des dates. Les métaux et cryptomonnaies restent hors classification.</p>
 <label>Rechercher dans la couverture<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom, ticker ou ISIN"/></label>
 <label><input type="checkbox" checked={onlyMissing} onChange={e=>setOnlyMissing(e.target.checked)}/>Afficher seulement les couvertures incomplètes</label>
 <div className="dca-catalog-list">{filtered.map(r=><article key={r.asset}><b>{r.name}</b><p>{r.isin} · {r.kind==='equity'?'Action':r.kind.toUpperCase()}</p>{['countries','sectors'].map(f=><p key={f}>{f==='countries'?'Pays':'Secteurs'} : {pct(r[f].coverage)} · {r[f].reason}{r[f].date&&` · ${r[f].date}`}</p>)}</article>)}</div>
 </details>
 </section>
}
