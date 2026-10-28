import assert from 'node:assert/strict'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { notificationState, notifyRadar, recentSignals, TRACKER_MARKER, RECENT_DAYS } from './lib/radar-notifications.mjs'

const repo = 'madmax91310/shinny-potato', now = new Date('2026-10-09T15:00:00Z')
const row = { family: 'indices', entity: 'russell-1000', label: 'Russell 1000', field: 'sectors:Tech', fieldLabel: 'Poids de la technologie', value: 30, threshold: 2, unit: '%', scope: 'Indice Russell 1000', period: '2026-09-30', checkedAt: '2026-10-08', publishedAt:'2026-10-08',sourceUrl: 'https://www.lseg.com/index-factsheet', tool: '/tweets-factsheets' }
const initial = advanceRadar(null, [row], { now })
const changed = advanceRadar(initial.state, [{ ...row, value: 45, period: '2026-10-08' }], { now })
// A structural 15-point move exercises delivery. Ordinary 5-point drift stays secondary.
assert.equal((await notifyRadar({events:advanceRadar(initial.state,[{...row,value:35,period:'2026-10-08'}],{now}).newEvents,ledger:{schemaVersion:1,editorialVersion:3,acknowledged:[]},api:async()=>{throw Error('Ordinary drift must not call GitHub')},repo,now})).sent,0)
const event = changed.newEvents[0]
const ledger = notificationState(initial.state, null, now)
const bot = { login: 'github-actions[bot]' }
function mock({ issues = [], failPost = false, assigned = true, hasIssues = true, pages = null, comments = {} } = {}) {
  const calls = [], created = [], posted = {}, patched = []
  const all = () => [...issues, ...created]
  const api = async (path, method = 'GET', body) => {
    calls.push({ path, method, body })
    if (path.startsWith('issues?')) return pages ? pages[Number(new URLSearchParams(path.split('?')[1]).get('page')) - 1] ?? [] : all()
    const thread = path.match(/^issues\/(\d+)\/comments/)
    if (thread && method === 'GET') return [...(comments[thread[1]] ?? []), ...(posted[thread[1]] ?? [])]
    if (thread && method === 'POST') {
      if (failPost) throw new Error('HTTP 503')
      ;(posted[thread[1]] ??= []).push({ body: body.body, user: bot })
      return posted[thread[1]].at(-1)
    }
    if (path === '') return { has_issues: hasIssues }
    if (path === 'assignees/madmax91310') return null
    if (path.match(/^issues\/\d+\/assignees$/)) return { assignees: [{ login: 'madmax91310' }] }
    if (path === 'issues' && method === 'POST') {
      if (failPost) throw new Error('HTTP 503')
      const issue = { number: all().length + 1, html_url: `https://github.com/example/issue/${all().length + 1}`, body: body.body, title: body.title, state: 'open', user: bot, assignees: assigned ? [{ login: 'madmax91310' }] : [] }
      created.push(issue); return issue
    }
    const single = path.match(/^issues\/(\d+)$/)
    if (single && method === 'PATCH') {
      const issue = all().find(candidate => candidate.number === Number(single[1]))
      Object.assign(issue, body); patched.push({ number: issue.number, ...body }); return issue
    }
    throw new Error(`Unexpected API call: ${path}`)
  }
  return { api, calls, created, posted, patched, tracker: () => all().find(issue => issue.body?.includes(TRACKER_MARKER)) }
}
const send = (events, state, server, options = {}) => notifyRadar({ events, ledger: state, api: server.api, repo, now, ...options })
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

// One tracked issue: new events are announced in a single comment, the body lists the recent signals.
const second = { ...event, id: 'b'.repeat(24), title: 'Autre indice', previousSourceUrl: 'https://www.lseg.com/previous' }
const server = mock(), result = await send([event, second, event], ledger, server)
assert.equal(result.sent, 2); assert.equal(server.created.length, 1)
const tracker = server.created[0]
assert.deepEqual(server.calls.find(call => call.path === 'issues' && call.method === 'POST').body.assignees, ['madmax91310'])
assert.match(tracker.title, /2 signaux récents/)
assert.ok(tracker.body.includes(TRACKER_MARKER))
for (const pattern of [/Russell 1000/, /Autre indice/, /editorial-radar-event:/, /radar-data\/state\.json/]) assert.match(tracker.body, pattern)
assert.equal(server.posted[1].length, 1, 'Un seul commentaire pour le lot')
const announcement = server.posted[1][0].body
for (const pattern of [/@madmax91310/, /30 %/, /45 %/, /2026-09-30/, /2026-10-08/, /https:\/\/www.lseg.com\/index-factsheet/, /editorial-radar-event:/]) assert.match(announcement, pattern)
const repeated = mock(); assert.equal((await send([event, second], result.ledger, repeated)).sent, 0); assert.equal(repeated.calls.length, 0)
assert.deepEqual(ledger.acknowledged, [], 'Le registre précédent reste intact')

// Failed sends remain pending even if the next run has no newEvents.
await assert.rejects(send(changed.state.events, ledger, mock({ failPost: true })), /503/)
const unchanged = advanceRadar(changed.state, [{ ...row, value: 45, period: '2026-10-08' }], { now })
assert.equal(unchanged.newEvents.length, 0)
assert.equal((await send(unchanged.state.events, ledger, mock())).sent, 1)

// Crash after notification / before ledger commit: recover receipts from earlier
// per-batch issues (even closed), from the tracked issue body and from its comments.
const legacyIssue = { number: 7, state: 'closed', user: bot, assignees: [{ login: 'madmax91310' }], title: 'Radar éditorial : 2 nouveaux signaux · 2026-10-09 · abc', body: `<!-- editorial-radar-event:${event.id} -->\n<!-- editorial-radar-event:${second.id} -->` }
const recovered = mock({ issues: [legacyIssue] })
const recoveredResult = await send([event, second], ledger, recovered)
assert.equal(recoveredResult.sent, 0); assert.equal(recoveredResult.recovered, 2)
assert.equal(Object.keys(recovered.posted).length, 0, 'Aucun commentaire : signaux déjà notifiés')
assert.equal(recovered.created.length, 1, 'L’issue suivie est créée pour lister les signaux récents')
const fromTracker = mock({ issues: [tracker], comments: { [tracker.number]: server.posted[1] } })
assert.equal((await send([event, second], ledger, fromTracker)).recovered, 2)
assert.equal(fromTracker.created.length, 0)
assert.equal(Object.keys(fromTracker.posted).length, 0)
const page1 = Array.from({ length: 100 }, (_, i) => ({ number: i + 100, user: bot, body: '' }))
const paginated = mock({ pages: [page1, [legacyIssue]] })
assert.equal((await send([event], ledger, paginated)).recovered, 1)
assert.equal(paginated.calls.filter(call => call.path.startsWith('issues?')).length, 2)
for (const fake of [{ ...legacyIssue, user: { login: 'somebody' } }, { ...legacyIssue, pull_request: {} }]) assert.equal((await send([event], ledger, mock({ issues: [fake] }))).sent, 1)

// Assignment failures are visible and repairable without a duplicate issue.
const noAssignment = mock({ assigned: false })
await assert.rejects(send([event], ledger, noAssignment), /sans attribution/)
const repair = mock({ issues: noAssignment.created })
assert.equal((await send([event], ledger, repair)).sent, 1, 'A tracker description is not a delivery receipt; failed assignment retries the comment')
assert.ok(repair.calls.some(call => call.path === 'issues/1/assignees'))
assert.equal(repair.created.length, 0)
await assert.rejects(send([event], ledger, mock({ hasIssues: false })), /activées/)
await assert.rejects(send([event], ledger, { api: async () => { throw new Error('HTTP 403') } }), /403/)

// Non-actionable large objects remain archived; a valid title is escaped.
const object = { ...event, after: { positions: Array.from({ length: 20 }, (_, i) => ({ ticker: `STOCK${i}` })) }, title: 'Titre @intruder <script>' }
assert.equal((await send([object],ledger,mock())).sent,0)
assert.equal(object.after.positions.length,20)
const objectServer=mock();await send([{...event,title:object.title}],ledger,objectServer)
assert.doesNotMatch(objectServer.posted[1][0].body, /@intruder|<script>/)
assert.doesNotMatch(objectServer.created[0].body, /@intruder|<script>/)
const invalid = mock()
assert.equal((await send([event,{...second,sourceUrl:'javascript:alert(1)'}],ledger,invalid)).sent,1,'An invalid proof never becomes notifiable; the independent valid fact still sends')
assert.doesNotMatch(invalid.posted[1][0].body,/javascript:/)
// Very large batches are split into several comments; the body stays bounded.
const many = Array.from({ length: 100 }, (_, i) => ({ ...event, id: i.toString(16).padStart(24, '0'), angle: 'Texte '.repeat(100) }))
const large = mock(); assert.equal((await send(many, ledger, large)).sent, 100)
assert.equal(large.posted[1].length,1,'One event with many facts produces one compact announcement')
for (const comment of large.posted[1]) assert.ok(Buffer.byteLength(comment.body) <= 55000)
assert.ok(Buffer.byteLength(large.created[0].body) <= 60000)
assert.equal(new Set(large.created[0].body.match(/editorial-radar-event:[a-f0-9]{24}/g)).size, 100, 'Chaque signal notifié laisse un accusé dans la description')
console.log('Notifications radar : silence initial, seuils, issue suivie, preuves, attribution, reprise, pagination, issues fermées et déduplication vérifiés.')

// A complete 13F portfolio can exceed GitHub's body limit on its own.
const huge = { ...event, after: { positions: Array.from({ length: 3000 }, (_, i) => ({ ticker: `STOCK${i}`, value: 123456789 })) } }
const hugeServer = mock(), revision = 'a'.repeat(40)
const hugeResult = await notifyRadar({ events: [huge, second], ledger, api: hugeServer.api, repo, evidenceRevision: revision, now })
assert.equal(hugeResult.sent, 1)
assert(hugeServer.posted[1].every(comment => Buffer.byteLength(comment.body) <= 55000))
assert(hugeServer.posted[1].some(comment => comment.body.includes('/radar-editorial?subject=')))
assert(hugeServer.posted[1].some(comment => comment.body.includes(`editorial-radar-event:${second.id}`)))
assert.equal(huge.after.positions.length, 3000, 'Full source evidence is not mutated')
assert.equal((await send([huge, second], ledger, mock({ issues: hugeServer.created, comments: { 1: hugeServer.posted[1] } }))).recovered, 1)

// Maintenance: signals leave the window, the tracked issue closes itself and reopens on
// the next signal; an unchanged issue is never rewritten; earlier per-batch issues close.
{
  const later = new Date(now.getTime() + (RECENT_DAYS + 1) * 86400000)
  assert.equal(recentSignals([event, second], later).length, 0)
  assert.equal(recentSignals([event, second], now).length, 2)
  const openLegacy = { ...legacyIssue, number: 3, state: 'open' }
  const maintained = mock({ issues: [{ ...tracker, number: 9, body: tracker.body, title: tracker.title, state: 'open' }, openLegacy] })
  const quiet = await notifyRadar({ events: [event, second], ledger: result.ledger, api: maintained.api, repo, now: later, maintain: true })
  assert.equal(quiet.sent, 0)
  assert.equal(maintained.patched.filter(patch => patch.number === 9).length, 1)
  assert.equal(maintained.tracker().state, 'closed')
  assert.match(maintained.tracker().title, /aucun signal récent/)
  assert.ok(maintained.tracker().body.includes(`editorial-radar-event:${event.id}`), 'Les accusés survivent à la sortie de fenêtre')
  assert.equal(maintained.patched.find(patch => patch.number === 3)?.state, 'closed', 'Ancienne issue par lot fermée')
  assert.equal(quiet.closedLegacy, 1)
  const idle = mock({ issues: [maintained.tracker()] })
  await notifyRadar({ events: [event, second], ledger: result.ledger, api: idle.api, repo, now: later, maintain: true })
  assert.equal(idle.patched.length, 0, 'Rien à réécrire quand rien ne change')
  assert.equal(Object.keys(idle.posted).length, 0)
  const nothing = mock()
  await notifyRadar({ events: [event, second], ledger: result.ledger, api: nothing.api, repo, now: later, maintain: true })
  assert.equal(nothing.created.length, 0, 'Aucune issue créée sans signal récent')
  const fresh = { ...event, id: 'c'.repeat(24),before:event.after,after:55,beforeText:'45 %',afterText:'55 %',beforePeriod:event.period,period:later.toISOString().slice(0,10),publishedAt:later.toISOString().slice(0,10),detectedAt: later.toISOString() }
  const reopened = mock({ issues: [maintained.tracker()] })
  const reopenResult = await notifyRadar({ events: [event, second, fresh], ledger: result.ledger, api: reopened.api, repo, now: later, maintain: true })
  assert.equal(reopenResult.sent, 1)
  assert.equal(reopened.tracker().state, 'open')
  assert.match(reopened.tracker().title, /1 signal récent/)
  assert.equal(reopened.posted[9].length, 1)
  console.log('Issue suivie du radar : fenêtre glissante, fermeture et réouverture automatiques, anciennes issues regroupées.')
}
