import Button from '../../design-system/Button'
import { BUDGET_ORIGINAL_PROFILES, BUDGET_ORIGINAL_PUBLICATION_CONTEXT, BUDGET_COMPLETENESS, BUDGET_EDITORIAL_CREATIONS } from './data.js'
import { analyzeBudget, dateLabel, euro, publicationContextFor, sourceReply } from './lib.js'

export default function SourceEvidencePanel({ profile, onCopy }) {
  const original = BUDGET_ORIGINAL_PROFILES.find(p => p.id === profile.id) || profile
  const review = BUDGET_COMPLETENESS[profile.id]
  const creation = BUDGET_EDITORIAL_CREATIONS[profile.id]
  const before = analyzeBudget(original), after = analyzeBudget(profile)
  const amounts = value => euro(value, profile.currency)
  return <>
    {creation && <details open><summary>Créations éditoriales et provenance</summary>
      <p>Personnage éditorial, pas un témoignage reçu. Les créations ne viennent pas de la personne source.</p>
      <p>Revue du {dateLabel(creation.reviewedAt)}.</p>
      <pre className="budget-provenance">{JSON.stringify(creation, null, 2)}</pre>
    </details>}
    <a href={original.source.url} target="_blank" rel="noreferrer">{original.source.publisher} · {original.source.title}</a>
    <p>Période du budget : {original.period}. {original.publishedAt ? `Source publiée le ${dateLabel(original.publishedAt)}.` : 'Publication non datée.'} Vérifiée le {dateLabel(original.checkedAt)}.{original.preparedAt && ` Préparation antérieure : ${dateLabel(original.preparedAt)}.`}</p>
    <p>{original.incomeNote}</p><p>{original.context}</p><p>{original.caveat}</p>
    {original.provenance && <details><summary>Déclarations et hypothèses antérieures</summary><pre className="budget-provenance">{JSON.stringify(original.provenance, null, 2)}</pre></details>}
    <details><summary>Photographie source</summary><pre className="budget-provenance">{JSON.stringify(original, null, 2)}</pre></details>
    {review && <details><summary>Rapprochement avec la source</summary>
      <p>Revue antérieure : {dateLabel(review.reviewedAt)}.</p>
      <p>{review.conclusion}</p>{review.scopeChange && <p>{review.scopeChange}</p>}
      {review.reliability && <p>Limites de la source : {review.reliability.remainingSummary}</p>}
      <table className="budget-audit-table"><thead><tr><th>Montants mensuels</th><th>Avant</th><th>Version affichée</th></tr></thead><tbody>{[['income','Ressources'],['expenses','Dépenses et provisions'],['available','Reste avant versements'],['savings','Versements'],['balance','Reste après versements']].map(([key,label]) => <tr key={key}><th>{label}</th><td>{amounts(before[key])}</td><td>{amounts(after[key])}</td></tr>)}</tbody></table>
      <pre className="budget-provenance">{JSON.stringify(review, null, 2)}</pre>
    </details>}
    {publicationContextFor(profile) && <details><summary>Provenance du récit et des questions</summary><p>« expressed » : question sourcée ; « editorial » : question aux lecteurs.</p><pre className="budget-provenance">{JSON.stringify(publicationContextFor(profile), null, 2)}</pre>
      <details><summary>Récit antérieur</summary><pre className="budget-provenance">{JSON.stringify(BUDGET_ORIGINAL_PUBLICATION_CONTEXT[profile.id], null, 2)}</pre></details>
    </details>}
    <Button variant="secondary" onClick={() => onCopy(sourceReply(profile))}>Copier la source pour une réponse</Button>
  </>
}
