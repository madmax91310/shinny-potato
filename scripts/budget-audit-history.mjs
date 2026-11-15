import assert from 'node:assert/strict'

// The November 6–13 audit receipts describe the former 28 EUR PEL payment.
// Reconcile that historical view without rewriting the receipts or source rows.
export function budgetBeforeChantier4(profile) {
  if (profile.id !== 'prepared-justbob-2026-10-30') return profile
  assert.deepEqual(profile.savings, [])
  return { ...profile, savings: [{ label: 'Épargne et investissements', amount: 16167 }] }
}

export function budgetBeforePelCorrection(current) {
  const profile = budgetBeforeChantier4(current)
  if (profile.id !== 'prepared-gritz-2026-10-30') return profile
  assert.equal(profile.savings.find(row => row.label === 'PEL')?.amount, 45)
  assert.equal(profile.savings.find(row => row.label === 'PEA')?.amount, 350)
  return { ...profile, savings: profile.savings.map(row => row.label === 'PEL' ? { ...row, amount: 28 } : row) }
}
