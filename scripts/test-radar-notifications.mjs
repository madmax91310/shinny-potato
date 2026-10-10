import assert from 'node:assert/strict'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { notificationState, notifyRadar } from './lib/radar-notifications.mjs'

const repo = 'madmax91310/shinny-potato', now = new Date('2026-10-09T15:00:00Z')
const row = { family: 'indices', entity: 'russell-1000', label: 'Russell 1000', field: 'sectors:Tech', fieldLabel: 'Poids de la technologie', value: 30, threshold: 2, unit: '%', scope: 'Indice Russell 1000', period: '2026-09-30', checkedAt: now.toISOString(), sourceUrl: 'https://www.lseg.com/index-factsheet', tool: '/tweets-factsheets' }
const initial = advanceRadar(null, [row], { now })
const changed = advanceRadar(initial.state, [{ ...row, value: 32, period: '2026-10-08' }], { now })
const event = changed.newEvents[0]
const ledger = notificationState(initial.state, null, now)
function mock({ issues = [], failPost = false, assigned = true, hasIssues = true, pages = null } = {}) {
  const calls = [], created = []
  const api = async (path, method = 'GET', body) => {
    calls.push({ path, method, body })
    if (path.startsWith('issues?')) return pages ? pages[Number(new URLSearchParams(path.split('?')[1]).get('page')) - 1] ?? [] : [...issues, ...created]
    if (path === '') return { has_issues: hasIssues }
    if (path === 'assignees/madmax91310') return null
    if (path.match(/^issues\/\d+\/assignees$/)) return { assignees: [{ login: 'madmax91310' }] }
    if (path === 'issues' && method === 'POST') {
      if (failPost) throw new Error('HTTP 503')
      const issue = { number: created.length + 1, html_url: 'https://github.com/example/issue/1', body: body.body, user: { login: 'github-actions[bot]' }, assignees: assigned ? [{ login: 'madmax91310' }] : [] }
      created.push(issue); return issue
    }
    throw new Error(`Unexpected API call: ${path}`)
  }
  return { api, calls, created }
}
const send = (events, state, server) => notifyRadar({ events, ledger: state, api: server.api, repo })
{
  const conflicting = { ...event, family: 'etf', field: 'countries:United States', beforePeriod: event.period }
  const server = mock()
  assert.equal((await send([conflicting], ledger, server)).sent, 0, 'Ancienne alerte à période identique jamais retentée')
  assert.equal(server.calls.length, 0)
  assert.equal((await send([{ ...event, status: 'source-conflict' }], ledger, server)).sent, 0)
  assert.equal((await send([conflicting, event, event], ledger, server)).sent, 1, 'Signal valide dédupliqué et conservé dans un lot mixte')
}

// Bootstrap and harmless revalidation cannot even contact GitHub Issues.
for (const events of [initial.newEvents, advanceRadar(initial.state, [{ ...row, checkedAt: '2026-10-09', period: '2026-10-09' }], { now }).newEvents, advanceRadar(initial.state, [{ ...row, value: 31.9 }], { now }).newEvents]) {
  const server = mock(); assert.equal((await send(events, ledger, server)).sent, 0); assert.equal(server.calls.length, 0)
}
const rollout = notificationState(changed.state, null, now)
assert.equal((await send(changed.state.events, rollout, mock())).sent, 0, 'Ancien historique silencieux au déploiement')
assert.throws(() => notificationState(initial.state, { schemaVersion: 1, acknowledged: [123] }), /invalide/)
assert.throws(() => notificationState(initial.state, { schemaVersion: 2, acknowledged: [] }), /invalide/)

// One issue groups every new event, with assignment, mention and evidence.
const second = { ...event, id: 'b'.repeat(24), title: 'Autre indice', previousSourceUrl: 'https://www.lseg.com/previous' }
const server = mock(), result = await send([event, second, event], ledger, server)
assert.equal(result.sent, 2); assert.equal(server.created.length, 1)
const posted = server.calls.find(call => call.method === 'POST')
assert.deepEqual(posted.body.assignees, ['madmax91310'])
for (const pattern of [/@madmax91310/, /30 %/, /32 %/, /2026-09-30/, /2026-10-08/, /2026-10-09T15:00:00.000Z/, /https:\/\/www.lseg.com\/index-factsheet/, /https:\/\/www.lseg.com\/previous/, /shinny-potato\/tweets-factsheets/, /editorial-radar-event:/]) assert.match(posted.body.body, pattern)
const repeated = mock(); assert.equal((await send([event, second], result.ledger, repeated)).sent, 0); assert.equal(repeated.calls.length, 0)
assert.deepEqual(ledger.acknowledged, [], 'Le registre précédent reste intact')

// Failed sends remain pending even if the next run has no newEvents.
await assert.rejects(send(changed.state.events, ledger, mock({ failPost: true })), /503/)
const unchanged = advanceRadar(changed.state, [{ ...row, value: 32, period: '2026-10-08' }], { now })
assert.equal(unchanged.newEvents.length, 0)
assert.equal((await send(unchanged.state.events, ledger, mock())).sent, 1)

// Crash after issue creation / before ledger commit: recover its receipt,
// even when the issue has been closed. Never send a duplicate issue.
const recovered = mock({ issues: [{ ...server.created[0], state: 'closed' }] })
const recoveredResult = await send([event, second], ledger, recovered)
assert.equal(recoveredResult.sent, 0); assert.equal(recoveredResult.recovered, 2); assert.equal(recovered.created.length, 0)
const page1 = Array.from({ length: 100 }, (_, i) => ({ number: i + 100, user: { login: 'github-actions[bot]' }, body: '' }))
const paginated = mock({ pages: [page1, [server.created[0]]] })
assert.equal((await send([event], ledger, paginated)).recovered, 1)
assert.equal(paginated.calls.filter(call => call.path.startsWith('issues?')).length, 2)
for (const fake of [{ ...server.created[0], user: { login: 'somebody' } }, { ...server.created[0], pull_request: {} }]) assert.equal((await send([event], ledger, mock({ issues: [fake] }))).sent, 1)

// Assignment failures are visible and repairable without a duplicate issue.
const noAssignment = mock({ assigned: false })
await assert.rejects(send([event], ledger, noAssignment), /sans attribution/)
const repair = mock({ issues: noAssignment.created })
assert.equal((await send([event], ledger, repair)).recovered, 1)
assert.ok(repair.calls.some(call => call.path === 'issues/1/assignees'))
await assert.rejects(send([event], ledger, mock({ hasIssues: false })), /activées/)
await assert.rejects(send([event], ledger, { api: async () => { throw new Error('HTTP 403') } }), /403/)

// Complete object values, safe links, no mentions injected by source text.
const object = { ...event, after: { positions: Array.from({ length: 20 }, (_, i) => ({ ticker: `STOCK${i}` })) }, title: 'Titre @intruder <script>' }
const objectServer = mock(); await send([object], ledger, objectServer)
assert.match(objectServer.created[0].body, /STOCK19/)
assert.doesNotMatch(objectServer.created[0].body, /@intruder|<script>/)
const invalid = mock()
await assert.rejects(send([event, { ...second, sourceUrl: 'javascript:alert(1)' }], ledger, invalid), /HTTPS/)
assert.equal(invalid.created.length, 0)
// Very large batches are split to respect the GitHub issue body limit.
const many = Array.from({ length: 100 }, (_, i) => ({ ...event, id: i.toString(16).padStart(24, '0'), angle: 'Texte '.repeat(100) }))
const large = mock(); assert.equal((await send(many, ledger, large)).sent, 100)
assert.ok(large.created.length > 1)
for (const issue of large.created) assert.ok(Buffer.byteLength(issue.body) <= 55000)
console.log('Notifications radar : silence initial, seuils, regroupement, preuves, attribution, reprise, pagination, issues fermées et déduplication vérifiés.')
