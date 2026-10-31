import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { advanceRadar, shouldRefreshRadar, observationKey, meaningful, displayValue } from './lib/editorial-radar.mjs'
import { pendingNotifications } from './lib/radar-notifications.mjs'
import { collectObservations } from './update-editorial-radar.mjs'
import { validateFeed, staleFeed } from '../src/pages/editorial-radar/client.js'
import { parseVanguardNews, parseGlobalXNews, GLOBALX_NEWS_URL, collectRadarNews } from './lib/radar-news.mjs'

const now = new Date('2026-10-08T15:00:00Z')
const rate = overrides => ({ family: 'etf', entity: 'FR001400U5Q4', label: 'Amundi PEA Monde', field: 'ter', fieldLabel: 'Frais annuels', value: .2, sourceUrl: 'https://www.amundietf.fr/product', scope: 'Part exacte FR001400U5Q4', checkedAt: '2026-10-08', period: '2026-10-07', tool: '/fiches-etf', priority: 'high', discovery: true, ...overrides })
const advance = (previous, rows, extra = {}) => advanceRadar(previous, rows, { now, ...extra })
{
  const fixture = JSON.parse(await readFile(new URL('./fixtures/radar-xtrackers-2026-10-07.json', import.meta.url)))
  const rows = fixture.snapshots.map(({ countries }) => rate({ entity: fixture.entity, field: 'countries:United States', fieldLabel: 'Poids des États-Unis', scope: countries.method, sourceUrl: fixture.sourceUrl, period: countries.asOf, sourceHash: countries.sha256, value: countries.rows[0].weightPct, threshold: 2 }))
  const key = observationKey(rows[0])
  const first = advance(null, [rows[0]])
  const conflict = advance(first.state, [rows[1], rate({ entity: 'OTHER', value: .3 })])
  assert.equal(conflict.newEvents.length, 1, 'Les autres observations valides restent détectées')
  assert.deepEqual(conflict.state.current[key], rows[0])
  assert.deepEqual(conflict.state.anchors[key], rows[0])
  assert.match(conflict.feed.errors[0].reason, /contradictoire/)
  const retry = advance(conflict.state, [{ ...rows[1], checkedAt: now.toISOString() }])
  assert.equal(Object.values(retry.state.conflicts)[0].proposals.length, 1, 'Proposition dédupliquée indépendamment de la date de collecte')
  assert.equal(Object.values(retry.state.conflicts)[0].proposals[0].observation.sourceHash, rows[1].sourceHash)
  const returned = advance(retry.state, [rows[2]])
  assert.equal(returned.newEvents.length, 0, 'Aller-retour exact Xtrackers silencieux')
  assert.equal(returned.feed.errors.length, 1, 'Un retour ne valide pas automatiquement la contradiction')
  assert.equal(returned.state.current[key].value, 98.558208)
  const newer = advance(returned.state, [{ ...rows[1], period: '2026-10-08' }])
  assert.equal(newer.newEvents.length, 0, 'Une ancre contradictoire ne prouve pas une baisse ; la nouvelle période rétablit une base')
  assert.equal(newer.feed.errors.length, 0)
  assert.ok(Object.values(newer.state.conflicts)[0].resolvedAt)
  assert.equal(advance(newer.state, [{ ...rows[1], period: '2026-10-08' }]).newEvents.length, 0)
  const reversal = advance(newer.state, [{ ...rows[0], period: '2026-10-09' }], { now: new Date('2026-10-09T15:00:00Z') })
  assert.equal(reversal.newEvents.length, 1, 'Le retour réel sur une autre période reste signalé')
  assert.equal(first.state.conflicts && Object.keys(first.state.conflicts).length, 0)
  for (const field of ['aum', 'top10', 'sectors:Tech']) {
    const row = rate({ field, value: 30, threshold: 2 })
    const result = advance(advance(null, [row]).state, [{ ...row, value: 33 }])
    assert.equal(result.newEvents.length, 0)
    assert.equal(result.state.current[observationKey(row)].value, 30)
  }
  // Before deployment, the historical pair may still be awaiting a send.
  const legacy = structuredClone(first.state)
  legacy.events = [
    { id: 'a'.repeat(24), ...rows[0], beforePeriod: rows[0].period, kind: 'change', detectedAt: now.toISOString() },
    { id: 'b'.repeat(24), ...rows[1], beforePeriod: rows[1].period, kind: 'change', detectedAt: now.toISOString() },
  ]
  const migrated = advance(legacy, [rows[0]])
  assert.equal(migrated.state.events.length, 2, 'Historique conservé pour audit')
  assert.equal(migrated.feed.events.length, 0, 'Alertes historiques trompeuses retirées du flux')
  assert.ok(migrated.state.events.every(e => e.status === 'source-conflict'))
}
{
  const fixture = JSON.parse(await readFile(new URL('./fixtures/radar-materials-2026-10.json', import.meta.url)))
  const countries = ['Ireland', 'United Kingdom']
  const rows = fixture.snapshots.map(({ countries: c }) => countries.map(country => rate({
    entity: fixture.entity, field: `countries:${country}`, fieldLabel: `Poids du pays ${country}`,
    scope: `${fixture.entity} · fund · ${c.method}`, sourceUrl: fixture.sourceUrl,
    checkedAt: '2026-10-13', period: c.asOf, sourceHash: c.sha256,
    value: c.rows.find(r => r.name === country).weightPct, threshold: 2,
  })))
  const options = { now: new Date('2026-10-13T12:00:00Z') }
  const first = advance(null, rows[0], options)
  const movement = advance(first.state, rows[1], options)
  assert.equal(movement.newEvents.length, 2, 'Reproduction des deux variations entre dates distinctes')
  const revised = advance(movement.state, rows[2], options)
  assert.equal(revised.newEvents.length, 0)
  assert.equal(revised.feed.events.length, 0, 'Les variations deviennent impropres à publication après contradiction DWS')
  assert.equal(revised.state.events.length, 2, 'Conservation des preuves et identifiants historiques')
  assert.ok(revised.state.events.every(e => e.status === 'source-conflict'))
  const ledger = { schemaVersion: 1, acknowledged: [] }
  assert.equal(pendingNotifications(revised.state.events, ledger).length, 0, 'Aucune nouvelle tentative d’envoi')
  const acknowledged = { schemaVersion: 1, acknowledged: movement.state.events.map(e => e.id) }
  assert.deepEqual(acknowledged.acknowledged, revised.state.events.map(e => e.id))
  const migrated = advance(revised.state, [], options)
  assert.equal(migrated.feed.events.length, 0, 'Migration idempotente sans nouvelle collecte')
  const later = advance(revised.state, rows[2].map(r => ({ ...r, period: '2026-10-08' })), options)
  assert.equal(later.feed.newSignalCount, 0, 'Pas de comparaison publiable contre une ancre disputée')
  assert.equal(later.newEvents.length, 0)
  assert.ok(Object.values(later.state.conflicts).every(c => c.resolvedAt))
  const small = advance(revised.state, rows[1].map(r => ({ ...r, period: '2026-10-08', value: r.value + .1 })), options)
  assert.equal(small.newEvents.length, 0)
  for (const row of rows[1]) assert.equal(small.state.anchors[observationKey(row)].period, '2026-10-08', 'Ancre saine rétablie même sous le seuil')
  const clean = advance(later.state, rows[2].map(r => ({ ...r, period: '2026-10-09', value: r.value + 3 })), options)
  assert.equal(clean.newEvents.length, 2, 'Les mouvements entre deux périodes non disputées restent détectés')
  const mixed = structuredClone(revised.state)
  const event = movement.state.events[0]
  mixed.events.push({ ...event, id: 'f'.repeat(24), field: 'countries:Australia' },
    { ...event, id: 'e'.repeat(24), scope: 'Autre méthode' },
    { ...event, id: 'd'.repeat(24), entity: 'OTHER' })
  assert.equal(advance(mixed, [], options).feed.events.length, 3, 'Seuls le même pays, produit, méthode et période sont affectés')
  const [a, b] = fixture.snapshots.slice(1).map(s => s.holdings.rows.map(r => [r.isin, r.weightPct]))
  assert.deepEqual(a, b, 'Les dix ISIN et poids du 7 octobre sont inchangés')
  const delta = rows[2][0].value - rows[1][0].value
  assert.ok(Math.abs(delta - fixture.snapshots[1].holdings.rows[0].weightPct) < 0.000001)
}
const initial = advance(null, [rate()])
assert.equal(initial.newEvents.length, 0, 'Initialisation silencieuse')
assert.equal(Object.keys(initial.state.current).length, 1)
assert.equal(advance(initial.state, [rate({ checkedAt: '2026-10-08T15:00:00Z', period: '2026-10-08' })]).newEvents.length, 0, 'Revalidation sans modification')
const changed = advance(initial.state, [rate({ value: .15, period: '2026-10-08' })])
assert.equal(changed.newEvents.length, 1)
assert.equal(changed.newEvents[0].before, .2)
assert.equal(changed.newEvents[0].after, .15)
assert.match(changed.newEvents[0].draft, /0,2.*0,15/)
assert.equal(advance(changed.state, [rate({ value: .15, period: '2026-10-08' })]).newEvents.length, 0, 'Pas de doublon')
assert.deepEqual(initial.state.current[observationKey(rate())].value, .2, 'État précédent intact')
for (const value of [null, NaN, Infinity]) {
  const invalid = advance(initial.state, [rate({ value })])
  assert.equal(invalid.newEvents.length, 0)
  assert.equal(invalid.state.current[observationKey(rate())].value, .2)
  assert.equal(invalid.feed.errors.length, 1)
}
assert.equal(advance(initial.state, []).state.current[observationKey(rate())].value, .2, 'Une disparition n’est pas une clôture')
for (const checkedAt of ['2026-01-01', '2026-12-01', 'pas de date']) assert.equal(advance(initial.state, [rate({ value: .1, checkedAt })]).newEvents.length, 0, 'Date invalide ou périmée')
assert.equal(advance(initial.state, [rate({ value: .1, period: '2026-09-01' })]).newEvents.length, 0, 'Pas de régression temporelle')
assert.equal(advance(initial.state, [rate({ value: .1, scope: 'Autre part' })]).newEvents.length, 0, 'Ne pas comparer des périmètres différents')
assert.throws(() => advance(initial.state, [rate(), rate()]), /dupliquée/)
assert.throws(() => advance({ schemaVersion: 1 }, [rate()]), /invalide/)
assert.equal(advance(initial.state, [rate({ entity: 'IE0000000001' })]).newEvents[0].kind, 'new')
assert.equal(advance(initial.state, [rate({ field: 'nouveau-champ', value: 12 })]).newEvents.length, 0, 'Un nouveau parseur n’est pas une annonce')
{
  const row = rate({ field: 'sectors:Tech', value: 30, threshold: 2, period: '2026-10-03' })
  let state = advance(null, [row]).state
  for (const [i, value] of [30.5, 31, 31.5].entries()) {
    const result = advance(state, [{ ...row, value, period: `2026-10-0${i + 4}` }]); assert.equal(result.newEvents.length, 0); state = result.state
  }
  const signal = advance(state, [{ ...row, value: 32, period: '2026-10-07' }])
  assert.equal(signal.newEvents.length, 1); assert.equal(signal.newEvents[0].before, 30)
  assert.equal(advance(signal.state, [{ ...row, value: 32.5, period: '2026-10-08' }]).newEvents.length, 0)
}
{
  const row = rate({ field: 'aum', value: 100, relativeThreshold: .2, scope: 'part · USD' })
  const state = advance(null, [row]).state
  assert.equal(advance(state, [{ ...row, value: 119, period: '2026-10-08' }]).newEvents.length, 0)
  assert.equal(advance(state, [{ ...row, value: 120, period: '2026-10-08' }]).newEvents.length, 1)
  assert.equal(advance(state, [{ ...row, value: 300, scope: 'fonds · EUR' }]).newEvents.length, 0)
}
{
  const row = rate({ family: 'assurance', entity: 'contrat', value: 3, rule: 'publication', period: '2024' })
  const result = advance(advance(null, [row]).state, [{ ...row, period: '2025' }])
  assert.equal(result.newEvents.length, 1, 'Nouvelle année même rendement')
  assert.equal(result.newEvents[0].kind, 'publication')
}
assert.equal(meaningful(rate({ value: 1 }), rate({ value: '1' })), false)
assert.match(displayValue({ positions: [{ ticker: 'UBER', changePct: 15 }], exits: ['XYZ'] }), /UBER.*15.*XYZ/)
const actual = await collectObservations()
assert.ok(actual.observations.length > 500, 'Collecte réelle des familles')
// Live observations advance with the collectors; the fixed clock above is for unit fixtures.
const real = advanceRadar(null, actual.observations, { now: new Date(), errors: actual.errors })
for (const family of ['etf', 'indices', 'courtiers', 'epargne', 'scpi', 'assurance', 'investisseurs', 'economie']) assert.ok(real.feed.coverage[family] > 0, `Famille raccordée : ${family}`)
assert.equal(real.newEvents.length, 0)
assert.equal(actual.errors.length, 0)
validateFeed(real.feed); validateFeed(changed.feed)
assert.throws(() => validateFeed({ ...changed.feed, events: [{ ...changed.newEvents[0], sourceUrl: 'javascript:alert(1)' }] }))
assert.throws(() => validateFeed({ ...changed.feed, events: [changed.newEvents[0], changed.newEvents[0]] }))
assert.equal(staleFeed(changed.feed, now.getTime()), false)
assert.equal(staleFeed(changed.feed, now.getTime() + 37 * 3600000), true)
const newsroom = title => `<h1>Press releases</h1><nds-base-card><span>7 October 2026</span><h3>${title}</h3><a href="/content/dam/intl/europe/documents/press-releases/new-etf.pdf">View press release</a></nds-base-card>`
const news = parseVanguardNews(newsroom('Vanguard launches a new ETF'), now)
assert.equal(news[0].period, '2026-10-07')
assert.equal(advance(initial.state, news).newEvents.length, 1)
assert.equal(advance(initial.state, parseVanguardNews(newsroom('Vanguard launches a new ETF').replace('7 October 2026', '7 October 2025'), now)).newEvents.length, 0, 'Une archive ajoutée ne déclenche pas une alerte')
assert.throws(() => parseVanguardNews('<html>Consent</html>', now))
assert.throws(() => parseVanguardNews(newsroom('Vanguard launches a new ETF').replace('/content/dam/', 'https://evil.invalid/content/dam/'), now))
assert.equal((await collectRadarNews(now, async () => { throw new Error('HTTP 403') })).errors.length, 2)
console.log(`Radar : seuils cumulés, périmètres, dates, bootstrap, publications, déduplication, conservation et ${real.feed.observationCount} observations vérifiés.`)

{
  const row = rate({period:'2026-10-08'})
  const start = advance(null,[row])
  const correction = advance(start.state,[{...row,value:.15}])
  const reverted = advance(correction.state,[row])
  assert.equal(reverted.newEvents.length,0)
  assert.equal(reverted.state.current[observationKey(row)].value,.15)
  assert.match(reverted.feed.errors[0].reason,/contradictoire/)
  assert.equal(advance(correction.state,[{...row,period:'2026-10-09'}],{now:new Date('2026-10-09T15:00:00Z')}).newEvents.length,1,'Un retour sur une nouvelle période est légitime')
  const stale = advance(correction.state,[{...row,checkedAt:'2026-10-07'}])
  assert.equal(stale.newEvents.length,0)
  assert.equal(stale.state.current[observationKey(row)].value,.15)
}
{
  const state = {...initial.state,sourceRevision:'abc'}
  const opts={eventName:'workflow_run',sourceRevision:'abc',now:new Date(now.getTime()+60000)}
  assert.equal(shouldRefreshRadar(state,opts),false)
  for(const eventName of ['schedule','workflow_dispatch','pull_request']) assert.equal(shouldRefreshRadar(state,{...opts,eventName}),true)
  assert.equal(shouldRefreshRadar(state,{...opts,sourceRevision:'def'}),true)
  assert.equal(shouldRefreshRadar({...state,lastErrorCount:1},opts),true)
  assert.equal(shouldRefreshRadar({...state,lastErrorCount:undefined},opts),true)
  assert.equal(shouldRefreshRadar(state,{...opts,now:new Date(now.getTime()+15*60000)}),true)
  assert.equal(shouldRefreshRadar(null,opts),true)
}

{
  const listing = `<h1>News</h1><div>Recent News</div><a href="https://issuer.test/document.pdf"><li><p>07 Oct 2026</p><h3>Global X launches a UCITS ETF</h3></li></a>`
  const rows = parseGlobalXNews(listing,now)
  assert.equal(rows[0].period,'2026-10-07')
  assert.equal(rows[0].sourceUrl,GLOBALX_NEWS_URL)
  const detected=advance(initial.state,rows)
  assert.equal(detected.newEvents.length,1)
  assert.equal(advance(detected.state,rows).newEvents.length,0)
  assert.equal(advance(initial.state,parseGlobalXNews(listing.replace('2026','2025'),now)).newEvents.length,0)
  assert.throws(()=>parseGlobalXNews(listing.replace('07 Oct','32 Oct'),now),/invalide/)
  assert.throws(()=>parseGlobalXNews('<html>Consent</html>',now),/format/)
  const partial=await collectRadarNews(now,async url=>{
    if(url===GLOBALX_NEWS_URL)throw new Error('HTTP 500')
    return {ok:true,headers:new Headers({'content-type':'text/html'}),text:async()=>newsroom('Vanguard launches a new ETF')}
  })
  assert.equal(partial.errors.length,1)
  assert.equal(partial.observations.length,1,'Une newsroom en panne ne masque pas l’autre')
}

// #583: missing categories in complete DWS snapshots must not strand conflicts.
{
  const conflicts = JSON.parse(await readFile(new URL('./fixtures/radar-review-583/conflicts.json', import.meta.url)))
  const initial = { schemaVersion: 1, initializedAt: '2026-10-08T00:00:00Z', current: {}, anchors: {}, events: [], conflicts }
  for (const conflict of Object.values(conflicts)) {
    initial.current[observationKey(conflict.accepted)] = conflict.accepted
    initial.anchors[observationKey(conflict.accepted)] = conflict.accepted
  }
  const rows = JSON.parse(await readFile(new URL('./fixtures/radar-review-583/equal-weight-observations.json', import.meta.url)))
  const opts = { now: new Date('2026-10-14T12:00:00Z') }
  const result = advanceRadar(initial, rows, opts)
  assert.equal(Object.values(result.state.conflicts).filter(c => !c.resolvedAt).length, 30)
  assert.equal(result.newEvents.length, 0, 'No invented market movement on recovery')
  for (const name of ['Switzerland', 'Bermuda']) {
    const c = Object.values(conflicts).find(c => c.accepted.entity === 'IE00BLNMYC90' && c.accepted.field === `countries:${name}`)
    const key = observationKey(c.accepted)
    assert.equal(result.state.current[key].value, 0)
    assert.equal(result.state.anchors[key].period, '2026-10-12')
    assert.deepEqual(result.state.conflicts[`${key}:2026-10-07`].proposals, c.proposals)
  }
  const repeated = advanceRadar(result.state, rows, opts)
  assert.equal(repeated.newEvents.length, 0)
  assert.equal(Object.values(repeated.state.conflicts).filter(c => !c.resolvedAt).length, 30)
  for (const unsafe of [[], rows.map(r => ({ ...r, completeComposition: false })), rows.slice(1),
    rows.map(r => ({ ...r, scope: 'different methodology' })),
    rows.map(r => ({ ...r, sourceHash: undefined })),
    rows.map(r => ({ ...r, period: '2026-10-06' }))]) {
    const unchanged = advanceRadar(initial, unsafe, opts)
    assert.equal(Object.values(unchanged.state.conflicts).filter(c => !c.resolvedAt).length, 32, 'Incomplete, changed or old evidence cannot resolve conflicts')
  }
  const samePeriod = advanceRadar(initial, rows.map(r => ({ ...r, period: '2026-10-07' })), opts)
  assert.equal(Object.values(samePeriod.state.conflicts).filter(c => !c.resolvedAt).length, 32, 'Omission at the disputed date remains a contradiction')
}

// Every qualified source shares the same signals and date conflict rules.
{
for(const isin of ['IE00B441G979','IE00B4WXJG34','IE00B0M63284','IE000SNLFDR7','DE000A0Q4R02','DE000A0H08R2'])assert(actual.observations.some(o=>o.entity===isin&&o.field==='ter'))
assert.equal(new Set(actual.observations.map(observationKey)).size,actual.observations.length)
const collectedMetric=actual.observations.find(o=>o.entity==='IE00B4WXJG34'&&o.field==='metric:modelOad');assert(collectedMetric)
// Freeze the scenario's dates: a refreshed source can already be newer than
// the synthetic next-period observation, which must then correctly be ignored.
const metric={...collectedMetric,period:'2026-10-13',checkedAt:'2026-10-14'}
const now=new Date('2026-10-14T15:00:00Z'),state=advanceRadar(null,[metric],{now}).state
assert.equal(advanceRadar(state,[{...metric,value:metric.value+.1,period:'2026-10-14'}],{now}).newEvents.length,0)
assert.equal(advanceRadar(state,[{...metric,value:metric.value+.3,period:'2026-10-14'}],{now}).newEvents.length,1)
const conflict=advanceRadar(state,[{...metric,value:metric.value+.3}],{now});assert.equal(conflict.newEvents.length,0);assert.equal(Object.keys(conflict.state.conflicts).length,1)
console.log('All qualified ETFs monitored once; metric thresholds and same-date revisions verified.')

}

// iShares replication aliases: future collection oscillations and legacy alerts.
{
  const { normalizedReplication, replicationWordingEvent } = await import('../src/lib/replication-method.js')
  const { notifiableEvents, correctReplicationNotification } = await import('./lib/radar-notifications.mjs')
  const { editorialState } = await import('../src/lib/radar-editorial.js')
  const sourceUrl = 'https://www.blackrock.com/varnish-api/product-data'
  const row = value => rate({ value, sourceUrl, field: 'characteristics:replicationMethod' })
  for (const [short, long] of [['Replicated', 'Physical (Replicated)'], ['Optimised', 'Physical (Optimised)'], ['Optimized', 'Physical (Optimised sampling)'], ['Sampled', 'Physical (Sampled)'], ['Swap', 'Synthetic (Swap)'], ['Physical Replication', 'Physical (Physical Replication)']]) {
    for (const [a, b] of [[short, long], [long, short]]) {
      const initial = advance(null, [row(a)])
      const changed = advance(initial.state, [row(b)])
      assert.equal(changed.newEvents.length, 0)
      assert.equal(changed.feed.errors.length, 0)
      assert.equal(changed.state.current[observationKey(row(a))].value, b)
      assert.equal(changed.state.anchors[observationKey(row(a))].value, b)
      const legacy = { ...row(b), id: 'e'.repeat(24), before: a, after: b, previousSourceUrl: sourceUrl,
        kind: 'change', detectedAt: now.toISOString(), beforePeriod: row(a).period }
      initial.state.events = [legacy]
      const migrated = advance(initial.state, [row(b)])
      assert.equal(migrated.state.events.length, 1)
      assert.equal(migrated.state.events[0].status, 'wording-only')
      assert.equal(migrated.state.events[0].before, a)
      assert.equal(migrated.state.events[0].after, b)
      assert.equal(migrated.feed.events.length, 0)
      assert.equal(notifiableEvents([legacy]).length, 0, 'Notification guard also handles unmigrated state')
      assert.equal(editorialState(legacy), 'secondary')
      const original = `Header\n### ETF replication\n\n<!-- editorial-radar-event:${legacy.id} -->\nValidation: important\n<!-- radar-batch:abc -->\n`
      const corrected = correctReplicationNotification(original, [legacy])
      assert.match(corrected, /formulations sont équivalentes/)
      assert.ok(corrected.includes(`<!-- editorial-radar-event:${legacy.id} -->`))
      assert.equal(correctReplicationNotification(corrected, [legacy]), corrected)
      assert.equal(advance(migrated.state, [row(a)]).feed.events.length, 0)
    }
  }
  for (const [a, b] of [['Replicated','Optimised'], ['Sampled','Optimised'], ['Physical Replication','Physical metal (Physical Replication)'], ['Physical (Replicated)','Synthetic'],
    ['Physical','Physical (Replicated)'], ['Physical metal','Physical (Replicated)'],
    ['Synthetic - funded swap','Synthetic - unfunded swap'], ['Novel method A','Novel method B']]) {
    const initial = advance(null, [row(a)])
    const result = advance(initial.state, [{ ...row(b), period: '2026-10-08' }])
    assert.equal(result.newEvents.length, 1, `${a} → ${b} must not disappear`)
    assert.equal(notifiableEvents(result.newEvents).length, 1)
    assert.equal(replicationWordingEvent(result.newEvents[0]), false)
    assert.equal(result.newEvents[0].before, a)
    assert.equal(result.newEvents[0].after, b)
  }
  assert.notEqual(normalizedReplication('Replicated','https://example.org'), normalizedReplication('Physical (Replicated)'))
  assert.notEqual(normalizedReplication('Replicated','https://blackrock.com.evil.org'), normalizedReplication('Physical (Replicated)'))
  assert.notEqual(normalizedReplication('Physical'), normalizedReplication('Physical (Full replication)'))
  console.log('Replication: bidirectional aliases, unknowns, real method changes, raw evidence, legacy migration and notification correction verified.')
}
{
  const { notifyRadar } = await import('./lib/radar-notifications.mjs')
  const sourceUrl = 'https://www.blackrock.com/api'
  const alias = { ...rate({ field: 'characteristics:replicationMethod' }), sourceUrl,
    previousSourceUrl: sourceUrl, id: 'f'.repeat(24), before: 'Replicated', after: 'Physical (Replicated)',
    kind: 'change', detectedAt: now.toISOString(), beforeText: 'Replicated', afterText: 'Physical (Replicated)' }
  const body = `Header\n### False signal\n<!-- editorial-radar-event:${alias.id} -->\nOriginal evidence\n`
  const calls = []
  const api = async (path, method = 'GET', data) => {
    calls.push({ path, method, data })
    if (method === 'PATCH') return {}
    if (path.startsWith('issues?')) return [{ number: 880, body: '<!-- editorial-radar-tracker:v1 -->',
      user: { login: 'github-actions[bot]' }, state: 'open', assignees: [{ login: 'madmax91310' }] }]
    if (path.startsWith('issues/880/comments?')) return [
      { id: 1, body, user: { login: 'github-actions[bot]' } },
      { id: 2, body, user: { login: 'human' } },
    ]
    throw new Error(`Unexpected ${method} ${path}`)
  }
  const result = await notifyRadar({ events: [], archiveEvents: [alias], api, repo: 'madmax91310/shinny-potato',
    ledger: { schemaVersion: 1, acknowledged: [alias.id] }, now, maintain: true })
  assert.equal(result.sent, 0)
  assert.ok(calls.some(c => c.path === 'issues/comments/1' && c.method === 'PATCH'))
  assert.ok(!calls.some(c => c.path === 'issues/comments/2'))
  assert.ok(!calls.some(c => c.method === 'POST'))
  assert.ok(calls.some(c => c.path === 'issues/880' && c.data.title === 'Radar éditorial : aucun signal récent'))
  assert.deepEqual(result.ledger.acknowledged, [alias.id])
  console.log('Legacy bot comments corrected even when aliases are excluded from the ready feed; human comments and receipts preserved.')
}

{
  // Product structure is an independent financial dimension. Its first
  // qualification is silent; a later change must survive unchanged methodology.
  const { notifiableEvents } = await import('./lib/radar-notifications.mjs')
  const { editorialState } = await import('../src/lib/radar-editorial.js')
  const method = rate({ field: 'characteristics:replicationMethod', value: 'Swap' })
  const structure = rate({ field: 'characteristics:productStructure', fieldLabel: 'Structure de réplication', value: 'Physical' })
  const initial = advance(null, [method])
  const qualified = advance(initial.state, [method, structure])
  assert.equal(qualified.newEvents.length, 0)
  const changed = advance(qualified.state, [method, { ...structure, value: 'Synthetic', period: '2026-10-08' }])
  assert.equal(changed.newEvents.length, 1)
  assert.equal(changed.newEvents[0].field, structure.field)
  assert.equal(editorialState(changed.newEvents[0]), 'ready')
  assert.equal(notifiableEvents(changed.newEvents).length, 1)
}

// Actual29October DWS portfolios: complete positions do not fully identify all
// registration countries. Unknown weights must not manufacture absent-country0.
{
  const fixture = JSON.parse(await readFile(new URL('./fixtures/radar-unknown-classifications-20261030.json', import.meta.url)))
  const before = JSON.stringify(fixture)
  const opts = {now: new Date('2026-10-31T01:00:00Z')}
  const emptyConflicts = {...fixture.state, conflicts: {}}
  const result = advanceRadar(emptyConflicts, fixture.rows, opts)
  for (const {key} of fixture.affected) {
    assert.deepEqual(result.state.current[key], fixture.state.current[key], 'Original dated country value stays untouched; omission is not0')
    assert.deepEqual(result.state.anchors[key], fixture.state.anchors[key])
    assert(!Object.values(result.state.conflicts).some(c => observationKey(c.accepted) === key), 'No manufactured zero proposal')
  }
  assert.equal(result.newEvents.length, 0)
  const unknownIssues = result.feed.errors.filter(e => e.phase === 'qualification' && e.reason.includes('aucun zéro déduit'))
  assert.equal(unknownIssues.length, 2, 'Both partial classification results remain explicit')
  assert(unknownIssues.every(e => e.sourceAttempted === false), 'An inference check is not a fresh provider request')
  const proofs = fixture.proofs.map(p => ({...p,checkedAt:opts.now.toISOString()})) // Isolated later reread, never written to real source records.
  const confirmed = advanceRadar(fixture.state, fixture.rows, {...opts,verifiedCompositions:proofs})
  for (const [key, conflict] of Object.entries(fixture.state.conflicts)) {
    assert(!confirmed.state.conflicts[key].resolvedAt, 'Stable remaining aggregates cannot confirm a missing classification')
    assert.deepEqual(confirmed.state.conflicts[key].accepted, conflict.accepted)
    assert.deepEqual(confirmed.state.conflicts[key].proposals, conflict.proposals, 'Preserve original conflicting evidence')
  }
  assert.equal(JSON.stringify(fixture), before, 'Source weights, dates and proofs stay immutable')
  console.log('Three actual DWS omissions: no false zero, original dates/conflicts preserved, qualification visible; old complete-classification zero scenarios remain valid.')
}
