import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { BUDGET_BEFORE_COHERENCE, BUDGET_COHERENCE_REVIEW, BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, budgetExpenseColumns, budgetPublicExpenseRows, budgetTransferPlan, buildBudgetText, euro, publicationContextFor } from '../src/pages/budget-profiles/lib.js'
import { reviewBudget } from '../src/pages/budget-profiles/review.js'
import { planSocialBudget } from '../src/pages/budget-profiles/socialImage.js'

const parsed = process.argv.slice(2).flatMap(path =>
  JSON.parse(readFileSync(`${path}/layout.json`)).map(entry => [entry.id, { ...entry, path }]))
const images = new Map(parsed)
assert.equal(parsed.length, images.size)
assert.equal(images.size, BUDGET_PROFILES.length)
const previous = new Map(readFileSync('docs/budget-relecture-1390/matrice.csv', 'utf8').trim().split('\n').slice(1).map(line => {
  const cells = [...line.matchAll(/"((?:[^"]|"")*)"/g)].map(match => match[1].replaceAll('""', '"'))
  return [cells[0], { text: cells[15], png: cells[16] }]
}))
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const cents = value => Math.round(value * 100)
const total = rows => rows.reduce((sum, row) => sum + cents(row.amount), 0)
const csv = cells => cells.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')
const out = 'docs/budget-coherence-2026-11-19'
const savingsStatus = { paid: 'réalisés', planned: 'prévus', budgeted: 'inscrits au budget, exécution non établie' }
const select = {
  courses: /course|aliment|nourriture|cantine|\brepas\b|restaurants?/iu,
  vêtements: /vêtements?|habillement|chaussures?/iu,
  cadeaux: /cadeaux?|anniversaires?/iu,
}
const noteworthy = {
  'finary-cyber-24-2026-08-27': 'Durée et première échéance du prêt non confirmées. Les 40 € de transports restent une enveloppe sans détail de fréquence.',
  'reddit-actif-2026-09-27': 'Enveloppe commune logement, charges et courses. Aucun total distinct pour l’alimentation.',
  'reddit-famille-bourges-2026-07-12': 'Les courses à 150 € sont soutenues par l’épicerie solidaire. Pas de future mensualité de crédit établie.',
  'editorial-noemie-frontaliere-2026-11-15': 'Les courses à 200 € sont payées sur le compte. Les 200 € de titres-restaurant et le stock auto ne sont pas additionnés aux flux.',
  'editorial-roadmap-befire-first-home-2026-11-16': 'Les courses couvrent les achats débités. Montant des chèques-repas et encours de l’épargne-pension inconnus.',
  'editorial-solene-marin-2026-11-15': 'Les courses couvrent les achats à terre. Les repas à bord sont pris en charge.',
  'editorial-complementary-solo-2026-11-16': 'L’enveloppe établie par la rédaction pour les vêtements est de 420 € par an. La réserve de trois mois reste hypothétique.',
  'editorial-studio-alternance-allocation-2026-11-16': 'Les 250 € couvrent courses et carburant. Pas de ventilation précise entre les deux.',
  'mustachian-ingenieur-28-2025-08-16': 'Salaire et versements non isolables dans les chiffres en CHF qui incluent des encaissements exceptionnels.',
}
const columns = ['id', 'profil', 'devise', 'période', 'périmètre_et_foyer', 'courses_et_repas', 'vêtements', 'cadeaux',
  'autres_postes_contrôlés', 'contrainte_centimes', 'non_contrainte_centimes', 'total_centimes',
  'capacité_centimes', 'réalisé_centimes', 'prévu_centimes', 'inscrit_centimes', 'reste_centimes',
  'corrections_chiffrées', 'reformulations', 'points_à_confirmer', 'texte', 'image', 'texte_sha256', 'png_sha256']
const lines = [csv(columns)]
const edits = []
let textChanges = 0
let imageChanges = 0
let deficits = 0

for (const profile of BUDGET_PROFILES) {
  const id = profile.id, totals = analyzeBudget(profile), context = publicationContextFor(profile)
  const [fixed, flexible] = budgetExpenseColumns(profile)
  const plan = planSocialBudget(profile), transfers = budgetTransferPlan(profile)
  const cash = total(profile.income.filter(row => !row.inKind)), spend = total(profile.expenses), savings = total(profile.savings)
  assert.deepEqual([cash, spend, cash - spend, savings, cash - spend - savings], [totals.income, totals.expenses, totals.available, totals.savings, totals.balance].map(cents), id)
  assert.equal(total([fixed, flexible]), spend, id)
  assert.equal(total(plan.transferRows), savings, id)
  assert.equal(total(plan.expenses.flat()), spend, id)
  for (const row of [...plan.expenses.flatMap(side => side.flatMap(section => section.rows)), ...plan.transferRows]) {
    assert.equal(total(row.members), cents(row.amount), id)
  }
  const amounts = Object.keys(savingsStatus).map(status => total(transfers.rows.filter(row => row.status === status)))
  assert.equal(amounts.reduce((sum, amount) => sum + amount, 0), savings, id)
  assert.doesNotMatch(buildBudgetText(profile), /Versements mixtes|prévue? \(prévu|effectuée? \(effectué|provision prévue|budget (?:reconstitué|fictif)|profil adapté|sa part du budget/i, id)

  const text = buildBudgetText(profile), image = images.get(id), png = readFileSync(`${image.path}/${id}.png`)
  assert(context.questions.length >= 1 && context.questions.length <= 2, id)
  assert.equal(new Set(context.questions.map(question => question.text)).size, context.questions.length, id)
  assert.deepEqual([png.toString('ascii', 1, 4), png.readUInt32BE(16), png.readUInt32BE(20)], ['PNG', 1080, 1350], id)
  assert.equal(image.truncated.length, 0, id)
  assert(!image.labels.some(label => /^(?:Dépense|Versement|Placement|Épargne|Logement|Santé|Factures|Vêtements) \d(?: ·|$)/u.test(label)), `${id}: libellé générique de secours`)

  const textHash = digest(text), imageHash = digest(png)
  const textChanged = textHash !== previous.get(id).text, imageChanged = imageHash !== previous.get(id).png
  textChanges += Number(textChanged)
  imageChanges += Number(imageChanged)
  deficits += Number(totals.balance < 0)
  const review = BUDGET_COHERENCE_REVIEW[id]
  const old = BUDGET_BEFORE_COHERENCE.find(entry => entry.id === id)
  const before = analyzeBudget(old)
  const money = amount => euro(amount, profile.currency)
  const editedRows = profile.expenses.flatMap((row, i) =>
    row.amount === old.expenses[i].amount ? [] : [`${row.label} ${money(old.expenses[i].amount)} → ${money(row.amount)}`])
  if (editedRows.length) edits.push(id)
  const correction = editedRows.length ? [...editedRows, `Dépenses ${money(before.expenses)} → ${money(totals.expenses)}`,
    `Capacité ${money(before.available)} → ${money(totals.available)}`, `Reste ${money(before.balance)} → ${money(totals.balance)}`].join(' · ') : 'Montants conservés'
  const rows = budgetPublicExpenseRows(profile)
  const describe = pattern => rows.filter(row => pattern.test(row.label)).map(row =>
    `${row.label} ${money(row.amount)}/mois (${money(row.annualProvision?.amount ?? cents(row.amount * 12) / 100)}/an)`).join(' · ')
  const coverage = reviewBudget(profile).coverage
  const unknown = coverage.filter(area => area.status === 'unknown').map(area => area.label).join(', ')
  const remaining = [noteworthy[id], unknown && `Sans ligne ou preuve distincte : ${unknown}.`].filter(Boolean).join(' ')
  const changes = [review?.reason, transfers.planned && 'Reste affiché sous condition du plan.',
    imageChanged && 'Rendu rapproché du nouveau texte et des groupes.'].filter(Boolean).join(' ')
  lines.push(csv([id, profile.name, profile.currency || 'EUR', profile.period || profile.budgetAsOf, profile.household,
    ...Object.values(select).map(pattern => describe(pattern) || 'Pas de poste isolé'),
    coverage.map(area => `${area.label} · ${area.status}`).join(' / '),
    cents(fixed.amount), cents(flexible.amount), spend, cash - spend, ...amounts, cash - spend - savings,
    correction, changes, remaining || 'Aucun écart établi. Les enveloppes restent limitées à leur périmètre documenté.',
    textChanged ? 'Modifié · copie identique' : 'Relu · copie identique',
    imageChanged ? 'Modifié · un PNG 1080 × 1350 identique à l’aperçu' : 'Un PNG 1080 × 1350 identique à l’aperçu',
    textHash, imageHash]))
}
assert.deepEqual(edits, ['finary-cyber-24-2026-08-27'])
assert.equal(deficits, 12)
writeFileSync(`${out}/matrice.csv`, lines.join('\n') + '\n')
const adrien = BUDGET_PROFILES.find(profile => profile.id === edits[0])
writeFileSync(`${out}/adrien-apres.txt`, buildBudgetText(adrien) + '\n')
console.log(`101 profils vérifiés, ${textChanges} textes et ${imageChanges} PNG modifiés, ${deficits} déficits conservés.`)
