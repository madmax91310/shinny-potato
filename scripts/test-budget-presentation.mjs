import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { BUDGET_PROFILES, BUDGET_ORIGINAL_PROFILES, BUDGET_ORIGINAL_PUBLICATION_CONTEXT } from '../src/pages/budget-profiles/data.js'
import { buildBudgetText, budgetHeading, budgetPublicPresentation, budgetPublicIncomeRows, publicationContextFor, analyzeBudget, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
import { budgetQualification, budgetRowSymbol, budgetPublicBasis, budgetTransfers } from '../src/pages/budget-profiles/presentation.js'
const baseline = JSON.parse(readFileSync(new URL('./fixtures/budget-editorial/presentation-2026-11-02.json', import.meta.url)))
const hash = v => createHash('sha256').update(JSON.stringify(v)).digest('hex')
assert.equal(BUDGET_PROFILES.length, baseline.count)
assert.equal(hash(BUDGET_ORIGINAL_PROFILES), baseline.profilesHash, 'No profile, amount, date, source, hypothesis or filter field changes')
assert.equal(hash(BUDGET_ORIGINAL_PROFILES.map(p=>BUDGET_ORIGINAL_PUBLICATION_CONTEXT[p.id])), baseline.contextsHash, 'Private qualifications, narratives, questions and evidence stay intact')
for (const p of BUDGET_PROFILES) {
  const text = buildBudgetText(p), c = publicationContextFor(p)
  assert.equal(text.split('\n')[0], budgetHeading(p))
  assert(!/Exemple de budget| — |20\d{2}/i.test(text.split('\n')[0]))
  assert(!text.includes('cet exemple de budget'))
  const qualifier = budgetQualification(p)
  if (qualifier) assert(text.toLowerCase().includes(qualifier.toLowerCase()), 'Forecasts and reference budgets keep their meaningful context')
  assert(!/budget personnel/i.test(text), `${p.id}: production labels stay outside the copied publication`)
  const presentation = budgetPublicPresentation(p)
  assert(!/budget personnel/i.test([presentation.job, presentation.household, presentation.location, presentation.basis].join(' ')), `${p.id}: both images use cleaned presentation data`)
  for (const part of [...c.paragraphs, ...c.questions]) assert(text.includes(part.text), 'Enriched facts and targeted questions remain verbatim')
  for (const row of p.expenses) assert(text.includes(`• ${budgetRowSymbol(row).emoji} ${row.label}`))
  for (const row of budgetPublicIncomeRows(p)) assert(text.includes(`• ${budgetRowSymbol(row, 'income').emoji} ${row.label}`))
  assert(!/20\d{2}/.test(budgetPublicBasis(p, budgetPublicPresentation(p).basis)), 'Calendar references leave the image basis, not the private metadata')
  assert.equal(refreshBudgetDraft({profile:p,text:'Mon texte choisi',edited:true}).text,'Mon texte choisi')
}
const aicha = BUDGET_PROFILES.find(p => p.name === 'Aïcha'), a = buildBudgetText(aicha)
assert(a.startsWith('Budget d’Aïcha, 41 ans\n'))
for (const line of ['💼 Cheffe de service', '👩‍👧 Mère célibataire, un enfant de 11 ans', '📍 Région parisienne', '• ⚡ Énergie et eau', '• 📚 École et cours particuliers', '• 🎨 Activités de son enfant', '• 🩺 Assurances et santé', '• 👕 Vêtements et hygiène', '👉 Reste avant épargne', '💳 Reste après épargne']) assert(a.includes(line),line)
assert(!a.includes('• 💰 Réserves pour projets'), 'A single synonymous allocation is not repeated under its heading')
assert.equal(analyzeBudget(aicha).savings,800)
const business = BUDGET_PROFILES.find(p => p.name === 'Inès')
assert(buildBudgetText(business).includes('Reste avant financement de son entreprise'))
assert(!buildBudgetText(business).includes('Reste avant épargne'))
assert(buildBudgetText(business).includes('Mariée, deux enfants'))
const lucie = BUDGET_PROFILES.find(p => p.name === 'Lucie')
assert(buildBudgetText(lucie).includes('Participation du conjoint : 600'))
assert(buildBudgetText(lucie).includes('participation du conjoint'))
assert.equal(analyzeBudget(lucie).income, lucie.income.reduce((sum,row)=>sum+row.amount,0))
const hadrien = BUDGET_PROFILES.find(p => p.name === 'Hadrien')
assert(buildBudgetText(hadrien).includes('Dépenses moyennes d’une autre période'), 'Removing the date line must retain the mixed-period condition')
assert(!/20\d{2}/.test(buildBudgetText(hadrien).split('\n')[0]), 'No period in the title')
assert(buildBudgetText(hadrien).includes('Le salaire est celui de 2026 ; les dépenses reprennent la moyenne de 2025.'), 'The financially material period mismatch stays explicit in the copy')
for (const [label,kind] of [['Énergie et eau','energy'],['École et cours particuliers','education'],['Assurances et santé','health'],['Vêtements et hygiène','clothing'],['Crédit automobile','transport'],['Assurance automobile','transport'],['Téléphone, santé et assurances personnelles','other']]) assert.equal(budgetRowSymbol({label,category:'other'}).kind,kind)
assert.equal(budgetTransfers({...aicha,savings:[{label:'PEA',amount:100}]},'Investissements').single,false,'A single named instrument supplies useful detail')
console.log('Budget presentation: neutral headings, meaningful qualifiers, semantic symbols, stable narratives and immutable source data verified for all profiles.')

assert.equal(budgetPublicBasis({...aicha, kind:'participant',period:''},'Rente prévue à partir de 2030'),'Rente prévue à partir de 2030','A financial horizon is not an editorial preparation date')

assert.equal(budgetTransfers({...aicha,savings:[{label:'Financement de son entreprise',amount:100}]}).heading,'Financement d’entreprise')
assert.equal(budgetTransfers({...aicha,savings:[{label:'PEA',amount:100}]}).heading,'Investissements')

assert.equal(budgetRowSymbol({label:'Courses alimentaires',category:'food'}).kind,'food')
assert.equal(budgetRowSymbol({label:'Cours particuliers',category:'other'}).kind,'education')
assert.equal(budgetRowSymbol({label:'Bitcoin'},'savings').kind,'investment')
assert.equal(budgetRowSymbol({label:'Enveloppe rentrée scolaire prévue'},'savings').kind,'other')
assert.equal(budgetRowSymbol({label:'Réserve pour investissements immobiliers'},'savings').kind,'savings')

assert.equal(budgetTransfers({...aicha,savings:[{label:'Autre versement',amount:100}]}).heading,'Versements','An unknown allocation is not automatically called savings')

assert.equal(budgetRowSymbol({label:'Manucure',category:'health'}).kind,'care')
assert.equal(budgetRowSymbol({label:'Coiffure et soins',category:'health'}).kind,'hair')

const swissMeans = BUDGET_PROFILES.find(p=>p.id==='mustachian-ingenieur-28-2025-08-16')
assert(!/annuel/.test(budgetPublicBasis(swissMeans,budgetPublicPresentation(swissMeans).basis)),'A 2025 average does not establish a complete calendar year')
