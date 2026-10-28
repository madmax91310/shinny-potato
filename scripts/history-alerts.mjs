import { readFileSync } from 'node:fs'
import POLICY from '../src/data/freshness-policy.json' with { type: 'json' }
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { INSTRUMENTS_BY_ISIN } from '../src/data/instruments.js'
import { calendarEligibility } from './automation-gap-inventory.mjs'
import { RANKING_ASSETS } from '../src/pages/performance-rankings/data.js'

const read = name => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url)))
const monthNumber = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value)) ? Number(value.slice(0, 4)) * 12 + Number(value.slice(5)) - 1 : null
const monthLabel = value => `${Math.floor(value / 12)}-${String(value % 12 + 1).padStart(2, '0')}`

// A monthly series is not the ISIN-wide annual calendar, fee or listing.
// Resolve its actual consumers before falling back to a legacy identity.
export function historyConsumerTools({ id, dataId, record, cadence, entities, today, excludedMonths }) {
  const series = cadence === 'monthly' && record.id && entities.filter(row => row.aliases?.includes(`history:${record.id}`))
  const exact = series?.length ? series : cadence === 'monthly' && record.id && entities.filter(row => row.aliases?.some(alias => alias === record.id || alias === id))
  const matches = exact?.length ? exact : entities.filter(row => row.aliases?.some(alias => alias === dataId || alias === id))
  const tools = new Set(matches.flatMap(row => row.tools ?? []))
  const ranking = cadence === 'monthly' && RANKING_ASSETS[record.id]
  if (ranking && !['monthly-average', 'price-index', 'futures-price'].includes(ranking.basis)) tools.add('Qui a vraiment gagné ?')
  if (excludedMonths && !excludedMonths.some(month => month.slice(5) === today.slice(5, 7)
    && Number(today.slice(0, 4)) - Number(month.slice(0, 4)) >= 1
    && Number(today.slice(0, 4)) - Number(month.slice(0, 4)) <= 10)) tools.delete('Il y a X ans')
  return [...tools].sort()
}

// Only inspect the observed range. No invented pre-launch history, annual proxy,
// current year or expected source publication date. Tail delays use the shared policy.
export function inspectHistory({ periods, cadence, today, policy, firstCompleteYear = 0, periodStart, periodEnd }) {
  const end = cadence === 'monthly' ? monthNumber(today.slice(0, 7)) : Number(today.slice(0, 4))
  const values = periods.map(([period, value]) => [cadence === 'monthly' ? monthNumber(period) : /^\d{4}$/.test(String(period)) ? Number(period) : null, value])
    .filter(([n]) => n !== null && n < end && (cadence === 'monthly' || n >= firstCompleteYear))
  const boundary = value => cadence === 'monthly' ? monthNumber(String(value).slice(0, 7)) : /^\d{4}/.test(String(value)) ? Number(String(value).slice(0, 4)) : null
  const declaredStart = boundary(periodStart), declaredEnd = boundary(periodEnd)
  const declared = declaredStart !== null && declaredEnd !== null && declaredStart <= declaredEnd
    ? [Math.max(declaredStart, cadence === 'annual' ? firstCompleteYear : declaredStart), Math.min(declaredEnd, end - 1)] : []
  if (!values.length && (!declared.length || declared[0] > declared[1])) return { missingPeriods: [], invalidPeriods: [], delayed: false, asOf: null }
  const label = n => cadence === 'monthly' ? monthLabel(n) : String(n)
  const all = values.map(([n]) => n), first = Math.min(...all, ...(declared.length ? [declared[0]] : [])), last = Math.max(...all, ...(declared.length ? [declared[1]] : []))
  const valid = new Set(values.filter(([, v]) => Number.isFinite(v) && (cadence !== 'monthly' || v > 0)).map(([n]) => n))
  const present = new Set(all)
  const missingPeriods = []
  for (let n = first; n <= last; n++) if (!present.has(n)) missingPeriods.push(label(n))
  const invalidPeriods = [...present].filter(n => !valid.has(n)).map(label).sort()
  const observedLast = all.length ? Math.max(...all) : null
  const asOf = observedLast === null ? null : label(observedLast)
  const observedEnd = cadence === 'monthly' ? new Date(Date.UTC(Math.floor(observedLast / 12), observedLast % 12 + 1, 0)) : new Date(Date.UTC(observedLast, 11, 31))
  const delayed = observedLast !== null && (Date.parse(today) - observedEnd.getTime()) / 86400000 > policy.dataDays
  return { missingPeriods, invalidPeriods, delayed, asOf }
}

export function historyAlerts(today, entities = [], checks = {}) {
  const alerts = []
  function inspect(id, dataId, name, record, periods, cadence, policyKey, sources = []) {
    const check = inspectHistory({ periods, cadence, today, policy: POLICY.fields[policyKey], periodStart: record.periodStart, periodEnd: record.periodEnd, ...calendarEligibility(dataId, today) })
    const tools = historyConsumerTools({ id, dataId, record, cadence, entities, today })
    const sourceUrls = [...new Set([record.sourceUrl, record.source?.url, ...(record.sourceUrls ?? []), ...sources].filter(Boolean))]
    const base = { name, dataId, field: cadence === 'monthly' ? 'Historique mensuel' : 'Performances annuelles',
      impactScope: tools.length ? 'asset' : 'catalog', tools, sourceUrls, to: `/bibliotheque-donnees?q=${encodeURIComponent(dataId)}`,
      checkedAt: record.checkedAt ?? record.source?.checkedAt ?? null, asOf: check.asOf,
      currency: record.currency ?? null, method: record.method ?? record.variant ?? null }
    if (cadence === 'monthly' && record.id) base.to = entities.find(row => row.aliases?.includes(`history:${record.id}`))?.to ?? base.to
    checks[id] = {...base, periods:periods.filter(([,v])=>Number.isFinite(v)&&(cadence!=='monthly'||v>0)).map(([d])=>String(d)), responseSha256:record.responseSha256??record.sha256??null}
    for(const window of record.historyUnqualifiedReturnWindows??[]){
      alerts.push({...base,id:`${id}:return-window:${window.start}:${window.end}`,kind:'history',unqualifiedReturnWindow:window,
        cause:window.reason,qualificationScope:'Rendements sur (début,fin] ; les périodes indépendamment corroborées restent utilisables.'})
    }
    if(record.historyUnqualifiedReturnWindows?.length)checks[id].unqualifiedReturnWindows=record.historyUnqualifiedReturnWindows
    const unqualified=record.historyExcludedMonths??[]
    if(unqualified.length){
      checks[id].periods=checks[id].periods.filter(period=>!unqualified.includes(period))
      alerts.push({...base,tools:historyConsumerTools({ id, dataId, record, cadence, entities, today, excludedMonths:unqualified }),id:`${id}:qualification`,kind:'history',invalidPeriods:unqualified,
        cause:`Composants officiels non rapprochés : ${unqualified.join(', ')}. Les fenêtres utilisant ces mois sont refusées ; les autres périodes restent qualifiables.`})
    }
    if(record.anniversaryExcludedMonths?.length)alerts.push({...base,id:`${id}:anniversary-qualification`,kind:'history',tools:['Il y a X ans'],invalidPeriods:record.anniversaryExcludedMonths,
      cause:`NAV historiques non rapprochées pour Il y a X ans : ${record.anniversaryExcludedMonths.join(', ')}. La série de rendement réinvesti est traitée séparément.`})
    if (check.missingPeriods.length || check.invalidPeriods.length) alerts.push({ ...base, id: `${id}:gaps`, kind: 'history',
      missingPeriods: check.missingPeriods, invalidPeriods: check.invalidPeriods,
      cause: [check.missingPeriods.length && `Périodes absentes dans la plage documentée de l’historique : ${check.missingPeriods.join(', ')}.`, check.invalidPeriods.length && `Valeurs non exploitables : ${check.invalidPeriods.join(', ')}.`].filter(Boolean).join(' ') })
    if (check.delayed) alerts.push({ ...base, id: `${id}:delay`, kind: 'freshness',
      cause: `Dernière période disponible : ${check.asOf}. Ancienneté supérieure au seuil de ${POLICY.fields[policyKey].dataDays} jours du registre de fraîcheur ; vérifier la publication de la source.` })
  }
  for (const file of ['automated-monthly', 'automated-etf-monthly', 'non-bond-monthly-records']) {
    for (const [id, r] of Object.entries(read(file))) if (Array.isArray(r.points)) inspect(`${file}:${id}`, r.isin ?? id, r.label ?? id, r, r.points, 'monthly', r.isin ? 'etf.monthly' : 'series.monthly')
  }
  for (const [file, id, name] of [['worldbank-gold-monthly', 'gold', 'Or · Banque mondiale'], ['bitcoin-yahoo-monthly', 'bitcoin', 'Bitcoin']]) {
    const r = read(file)
    inspect(file, id, name, r, r.points, 'monthly', 'series.monthly', [r.url].filter(Boolean))
  }
  for (const [isin, r] of Object.entries(AUTOMATED_ETF)) if (r.performance?.years) inspect(`etf:${isin}:annual`, isin, INSTRUMENTS_BY_ISIN[isin]?.name ?? isin, r.performance, Object.entries(r.performance.years), 'annual', 'etf.performance', [r.sourceUrl].filter(Boolean))
  for (const [id, r] of Object.entries(read('automated-indices'))) if (Array.isArray(r.returns?.values)) inspect(`index:${id}:annual`, id, r.name ?? id, r.returns, r.returns.values, 'annual', 'index.returns')
  return alerts
}
