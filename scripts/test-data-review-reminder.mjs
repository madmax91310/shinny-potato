import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { buildReview } from '../src/pages/data-review/lib.js'
import { reminderCandidates, planReminders, syncReminders } from './data-review-reminder.mjs'

const record = (id, registry, checkedAt, value = {}) => ({ id, name: id, consumers: [{ tool: 'Test' }], fields: [{ label: 'Valeur', registry, value, metadata: { checkedAt, sourceUrls: ['https://example.org'], sourceStatus: 'documented' } }] })
const catalog = [
  record('monthly', 'src/data/market-history.js', '2026-10-02', { points: [{ date: '2026-09', price: 1 }] }),
  record('annual', 'src/data/instrument-returns.js', '2026-10-02'),
  record('quarterly', 'src/data/etf-ter.js', '2026-10-02'),
  record('six-monthly', 'src/data/instruments.js', '2026-10-02'),
  record('yearly', 'src/data/household-statistics.js', '2026-10-02'),
  record('undated', 'src/data/etf-ter.js', null),
  record('future', 'src/data/etf-ter.js', '2027-10-02'),
]
const archive = record('archive', 'src/data/etf-ter.js', '2020-01-01')
archive.fields[0].metadata.sourceStatus = 'archive-unverifiable'
catalog.push(archive)
const review = date => buildReview(date, catalog, [], {}, {})
assert.deepEqual(planReminders(review('2026-10-03')), [], 'La revue de cette semaine ne déclenche pas un nouveau rappel')
assert.equal(reminderCandidates(review('2026-10-24')).length, 0)
const first = reminderCandidates(review('2026-10-25'))
assert.deepEqual(first.map(x => x.id), ['data:monthly:0'], 'Entrée exacte dans la fenêtre de sept jours')
assert.equal(first[0].nextReviewAt, '2026-11-01')
assert.equal(reminderCandidates(review('2026-11-01')).length, 1, 'Le jour même est couvert')
assert.equal(reminderCandidates(review('2026-11-20')).length, 1, 'Un passage retardé retrouve une échéance échue')
const deadlines = review('2027-10-03').schedule
assert.equal(deadlines.find(x => x.id === 'data:annual:0').nextReviewAt, '2027-01-01')
assert.equal(deadlines.find(x => x.id === 'data:quarterly:0').nextReviewAt, '2027-01-02')
assert.equal(deadlines.find(x => x.id === 'data:six-monthly:0').nextReviewAt, '2027-04-02')
assert.equal(deadlines.find(x => x.id === 'data:yearly:0').nextReviewAt, '2027-10-02')
assert.equal(reminderCandidates(review('2027-10-03')).length, 5, 'Ni réserve, date future, champ sans date ni archive')

const offerReview = date => buildReview(date, [], [{ id: 'broker', nom: 'Courtier' }], { broker: { frais: { status: 'confirmé', refs: [{ document: 'offer' }, { document: 'offer' }] } } }, { offer: { title: 'Offre', checked: '01/10/2026', reviewUntil: '2026-10-20', url: 'https://example.org' } })
assert.equal(reminderCandidates(offerReview('2026-10-12')).length, 0)
assert.equal(reminderCandidates(offerReview('2026-10-13')).length, 1)
assert.equal(reminderCandidates(offerReview('2026-10-20')).length, 1)
assert.equal(reminderCandidates(offerReview('2026-10-21')).length, 1)

const real = buildReview('2026-10-03')
assert.deepEqual(planReminders(real), [], 'Catalogue réel audité cette semaine : aucun rappel prématuré')
assert.equal(real.schedule.filter(x => x.id.startsWith('investor:') && x.nextReviewAt === '2026-11-14').length, 3)
assert.equal(reminderCandidates(buildReview('2026-11-06')).filter(x => x.id.startsWith('investor:')).length, 0)
assert.equal(reminderCandidates(buildReview('2026-11-07')).filter(x => x.id.startsWith('investor:')).length, 3)

const planned = planReminders(review('2026-10-25'))
for (const state of ['open', 'closed']) assert.equal(planReminders(review('2026-11-20'), [{ state, body: planned[0].body }]).length, 0, `Déduplication d'une issue ${state}`)
assert.equal(planReminders(review('2026-10-25'), [{ pull_request: {}, body: planned[0].body }]).length, 1, 'Une PR ne vaut pas rappel')
assert.equal(planReminders(review('2026-10-25'), [{ title: planned[0].title, body: 'Autre sujet' }]).length, 1, 'Le titre seul ne clôture pas une échéance')
const updatedCatalog = structuredClone(catalog)
updatedCatalog[0].fields[0].value.points.push({ date: '2026-10', price: 2 })
const next = buildReview('2026-11-24', updatedCatalog, [], {}, {})
assert.equal(planReminders(next, [{ body: planned[0].body }]).length, 1, 'La prochaine échéance reste rappelable')
const newItem = { ...first[0], id: 'data:new:0' }
assert.deepEqual(planReminders({ ...review('2026-10-25'), schedule: [...first, newItem] }, [{ body: planned[0].body }])[0].keys, ['data%3Anew%3A0@2026-11-01'], 'Un nouveau champ à la même date reste rappelable')
const big = { ...review('2026-10-25'), schedule: Array.from({ length: 501 }, (_, i) => ({ ...first[0], id: `data:large:${i}`, name: 'é'.repeat(400), field: 'f'.repeat(400) })) }
const batches = planReminders(big)
assert.equal(batches.length, 11)
assert(batches.every(x => Buffer.byteLength(x.body) < 65000), 'Corps acceptés par GitHub')
assert.equal(planReminders(big, batches.map(x => ({ body: x.body }))).length, 0)

let calls = []
const pages = [Array.from({ length: 100 }, () => ({ body: 'Autre issue' })), [{ state: 'closed', body: planned[0].body }]]
assert.deepEqual(syncReminders(review('2026-10-25'), 'owner/repo', args => { calls.push(args); return pages }), [])
assert(calls[0].includes('--paginate') && calls[0].includes('--slurp'))
calls = []
const fakeApi = (args, input) => { calls.push({ args, input }); return args.includes('GET') ? [[]] : { number: 1 } }
assert.equal(syncReminders(review('2026-10-25'), 'owner/repo', fakeApi).length, 1)
assert.equal(JSON.parse(calls[1].input).body, planned[0].body)
assert.equal(calls.length, 2)
assert.throws(() => syncReminders(review('2026-10-25'), 'owner/repo', () => { throw new Error('GitHub indisponible') }), /GitHub indisponible/, 'Pas de création si la lecture échoue')
assert.deepEqual(syncReminders(real, 'owner/repo', () => { throw new Error('Aucun accès attendu') }), [])
const invalid = spawnSync(process.execPath, ['scripts/data-review-reminder.mjs', '--json', '2026-02-30'])
assert.notEqual(invalid.status, 0)
const cli = spawnSync(process.execPath, ['scripts/data-review-reminder.mjs', '--json', '2026-10-03'], { encoding: 'utf8' })
assert.equal(cli.status, 0)
assert.deepEqual(JSON.parse(cli.stdout), [])
const workflow = readFileSync('.github/workflows/review-freshness.yml', 'utf8')
assert(workflow.includes('cancel-in-progress: false') && workflow.includes('continue-on-error: true') && workflow.includes('--sync'))
assert(!workflow.includes('180 jours') && !workflow.includes('check-freshness.mjs'))
console.log('Rappels : calendrier partagé, fenêtre de 7 jours, audit récent, offres/13F, échéances dépassées, pagination, déduplication ouverte/fermée, nouveaux champs, lots et erreurs GitHub validés.')
