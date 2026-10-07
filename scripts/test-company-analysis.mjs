import assert from 'node:assert/strict'
import { searchData } from '../src/data/catalog.js'
import { COMPANIES } from '../src/pages/company-analysis/data.js'
import { buildTweetText, canPublish, activeValuation, metrics } from '../src/pages/company-analysis/lib.js'

const now = new Date('2026-10-07T07:00:00Z')
const base = { ...COMPANIES[0], accountsObservedAt: '2026-10-07', annual: {
  start: '2025-01-01', end: '2025-12-31', revenue: 120e9, previousRevenue: 100e9,
  netIncome: 8e9, previousNetIncome: 10e9, freeCashFlow: -1e9,
}, quarter: null, quote: null, valuation: null }
let text = buildTweetText(base, now)
assert.match(text, /hausse de 20,0 %/)
assert.match(text, /baisse de 20,0 %/)
assert.match(text, /disponible est négatif/)
assert(!text.includes('PER'))
// Changing the raw figures must change the prose, even if old derived metadata survives.
const altered = structuredClone(base)
altered.annual.revenue = 80e9; altered.annual.revenueGrowth = 20
assert.match(buildTweetText(altered, now), /baisse de 20,0 %/)
for (const [current,previous,expected] of [[-2e9,-4e9,/perte s’est réduite/],[-4e9,-2e9,/perte s’est creusée/],[2e9,-4e9,/revenue au bénéfice/],[-2e9,4e9,/après un bénéfice/],[0,4e9,/à l’équilibre/]]) {
  const company = structuredClone(base); company.annual.netIncome = current; company.annual.previousNetIncome = previous
  text = buildTweetText(company,now); assert.match(text,expected)
  assert(!/Infinity|NaN|undefined/.test(text)); assert(!text.includes('de 150,0 %'))
}
const unknown = structuredClone(base); unknown.annual.previousRevenue = null; unknown.annual.previousNetIncome = null
assert(!buildTweetText(unknown,now).includes('sur un an'))
const valued = {...base, valuation:{peTTM:30,forwardPE:20,accountsAsOf:'2026-06-30',observedAt:'2026-10-07'}}
assert.match(buildTweetText(valued,now),/PER est de 30,0/)
assert.match(buildTweetText(valued,now),/horizon non précisé/)
assert(!/bon marché|sous-évalu|va augmenter/.test(buildTweetText(valued,now)))
valued.valuation.observedAt = '2026-09-01'
assert.equal(activeValuation(valued,now),null)
assert(!buildTweetText(valued,now).includes('PER'))
valued.valuation.observedAt = '2026-10-07'; valued.quarter = {...base.annual,end:'2026-09-30'}
assert.equal(activeValuation(valued,now),null)
const stale = {...base,accountsObservedAt:'2026-01-01'}
assert.equal(canPublish(stale,now),false);assert.equal(buildTweetText(stale,now),'')
assert.deepEqual(metrics(stale,now),[])
for (const company of COMPANIES) {
  const observationNow = new Date(`${company.accountsObservedAt}T12:00:00Z`)
  assert(canPublish(company,observationNow),`${company.name}: valid initial accounts`)
  text = buildTweetText(company,observationNow)
  const record = searchData(company.symbol,'company').find(record => record.id === `company:${company.id}`)
  assert(record)
  assert.equal(record.fields.find(field => field.label === 'Activité').metadata.checkedAt, company.activityReviewedAt)
  assert.equal(record.fields.find(field => field.label === 'Cours de clôture').metadata.checkedAt, company.quote.observedAt)
  assert(text.includes(company.activity)); assert(!/NaN|undefined|Infinity/.test(text))
  assert(company.accountsSourceUrl.startsWith('https://data.sec.gov/'))
}
console.log('Company analysis: raw-number changes, gains, losses, missing/stale estimates and all initial companies OK.')
