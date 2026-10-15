import { dateLabel } from './lib.js'
import { formatValue as n } from './valuationPresentation.js'
const percent=v=>Number.isFinite(v)?`${n(v*100)} %`:'—'
export default function ForecastEvaluation({company}) {
  const history=company.forecastEvaluation??{groups:[]}
  const rows=history.groups.filter(g=>g.company===company.id),evaluated=rows.reduce((s,g)=>s+g.evaluated,0)
  const pending=rows.reduce((s,g)=>s+g.pending,0),fundamentals=rows.reduce((s,g)=>s+g.fundamentalEvaluated,0)
  const next=rows.map(g=>g.nextTargetDate).filter(Boolean).sort()[0]
  return <details className="valuation-methodology" data-testid="forecast-evaluation"><summary>Suivi des prévisions dans le temps</summary>
    <p>{history.startedAt?`Archivage automatique depuis le ${dateLabel(history.startedAt)} ; bilan actualisé le ${dateLabel(history.updatedAt)}.`:'Le suivi sera initialisé lors de la prochaine collecte automatique en production.'} Les hypothèses et sources d’origine sont conservées. Les réglages personnels ne sont pas archivés.</p>
    <p data-testid="forecast-progress">📅 {pending} projections en attente d’évaluation du cours ; {evaluated} comparaisons de cours et {fundamentals} comparaisons de résultats publiés réalisées.{next&&` Prochaine échéance archivée : ${dateLabel(next)}.`} Plusieurs projections peuvent concerner la même date : ce ne sont pas des observations indépendantes.</p>
    {!evaluated&&<p>Aucune prévision arrivée à échéance et évaluée pour cette entreprise. La fiabilité prédictive n’est pas encore mesurée.</p>}
    {!!rows.length&&<div className="company-history-scroll"><table><caption>Évaluation par méthode, horizon et version du modèle</caption><thead><tr><th>Méthode / horizon</th><th>Archivées</th><th>En attente</th><th>Évaluées</th><th>Erreur absolue moyenne du cours</th><th>Référence cours inchangé</th><th>Erreur fondamentale / comparaisons relatives</th><th>Cours dans la fourchette</th><th>Non comparables / manquantes</th></tr></thead><tbody>{rows.map(g=><tr key={`${g.method}-${g.years}-${g.modelVersion}`}><th>{g.method==='cash'?'FCF/action':'BPA ajusté'} · {g.years} an{g.years>1?'s':''} · v{g.modelVersion}</th><td>{g.count}</td><td>{g.pending}</td><td>{g.evaluated}</td><td>{percent(g.mae)}</td><td>{percent(g.baselineMae)}</td><td>{percent(g.fundamentalMae)} / {g.fundamentalRelativeCount??g.fundamentalEvaluated} sur {g.fundamentalEvaluated} constatées</td><td>{percent(g.rangeCoverage)}</td><td>{g.blocked} / {g.missing}</td></tr>)}</tbody></table></div>}
    <p>💡 L’erreur moyenne indique de combien l’objectif central s’est écarté du cours constaté, sans tenir compte du sens de l’erreur. Plus elle est faible, plus les objectifs ont été proches des cours observés. La référence « cours inchangé » permet de vérifier si le modèle a fait mieux que conserver le cours de départ.</p>
    <p>La présence du cours dans la fourchette prudent–favorable décrit les résultats passés. Elle ne donne pas une probabilité de réussite pour une nouvelle projection. L’écart sur les bénéfices ou le FCF est suivi séparément : un objectif de cours peut être proche du résultat final malgré des hypothèses erronées.</p>
    <p>{history.convention}</p><p>Le contrôle des fondamentaux attend la publication du premier exercice se terminant après l’échéance ; il peut donc être disponible après le contrôle du cours. Les erreurs restent consultables même si l’entreprise n’est plus éligible aux nouvelles projections.</p>
    {history.startedAt&&<p><a href={history.archiveUrl} target="_blank" rel="noreferrer">Archives datées et résultats détaillés</a></p>}
  </details>
}
