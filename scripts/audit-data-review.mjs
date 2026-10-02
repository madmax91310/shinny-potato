import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { buildReview, dayNumber, expiry, freshness, parisToday } from '../src/pages/data-review/lib.js'
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
  const field = record.fields.find(x => observation.type === 'index'
    ? x.value.asOf === observation.asOf
    : x.label === (observation.type === 'comparator' ? 'Rendements 2023–2025 du comparateur' : 'Rendements 2020–2025'))
  assert(field, `Champ contrôlé absent : ${record.id}`)
  assert.deepEqual(observation.type === 'index' ? field.value.constituents : field.value, observation.constituents ?? observation.values)
  assert.equal(field.metadata.checkedAt, closure.checkedAt)
  assert(observation.sourceUrls.every(url => field.metadata.sourceUrls.includes(url)), `${record.id}: source contrôlée différente`)
}
const remaining = buildReview(closure.checkedAt)
assert.equal(remaining.items.filter(x => x.category === 'undated').length, 4, 'Les quatre contrôles non résolus doivent rester visibles')
assert.equal(remaining.items.filter(x => x.category === 'reserve').length, 9, 'Aucune réserve courtier clôturée sans preuve explicite')
assert.equal(remaining.archives, 16, 'La recherche ne doit pas masquer un reliquat en archive')
console.log(`Revue au ${current.today} : ${current.items.length} éléments, 9 réserves, 3 échéances ; archives séparées : ${current.archives}. Cas limites de dates validés.`)
console.log(`Revue du ${closure.checkedAt} : ${closure.records.length} contrôles clôturés, 4 contrôles non datés et 9 réserves conservés.`)
