// GitHub cron uses UTC and is best-effort. Gate by local hour for both DST regimes.
export function parisClock(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type,p.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) }
}
export function scheduledRadar(now = new Date()) {
  const local = parisClock(now)
  return { ...local, enabled: local.hour >= 8 && local.hour <= 20, digest: local.hour >= 19 }
}
