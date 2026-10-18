import assert from 'node:assert/strict'
import POLICY from '../src/data/freshness-policy.json' with {type:'json'}
import { freshness, etfFreshnessKey, fieldState } from './report-asset-fields.mjs'
for (const [key, p] of Object.entries(POLICY.fields)) {
  assert(Number.isInteger(p.checkDays) && p.checkDays > 0 && Number.isInteger(p.dataDays) && p.dataDays >= p.checkDays, `${key}: invalid thresholds`)
}
// Each ETF field resolves to exactly one rule; static legal characteristics are renewed yearly.
assert.equal(etfFreshnessKey('domicile'), 'etf.staticCharacteristic')
assert.equal(etfFreshnessKey('pea'), 'etf.characteristic')
assert.equal(etfFreshnessKey('countries'), 'etf.default')
assert.equal(etfFreshnessKey('monthly'), 'etf.monthly')
assert.throws(() => freshness('unknown.field'))
const now = '2026-10-18'
assert.equal(fieldState({ checkedAt: '2026-01-02', asOf: '2026-01-01' }, now, freshness('etf.staticCharacteristic')), 'current')
assert.equal(fieldState({ checkedAt: '2026-10-01', asOf: '2026-10-01' }, now, freshness('etf.default')), 'check-overdue')
assert(POLICY.calendars['scpi.quarterlyBulletin'].graceDaysAfterNextQuarterEnd > 0)
console.log(`Freshness policy: ${Object.keys(POLICY.fields).length} field rules and ${Object.keys(POLICY.calendars).length} source calendar verified.`)
