export const monthlyProvision = annual => annual === null ? null : Math.round(Math.round(annual * 100) / 12) / 100
export const validAnnualProvision = row => row.annualProvision === undefined ||
  !!row.annualProvision && Object.keys(row.annualProvision).length === 1 &&
  (row.annualProvision.amount === null ? row.amount === null :
    typeof row.annualProvision.amount === 'number' && Number.isFinite(row.annualProvision.amount) && row.annualProvision.amount >= 0 && row.annualProvision.amount <= 10000000 && row.amount === monthlyProvision(row.annualProvision.amount))
export const provisionLabel = row => row.annualProvision && !/^provision\b/i.test(row.label) ? `Provision ${row.label}` : row.label
export function annualRow(row, amount) {
  return { ...row, amount: monthlyProvision(amount), annualProvision: { amount } }
}
export function monthlyRow(row, amount = row.amount) {
  const { annualProvision: _annual, ...rest } = row
  return { ...rest, amount }
}
export function moveBudgetRow(rows, index, direction) {
  const next = [...rows], target = index + direction
  if (!Number.isInteger(index) || ![-1, 1].includes(direction) || index < 0 || target < 0 || index >= rows.length || target >= rows.length) return next
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
