import POLICY from './freshness-policy.json' with { type: 'json' }
const day = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return NaN
  const parsed = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value ? parsed : NaN
}
export function currentEvidence(checkedAt, asOf, field, now = new Date()) {
  const checked = day(checkedAt), publication = day(asOf), today = Date.parse(now.toISOString().slice(0, 10))
  const policy = POLICY.fields[field]
  return Boolean(policy && Number.isFinite(checked) && Number.isFinite(publication) && publication <= checked && checked <= today
    && today - checked <= policy.checkDays * 86400000 && today - publication <= policy.dataDays * 86400000)
}
