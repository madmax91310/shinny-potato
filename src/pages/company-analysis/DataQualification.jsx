import { companyQualification } from './dataQualification.js'
import { formatValue as n } from './valuationPresentation.js'
export default function DataQualification({company,model,now}) {
  const q=companyQualification(company,now,model)
  return <details className="valuation-methodology" data-testid="data-qualification"><summary>Données requises · bénéfices {q.methods.earnings.available?'disponibles':'indisponibles'} · FCF {q.methods.cash.available?'disponible':'indisponible'}</summary>
    <p>Une méthode disponible dispose des données requises pour ses calculs. Cela ne signifie pas que tous les risques de l’entreprise sont modélisés.</p>
    {Object.entries(q.methods).map(([key,m])=><p key={key}><strong>{key==='cash'?'Méthode FCF':'Méthode bénéfices'} : {m.available?'données requises réunies':'calcul suspendu'}.</strong> {m.reasons.join(' ')} {m.available&&`${m.historicalMultipleCount} références historiques de multiple ; ${key==='cash'?'comptes':'estimations externes'} jusqu’au ${m.sourcedThrough}.`}</p>)}
    <p>Les objectifs utilisent les exercices annuels. Derniers comptes intermédiaires : {q.fields.quarterly.period??'non collectés'}{q.fields.quarterly.present&&!q.fields.quarterly.fresh?' (observation trop ancienne)':''}. Ils ne sont pas assimilés à un nouvel exercice annuel.</p>
    <div className="company-history-scroll"><table><caption>Données financières et rôle dans l’analyse</caption><thead><tr><th>Donnée / définition</th><th>Valeur</th><th>Période / source</th><th>Utilisation</th></tr></thead><tbody>{q.financialDepth.map(f=><tr key={f.key}><th>{f.label}<small style={{display:'block',fontWeight:400}}>{f.definition}</small></th><td>{f.usable?`${n(f.value/1e6,2)} M${f.key==='averageDilutedShares'?' actions':` ${company.currency}`}`:f.present?'À renouveler / qualifier':'Non collectée'}</td><td>{f.end??'—'}{f.sourceUrl&&<> · <a href={f.sourceUrl} target="_blank" rel="noreferrer">Source</a></>}</td><td>{f.use==='risk'?'Vigilance ; hors calcul explicite':'Calcul si qualifiée'}</td></tr>)}</tbody></table></div>
    <p>Dette, acquisitions et locations ne sont pas déduites automatiquement du prix cible. Des informations absentes ne valent jamais zéro. Les bénéfices ajustés restent distincts des bénéfices comptables publiés.</p>
  </details>
}
