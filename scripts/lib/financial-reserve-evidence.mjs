// Audit evidence only. Never changes prices, admission rules or financial tolerances.
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {gunzipSync} from 'node:zlib'
import {join} from 'node:path'

const text = value => value.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').trim()
const one = values => { if (values.length !== 1) throw new Error('Missing or ambiguous official observation'); return values[0] }
const positive = value => {
  if (typeof value === 'string' && /^\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)) value = Number(value)
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error('Invalid official level')
  return value
}

export function officialClose(html, date) {
  const header = html.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/i)?.[1] ?? ''
  const labels = [...header.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(m => text(m[1]).toLowerCase())
  if (labels[0] !== 'date' || labels[5] !== 'close') throw new Error('Official closing-price columns changed')
  const expected = date.split('-').reverse().join('/')
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(m => [...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(c => text(c[1])))
    .filter(c => c[0] === expected)
  const value = one(rows)[5]
  if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error('Unqualified official price format')
  return positive(Number(value))
}

export function loadMarketNavEvidence(root, read = readFileSync) {
  try {
    const spec = JSON.parse(read(join(root, 'market-nav-evidence.json')))
    const hosts = {identity:'live.euronext.com',startQuote:'live.euronext.com',endQuote:'live.euronext.com',nav:'www.blackrock.com',fx:'www.ecb.europa.eu'}
    const captures = {}
    for (const [key, host] of Object.entries(hosts)) {
      const ref = spec.captures?.[key]
      if (!ref || !/^[\w.-]+$/.test(ref.file) || new URL(ref.sourceUrl).protocol !== 'https:' || new URL(ref.sourceUrl).hostname !== host) throw new Error('Wrong official source')
      const file = read(join(root, ref.file))
      const raw = ref.file.endsWith('.gz') ? gunzipSync(file) : file
      if (createHash('sha256').update(raw).digest('hex') !== ref.uncompressedSha256) throw new Error('Official capture hash mismatch')
      captures[key] = raw.toString('utf8')
    }
    const identity = JSON.parse(captures.identity.match(/<script\b[^>]*data-drupal-selector="drupal-settings-json"[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '{}').custom?.instrument
    if (!identity || identity.isin !== spec.isin || identity.mic !== spec.listing?.mic || identity.symbol !== spec.listing?.ticker) throw new Error('Wrong exchange share identity')
    const body = JSON.parse(captures.nav).componentsByNameMap
    const facts = body.keyFundFacts.containersByNameMap.default.dataPointsByNameMap
    const chart = body.performance.containersByNameMap.chart.dataPointsByNameMap
    const calendar = body.performance.containersByNameMap.returns.subContainersByNameMap.calendar.dataPointsByNameMap
    if (facts.isin.value !== spec.isin || facts.useOfProfitsCode.value !== 'Accumulating' || chart.currencySymbol.value !== spec.navCurrency || calendar.returnsByCurrency.value.annualNav !== spec.navCurrency) throw new Error('Wrong NAV share or convention')
    const dates = [spec.start, spec.end]
    if (spec.schema !== 1 || dates[0]?.slice(0,7) !== `${spec.year-1}-12` || dates[1]?.slice(0,7) !== `${spec.year}-12`) throw new Error('Wrong official period')
    const levels = key => dates.map(date => {
      const points = chart[key]
      if (points.asOfDate.length !== points.value.length) throw new Error('Misaligned issuer dates')
      return positive(one(points.value.filter((_,i) => String(points.asOfDate[i]) === date.replaceAll('-',''))))
    })
    const nav = levels('navData'), totalReturn = levels('performanceData')
    const types = calendar.returnTypes.value, column = one(types.flatMap((t,i) => t === 'annualNav' ? [i] : []))
    const annual = Number(one(Object.values(calendar).filter(p => p?.active && String(p.asOfDate) === `${spec.year}1231` && Array.isArray(p.value))).value[column])
    const usdPerEur = dates.map(date => {
      const section = one([...captures.fx.matchAll(/<Cube\s+time=['"]([^'"]+)['"]\s*>([\s\S]*?)<\/Cube>/g)].filter(m => m[1] === date))[2]
      return positive(Number(one([...section.matchAll(/<Cube\s+currency=['"]USD['"]\s+rate=['"]([^'"]+)['"]\s*\/>/g)])[1]))
    })
    return {evidence:{...spec,nav,totalReturn,usdPerEur,annual,closes:[officialClose(captures.startQuote,spec.start),officialClose(captures.endQuote,spec.end)]},error:null}
  } catch (error) { return {evidence:null,error:error.message} }
}

export function explainOfficialMarketNav({isin,year,history,record,left,right,evidence,fx,convert}) {
  if (!evidence || evidence.isin !== isin || evidence.year !== year || record?.id !== evidence.assetId || history?.isin !== isin || record.isin !== isin) return null
  const {listing,navCurrency,start,end,closes,nav,totalReturn,usdPerEur,publishedDecimalPlaces} = evidence
  if (record.parser !== 'yahoo' || record.field !== 'adjclose' || record.mic !== listing.mic || record.ticker !== listing.ticker || record.currency !== listing.currency || listing.currency !== 'EUR' || navCurrency !== 'USD') return null
  if (start?.slice(0,7) !== `${year-1}-12` || end?.slice(0,7) !== `${year}-12` || publishedDecimalPlaces !== 2) return null
  if (![...closes,...nav,...totalReturn,...usdPerEur].every(v => typeof v === 'number' && Number.isFinite(v) && v > 0)) return null
  const points = new Map(record.points)
  for (let i=0;i<2;i++) {
    const date = [start,end][i], rates = fx.months[date.slice(0,7)]
    if (rates?.asOf !== date || rates.rates?.USD !== usdPerEur[i]) return null
    if (points.get(date.slice(0,7)) !== Math.round(Math.fround(closes[i])*1e6)/1e6) return null
  }
  const native = (nav[1]/nav[0]-1)*100, reinvested = (totalReturn[1]/totalReturn[0]-1)*100
  const published = Math.round(evidence.annual*100)/100
  if (!(native >= published-.005 && native < published+.005 && reinvested >= published-.005 && reinvested < published+.005)) return null
  // Same arithmetic as the monthly-history consumer, with exact inputs.
  // This avoids treating IEEE-754 evaluation order as a financial tolerance.
  const first = points.get(start.slice(0,7)), last = points.get(end.slice(0,7))
  const actualLeft = (last-first)/first*100
  const actualRight = convert(published,year,navCurrency,'EUR')
  if (left !== actualLeft || right !== actualRight) return null
  const marketReturn = (closes[1]/closes[0]-1)*100, navReturn = (nav[1]/nav[0]*usdPerEur[0]/usdPerEur[1]-1)*100
  const relativeValuation = closes.map((p,i) => p*usdPerEur[i]/nav[i])
  return {cause:'Clôtures de la cotation et NAV officiellement corroborées ; valorisations distinctes aux mêmes bornes',isin,listing,start,end,closes,nav,usdPerEur,marketReturn,navReturn,publishedCalendarReturn:actualRight,relativeValuation,
    decompositionPercentagePoints:{marketVersusNav:marketReturn-navReturn,calendarPrecision:navReturn-actualRight,quoteRepresentation:actualLeft-marketReturn,total:actualLeft-actualRight},
    sourceCaptures:evidence.captures,scope:'Cette comparaison seulement ; les facteurs relatifs ne sont pas attribués au seul spread ou au seul horaire. Aucune tolérance financière ni admission modifiée.'}
}

export function retainedBoundary(initial, record, level, monthQualified) {
  const proof = record?.calendarProof
  const controlled = record?.isin === initial.isin && proof?.controlledInstrument === initial.isin && proof.controlledFields?.length > 0
  const withheld = controlled ? proof.withheldMonthlyEnds ?? [] : []
  const problemMonth = initial.navLast.slice(0,7)
  const problemMonthWithheld = withheld.some(row => row.month === problemMonth)
  const qualified = !!(controlled && monthQualified && record.periodEnd >= problemMonth
    && record.points?.some(p => p[0] === problemMonth) && !record.historyExcludedMonths?.includes(problemMonth) && !problemMonthWithheld)
  return {id:initial.id,isin:initial.isin,initial,problemMonth,
    current:{evidenceCheckedAt:record?.checkedAt??null,periodEnd:record?.periodEnd??null,controlledInstrument:proof?.controlledInstrument??null,withheldMonthlyEnds:withheld,excludedMonths:record?.historyExcludedMonths??[],scaleProof:proof?.scaleProof??null,level:level?.isin===initial.isin?level:null},
    monthQualified:qualified,problemMonthWithheld,retainedPartialQualification:!!(controlled && withheld.length),
    classification:qualified?'résolu depuis — borne mensuelle commune qualifiée':controlled && problemMonthWithheld?'qualification partielle — rendement du mois toujours refusé':'preuve courante insuffisante — dernière qualification conservée',
    latestRefreshOutcome:'Non déduit de la seule présence d’un historique conservé'}
}
