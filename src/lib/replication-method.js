// Exact aliases only. Generic physical replication never implies full replication.
// Bare iShares methodology codes are interpreted only with issuer provenance.
const clean = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : ''
const blackrock = url => { try { return /(^|\.)(blackrock\.com|ishares\.com)$/.test(new URL(url).hostname) } catch { return false } }
export function normalizedReplication(value, sourceUrl = '') {
  const raw = clean(value)
  const aliases = {
    'physical (replicated)': 'physical:full', 'physical (full replication)': 'physical:full',
    'physical (optimised)': 'physical:optimised', 'physical (optimized)': 'physical:optimised',
    'physical (optimised sampling)': 'physical:optimised', 'physical (optimized sampling)': 'physical:optimised',
    'physical (sampled)': 'physical:sampled',
    'physical (physical replication)': 'physical:replication-unspecified',
    'synthetic (swap)': 'synthetic:swap',
    'physical': 'physical:unspecified', 'synthetic': 'synthetic:unspecified',
  }
  if (aliases[raw]) return aliases[raw]
  if (blackrock(sourceUrl)) {
    if (raw === 'sampled') return 'physical:sampled'
    if (raw === 'physical replication') return 'physical:replication-unspecified'
    if (raw === 'swap') return 'synthetic:swap'
    if (raw === 'replicated') return 'physical:full'
    if (['optimised', 'optimized'].includes(raw)) return 'physical:optimised'
  }
  // Unrecognised qualifiers remain distinct; never guess their financial meaning.
  return `unknown:${raw}`
}
export const replicationField = item => item?.family === 'etf' && item.field === 'characteristics:replicationMethod'
export function replicationEquivalent(before, after) {
  return replicationField(before) && replicationField(after) &&
    normalizedReplication(before.value, before.sourceUrl) === normalizedReplication(after.value, after.sourceUrl)
}
export function replicationWordingEvent(event) {
  return event?.kind === 'change' && replicationField(event) && event.before != null && event.after != null &&
    replicationEquivalent({ ...event, value: event.before, sourceUrl: event.previousSourceUrl }, { ...event, value: event.after })
}
