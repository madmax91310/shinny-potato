import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { BUDGET_PROFILES, BUDGET_PUBLICATION_REVIEW, BUDGET_PUBLICATION_CLOSURE } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, budgetExpenseColumns, budgetPublicPresentation, buildBudgetText, publicationContextFor } from '../src/pages/budget-profiles/lib.js'
import { projectBudgetScenario } from '../src/pages/budget-profiles/closure-scenarios.js'
import { planSocialBudget } from '../src/pages/budget-profiles/socialImage.js'

const shards = process.argv.slice(2)
assert(shards.length, 'Indiquer les répertoires des exports Chromium de tous les profils')
const imageEvidence = new Map(shards.flatMap(path => JSON.parse(readFileSync(`${path}/layout.json`)).map(entry => [entry.id, { ...entry, path }])))
const baseline = readFileSync(new URL('../docs/budget-maquette-b-2026-11-18/audit.csv', import.meta.url), 'utf8').trim().split('\n').slice(1)
const previousLedgers = new Map(baseline.map(line => {
  const [, id, currency, fields] = line.match(/^([^,]+),.*?,([A-Z]{3}),((?:-?\d+,){4}-?\d+),/)
  return [id, [currency, ...fields.split(',').map(Number)]]
}))
const prior = {
  'finary-alternant-19-2025-09-27': 'Titre générique et unité mensuelle sur un total qui incluait le bonus.',
  'mustachian-ingenieur-28-2025-08-16': 'Le solde moyen de 3 749 CHF était intitulé capacité d’épargne et les versements affichaient 0 CHF.',
  'reddit-famille-bourges-2026-07-12': 'Le regroupement de 922,03 € n’était pas daté dans le visuel et la question n’abordait pas le choix d’un nouvel échéancier.',
  'editorial-complementary-solo-2026-11-16': 'Déficit de 850 € après versement, sans financement temporaire décrit.',
  'editorial-studio-alternance-demenagement-2026-11-16': 'Projection à 700 € de loyer avec 10 € de marge, sans mensualité future dans le calcul.',
}
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const cents = value => Math.round(value * 100)
const sum = rows => rows.reduce((amount, row) => amount + cents(row.amount), 0)
const forbidden = /(?:budget (?:reconstitué|fictif)|exemple de budget|profil adapté|(?:sa|leur) part du budget|mensuel\s*·\s*sa part|—)/i
const out = new URL('../docs/budget-relecture-1390/matrice.csv', import.meta.url)
const columns = ['id', 'profil', 'devise', 'période', 'qualification_des_revenus', 'revenus_centimes', 'dépenses_centimes',
  'capacité_centimes', 'versements_centimes', 'reste_centimes', 'texte', 'calculs', 'image', 'points_à_relire',
  'retouches_de_contenu', 'texte_sha256', 'png_sha256', 'provenance_clôture', 'avant_clôture', 'après_clôture']
const csv = cells => cells.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')
const lines = [csv(columns)]

assert.equal(imageEvidence.size, BUDGET_PROFILES.length)
for (const profile of BUDGET_PROFILES) {
  const id = profile.id, currency = profile.currency || 'EUR'
  const cash = sum(profile.income.filter(row => !row.inKind)), expenses = sum(profile.expenses), transfers = sum(profile.savings)
  const available = cash - expenses, balance = available - transfers, reviewed = BUDGET_PUBLICATION_REVIEW[id] || []
  assert.deepEqual([currency, cash, expenses, transfers, available, balance], previousLedgers.get(id), id)
  const closure = BUDGET_PUBLICATION_CLOSURE[id]
  const totals = analyzeBudget(profile), plan = planSocialBudget(profile)
  assert.deepEqual([totals.income, totals.expenses, totals.savings, totals.available, totals.balance].map(cents), [cash, expenses, transfers, available, balance], id)
  assert.equal(sum(budgetExpenseColumns(profile)), expenses, id)
  assert.equal(sum(plan.expenses.flat()), expenses, id)
  assert.equal(sum(plan.transferRows), transfers, id)
  for (const row of [...plan.expenses.flatMap(side => side.flatMap(section => section.rows)), ...plan.transferRows]) {
    assert.equal(sum(row.members), cents(row.amount), id)
  }
  const text = buildBudgetText(profile), context = publicationContextFor(profile), image = imageEvidence.get(id)
  assert.doesNotMatch(text, forbidden, id)
  assert(context.questions.length >= 1 && context.questions.length <= 2, id)
  assert.equal(new Set(context.questions.map(entry => entry.text)).size, context.questions.length, id)
  for (const change of reviewed) {
    if (!closure) assert(text.includes(change.after), id)
    if (change.basis === 'assumption') assert.equal(profile.provenance.nature, 'editorial-character', id)
  }
  assert.equal(image.truncated.length, 0, id)
  assert(!image.labels.some(label => / · \d+$/u.test(label)), `${id}: libellé de secours`)
  const png = readFileSync(`${image.path}/${id}.png`)
  assert.equal(png.toString('ascii', 1, 4), 'PNG', id)
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1080, 1350], id)
  const result = closure ? 'Publiable · texte et copie identiques' : 'Relu · texte et copie identiques'
  const provenance = closure ? closure.scenario ? 'Données d’origine conservées. Hypothèses éditoriales distinctes.' : 'Données d’origine conservées. Donnée historique non disponible explicitée.' : ''
  const projection = closure?.scenario && projectBudgetScenario(closure.scenario, totals)
  const applied = projection?.rents?.map(({ rent, beforeLoan, afterLoan }) =>
    `Loyer ${rent} € : solde ${beforeLoan} € avant le prêt et ${afterLoan} € après le prêt.`).join(' ')
  const after = closure && [closure.budget.imageIncomeLabel, closure.reason, applied].filter(Boolean).join(' · ')
  lines.push(csv([id, profile.name, currency, profile.period || profile.budgetAsOf,
    budgetPublicPresentation(profile).basis, cash, expenses, available, transfers, balance, result,
    'Centimes et sous-totaux rapprochés', 'Un PNG 1080 × 1350 identique à l’aperçu',
    closure?.limits || 'Se reporter aux limites du relevé d’origine pour les postes et montants non renseignés.',
    [...reviewed.map(change => change.basis + ' ' + change.field), ...(closure ? ['clôture 2026-11-19'] : [])].join(' / '),
    digest(text), digest(png), provenance, prior[id], after]))
}
writeFileSync(out, lines.join('\n') + '\n')
console.log(`${BUDGET_PROFILES.length} relevés inchangés, relecture du texte, rapprochement image et ${Object.keys(prior).length} profils publiables après clôture.`)
