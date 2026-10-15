import {useState} from 'react'
import completeness from '../../data/etf-completeness.json'
import { ETF_DEVELOPMENT_CATALOG, etfDevelopmentEntry } from '../../data/etf-development.js'
export default function EtfDevelopment() {
  const [query,setQuery]=useState('');
  const [onlyGaps,setOnlyGaps]=useState(true);
  const rows=completeness.rows.filter(r=>(!onlyGaps||r.gaps.some(g=>g.status!=='not-applicable'))&&`${r.name} ${r.isin}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <h3>Couverture des {completeness.instruments} instruments</h3>
    <p>Présence des données, vérifiée au {completeness.checkedAt}. La fraîcheur et les échecs de collecte restent suivis dans « Données à revoir ». Les champs non applicables sont exclus du dénominateur.</p>
    <div style={{overflowX:'auto'}}><table><thead><tr><th>Donnée</th><th>Présente / applicable</th><th>Non applicable</th><th>En attente</th><th>Non publiée</th><th>À résoudre</th></tr></thead><tbody>{Object.entries(completeness.fieldCoverage).map(([key,r])=><tr key={key}><td>{r.label}</td><td>{r.present}/{r.applicable}</td><td>{r.notApplicable}</td><td>{r.waiting}</td><td>{r.notPublished}</td><td>{r.unresolved}</td></tr>)}</tbody></table></div>
    <h3>Performances et champs à compléter</h3>
    <p>Les calendriers de l’émetteur, les performances glissantes et les rendements calculés sur une cotation sont séparés. Une cotation en EUR ne remplace pas un rendement NAV en USD. Aucun historique court n’est prolongé.</p>
    <label>Rechercher un ETF ou un ISIN <input value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <label><input type="checkbox" checked={onlyGaps} onChange={e=>setOnlyGaps(e.target.checked)}/> Afficher uniquement les instruments à compléter</label>
    <p>{rows.length} instruments</p>
    {rows.map(r=><details key={r.isin}><summary>{r.name} · {r.isin}</summary>
      <p><a href={`?type=instrument&q=${r.isin}`}>Données et outils raccordés</a></p>
      <p>Calendrier émetteur ({r.annual.currency??'devise non documentée'}) : {Object.entries(r.annual.years).map(([y,v])=>`${y} : ${v.toFixed(2)} %`).join(' · ')||'aucune année civile complète qualifiée'}. {r.annual.sourceUrl&&<a href={r.annual.sourceUrl} target="_blank" rel="noreferrer">Source émetteur</a>}</p>
      {r.observations.map((o,i)=><p key={i}>Performance publiée : {o.label} · {o.value.toFixed(2)} % au {o.asOf} ({r.annual.currency}).</p>)}
      {r.listings.map((l,i)=><p key={i}>Calcul sur cotation {l.symbol} ({l.currency}), revenus réinvestis : {Object.entries(l.years).map(([y,v])=>`${y} : ${v.toFixed(2)} %`).join(' · ')}. {l.method}. <a href={l.sourceUrls[0]} target="_blank" rel="noreferrer">Source des cours</a></p>)}
      <ul>{r.gaps.map(g=><li key={g.field}>{completeness.fieldCoverage[g.field].label} : {g.reason}</li>)}</ul>
    </details>)}
    <h3>Raccordements des lots ETF</h3>
    <p>Les références ci-dessous utilisent les données communes déjà collectées. Les usages actuels sont indiqués pour chaque part. Une collecte disponible ne suffit pas à qualifier un historique : les séries courtes ne sont pas prolongées.</p>
    {ETF_DEVELOPMENT_CATALOG.map(lot=><section key={lot.id}>
      <h3>{lot.label}</h3>
      {lot.entries.map(([family,isin])=>{const row=etfDevelopmentEntry(isin);return <details key={isin}>
        <summary>{family} — {row.name} · {row.status}</summary>
        <p><a href={`?type=instrument&q=${isin}`}>{isin} · ouvrir les données et les usages</a></p>
        <p>Collecte : {row.collected?'présente':'non documentée'} · Fiche ETF : {row.sheet?'présente':'à préparer'} · Générateur : {row.portfolio}</p>
        <p>Outils raccordés : {row.tools.length ? row.tools.map((tool,index)=><span key={tool.href}>{index>0 ? ' · ' : ''}<a href={`${import.meta.env.BASE_URL.replace(/\/$/,'')}${tool.href}`}>{tool.label}</a></span>) : 'aucun'}.</p>
        <p>Années de part collectées : {row.years.join(', ')||'aucune année civile complète'}. Six années communes : {row.sixYears?'disponibles':'indisponibles'}.</p>
        <ul>{Object.entries(row.observations).map(([key,value])=><li key={key}>{({aum:'Encours',holdings:'Positions',countries:'Pays',sectors:'Secteurs'})[key]} : {value.available ? `${value.asOf} · ${value.basis ?? 'base non documentée'}` : 'non documenté'} {value.source && <a href={value.source} target="_blank" rel="noreferrer">Source</a>}</li>)}</ul>
        {row.gaps.length>0 && <ul>{row.gaps.map(gap=><li key={gap}>{gap}</li>)}</ul>}
      </details>})}
    </section>)}
  </>
}
