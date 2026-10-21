import {useEffect,useMemo,useState} from 'react'
import {references,pct,euro} from './engine.js'
import {loadHoldings} from './holdings-loader.js'
import {portfolioAnalytics,flowAllocation,allocationAfterContributions,compareExposures} from './analytics.js'
import {exposureDisplay} from './exposure.js'
import Verification from './Verification.jsx'
const titleScope=scope=>scope==='index'?'Indices suivis':scope==='equity'?'Titres en direct':'Positions publiées'
const delta=n=>`${n>0?'+':''}${n.toLocaleString('fr-FR',{maximumFractionDigits:2})} pts`
export default function Analytics({profile,analysis}) {
 const [mode,setMode]=useState('held'),[capital,setCapital]=useState('10000'),[months,setMonths]=useState('12')
 const [baseline,setBaseline]=useState(null),[query,setQuery]=useState(''),[limit,setLimit]=useState(20)
 const [state,setState]=useState({key:'',holdings:{},error:false}),[retry,setRetry]=useState(0),[selectedGroup,setSelectedGroup]=useState(0)
 const requested=[...new Set([...profile.lines,...(baseline||[])].map(l=>l.asset))].sort().join('|')
 useEffect(()=>{let active=true;setState({key:'',holdings:{},error:false});loadHoldings(requested.split('|')).then(holdings=>{if(active)setState({key:requested,holdings,error:false})}).catch(()=>{if(active)setState({key:requested,holdings:{},error:true})});return()=>{active=false}},[requested,retry])
 const loading=state.key!==requested
 let simulationError=''
 let lines=profile.lines
 if(mode==='flows')lines=flowAllocation(profile.lines)
 if(mode==='future')try{lines=allocationAfterContributions(profile.lines,Number(capital),Number(months))}catch(e){simulationError=e.message;lines=[]}
 const result=useMemo(()=>portfolioAnalytics(lines,references,loading?{}:state.holdings),[lines,state.holdings,loading])
 const before=useMemo(()=>baseline?portfolioAnalytics(baseline,references,loading?{}:state.holdings):null,[baseline,state.holdings,loading])
 const group=result.groups[Math.min(selectedGroup,Math.max(0,result.groups.length-1))]
 const rows=(group?.rows||[]).filter(r=>(r.name+' '+r.isin).toLowerCase().includes(query.toLowerCase()))
 const monthly=profile.lines.reduce((s,l)=>s+(Number.isFinite(l.amount)?l.amount:0),0)
 return <section id="dca-analysis" tabIndex={-1} className="dca-analysis" aria-label="Analyse du portefeuille">
 <div className="dca-analysis-heading"><div><span className="dca-eyebrow">SOUS LES LIGNES DU PORTEFEUILLE</span><h2>Ce que tu détiens vraiment</h2><p>Expositions, titres communs et poids cumulé des détentions directes et indirectes.</p></div><span className="dca-live-badge">{profile.lines.length} positions</span></div>
 <div className="dca-analysis-tabs" aria-label="Allocation analysée">{[['held','Portefeuille actuel'],['flows','Versements mensuels'],['future','Après les versements']].map(([id,label])=><button key={id} aria-pressed={mode===id} onClick={()=>{setMode(id);setSelectedGroup(0)}} disabled={profile.imageOnly&&id!=='held'}>{label}</button>)}</div>
 {mode==='future'&&<div className="dca-simulation"><div className="dca-fields"><label>Capital actuel (€)<input aria-label="Capital actuel pour les versements" type="number" min="1" value={capital} onChange={e=>setCapital(e.target.value)}/></label><label>Nombre de mois<input aria-label="Durée des versements en mois" type="number" min="1" max="120" step="1" value={months} onChange={e=>setMonths(e.target.value)}/></label></div><p>Avec {euro(monthly)} par mois. Calcul à cours constants, sans rendement, frais ni fiscalité ; compositions des fonds maintenues à leur dernière observation. Ce n’est pas une prévision.</p></div>}
 {simulationError&&<p role="alert">{simulationError}</p>}
 {!lines.length&&!simulationError&&<p>Aucun versement mensuel à analyser.</p>}
 {!!lines.length&&<>
 <div className="dca-metrics">{['countries','sectors'].map(field=>{const x=result.exposures[field],d=exposureDisplay(x),lead=x.groups[0]?.rows[0];return <article key={field}><span>{field==='countries'?'Premier pays observé':'Premier secteur observé'}</span><strong>{lead?pct(lead.weight):'—'}</strong><b>{lead?.name||'Pas de ventilation'}</b><small>{pct(d.coverage)} ventilés · {pct(d.missing)} non ventilés</small></article>})}<article><span>Titres identifiés</span><strong>{loading?'…':group?.identified||0}</strong><b>{group?titleScope(group.scope):'Analyse en cours de qualification'}</b><small>{loading?'Chargement des compositions…':`${pct(group?.coverage||0)} du portefeuille identifié`}</small></article></div>
 {loading&&<p role="status">Chargement de l’analyse des détentions…</p>}{state.error&&<p role="alert">Les compositions n’ont pas pu être chargées. <button onClick={()=>setRetry(n=>n+1)}>Relancer l’analyse</button></p>}
 <details className="dca-analysis-detail"><summary>Concentration et poids cumulés</summary>
 <p>Chaque titre est rapproché par ISIN. Les ADR et classes d’actions restent distincts. Les chiffres portent sur l’allocation sélectionnée ci-dessus.</p>
 {result.groups.length>1&&<div className="dca-analysis-tabs" aria-label="Périmètre des détentions">{result.groups.map((g,i)=><button key={i} aria-pressed={group===g} onClick={()=>setSelectedGroup(i)}>{titleScope(g.scope)} · {g.oldest} → {g.asOf}</button>)}</div>}
 {group&&!loading&&<><div className="dca-concentration"><div><span>5 premiers titres</span><strong>{pct(group.top5)}</strong></div><div><span>10 premiers titres</span><strong>{pct(group.top10)}</strong></div><p>{group.complete?'Couverture complète des titres identifiés.':'Concentration observée sur la part identifiée ; des détentions manquantes peuvent augmenter ces poids.'}<br/>{group.oldest} → {group.asOf} · {pct(group.coverage)} identifiés sur {pct(group.portfolioWeight)} analysés.</p></div>
 <label>Rechercher un titre ou un ISIN<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(20)}} placeholder="Microsoft, US…"/></label>
 <div className="dca-security-list">{rows.slice(0,limit).map(r=><details key={r.isin}><summary><span>{r.name}<small>{r.isin} · {r.contributions.length} support{r.contributions.length>1?'s':''}</small></span><span className="dca-security-weight">{pct(r.weight)}<span className="dca-weight-bar" style={{'--weight':`${Math.min(100,r.weight)}%`}}/></span></summary><p>En direct : {pct(r.direct)} · Via les fonds : {pct(r.indirect)}</p>{r.contributions.map(c=><p key={c.asset}>{c.label} : {pct(c.weight)} · <a href={c.sourceUrl} target="_blank" rel="noreferrer">{c.asOf}</a></p>)}</details>)}</div>
 {!rows.length&&<p>Aucun titre correspondant.</p>}{rows.length>limit&&<button className="dca-secondary" onClick={()=>setLimit(n=>n+30)}>Afficher 30 titres de plus ({rows.length-limit} restants)</button>}</>}
 {!group&&!loading&&<p>Aucune composition compatible disponible pour ce périmètre. Les expositions géographiques et sectorielles restent analysées séparément.</p>}
 </details>
 <details className="dca-analysis-detail"><summary>Recouvrement entre les supports · {loading?'…':result.pairs.length} comparaisons</summary><p>Le recouvrement additionne le plus petit poids de chaque titre commun dans les deux fonds, indépendamment de leurs poids dans ton portefeuille. Un top 10 ne suffit pas pour calculer ce taux.</p>
 <div className="dca-pair-grid">{result.pairs.slice(0,50).map((pair,i)=><article key={i}><span>{pair.left}</span><span>{pair.right}</span><strong>{pair.full?pct(pair.overlap):'Partiel'}</strong><small>{pair.companyCommon.length} entreprises communes · {pair.identifiedCoverage.map(pct).join(' / ')} identifiés</small></article>)}</div>{result.pairs.length>50&&<p>50 comparaisons affichées ici. Toutes les paires sont accessibles dans le détail des sources ci-dessous.</p>}
 {!!result.unavailable.length&&!loading&&<p>Sans composition exploitable : {result.unavailable.join(' · ')}.</p>}
 </details>
 {lines.filter(l=>references[l.asset]?.assetAllocation).map(l=>{const o=references[l.asset].assetAllocation;const age=(Date.now()-Date.parse(o.asOf))/86400000;return <details className="dca-analysis-detail" key={l.asset}><summary>{l.label} · allocation multi-actifs</summary>{age>=0&&age<=93?<>{o.rows.map(r=><p key={r.name}>{r.name} : {pct(r.weightPct)} du fonds, soit {pct(l.weight*r.weightPct/100)} de l’allocation analysée.</p>)}<p><a href={o.sourceUrl} target="_blank" rel="noreferrer">Allocation publiée au {o.asOf}</a>. Les fonds sous-jacents ne sont pas assimilés à leurs entreprises. Cette ventilation actions/obligations ne constitue pas une ventilation intégrale par pays ou secteur.</p></>:<p>Observation trop ancienne ou date invalide. Aucun poids multi-actifs calculé.</p>}</details>})}
 <details className="dca-analysis-detail"><summary>Comparer deux allocations</summary><p>Garde une allocation comme référence, puis modifie les lignes ou les versements. Les écarts sont exprimés en points de pourcentage sur les ventilations compatibles.</p><div className="dca-buttons"><button className="dca-secondary" onClick={()=>setBaseline(structuredClone(lines))}>Garder cette allocation comme référence</button>{baseline&&<button className="dca-secondary" onClick={()=>setBaseline(null)}>Effacer la référence</button>}</div>
 {before&&['countries','sectors'].map(field=>{const c=compareExposures(before,result,field);return <section key={field}><h3>{field==='countries'?'Pays':'Secteurs'}</h3>{c.compatible?<><p>Couverture référence / sélection : {c.coverage.map(pct).join(' / ')}</p><div className="dca-diff-table"><div><b>Exposition</b><b>Référence</b><b>Sélection</b><b>Écart</b></div>{c.rows.slice(0,10).map(r=><div key={r.name}><span>{r.name}</span><span>{pct(r.before)}</span><span>{pct(r.after)}</span><strong>{delta(r.delta)}</strong></div>)}</div></>:<p>Les dates ou les méthodes ne permettent pas de comparer ces ventilations.</p>}</section>})}
 </details>
 <details className="dca-analysis-detail"><summary>Sources, couverture du catalogue et détail des comparaisons</summary><Verification profile={{...profile,lines}} analysis={{...analysis,countries:result.exposures.countries,sectors:result.exposures.sectors}}/></details>
 </>}
 </section>
}
