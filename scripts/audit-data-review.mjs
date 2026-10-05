import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { REVIEWED_PERFORMANCE_META } from '../src/data/instrument-performance-review.js'
import { AUTOMATED_PERFORMANCE } from '../src/data/automated-etf.js'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { buildReview, dayNumber, expiry, freshness, parisToday, addMonths, scheduledReview, reviewCalendar, summarizeCadences } from '../src/pages/data-review/lib.js'
import { OFFICIAL_SOURCES, SECONDARY_SOURCES } from '../src/pages/broker-comparator/evidence.js'

assert.equal(dayNumber('2026-02-30'), null)
assert.equal(dayNumber('date absente'), null)
assert.equal(parisToday(new Date('2026-09-30T22:30:00Z')), '2026-10-01')
assert.equal(expiry('2026-12-31', '2026-12-31'), 'ending', 'Offre encore valable le dernier jour')
assert.equal(expiry('2026-12-31', '2027-01-01'), 'expired')
assert.equal(expiry('2026-12-31', '2026-09-30'), 'scheduled')
assert.equal(freshness('2026-01-01', '2026-06-29'), 'soon')
assert.equal(freshness('2026-01-01', '2026-06-30'), 'stale')
assert.equal(freshness(null, '2026-09-30'), 'undated')
assert.equal(freshness('2026-10-01', '2026-09-30'), 'future-date')
const fixture = [{ id: 'history', name: 'Historique', consumers: [{ tool: 'Test' }], fields: [
  { label: 'Ancienne photographie', metadata: { asOf: '2010-01-01', checkedAt: '2026-09-29', sourceUrls: ['https://example.org'], sourceStatus: 'documented' } },
  { label: 'Archive', metadata: { sourceStatus: 'archive-unverifiable', sourceUrls: [] } },
  { label: 'Sans contrôle', metadata: { asOf: '2026-09-29', checkedAt: null, sourceUrls: ['https://example.org'], sourceStatus: 'documented' } },
] }]
const result = buildReview('2026-09-30', fixture, [], {}, {})
assert.equal(result.archives, 1)
assert.deepEqual(result.items.map(x => x.field), ['Sans contrôle'], 'Ni photographie ancienne ni archive ne devient une alerte de fraîcheur')
const separateSources = buildReview('2026-09-30', [], [{ id: 'test', nom: 'Test' }], { test: { frais: { status: 'confirmé', refs: [{ document: 'old' }, { document: 'new' }] } } }, { old: { title: 'Ancien contrôle', checked: '01/01/2026', url: 'https://example.org/old' }, new: { title: 'Récent', checked: '29/09/2026', url: 'https://example.org/new' } })
assert.equal(separateSources.items.length, 1, 'Un contrôle récent ne masque pas un autre contrôle ancien')
assert.equal(separateSources.items[0].field, 'Ancien contrôle')
for (const source of Object.values({ ...OFFICIAL_SOURCES, ...SECONDARY_SOURCES })) {
  if (source.reviewUntil) assert.notEqual(dayNumber(source.reviewUntil), null, 'Échéance enregistrée invalide')
}
const current = buildReview('2026-10-02')
assert.equal(current.items.filter(x => x.category === 'reserve').length, 9)
assert.equal(current.items.filter(x => x.until).length, 3, 'Les offres réutilisées dans plusieurs cellules sont dédoublonnées')
assert.equal(current.archives, 16)
assert.equal(new Set(current.items.map(x => x.id)).size, current.items.length)
assert(current.items.every(x => x.to.startsWith('/') && x.reason && x.name && x.field))
assert.equal(buildReview('2027-01-01').items.filter(x => x.category === 'expired').length, 3)
// Rejouer les observations de la revue, y compris les proxys conservés : le catalogue
// et les consommateurs doivent exposer les valeurs effectivement lues dans la source.
const closure = JSON.parse(readFileSync(new URL('./source-snapshots/data-review-2026-10-02.json', import.meta.url)))
for (const observation of closure.records) {
  const record = DATA_CATALOG.find(x => x.id === (observation.isin ?? observation.id))
  const reviewed = REVIEWED_PERFORMANCE_META[observation.isin]
  const historicalProxy = reviewed?.portfolioHistoryBasis === 'proxy'
  const field = record.fields.find(x => observation.type === 'index'
    ? x.value.asOf === observation.asOf
    : x.label === (observation.type === 'comparator' ? 'Rendements 2023–2025 du comparateur' : historicalProxy ? 'Historique de simulation 2020–2025' : 'Rendements 2020–2025'))
  assert(field, `Champ contrôlé absent : ${record.id}`)
  const automated = observation.type === 'portfolio' && !historicalProxy ? AUTOMATED_PERFORMANCE[observation.isin] : null
  assert.deepEqual(observation.type === 'index' ? field.value.constituents : field.value, automated?.values ?? observation.constituents ?? observation.values)
  if (automated) {
    assert.equal(field.metadata.checkedAt, automated.checkedAt)
    assert(field.metadata.checkedAt >= closure.checkedAt, `${record.id}: contrôle automatisé antérieur à la revue`)
    assert(field.metadata.sourceUrls.includes(automated.source), `${record.id}: source automatisée absente`)
  } else if (reviewed && !historicalProxy && observation.type === 'portfolio') {
    // Les mêmes années calendaires ont été recertifiées dans une publication plus récente.
    assert.equal(field.metadata.checkedAt, reviewed.checkedAt)
    assert(field.metadata.sourceUrls.includes(reviewed.source), `${record.id}: nouvelle source contrôlée absente`)
  } else {
    assert.equal(field.metadata.checkedAt, closure.checkedAt)
    assert(observation.sourceUrls.every(url => field.metadata.sourceUrls.includes(url)), `${record.id}: source contrôlée différente`)
  }
}
const remaining = buildReview(closure.checkedAt)
assert.equal(remaining.items.filter(x => x.category === 'undated').length, 4, 'Les quatre contrôles non résolus doivent rester visibles')
assert.equal(remaining.items.filter(x => x.category === 'reserve').length, 9, 'Aucune réserve courtier clôturée sans preuve explicite')
assert.equal(remaining.archives, 16, 'La recherche ne doit pas masquer un reliquat en archive')
console.log(`Revue au ${current.today} : ${current.items.length} éléments, 9 réserves, 3 échéances ; archives séparées : ${current.archives}. Cas limites de dates validés.`)
console.log(`Revue du ${closure.checkedAt} : ${closure.records.length} contrôles clôturés, 4 contrôles non datés et 9 réserves conservés.`)

assert.equal(addMonths('2026-01-31', 1), '2026-02-28')
assert.equal(addMonths('2027-11-30', 3), '2028-02-29')
const monthly = { registry: 'src/data/market-history.js', value: { points: [{ date: '2026-08', price: 1 }] } }
assert.equal(scheduledReview({ checkedAt: '2026-10-02' }, monthly, '2026-10-02').category, 'stale', 'Une consultation ne repousse pas un mois manquant')
monthly.value.points.push({ date: '2026-09', price: 2 })
assert.equal(scheduledReview({ checkedAt: '2026-10-02' }, monthly, '2026-10-02').nextReviewAt, '2026-11-01')
assert.equal(scheduledReview({ checkedAt: '2026-09-30' }, { registry: 'src/data/etf-ter.js' }, '2026-12-30').category, 'stale')
assert.equal(scheduledReview({ checkedAt: '2026-09-30' }, { registry: 'src/data/instrument-returns.js' }, '2026-10-02').nextReviewAt, '2027-01-01')
assert.equal(new Set(current.schedule.map(x => x.id)).size, current.schedule.length)
assert(current.schedule.every(x => x.nextReviewAt || x.category === 'undated'))
assert.equal(current.schedule.filter(x => x.id.startsWith('investor:')).length, 18)
assert(current.schedule.filter(x => x.id.startsWith('investor:')).every(x => x.nextReviewAt === '2026-11-14'))

const calendar = reviewCalendar(buildReview('2026-10-03'))
assert.equal(new Set(calendar.map(item => item.id)).size, calendar.length)
assert(calendar.every(item => item.cadence), 'Chaque contrôle possède la temporalité de sa règle')
const groups = summarizeCadences(calendar, '2026-10-03')
assert.equal(groups.reduce((sum, group) => sum + group.total, 0), calendar.length)
assert(groups.every(group => group.due === 0), 'Les contrôles de cette semaine sont pris en compte')
assert.equal(groups.find(group => group.id === 'monthly').nextReviewAt, '2026-11-01')
assert(groups.find(group => group.id === 'quarterly').types.includes('Portefeuilles trimestriels'))
assert.equal(calendar.filter(item => item.id.startsWith('investor:') && item.cadence === 'quarterly').length, 18)
assert.equal(groups.find(group => group.id === 'event').total, 3)
assert.equal(groups.find(group => group.id === 'annual').nextReviewAt, '2027-01-01')
const groupFixture = summarizeCadences([
  { cadence: 'monthly', nextReviewAt: '2026-09-01', category: 'stale', dataType: 'Cours mensuels' },
  { cadence: 'monthly', nextReviewAt: '2026-10-03', category: 'stale', dataType: 'Cours mensuels' },
  { cadence: 'monthly', nextReviewAt: '2026-11-01', category: 'soon', dataType: 'Cours mensuels' },
  { cadence: 'monthly', nextReviewAt: null, category: 'undated', dataType: 'Cours mensuels' },
  { cadence: 'monthly', nextReviewAt: '2026-10-04', category: 'future-date', dataType: 'Cours mensuels' },
], '2026-10-03')[0]
assert.deepEqual({ total: groupFixture.total, due: groupFixture.due, unplanned: groupFixture.unplanned, oldest: groupFixture.oldestDueAt, next: groupFixture.nextReviewAt }, { total: 5, due: 2, unplanned: 2, oldest: '2026-09-01', next: '2026-11-01' })
assert.throws(() => summarizeCadences([], '2026-02-30'), /Date de revue invalide/)
console.log('Temporalités : mensuel, trimestriel (dont 13F), semestriel, annuel et offres ; dates et compteurs dérivés du calendrier validés.')
