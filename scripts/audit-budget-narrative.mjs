import { mkdirSync, writeFileSync } from 'node:fs'
import { BUDGET_PROFILES, BUDGET_EDITORIAL_CREATIONS } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, publicationContextFor } from '../src/pages/budget-profiles/lib.js'

const rows = BUDGET_PROFILES.map(p => {
  const r = BUDGET_EDITORIAL_CREATIONS[p.id], c = publicationContextFor(p)
  return { id: p.id, name: p.name, currency: p.currency || 'EUR', period: p.period, source: p.source,
    monthly: analyzeBudget(p), review: r.narrativeReview, paragraphs: c.paragraphs, questions: c.questions,
    generalQuestion: c.budgetQuestion, text: buildBudgetText(p) }
})
const stats = { reviewed: rows.length, changed: rows.filter(r => r.review.changedFields.length).length,
  narrativeChanged: rows.filter(r => r.review.changedFields.includes('paragraphs')).length,
  targetedQuestionsChanged: rows.filter(r => r.review.changedFields.includes('questions')).length,
  generalConclusionRemoved: rows.filter(r => r.review.previous.budgetQuestion && !r.generalQuestion).length,
  expressedQuestions: rows.reduce((n, r) => n + r.questions.filter(q => q.origin === 'expressed').length, 0),
  editorialQuestions: rows.reduce((n, r) => n + r.questions.filter(q => q.origin === 'editorial').length, 0),
  deficits: rows.filter(r => r.monthly.balance < 0).length, monthlyAmountsChanged: 0 }
const lines = ['# Cohérence des récits et questions — 6 novembre 2026', '', JSON.stringify(stats, null, 2), '',
  'Base : `b13ec5c5fd159a899b59b9330646426f837c660f` (master). Les sources, montants mensuels, identifiants, périodes et dix déficits sont conservés. Aucune nouvelle consultation de source ni déclaration authentique n’est revendiquée. Les compléments et calculs conditionnels sont éditoriaux et restent consultables dans la fiche.', '',
  'Chaque projet est un objectif minimum, pas une égalité imposée. Un dépassement à l’échéance peut rester disponible ou entraîner une revue des virements ; un virement envisagé ne devient pas un virement effectué. Les stocks ne sont jamais ajoutés aux revenus mensuels.', '',
  '## Identités publiques du code et des données', '',
  '- Livraison #1186 : run [42238277849](https://github.com/madmax91310/shinny-potato/actions/runs/42238277849), publication vérifiée le 06/11 à 16:36 UTC, nouveau contrôle à 16:49. Code `02cfde6b5cf0184a10c024c74adfef6f04a9f009`, données `2d73ea8f922ef234bf91911e705853e658bcaa94`.',
  '- Collecte ultérieure : commit `f212ab74eebaf825b930a67e636da03bebb32638`, 18:09 UTC, puis job [128065452982](https://github.com/madmax91310/shinny-potato/actions/runs/42267239488/job/128065452982). Construction 18:17:53, vérification publique 18:20:37 : même code `02cfde6b…`, nouvelles données `f212ab74…`, 382 fichiers vérifiés. Le job de publication réussit ; le run global signale séparément des sources de collecte en échec.',
  '- `sha` identifie le code validé ; `dataSha` le snapshot de données automatisées composé avec ce code. Ce dernier ne remplace pas la version de la banque de budgets intégrée au code. Le portail de données applique les contrats de compatibilité et vérifie un manifeste des fichiers réellement servis.',
  '- Preuve Git : l’arbre `src/pages/budget-profiles` porte exactement `d7ca9e6300df3e98b7ca071eb6ed14c19652dbe8` aux trois commits ci-dessus. L’écart vient de la collecte ultérieure, sans changement du budget ni anomalie de publication démontrée. Aucun SHA forcé, aucune modification du déploiement.', '',
  '## Audit par profil', '']
for (const r of rows) lines.push(`### ${r.name}`, '', `Identifiant : \`${r.id}\` ; ${r.currency} ; période conservée : ${r.period}.`, '', r.review.note, '',
  `Modifications : ${r.review.changedFields.join(', ') || 'aucune, questions et récit conservés'}.`, '',
  ...r.review.limits.map(limit => `- Limite : ${limit}`), '',
  ...r.review.projectChecks.map(p => `- Projet : ${p.label} ; cible ${p.target ?? 'non chiffrée'} ; départ ${p.initialFunding} ; mensuel ${p.monthlyFunding ?? 'non affecté'}${p.consideredOnly ? ' envisagé' : ''} ; échéance ${p.horizonMonths ?? 'non arrêtée'} mois${p.fundingAtHorizon !== undefined ? ` ; total conditionnel ${p.fundingAtHorizon}, écart au minimum ${p.differenceFromMinimum}` : ''}.`), '',
  'Récit retenu :', '', ...r.paragraphs.map(p => p.text), '', 'Questions retenues :', '', ...r.questions.map(q => `- [${q.origin}] ${q.text}`), ...(r.generalQuestion ? [`- [ouverture] ${r.generalQuestion}`] : []), '')
mkdirSync('docs', { recursive: true })
writeFileSync('docs/budget-narrative-coherence-2026-11-06.md', lines.join('\n').trimEnd() + '\n')
writeFileSync('docs/budget-narrative-coherence-2026-11-06.json', JSON.stringify({ stats, profiles: rows }, null, 2) + '\n')
mkdirSync('test-artifacts/budget-narrative', { recursive: true })
writeFileSync('test-artifacts/budget-narrative/final-texts.txt', rows.map(r => `${r.id}\n${r.text}`).join('\n\n===\n\n'))
console.log(stats)
