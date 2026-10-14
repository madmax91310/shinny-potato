import history from '../../data/company-forecast-evaluation.json' with { type: 'json' }
import { dateLabel } from './lib.js'
import { formatValue as n } from './valuationPresentation.js'
const percent=v=>Number.isFinite(v)?`${n(v*100)} %`:'—'
export default function ForecastEvaluation({company}) {
  const rows=history.groups.filter(g=>g.company===company.id),evaluated=rows.reduce((s,g)=>s+g.evaluated,0)
  return <details className="valuation-methodology" data-testid="forecast-evaluation"><summary>Suivi des prévisions dans le temps</summary>
    <p>{history.startedAt?`Archivage automatique depuis le ${dateLabel(history.startedAt)} ; bilan actualisé le ${dateLabel(history.updatedAt)}.`:'Le suivi sera initialisé lors de la prochaine collecte automatique en production.'} Les hypothèses et sources d’origine sont conservées. Les réglages personnels ne sont pas archivés.</p>
    {!evaluated&&<p>Aucune prévision arrivée à échéance et évaluée pour cette entreprise. La fiabilité prédictive n’est pas encore mesurée.</p>}
    {!!rows.length&&<div className="company-history-scroll"><table><caption>Évaluation par méthode, horizon et version du modèle</caption><thead><tr><th>Méthode / horizon</th><th>Archivées</th><th>En attente</th><th>Évaluées</th><th>Erreur absolue moyenne du cours</th><th>Référence cours inchangé</th><th>Erreur fondamentale / nombre</th><th>Non comparables / manquantes</th></tr></thead><tbody>{rows.map(g=><tr key={`${g.method}-${g.years}-${g.modelVersion}`}><th>{g.method==='cash'?'FCF/action':'BPA ajusté'} · {g.years} an{g.years>1?'s':''} · v{g.modelVersion}</th><td>{g.count}</td><td>{g.pending}</td><td>{g.evaluated}</td><td>{percent(g.mae)}</td><td>{percent(g.baselineMae)}</td><td>{percent(g.fundamentalMae)} / {g.fundamentalEvaluated}</td><td>{g.blocked} / {g.missing}</td></tr>)}</tbody></table></div>}
    <p>{history.convention}</p><p>Le contrôle des fondamentaux attend la publication du premier exercice se terminant après l’échéance ; il peut donc être disponible après le contrôle du cours. Les erreurs restent consultables même si l’entreprise n’est plus éligible aux nouvelles projections.</p>
    {history.startedAt&&<p><a href={history.archiveUrl} target="_blank" rel="noreferrer">Archives datées et résultats détaillés</a></p>}
  </details>
}
