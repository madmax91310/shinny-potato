import assert from 'node:assert/strict'
import { advanceRadar, shouldRefreshRadar, observationKey, meaningful, displayValue } from './lib/editorial-radar.mjs'
import { collectObservations } from './update-editorial-radar.mjs'
import { validateFeed, staleFeed } from '../src/pages/editorial-radar/client.js'
import { parseVanguardNews, parseGlobalXNews, GLOBALX_NEWS_URL, collectRadarNews } from './lib/radar-news.mjs'

const now = new Date('2026-10-08T15:00:00Z')
const rate = overrides => ({ family: 'etf', entity: 'FR001400U5Q4', label: 'Amundi PEA Monde', field: 'ter', fieldLabel: 'Frais annuels', value: .2, sourceUrl: 'https://www.amundietf.fr/product', scope: 'Part exacte FR001400U5Q4', checkedAt: '2026-10-08', period: '2026-10-07', tool: '/fiches-etf', priority: 'high', discovery: true, ...overrides })
const advance = (previous, rows, extra = {}) => advanceRadar(previous, rows, { now, ...extra })
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
  const row = rate({ field: 'sector', value: 30, threshold: 2 })
  let state = advance(null, [row]).state
  for (const value of [30.5, 31, 31.5]) {
    const result = advance(state, [{ ...row, value }]); assert.equal(result.newEvents.length, 0); state = result.state
  }
  const signal = advance(state, [{ ...row, value: 32 }])
  assert.equal(signal.newEvents.length, 1); assert.equal(signal.newEvents[0].before, 30)
  assert.equal(advance(signal.state, [{ ...row, value: 32.5 }]).newEvents.length, 0)
}
{
  const row = rate({ field: 'aum', value: 100, relativeThreshold: .2, scope: 'part · USD' })
  const state = advance(null, [row]).state
  assert.equal(advance(state, [{ ...row, value: 119 }]).newEvents.length, 0)
  assert.equal(advance(state, [{ ...row, value: 120 }]).newEvents.length, 1)
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
