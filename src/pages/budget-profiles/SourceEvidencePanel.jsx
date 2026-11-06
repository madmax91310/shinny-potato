import Button from '../../design-system/Button'
import { BUDGET_ORIGINAL_PROFILES, BUDGET_ORIGINAL_PUBLICATION_CONTEXT, BUDGET_COMPLETENESS } from './data.js'
import { analyzeBudget, dateLabel, euro, publicationContextFor, sourceReply } from './lib.js'

export default function SourceEvidencePanel({ profile, onCopy }) {
  const original = BUDGET_ORIGINAL_PROFILES.find(p => p.id === profile.id) || profile
  const review = BUDGET_COMPLETENESS[profile.id]
  const before = analyzeBudget(original), after = analyzeBudget(profile)
  const amounts = value => euro(value, profile.currency)
  return <>
    <a href={original.source.url} target="_blank" rel="noreferrer">{original.source.publisher} · {original.source.title}</a>
    <p>Période du budget : {original.period}. {original.publishedAt ? `Source publiée le ${dateLabel(original.publishedAt)}.` : 'Date exacte de publication non indiquée.'} Vérifiée le {dateLabel(original.checkedAt)}.{original.preparedAt && ` Version antérieure préparée le ${dateLabel(original.preparedAt)}.`}</p>
    <p>{original.incomeNote}</p><p>{original.context}</p><p>{original.caveat}</p>
    {original.provenance && <details><summary>Déclarations et hypothèses antérieures</summary><pre className="budget-provenance">{JSON.stringify(original.provenance, null, 2)}</pre></details>}
    <details><summary>Photographie conservée avant compléments</summary><p>Une version déjà préparée peut contenir des hypothèses antérieures : elles ne deviennent pas des déclarations authentiques.</p><pre className="budget-provenance">{JSON.stringify(original, null, 2)}</pre></details>
    {review && <details><summary>Complétude, hypothèses et rapprochement des montants</summary>
      <p>Revue éditoriale du {dateLabel(review.reviewedAt)}, distincte de la période et de la vérification de la source.</p>
      <p>{review.conclusion}</p>{review.scopeChange && <p>{review.scopeChange}</p>}
      {review.reliability && <p>Limites du périmètre : {review.reliability.remainingSummary}</p>}
      <table className="budget-audit-table"><thead><tr><th>Montants mensuels</th><th>Avant</th><th>Version affichée</th></tr></thead><tbody>{[['income','Ressources'],['expenses','Dépenses et provisions'],['available','Reste avant versements'],['savings','Versements'],['balance','Reste après versements']].map(([key,label]) => <tr key={key}><th>{label}</th><td>{amounts(before[key])}</td><td>{amounts(after[key])}</td></tr>)}</tbody></table>
      <p>Les compléments et réallocations sont des hypothèses éditoriales, pas de nouvelles déclarations de la personne source. Aucun nouveau salaire, aide ou patrimoine n’est créé.</p>
      <pre className="budget-provenance">{JSON.stringify(review, null, 2)}</pre>
    </details>}
    {publicationContextFor(profile) && <details><summary>Provenance du récit et des questions</summary><p>« expressed » désigne une interrogation sourcée ; « editorial » une question aux lecteurs. Les adaptations et leur origine sont conservées.</p><pre className="budget-provenance">{JSON.stringify(publicationContextFor(profile), null, 2)}</pre>
      <details><summary>Récit et questions avant adaptation</summary><pre className="budget-provenance">{JSON.stringify(BUDGET_ORIGINAL_PUBLICATION_CONTEXT[profile.id], null, 2)}</pre></details>
    </details>}
    <p>Les prénoms sont éditoriaux. Un budget de référence n’est pas un témoignage individuel. Les inconnues et les prises en charge ne sont pas assimilées à des dépenses gratuites.</p>
    <Button variant="secondary" onClick={() => onCopy(sourceReply(profile))}>Copier la source pour une réponse</Button>
  </>
}
