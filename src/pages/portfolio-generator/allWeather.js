import { buildManualPortfolio } from './engine.js'
import { annualizedReturn } from './performance.js'

// Editorial allocations, 16/10/2026. These are unlevered EUR-bond adaptations,
// not Bridgewater's proprietary risk-parity portfolio or a US Treasury replica.
// Framework: https://www.bridgewater.com/research-and-insights/the-all-weather-story
// Only existing exact-share return series are used; refresh stays in the shared collectors.
const rows = pairs => pairs.map(([id, pct, role]) => ({ id, pct, role }))
export const ALL_WEATHER_PRESETS = [
  {
    id: 'euro', label: 'All Weather · adaptation euro',
    description: '30 % d’actions mondiales, 55 % d’obligations souveraines en euros, 7,5 % d’or et 7,5 % de matières premières.',
    thesis: 'Cette adaptation All Weather associe plusieurs moteurs économiques, avec des obligations en euros. Les obligations longues restent très sensibles aux taux ; les différentes poches peuvent baisser ensemble.',
    assets: rows([['msci_world_ishares',30,'Actions mondiales'],['oblig_eur_long_ishares',40,'États euro · 15–30 ans'],['euro-govt-5-7',15,'États euro · 5–7 ans'],['or',7.5,'Or physique'],['mp_large',7.5,'Matières premières diversifiées']]),
  },
  {
    id: 'inflation', label: 'All Weather · obligations indexées',
    description: '15 % d’obligations indexées sur l’inflation remplacent une partie des obligations longues.',
    thesis: 'Cette variante All Weather ajoute des obligations indexées sur l’inflation à la diversification actions, obligations, or et matières premières. L’indexation ne protège pas leur cours contre une hausse des taux réels.',
    assets: rows([['msci_world_ishares',30,'Actions mondiales'],['oblig_eur_long_ishares',25,'États euro · 15–30 ans'],['euro-govt-5-7',15,'États euro · 5–7 ans'],['oblig_inflation',15,'États euro · indexés inflation'],['or',7.5,'Or physique'],['mp_large',7.5,'Matières premières diversifiées']]),
  },
  {
    id: 'shorter', label: 'All Weather · durée obligataire réduite',
    description: 'La poche 15–30 ans passe de 40 % à 20 %, au profit des échéances 5–7 ans et 1–3 ans.',
    thesis: 'Cette variante All Weather réduit la place des obligations longues pour limiter la sensibilité de la poche obligataire aux taux. Elle modifie aussi son comportement lorsque les taux baissent, sans garantir une protection du capital.',
    assets: rows([['msci_world_ishares',30,'Actions mondiales'],['oblig_eur_long_ishares',20,'États euro · 15–30 ans'],['euro-govt-5-7',25,'États euro · 5–7 ans'],['oblig_etat_eur_short',10,'États euro · 1–3 ans'],['or',7.5,'Or physique'],['mp_large',7.5,'Matières premières diversifiées']]),
  },
]

export const ALL_WEATHER_NOTE = 'Adaptations pédagogiques sans levier, avec obligations en euros et actions mondiales. Elles ne reproduisent pas le portefeuille propriétaire de Bridgewater ni une allocation en Treasuries américains. Les pondérations sont fixes et rétablies chaque année dans la simulation.'

export function buildAllWeatherPortfolio(presetId, history = []) {
  const preset = ALL_WEATHER_PRESETS.find(item => item.id === presetId)
  if (!preset) throw new Error('Variante All Weather inconnue.')
  const portfolio = buildManualPortfolio(preset.assets, 'generaliste', history)
  if (annualizedReturn(portfolio.perf) === null) throw new Error('Historique commun insuffisant pour cette variante All Weather.')
  return { ...portfolio, mode: 'preset', presetId, title: preset.label,
    profileName: 'All Weather', riskLabel: 'Allocation fixe', recipeLabel: preset.label,
    strategyLabel: preset.label, strategyThesis: preset.thesis }
}
