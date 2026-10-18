import assert from 'node:assert/strict'
import { scenarioTarget, nextMonth, monthEnd } from './simulate-refresh.mjs'
assert.equal(nextMonth('2026-12'), '2027-01')
assert.equal(monthEnd('2027-02'), '2027-02-28')
assert.deepEqual(scenarioTarget('next-month', '2026-09'), { until: '2026-10', fx: true })
assert.deepEqual(scenarioTarget('ecb-outage', '2026-09'), { until: '2026-10', fx: false })
assert.deepEqual(scenarioTarget('year-rollover', '2026-09'), { until: '2027-01', fx: true })
assert.deepEqual(scenarioTarget('year-rollover', '2026-12'), { until: '2027-01', fx: true })
assert.throws(() => scenarioTarget('other', '2026-09'))
console.log('Refresh rehearsal scenarios: next month, ECB outage and year rollover targets verified.')
