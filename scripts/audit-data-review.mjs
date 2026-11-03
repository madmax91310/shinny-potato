import { INVESTORS } from "../src/pages/investor-portfolio/data.js"
import practicalReferences from '../src/data/automated-practical-sheets.json' with {type:'json'}
import assert from 'node:assert/strict'
import { assertReviewObservation } from './lib/data-review-observation.mjs'
import { readFileSync } from 'node:fs'
import { REVIEWED_PERFORMANCE_META } from '../src/data/instrument-performance-review.js'
import { HISTORICAL_AUTOMATED_PERFORMANCE as AUTOMATED_PERFORMANCE } from '../src/data/automated-etf.js'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { INDEX_RETURNS, getCurrentIndexReturnSeries } from '../src/data/index-returns.js'
import { buildReview, dayNumber, expiry, freshness, parisToday, addMonths, scheduledReview, reviewCalendar, summarizeCadences } from '../src/pages/data-review/lib.js'
import { BROKER_EVIDENCE, EVIDENCE_FIELDS, OFFICIAL_SOURCES, SECONDARY_SOURCES } from '../src/pages/broker-comparator/evidence.js'
import { BROKER_TARIFFS } from '../src/data/broker-tariffs.js'

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
// Stable examples exercise deduplication and expiry without freezing the live offer roster.
const offerSources = {
  shared: { title: 'Offre commune', checked: '01/10/2026', reviewUntil: '2026-10-10', url: 'https://example.org/shared' },
  later: { title: 'Offre suivante', checked: '01/10/2026', reviewUntil: '2026-12-31', url: 'https://example.org/later' },
  added: { title: 'Nouvelle offre', checked: '01/10/2026', reviewUntil: '2027-03-31', url: 'https://example.org/added' },
}
const offerBrokers = [{ id: 'a', nom: 'A' }, { id: 'b', nom: 'B' }]
const offerEvidence = {
  a: {
    frais: { status: 'confirmé', refs: [{ document: 'shared' }, { document: 'shared' }] },
    dca: { status: 'confirmé', refs: [{ document: 'shared' }] },
    transfert: { status: 'confirmé', refs: [{ document: 'later' }] },
  },
  b: { frais: { status: 'confirmé', refs: [{ document: 'shared' }] } },
}
const offerRows = (date, evidence = offerEvidence) => buildReview(date, [], offerBrokers, evidence, offerSources).items.filter(item => item.until)
assert.deepEqual(offerRows('2026-10-02').map(item => item.id).sort(), ['offer:a:later', 'offer:a:shared', 'offer:b:shared'], 'Une offre réutilisée dans plusieurs cellules est unique par courtier')
const expandedOffers = structuredClone(offerEvidence)
expandedOffers.a.transfert.refs.push({ document: 'added' })
assert.equal(offerRows('2026-10-02', expandedOffers).length, 4, 'Une nouvelle offre conserve les anciennes échéances')
const expiredOffers = offerRows('2027-01-01', expandedOffers)
assert.equal(expiredOffers.filter(item => item.category === 'expired').length, 3)
assert.equal(expiredOffers.find(item => item.id === 'offer:a:added').category, 'scheduled')
for (const source of Object.values({ ...OFFICIAL_SOURCES, ...SECONDARY_SOURCES })) {
  if (source.reviewUntil) assert.notEqual(dayNumber(source.reviewUntil), null, 'Échéance enregistrée invalide')
}
const current = buildReview('2026-10-02')
const expectedReserves = Object.entries(BROKER_EVIDENCE).flatMap(([id, fields]) => EVIDENCE_FIELDS.flatMap(([key]) => {
  const item = fields[key]
  return item && !(item.status === 'non établi' && /sans objet/i.test(item.summary)) && (item.status !== 'confirmé' || item.review?.outcome === 'unresolved') ? [`broker:${id}:${key}`] : []
})).concat(DATA_CATALOG.flatMap(record=>record.fields.flatMap((field,index)=>field.qualificationMissing ? [`qualification:${record.id}:${index}`] : []))).concat(Object.entries(practicalReferences.sources).filter(([,source])=>source.status==='error'||source.reviewRequired).map(([key])=>`practical-source:${key}`)).sort()
assert.deepEqual(current.items.filter(x => x.category === 'reserve').map(x => x.id).sort(), expectedReserves)
assert(current.items.some(x => x.id === 'broker:tr:garde' && x.category === 'reserve'), 'La gratuité du CTO ne clôture pas la réserve de garde PEA')
const datedOffers = Object.values(BROKER_TARIFFS).flatMap(broker => Object.values(broker.fields ?? {}).filter(field => field.until));
const offerKeys = records => [...new Set(records.map(record => `${record.sourceUrl}|${record.until}`))].sort();
assert.deepEqual(current.items.filter(x => x.until).map(x => `${x.urls[0]}|${x.until}`).sort(), offerKeys(datedOffers), 'Chaque offre du registre figure une seule fois, même réutilisée dans plusieurs cellules')
assert.equal(current.archives, 19, '16 photographies d’indices et 3 relevés QYLD explicitement archivés')
assert.equal(new Set(current.items.map(x => x.id)).size, current.items.length)
assert(current.items.every(x => x.to.startsWith('/') && x.reason && x.name && x.field))
assert.equal(buildReview('2027-01-01').items.filter(x => x.category === 'expired').length, offerKeys(datedOffers.filter(offer => offer.until < '2027-01-01')).length)
// Rejouer les observations de la revue, y compris les proxys conservés : le catalogue
// et les consommateurs doivent exposer les valeurs effectivement lues dans la source.
const closure = JSON.parse(readFileSync(new URL('./source-snapshots/data-review-2026-10-02.json', import.meta.url)))
for (const observation of closure.records) {
  const record = DATA_CATALOG.find(x => x.id === (observation.isin ?? observation.id))
  const reviewed = REVIEWED_PERFORMANCE_META[observation.isin]
  const historicalProxy = reviewed?.portfolioHistoryBasis === 'proxy' && !AUTOMATED_PERFORMANCE[observation.isin]?.values.some(Number.isFinite)
  const field = record.fields.find(x => observation.type === 'index'
    ? x.value.asOf === observation.asOf
    : x.label === (observation.type === 'comparator' ? 'Rendements 2023–2025 du comparateur' : historicalProxy ? 'Historique de simulation 2020–2025' : 'Rendements 2020–2025'))
  assert(field, `Champ contrôlé absent : ${record.id}`)
  assertReviewObservation({ recordId: record.id, field, observation, closureCheckedAt: closure.checkedAt,
    automated: observation.type === 'portfolio' && !historicalProxy ? AUTOMATED_PERFORMANCE[observation.isin] : null,
    reviewed: reviewed && !historicalProxy && observation.type === 'portfolio' ? reviewed : null,
  })
}
const remaining = buildReview(closure.checkedAt)
// Validate every undated field, rather than freezing the pre-migration list of
// index IDs. A new return convention must not hide an older undated control.
const expectedUndated = DATA_CATALOG.flatMap(record => record.consumers.length
  ? record.fields.flatMap((field, index) => field.metadata.sourceStatus !== 'archive-unverifiable' && dayNumber(field.metadata.checkedAt) === null ? [`data:${record.id}:${index}`] : [])
  : []).sort()
assert.deepEqual(remaining.items.filter(x => x.category === 'undated').map(x => x.id).sort(), expectedUndated, 'Chaque champ actif sans contrôle daté reste visible, quelle que soit sa convention de rendement')
for (const id of ['acwi', 'topix', 'world']) assert(remaining.items.some(x => x.category === 'undated' && x.maintenanceRecord.id === id), `Ancien contrôle non daté masqué : ${id}`)
for (const id of ['stoxx600', 'eurostoxx50']) {
  const price = INDEX_RETURNS[id]['2026-08-31']
  const net = INDEX_RETURNS[id]['2026-10-09']
  assert.match(price.metadata.method, /hors dividendes/)
  assert.equal(net.variant, 'NET')
  assert.match(net.metadata.method, /dividendes nets réinvestis/)
  assert.notDeepEqual(price.values, net.values, 'Les observations Price et NET restent distinctes')
  assert.notEqual(price.metadata.checkedAt, net.metadata.checkedAt, 'La migration NET ne redâte pas le contrôle Price')
  assert.notDeepEqual(getCurrentIndexReturnSeries(id, '2026-08-31').values, getCurrentIndexReturnSeries(id, '2026-10-09').values, 'Aucune substitution entre conventions Price et NET')
  const record = structuredClone(DATA_CATALOG.find(x => x.id === id))
  record.fields = record.fields.filter(x => x.registry.endsWith('/index-returns.js'))
  const old = record.fields.find(x => /hors dividendes/.test(x.metadata.method))
  old.metadata.checkedAt = null
  const migrated = buildReview('2026-10-11', [record], [], {}, {})
  assert.deepEqual(migrated.items.filter(x => x.category === 'undated').map(x => x.field), [old.label], 'Une preuve NET datée ne clôture pas un ancien contrôle Price non daté')
  assert.equal(migrated.schedule.find(x => x.metadata.method === net.metadata.method).category, 'current')
}
assert.deepEqual(remaining.items.filter(x => x.category === 'reserve').map(x => x.id).sort(), expectedReserves, 'Toutes les preuves non résolues restent visibles')
assert.equal(remaining.archives, 19, 'La recherche ne doit pas masquer un reliquat en archive')
console.log(`Revue au ${current.today} : ${current.items.length} éléments, ${expectedReserves.length} réserves, ${offerKeys(datedOffers).length} échéances ; archives séparées : ${current.archives}. Cas limites de dates validés.`)
console.log(`Revue du ${closure.checkedAt} : ${closure.records.length} contrôles clôturés, ${expectedUndated.length} contrôles non datés et ${expectedReserves.length} réserves conservés ; conventions Price/NET séparées.`)

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
assert.equal(current.schedule.filter(x => x.id.startsWith('investor:')).length, INVESTORS.length)
for(const row of current.schedule.filter(x=>x.id.startsWith('investor:'))){
  const year=Number(row.metadata.asOf.slice(0,4)),quarter=row.metadata.asOf.slice(5)
  const deadlines={'03-31':`${year}-08-14`,'06-30':`${year}-11-14`,'09-30':`${year+1}-02-14`,'12-31':`${year+1}-05-15`}
  assert(Object.hasOwn(deadlines,quarter),'Le trimestre source doit être explicite')
  assert.equal(row.nextReviewAt,deadlines[quarter],row.id+' : échéance du trimestre réellement enregistré')
}

// Exercise calendar boundaries against a fixed publication fixture. Live gold and
// issuer controls can legitimately advance beyond this historical test date.
const calendarCatalog = [
  { id: 'calendar:monthly', name: 'Mois publié', consumers: [{tool:'Test'}], fields: [{registry: 'src/data/market-history.js',value:{points:[{date:'2026-09',price:2}]},label: 'Niveau mensuel', metadata: { checkedAt: '2026-10-02', sourceStatus: 'documented',sourceUrls:['https://issuer.test/monthly'] } }] },
  { id: 'calendar:annual', name: 'Année publiée', consumers: [{tool:'Test'}], fields: [{registry:'src/data/instrument-returns.js',label: 'Performance annuelle', metadata: { checkedAt: '2026-10-02', sourceStatus: 'documented',sourceUrls:['https://issuer.test/annual'] } }] },
]
const fixedGroups = summarizeCadences(reviewCalendar(buildReview('2026-10-03', calendarCatalog)), '2026-10-03')
const calendar = reviewCalendar(buildReview('2026-10-03'))
assert.equal(new Set(calendar.map(item => item.id)).size, calendar.length)
assert(calendar.every(item => item.cadence), 'Chaque contrôle possède la temporalité de sa règle')
const groups = summarizeCadences(calendar, '2026-10-03')
assert.equal(groups.reduce((sum, group) => sum + group.total, 0), calendar.length)
assert(groups.every(group => group.due === 0), 'Les contrôles de cette semaine sont pris en compte')
assert.equal(fixedGroups.find(group => group.id === 'monthly').nextReviewAt, '2026-11-01')
assert(groups.find(group => group.id === 'quarterly').types.includes('Portefeuilles trimestriels'))
assert.equal(calendar.filter(item => item.id.startsWith('investor:') && item.cadence === 'quarterly').length, INVESTORS.length)
assert.equal(groups.find(group => group.id === 'event').total, offerKeys(datedOffers).length)
assert.equal(fixedGroups.find(group => group.id === 'annual').nextReviewAt, '2027-01-01')

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
