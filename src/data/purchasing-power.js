// Niveaux officiels INSEE, collectés par refresh_purchasing_power.py.
// Prix : moyenne annuelle de départ -> niveau mensuel, dans la même base 2025.
// IRL : T1 de départ -> dernier trimestre publié ; SMIC : janvier -> montant en vigueur.
import OBSERVATIONS from './purchasing-power-observations.json' with { type: 'json' }
export { AMOUNT_PRESETS } from './market-history.js'
export const PURCHASING_OBSERVATIONS = OBSERVATIONS
export const YEAR_MIN = 2010
export const YEAR_MAX = Math.min(...['general', 'alimentation', 'energie'].map(k => Math.max(...Object.keys(OBSERVATIONS.prices.annualLevels[k]).map(Number))))
export const YEAR_PRESETS = [2010, 2015, 2020].filter(y => y <= YEAR_MAX)
const monthLabel = period => new Date(`${period}-01T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
export const GENERAL_PRICE_LEVELS = OBSERVATIONS.prices.annualLevels.general
export const ALIMENTATION = OBSERVATIONS.prices.annualLevels.alimentation
export const ENERGIE = OBSERVATIONS.prices.annualLevels.energie
export const PRICE_OBSERVATION = {
  asOf: OBSERVATIONS.prices.asOf, label: monthLabel(OBSERVATIONS.prices.asOf),
  baseYear: OBSERVATIONS.prices.baseYear, ...OBSERVATIONS.prices.latestLevels,
  provisional: OBSERVATIONS.prices.provisional,
}
export const RENT_OBSERVATION = {
  asOf: OBSERVATIONS.irl.asOf, label: `T${OBSERVATIONS.irl.asOf.at(-1)} ${OBSERVATIONS.irl.asOf.slice(0, 4)}`,
  value: OBSERVATIONS.irl.values[OBSERVATIONS.irl.asOf],
}
export const SMIC_OBSERVATION = {
  asOf: OBSERVATIONS.smic.asOf, label: monthLabel(OBSERVATIONS.smic.asOf),
  value: OBSERVATIONS.smic.values[OBSERVATIONS.smic.asOf],
}
export const IRL_LOYER = Object.fromEntries(Object.entries(OBSERVATIONS.irl.values).filter(([p]) => p.endsWith('-Q1')).map(([p, v]) => [p.slice(0, 4), v]))
export const SMIC = Object.fromEntries(Object.entries(OBSERVATIONS.smic.values).filter(([p]) => p.endsWith('-01')).map(([p, v]) => [p.slice(0, 4), v]))

export const POSTES = {
  loyer: {
    id: 'loyer', label: 'Loyer', icon: '🏠',
    tweetNoun: 'ton loyer', tweetVerb: 'de loyer',
    series: IRL_LOYER, seriesType: 'level', latestValue: RENT_OBSERVATION.value,
    sourceLabel: "Indice de référence des loyers (IRL), INSEE",
  },
  alimentation: {
    id: 'alimentation', label: 'Alimentation', icon: '🛒',
    tweetNoun: 'tes courses', tweetVerb: "d'alimentation",
    series: ALIMENTATION, seriesType: 'level', latestValue: PRICE_OBSERVATION.alimentation,
    sourceLabel: "Indice des prix à la consommation - fonction Alimentation, INSEE",
  },
  carburant: {
    // Keep the historical ID for saved selections; this series covers all energy.
    id: 'carburant', label: 'Énergie', icon: '⚡',
    tweetNoun: 'ton budget énergie', tweetVerb: "d'énergie",
    series: ENERGIE, seriesType: 'level', latestValue: PRICE_OBSERVATION.energie,
    sourceLabel: "Indice des prix à la consommation - fonction Énergie, INSEE",
  },
}
export const POSTE_ORDER = ['loyer', 'alimentation', 'carburant']
