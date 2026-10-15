import { ETF_DEVELOPMENT_LOTS, etfDevelopmentEntry } from '../../data/etf-development.js'
export default function EtfDevelopment() {
  return <details className="ds-etf-development">
    <summary>Ajout d’ETF · suivi des quatre lots</summary>
    <p>Les références ci-dessous utilisent les données communes déjà collectées. Les affectations aux outils restent à examiner. Une collecte disponible ne suffit pas à qualifier un historique : les séries courtes ne sont pas prolongées.</p>
    {ETF_DEVELOPMENT_LOTS.map(lot=><section key={lot.id}>
      <h3>{lot.label}</h3>
      {lot.entries.map(([family,isin])=>{const row=etfDevelopmentEntry(isin);return <details key={isin}>
        <summary>{family} — {row.name} · {row.status}</summary>
        <p><a href={`?type=instrument&q=${isin}`}>{isin} · ouvrir les données et les usages</a></p>
        <p>Collecte : {row.collected?'présente':'non documentée'} · Fiche ETF : {row.sheet?'présente':'à préparer'} · Générateur : {row.portfolio}</p>
        <p>Années de part collectées : {row.years.join(', ')||'aucune année civile complète'}. Six années communes : {row.sixYears?'disponibles':'indisponibles'}.</p>
        <ul>{Object.entries(row.observations).map(([key,value])=><li key={key}>{({aum:'Encours',holdings:'Positions',countries:'Pays',sectors:'Secteurs'})[key]} : {value.available ? `${value.asOf} · ${value.basis ?? 'base non documentée'}` : 'non documenté'} {value.source && <a href={value.source} target="_blank" rel="noreferrer">Source</a>}</li>)}</ul>
        {row.gaps.length>0 && <ul>{row.gaps.map(gap=><li key={gap}>{gap}</li>)}</ul>}
      </details>})}
    </section>)}
  </details>
}
