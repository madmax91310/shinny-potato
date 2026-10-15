import { activeDecision, activeEstimates, calculatedRatios, canPublish, fresh, latestAccountsEnd } from './lib.js'

const positive = x => Number.isFinite(x) && x > 0
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
export const POLICY = Object.freeze({version: 1, years: 10, discount: .10, multiples: [15, 20, 25], spread: .03})
export const MODEL_NOTE = 'Simulation FCF après intérêts : financement net par dette nul, nombre d’actions constant, flux disponibles distribuables. Aucun ajout de dividendes, rachats ou trésorerie et aucune seconde déduction de dette. Les acquisitions, locations et besoins de financement exceptionnels ne sont pas modélisés.'

function validate({base, growth, discount, years, multiple}) {
  if (!positive(base) || !Number.isFinite(growth) || growth < -.5 || growth > .5
    || !Number.isFinite(discount) || discount < .01 || discount > .5
    || !Number.isInteger(years) || years < 1 || years > 20 || !positive(multiple) || multiple > 60) {
    throw new RangeError('Hypothèses hors limites : croissance −50 à 50 %, rendement 1 à 50 %, horizon 1 à 20 ans, multiple > 0 à 60.')
  }
}
// Equity cash-flow proxy, not FCFF: no net-debt subtraction and no dividends added twice.
export function cashValue(input) {
  validate(input)
  const {base, growth, discount, years, multiple} = input
  const flows = Array.from({length: years}, (_, i) => base * (1 + growth) ** (i + 1))
  const presentFlows = flows.reduce((sum, value, i) => sum + value / (1 + discount) ** (i + 1), 0)
  const terminal = flows.at(-1) * multiple / (1 + discount) ** years
  return {value: presentFlows + terminal, terminalShare: terminal / (presentFlows + terminal), flows}
}
// Terminal resale price only: earnings are not distributable cash flows.
export function earningsValue(input) {
  validate(input)
  return input.base * (1 + input.growth) ** input.years * input.multiple / (1 + input.discount) ** input.years
}
function solve(fn, target, lo, hi) {
  if (!positive(target)) return null
  let a = fn(lo) - target, b = fn(hi) - target
  if (!Number.isFinite(a) || !Number.isFinite(b) || a * b > 0) return null
  for (let i = 0; i < 90; i++) {
    const mid = (lo + hi) / 2, value = fn(mid) - target
    if (Math.abs(value) < 1e-9) return mid
    if (a * value <= 0) hi = mid
    else { lo = mid; a = value }
  }
  return (lo + hi) / 2
}
export const impliedGrowth = (input, price) => solve(growth => cashValue({...input, growth}).value, price, -.5, .5)
export const impliedReturn = (input, price) => solve(discount => cashValue({...input, discount}).value, price, .01, .5)

export function valuationInputs(company, now = new Date()) {
  const reasons = [], q = company.quote, d = activeDecision(company, now)
  const quoteOK = canPublish(company, now) && company.annual?.sourceUrl?.startsWith('https://') && q?.currency === company.currency && positive(q?.price)
    && q.sourceUrl?.startsWith('https://') && fresh(q.asOf, 10, now) && Array.isArray(q.splits)
  if (!quoteOK) reasons.push('Comptes et cours récents, source et devise cohérente requis.')
  const commonReasons=[...reasons]
  if (!d || d.accountsEndAtCollection !== latestAccountsEnd(company)) reasons.push('Composantes annuelles à renouveler.')
  // Publication counts from different documents may have different split bases.
  // Explicitly certified full-window split observation is required; never infer from an empty two-year quote feed.
  const basis = company.valuationShareBasis
  const basisOK = basis?.version === 1 && basis.currency === company.currency && fresh(basis.observedAt, 45, now)
    && basis.annualEnd === company.annual?.end && basis.accountsEndAtCollection === latestAccountsEnd(company)
    && basis.splitCheckThrough >= q?.asOf && basis.sourceUrl?.startsWith('https://')
  if (!basisOK) reasons.push('Historique des divisions d’actions et nombres d’actions à qualifier.')
  const normalised = basis?.normalisedYears
  const normalisedOK = !normalised || (normalised.length === d?.years.length && d.years.every(r => {
    const n = normalised.find(p=>p.end===r.end)
    return n && positive(n.averageDilutedShares) && n.reportedAverageDilutedShares===r.averageDilutedShares && n.sourceUrl===r.sharesBasisSource && n.adjustments?.length && n.adjustments.every(a=>positive(a.ratio)&&a.issuerSourceUrl?.startsWith('https://'))
  }))
  const history = basisOK && normalisedOK && d ? d.years.filter(y => Number.isFinite(y.freeCashFlow) && positive(y.averageDilutedShares)
    && y.sharesBasisSource?.startsWith('https://')).map(y => ({end: y.end, value: y.freeCashFlow / (normalised?.find(p=>p.end===y.end)?.averageDilutedShares ?? y.averageDilutedShares),
      sourceUrl: y.sourceUrl, sharesSourceUrl: y.sharesBasisSource, definition: y.freeCashFlowDefinition})) : []
  const continuous = history.length >= 4 && history.length === d?.years.length
    && history.at(-1).end === company.annual?.end && basis?.splitCheckFrom <= history[0].end
    && history.every((y, i) => positive(y.value) && y.definition && y.definition === history[0].definition
      && (!i || ((Date.parse(y.end)-Date.parse(history[i-1].end))/86400000 >= 330
      && (Date.parse(y.end)-Date.parse(history[i-1].end))/86400000 <= 400)))
  if (!continuous) reasons.push('Au moins quatre exercices consécutifs de FCF positif par action comparables requis.')
  const ratios = calculatedRatios(company, now), estimates = activeEstimates(company, now)
  const eps = ratios.peTTM ? company.trailing.dilutedEPS : ratios.peAnnual ? company.annual.dilutedEPS : null
  const earningsReady = Boolean(quoteOK && positive(eps) && positive(estimates?.growthEPS5Y))
  const cashReady = Boolean(quoteOK && basisOK && normalisedOK && continuous)
  const cashReasons=[...reasons]
  const elapsed = continuous ? (Date.parse(history.at(-1).end)-Date.parse(history[0].end))/86400000/365.25 : null
  return {cashReady, earningsReady, reasons, commonReasons, cashReasons, history, price: quoteOK ? q.price : null, eps,
    reportedCashPerShare: quoteOK && basisOK && history.at(-1)?.end === company.annual?.end ? history.at(-1).value : null,
    cashBase: cashReady ? history.at(-1).value : null,
    historicalGrowth: cashReady ? (history.at(-1).value/history[0].value)**(1/elapsed)-1 : null,
    estimatedGrowth: earningsReady ? estimates.growthEPS5Y/100 : null,
    pe: ratios.peTTM ?? ratios.peAnnual ?? null, forwardPE: quoteOK && estimates ? q.price/estimates.forwardEPS : null}
}

export function buildScenarios(company, overrides = {}, now = new Date()) {
  const inputs = valuationInputs(company, now)
  const cashGrowth = inputs.cashReady ? clamp(inputs.historicalGrowth, -.10, .10) : null
  const epsGrowth = inputs.earningsReady ? clamp(inputs.estimatedGrowth, 0, .10) : null
  const scenarios = ['Prudent', 'Central', 'Favorable'].map((name, index) => {
    const delta = (index - 1) * POLICY.spread
    const user = overrides[index] ?? {}
    const common = {years: POLICY.years, discount: POLICY.discount, multiple: POLICY.multiples[index]}
    const cashAssumptions = inputs.cashReady ? {...common, ...user, growth: user.cashGrowth ?? cashGrowth + delta, base: inputs.cashBase} : null
    // Five-year provider forecast is not silently extrapolated ten years.
    const earningsAssumptions = inputs.earningsReady ? {...common, years: 5, ...user, growth: user.earningsGrowth ?? epsGrowth + delta, base: inputs.eps} : null
    return {name, cashAssumptions, earningsAssumptions,
      cash: cashAssumptions ? cashValue(cashAssumptions) : null,
      earnings: earningsAssumptions ? earningsValue(earningsAssumptions) : null,
      requiredGrowth: cashAssumptions ? impliedGrowth(cashAssumptions, inputs.price) : null,
      expectedReturn: cashAssumptions ? impliedReturn(cashAssumptions, inputs.price) : null}
  })
  return {inputs, scenarios, policy: POLICY, note: MODEL_NOTE,
    rules: 'FCF : croissance historique annualisée bornée entre −10 et +10 %. BPA : croissance estimée sur cinq ans bornée entre 0 et 10 %, horizon cinq ans. Écart de ±3 points ; multiples 15/20/25 ; rendement exigé 10 %. Conventions de simulation, pas des prévisions ni des probabilités. La base comptable des prévisions Finviz n’est pas précisée ; elle peut différer du BPA publié. Les deux méthodes ne sont pas moyennées.'}
}

