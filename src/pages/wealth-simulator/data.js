import { currentSavingsObservation } from '../../data/economic-data.js'
import { REGULATORY, REGULATORY_OBSERVATIONS } from '../../data/regulatory-data.js'
import { PEL_CEILING, PEL_SOURCE_URL, pelRateFor } from '../../data/pel-rates.js'

export const SAVINGS = currentSavingsObservation()
export const ENVELOPES = [
  { id: 'livret-a', name: 'Livret A', ceiling: REGULATORY.livretCeiling, source: REGULATORY_OBSERVATIONS.livret?.sourceUrl },
  { id: 'ldds', name: 'LDDS', ceiling: REGULATORY.lddsCeiling, source: REGULATORY_OBSERVATIONS.ldds?.sourceUrl },
  { id: 'av', name: 'Assurance-vie' },
  { id: 'pea', name: 'PEA', ceiling: REGULATORY.peaCeiling, source: REGULATORY_OBSERVATIONS.pea?.sourceUrl },
  { id: 'cto', name: 'CTO' },
  { id: 'pel', name: 'PEL', ceiling: PEL_CEILING, source: PEL_SOURCE_URL }, { id: 'other', name: 'Autre placement' },
]
// Taux réglementaires préremplis : Livret A observé, LDDS publié par service-public, PEL selon la
// génération d’ouverture. Les autres enveloppes partent de 0 : leur rendement est une hypothèse.
export function regulatedRate(envelope, opened) {
  if (envelope === 'livret-a') return SAVINGS?.rate ?? 0
  if (envelope === 'ldds') return REGULATORY.lddsRate ?? SAVINGS?.rate ?? 0
  if (envelope === 'pel') return pelRateFor(opened ?? new Date().toISOString().slice(0, 10)) ?? 0
  return 0
}
export const SCENARIOS = [
  { id: 'low', label: 'Prudent', color: '#ffb454', dash: [24, 14] },
  { id: 'central', label: 'Central', color: '#42e2ba', dash: [] },
  { id: 'high', label: 'Favorable', color: '#a69bff', dash: [2, 14] },
]
export const HORIZONS = [5, 10, 15, 20, 30]
export function newPocket(envelope = 'pea', id = crypto.randomUUID()) {
  const opened = envelope === 'pel' ? new Date().toISOString().slice(0, 10) : undefined
  const rate = regulatedRate(envelope, opened)
  return { id, envelope, name: ENVELOPES.find(e => e.id === envelope)?.name ?? 'Placement', initial: 0,
    monthly: 0, rates: { low: rate, central: rate, high: rate }, fee: 0, rateMode: 'net', tax: 0,
    contributionGrowth: 0, ...(opened ? { opened } : {}) }
}
export function emptyPlan() {
  return { version: 1, years: 20, inflation: 2, active: 'a', scenario: 'central', mode: 'personal',
    portfolios: { a: { name: 'Patrimoine A', pockets: ['livret-a', 'av', 'pea', 'cto'].map((e, i) => newPocket(e, `a-${i}`)), events: [] },
      b: { name: 'Patrimoine B', pockets: ['livret-a', 'av', 'pea', 'cto'].map((e, i) => newPocket(e, `b-${i}`)), events: [] } } }
}
// Hypothèses pédagogiques, jamais des prévisions ou des rendements historiques.
export function examplePlan() {
  const plan = emptyPlan()
  for (const key of ['a', 'b']) {
    plan.portfolios[key].pockets.forEach((p, i) => {
      p.initial = [15000, 10000, 8000, 2000][i]
      p.monthly = [200, 100, 400, 50][i]
      if (i > 0) p.rates = i === 1 ? { low: 1, central: 2.5, high: 4 } : { low: 3, central: 5, high: 7 }
    })
  }
  plan.portfolios.b.pockets[0].monthly = 350
  plan.portfolios.b.pockets[2].monthly = 250
  return plan
}
