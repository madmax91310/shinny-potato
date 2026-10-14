import assert from 'node:assert/strict'
import { COMPANIES } from '../src/data/companies.js'

const minimumYears = {disney:4, nike:4, servicenow:4, walmart:4, netflix:4, booking:3}
for (const [id, minimum] of Object.entries(minimumYears)) {
  const company = COMPANIES.find(c => c.id === id)
  const rows = company.decision?.years ?? []
  assert(rows.length >= minimum, `${id}: annual history incomplete`)
  assert.equal(company.decision.publicationCoverageVersion, 1, `${id}: collection not migrated`)
  assert.equal(rows.at(-1).end, company.annual.end)
  const fields = id === 'nike' ? ['averageDilutedShares'] : ['operatingCashFlow','capitalExpenditure','freeCashFlow']
  if (id === 'disney') fields.push('averageDilutedShares','shareBasedCompensation')
  if (id === 'servicenow') fields.push('averageDilutedShares')
  if (id === 'disney') for (const field of ['dividendsPaid','shareRepurchases']) assert(Number.isFinite(rows.at(-1)[field]), `${id}: missing current ${field}`)
  for (const field of fields) {
    assert(rows.every(row => Number.isFinite(row[field]) && row.sourceUrl?.startsWith('https://')), `${id}: missing sourced ${field}`)
  }
}
const adobe = COMPANIES.find(c => c.id === 'adobe')
assert.equal(adobe.solidity.annualEnd, adobe.annual.end)
assert.equal(adobe.solidity.latestBalance.asOf, (adobe.quarter ?? adobe.annual).end)
assert.equal(adobe.solidity.annualBalances.length, 2)
console.log('Expanded issuer coverage: annual components and Adobe balances qualified.')
