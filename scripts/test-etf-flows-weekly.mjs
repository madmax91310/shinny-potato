import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createEdition} from './collect-etf-flows.mjs'
import {lastWeekMonday, tradingWeek} from './etf-flows-calendar.mjs'
import {dateRange, rankRows, renderPost} from '../src/pages/etf-flows/weekly.js'

assert.equal(lastWeekMonday(new Date('2026-11-22T23:01:00Z')), '2026-11-16')
assert.equal(lastWeekMonday(new Date('2026-11-22T22:59:00Z')), '2026-11-16')
assert.equal(lastWeekMonday(new Date('2026-11-20T18:00:00Z')), '2026-11-09')
const closures = ['Thursday, January 1', 'Monday, January 19', 'Monday, February 16', 'Friday, April 3',
  'Monday, May 25', 'Friday, June 19', 'Friday, July 3', 'Monday, September 7', 'Thursday, November 26***', 'Friday, December 25']
const html = '<table><tr><th>Holiday</th><th>2026</th></tr>' + closures.map((date, i) =>
  `<tr><th>${i === 3 ? 'Good Friday' : i === 5 ? 'Juneteenth' : 'Holiday'}</th><td>${date}</td></tr>`).join('') + '</table>'
assert.deepEqual(tradingWeek('2026-11-23', html).sessions, ['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-27'])
assert.equal(tradingWeek('2026-11-30', html).opens, '2026-11-27')
assert.throws(() => tradingWeek('2026-11-23', '<html/>'), /NYSE/)
assert.equal(dateRange('2026-12-28', '2027-01-01'), 'du 28 décembre 2026 au 1 janvier 2027')

const sample = [{id: 'B', usd: 1}, {id: 'A', usd: 1}, {id: 'X', usd: -10}, {id: 'Y', usd: -20}, {id: 'Z', usd: 0}]
assert.deepEqual(rankRows(sample).inflows.map(row => row.id), ['A', 'B'])
assert.deepEqual(rankRows(sample).outflows.map(row => row.id), ['Y', 'X'])

const period = tradingWeek('2026-11-16', html)
const {sessions, opens, monday} = period
const from = sessions[0], to = sessions.at(-1)
const cite = as_of => ({publisher: 'ETFIQ', class: 'ETFIQ-computed', license: 'https://etfiq.com/license/', as_of})
const weekly = {
  schemaVersion: 1, edition: to, asOf: to, cite: cite(to),
  week: {monday, from, to, reach: to, opens, sessions, counted: sessions, partial: false},
  daily: sessions.map(d => ({d, funds: 2, flow: 25})),
  coverage: {daysCounted: sessions.length, universe: 3}, funds: {inflows: [], outflows: []},
}
const taxonomy = {cite: cite(to), version: 2, taxonomy: [{id: 'stocks', groups: [{
  id: 'sector-stocks', segments: ['communications','consumer-cyclical','consumer-defensive','energy','financial','health',
    'industrials','materials','real-estate','real-estate-global','technology','utilities'].map(id => ({id: 'sector-' + id})),
}]}], funds: {
  USF: {status: 'classified', category: 'stocks', group: 'us-stocks', segment: 'us-large-blend'},
  SEC: {status: 'classified', category: 'stocks', group: 'sector-stocks', segment: 'sector-technology'},
}}
const makeRow = (ticker, navDate, flowUsd) => ({ticker, name: ticker, basis: 'daily', status: 'ok', held: false, navDate, flowUsd})
const daily = sessions.map((d, i) => {
  const previous = sessions[i - 1] ?? opens
  const funds = [makeRow('USF', previous, 100_000), makeRow('SEC', previous, -500_000)]
  if (d !== to) funds.push(makeRow('MISSING', previous, 50_000_000))
  return {schemaVersion: 1, asOf: d, cite: cite(d), basis: 'daily', window: {from: d, to: d, days: 1, opens: previous},
    funds, total: {funds: funds.length, flowUsd: funds.reduce((sum, row) => sum + row.flowUsd, 0)}}
})
const qualified = createEdition(period, weekly, daily, taxonomy, {})
assert.equal(qualified.coverage.partialDaily, 1)
assert.equal(qualified.groups.geography[0].usd, 500_000)
assert.equal(qualified.groups.sectors[0].usd, -2_500_000)
assert.deepEqual(qualified.groups.funds.map(row => row.id), ['USF', 'SEC'])
assert.throws(() => createEdition(period, {...weekly, week: {...weekly.week, counted: sessions.slice(0, -1), partial: true}}, daily, taxonomy, {}), /incomplète/)
assert.throws(() => createEdition(period, weekly, [...daily.slice(0, -1), daily.at(-2)], taxonomy, {}), /2026-11-20/)
const truncated = {...daily.at(-1), funds: daily.at(-1).funds.slice(0, 1)}
assert.throws(() => createEdition(period, weekly, [...daily.slice(0, -1), truncated], taxonomy, {}), /ne correspond pas au total/)

const registry = JSON.parse(readFileSync(new URL('../src/data/etf-flows-weekly.json', import.meta.url)))
assert.equal(registry.schemaVersion, 1)
let previous = '9999'
for (const edition of registry.editions) {
  assert(edition.monday < previous, 'Dates dupliquées ou désordonnées')
  previous = edition.monday
  assert(edition.sessions.every((day, index) => day >= edition.monday && (!index || day > edition.sessions[index - 1])))
  assert.equal(edition.currency, 'USD')
  assert(Date.parse(edition.validatedAt) > Date.parse(edition.sessions.at(-1)))
  assert.equal(edition.sources.daily.length, edition.sessions.length)
  assert(edition.groups.geography.some(row => row.id === 'US'))
  for (const rows of Object.values(edition.groups)) {
    assert(rows.length && new Set(rows.map(row => row.id)).size === rows.length)
    assert(rows.every(row => row.label && Number.isSafeInteger(row.usd)))
  }
  const post = edition.post
  assert.equal(post, renderPost(edition))
  assert.match(post, /^📊 Flux nets des ETF du /)
  assert.match(post, /🌍 Par pays et par zone[\s\S]*🏭 Par secteur[\s\S]*💸 Top 5 des ETF cotés aux États-Unis[\s\S]*Sources · ETFIQ/)
}
console.log('Calendrier, tri et registre des éditions ETF vérifiés.')
