import LEVELS from './anniversary-levels.json' with { type: 'json' }

// A blank override uses a dated observation; an invalid override never silently falls back.
export function resolveAnniversaryLevel(assetId, override, now = new Date(), levels = LEVELS) {
  if (override !== '' && override !== null && override !== undefined) {
    const value = Number(override)
    return Number.isFinite(value) && value > 0 ? { value, label: 'Niveau saisi manuellement', manual: true } : null
  }
  const record = levels[assetId]
  if (!record || !Number.isFinite(record.value) || record.value <= 0) return null
  const monthly = /^\d{4}-\d{2}$/.test(record.asOf)
  if (!monthly && !/^\d{4}-\d{2}-\d{2}$/.test(record.asOf)) return null
  const date = new Date(`${record.asOf}${monthly ? '-01' : ''}T00:00:00Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, monthly ? 7 : 10) !== record.asOf || !Number.isFinite(record.maxAgeDays) || record.maxAgeDays < 0) return null
  const age = (now - date) / 86400000
  if (!Number.isFinite(age) || age < 0 || age > record.maxAgeDays) return null
  const label = date.toLocaleDateString('fr-FR', { ...(monthly ? { month: 'long', year: 'numeric' } : {}), timeZone: 'UTC' })
  return { ...record, label: `${monthly ? 'Moyenne de' : 'Clôture du'} ${label}`, manual: false }
}
