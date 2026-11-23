import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {lastWeekMonday, tradingWeek} from './etf-flows-calendar.mjs'
import {dateRange, rankRows, renderPost} from '../src/pages/etf-flows/weekly.js'

assert.equal(lastWeekMonday(new Date('2026-11-22T23:01:00Z')), '2026-11-16')
assert.equal(lastWeekMonday(new Date('2026-11-22T22:59:00Z')), '2026-11-09')
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
