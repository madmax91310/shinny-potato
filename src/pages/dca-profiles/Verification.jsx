import { useEffect, useMemo, useState } from 'react'
import { loadExposureCatalog } from './records.js'
import { references, pct } from './engine.js'
import { exposureDisplay } from './exposure.js'
import catalogue from './catalog.json' with {type:'json'}
import { loadHoldingsState } from './holdings-loader.js'
import { catalogCoverage, sharedPositions } from './verification.js'
import { holdingsReconciliationDetails,rejectedPerimeterDetails,accountingWeight,accountingClass } from '../../data/holdings-reconciliation.js'
export default function Verification({profile,analysis,onHoldingsChange}){
 const [query,setQuery]=useState(''),[onlyMissing,setOnlyMissing]=useState(false),[pairLimit,setPairLimit]=useState(20)
 const [catalogOpen,setCatalogOpen]=useState(false),[catalog,setCatalog]=useState([]),[catalogError,setCatalogError]=useState(false),[catalogRetry,setCatalogRetry]=useState(0)
 useEffect(()=>{if(!catalogOpen)return;let active=true;setCatalogError(false);loadExposureCatalog().then(refs=>{if(active)setCatalog(catalogCoverage(refs))}).catch(()=>{if(active)setCatalogError(true)});return()=>{active=false}},[catalogOpen,catalogRetry])
 const [holdings,setHoldings]=useState({}),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState(false)
 const [retry,setRetry]=useState(0)
 const assets=profile.lines.map(l=>l.asset).sort().join('|')
 useEffect(()=>{let active=true;setLoading(true);setHoldings({});setLoadError(false);loadHoldingsState(assets.split('|')).then(({holdings,failedAssets})=>{if(active){setHoldings(holdings);setLoadError(failedAssets.length>0);if(retry)onHoldingsChange()}}).catch(()=>{if(active){setHoldings({});setLoadError(true)}}).finally(()=>{if(active)setLoading(false)});return ()=>{active=false}},[assets,retry,onHoldingsChange])
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
 {loading&&<p role="status">Chargement des compositions complètes…</p>}{loadError&&<p role="alert">{Object.keys(holdings).length?'Certaines compositions sont indisponibles ; les autres restent affichées.':'Impossible de charger les compositions.'} <button onClick={()=>setRetry(n=>n+1)}>Réessayer</button></p>}
 <p>Comparaison des entreprises par identifiants vérifiés ; les titres restent détaillés par ISIN. Les listes de principales positions sont partielles : aucun taux global de chevauchement n’est calculé à partir d’un top 10. Les poids additionnés concernent uniquement les deux supports comparés.</p>
 {!shared.pairs.length&&<p>Aucune paire ne dispose actuellement de positions identifiées avec des dates et des périmètres compatibles.</p>}
 {shared.pairs.slice(0,pairLimit).map((pair,i)=><details key={i}><summary>{pair.left} / {pair.right} · {pair.common.length} positions communes</summary><h3>{pair.left} / {pair.right}</h3><p>Positions identifiées : {pair.identifiedCoverage.map(pct).join(' / ')} de chaque support.{pair.full?` Chevauchement des entreprises des listes complètes : ${pct(pair.overlap)}.`:' Listes partielles : le reste du portefeuille n’est pas comparé.'}</p>
 {pair.common.length>30&&<p>Les 30 positions communes les plus pondérées sont affichées sur {pair.common.length}. Tous les titres entrent dans les calculs.</p>}
 {pair.common.length?pair.common.slice(0,30).map(row=><p key={row.isin}>{row.name} · {row.isin} : {pct(row.portfolioWeight)} du portefeuille via ces deux supports.</p>):<p>Aucune position commune identifiée dans ces listes. Cela ne prouve pas l’absence de chevauchement.</p>}
 {pair.sources.map((source,i)=><p key={i}><a href={source.url} target="_blank" rel="noreferrer">Source {i+1} ↗</a> · {source.asOf}{source.checkedAt&&` · Contrôlé le ${source.checkedAt.slice(0,10)}`}{source.basis==='index'&&' · Exposition de l’indice, pas détentions du fonds'}{source.method&&<><br/>{source.method}</>}</p>)}
 </details>)}
 {shared.pairs.length>pairLimit&&<button onClick={()=>setPairLimit(pairLimit+20)}>Afficher 20 autres comparaisons ({shared.pairs.length-pairLimit} restantes)</button>}
 {!!shared.unavailable.length&&<p>Sans liste exploitable : {shared.unavailable.join(' · ')}.</p>}
 <details><summary>Pourquoi certaines comparaisons restent partielles ou impossibles</summary>
 {shared.qualification.filter(q=>!q.complete).map(q=><article key={q.asset}><b>{q.label}</b>{q.asOf&&<p>Photographie : {q.asOf}{q.sourceUrl&&<> · <a href={q.sourceUrl} target="_blank" rel="noreferrer">Source</a></>}</p>}
 {q.reasons.map(reason=><p key={reason}>{reason}</p>)}
 {q.valid&&<p>Poids publiés : {accountingWeight(q.sourceCoverage)} · identifiés : {accountingWeight(q.identifiedCoverage)} · sans identifiant : {accountingWeight(q.unidentifiedCoverage)}.{q.residualWeight>=0?` Solde hors de la liste : ${accountingWeight(q.residualWeight)}.`:` Excédent publié : ${accountingWeight(-q.residualWeight)}.`}</p>}</article>)}
 {shared.incompatiblePairs.slice(0,pairLimit).map((pair,i)=><p key={i}>{pair.left} / {pair.right} : {pair.reasons.join(' ')}</p>)}
 {shared.incompatiblePairs.length>pairLimit&&<button onClick={()=>setPairLimit(pairLimit+20)}>Afficher 20 autres incompatibilités</button>}
 </details>
 </details>
 <details><summary>Poids cumulé des titres détenus en direct et via les ETF</summary>
 <p>Chaque ISIN est compté une seule fois en additionnant ses contributions. Les listes partielles donnent un minimum observé, jamais une mesure complète. Les classes d’actions et les ADR restent distincts. Les dates ou périmètres incompatibles restent séparés.</p>
 {shared.totals.map((group,i)=><section key={i}><h3>{group.scope==='index'?'Indices suivis':'Positions publiées'} · {group.oldest} → {group.asOf}</h3><p>{pct(group.coverage)} du portefeuille identifié sur {pct(group.portfolioWeight)} analysés.</p>
 {group.rows.slice(0,30).map(row=><details key={row.isin}><summary>{row.name} · {row.isin} : {pct(row.weight)} du portefeuille</summary><p>En direct : {pct(row.direct)} · Via les ETF : {pct(row.indirect)}</p>{row.contributions.map(c=><p key={c.asset}>{c.label} : {pct(c.weight)} · <a href={c.sourceUrl} target="_blank" rel="noreferrer">{c.asOf} ↗</a></p>)}</details>)}
 {group.rows.length>30&&<p>Les 30 titres les plus pondérés sont affichés sur {group.rows.length} titres identifiés. Le calcul utilise toutes les lignes.</p>}</section>)}
 </details>
 <details><summary>Positions retenues et solde hors périmètre</summary>
 <p>Les poids restent ceux du fonds entier. Le solde peut contenir des liquidités, d’autres instruments ou des positions dont l’identifiant n’est pas publié ; il n’est pas redistribué aux actions.</p>
 {profile.lines.map(line=>{const status=catalogue[line.asset]?.holdingsStatus,d=rejectedPerimeterDetails(status,line.isin),p=d?.navReconciliation;return d&&<article key={'rejected-'+line.asset}><b>{line.label}</b><p>Observation du {d.asOf}, contrôlée le {d.checkedAt.slice(0,10)} : périmètre brut/net non admis dans les calculs de recouvrement.</p><p>{d.benchmark} · <a href={d.sourceUrl} target="_blank" rel="noreferrer">Source officielle</a></p><p>Actions brutes : {accountingWeight(p.selectedWeightPct)} · total net toutes classes : {accountingWeight(p.publishedNetWeightPct)}.</p>{Object.entries(p.excludedWeightPctByType).map(([kind,weight])=><p key={kind}>{accountingClass(kind)} : {accountingWeight(weight)}.</p>)}<p>Dernière composition admise conservée au {status.asOf}. Ni ses poids ni sa date ne sont remplacés par cette observation refusée.</p></article>})}
 {profile.lines.map(line=>holdings[line.asset]?.identitySourceFailures?.length>0&&<p key={line.asset}>{line.label} : certaines sources d’identifiants sont indisponibles. Les preuves valides conservées gardent leurs dates ; les positions inconnues restent non identifiées.</p>)}
 {profile.lines.map(line=>{const h=holdings[line.asset],p=holdingsReconciliationDetails(h);return p&&<article key={line.asset} aria-label={`Rapprochement comptable ${line.label}`}><b>{line.label}</b><p>{p.asOf} · <a href={h.sourceUrl} target="_blank" rel="noreferrer">Table publiée par l’émetteur</a></p><p>{p.sourceRowCount} lignes publiées · {p.selectedRowCount} positions retenues : {accountingWeight(p.selectedWeightPct)}.</p>
 {Object.entries(p.excludedWeightPctByType).filter(([,weight])=>weight!==0).map(([kind,weight])=><p key={kind}>{accountingClass(kind)} hors de cette liste : {accountingWeight(weight)}.</p>)}
 {p.qualifiedExcludedPositions?.map(row=><p key={row.isin}>{row.name} · {row.isin} : {accountingWeight(row.weightPct)}, part de fonds monétaire qualifiée par son <a href={row.sourceUrl} target="_blank" rel="noreferrer">document officiel du {row.asOf}</a> ; classe brute publiée « {row.sourceAssetClass} ».</p>)}
 {!!p.unidentifiedPositions.length&&<><p>Identifiant non publié pour les positions suivantes, conservées séparément :</p>{p.unidentifiedPositions.map((row,i)=><p key={i}>{row.name} : {accountingWeight(row.weightPct)}{row.ticker&&` · ${row.ticker}`}.</p>)}</>}
 <p>Total net publié, toutes classes : {accountingWeight(p.publishedNetWeightPct)}. Aucun poids renormalisé.</p></article>})}
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
