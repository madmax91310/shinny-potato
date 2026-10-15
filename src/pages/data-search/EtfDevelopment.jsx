import { ETF_DEVELOPMENT_CATALOG, etfDevelopmentEntry } from '../../data/etf-development.js'
export default function EtfDevelopment() {
  return <>
    <p>Les références ci-dessous utilisent les données communes déjà collectées. Les liens indiquent les outils effectivement raccordés à chaque part. Une collecte disponible ne suffit pas à qualifier un historique : les séries courtes ne sont pas prolongées.</p>
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
