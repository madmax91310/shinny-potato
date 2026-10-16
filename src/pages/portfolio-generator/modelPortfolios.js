import { ALL_WEATHER_PRESETS, ALL_WEATHER_NOTE, buildAllWeatherPortfolio } from './allWeather.js'
import { buildManualPortfolio } from './engine.js'
import { annualizedReturn } from './performance.js'

// 16/10/2026: model definitions reviewed against Portfolio Charts' allocation tables.
// https://portfoliocharts.com/portfolios/permanent-portfolio/
// https://portfoliocharts.com/portfolios/golden-butterfly-portfolio/
// These are explicitly labelled adaptations using existing collected share classes.
// The 40/60–80/20 allocations are editorial stock/bond examples, not attributed models.
const rows = pairs => pairs.map(([id, pct, role]) => ({ id, pct, role }))
const balanced = equity => ({
  id: `${equity}-${100-equity}`, label: `${equity}/${100-equity} · actions mondiales et obligations`,
  description: `${equity} % d’actions mondiales et ${100-equity} % d’obligations mondiales couvertes en euros.`,
  thesis: `Le portefeuille ${equity}/${100-equity} répartit le capital entre ${equity} % d’actions pour la croissance et ${100-equity} % d’obligations pour diversifier. Ici, les obligations mondiales sont couvertes en euros. Les deux poches peuvent baisser ensemble.`,
  assets: rows([['msci_world_ishares',equity,'Actions mondiales'],['oblig_global_agg_eur_hedged',100-equity,'Obligations mondiales · couvertes en EUR']]),
})

export const MODEL_FAMILIES = [
  {
    id: 'all-weather', label: 'All Weather', emoji: '🌦️',
    explanation: 'L’approche All Weather cherche à répartir les moteurs du portefeuille entre différents contextes de croissance et d’inflation. Elle combine actions, obligations et actifs réels pour éviter de dépendre d’un seul scénario économique.',
    adaptation: ALL_WEATHER_NOTE,
    presets: ALL_WEATHER_PRESETS,
  },
  {
    id: 'permanent', label: 'Permanent Portfolio', emoji: '🧩',
    explanation: 'Harry Browne a conçu le Permanent Portfolio autour de quatre poches égales : actions, obligations longues, liquidités et or. Chacune répond à une logique économique différente. Les parts égales portent sur le capital, pas sur le risque de chaque poche.',
    adaptation: 'Cette adaptation utilise des actions mondiales et des obligations en euros. La poche de liquidités est représentée par un ETF monétaire en euros, en remplacement des bons du Trésor américains du modèle d’origine.',
    presets: [{
      id: 'euro', label: 'Permanent Portfolio · adaptation euro',
      description: 'Quatre poches de 25 %, avec actions mondiales, obligations longues en euros, monétaire et or.',
      thesis: 'Le Permanent Portfolio de Harry Browne répartit le capital en quatre poches égales pour diversifier les scénarios économiques : actions, obligations longues, liquidités et or. Cette adaptation utilise des actions mondiales et un ETF monétaire en euros. Les obligations longues restent sensibles aux taux.',
      assets: rows([['msci_world_ishares',25,'Actions mondiales'],['oblig_eur_long_ishares',25,'États euro · 15–30 ans'],['monetaire_xeon',25,'Monétaire en euros'],['or',25,'Or physique']]),
    }],
  },
  {
    id: 'golden-butterfly', label: 'Golden Butterfly', emoji: '🦋',
    explanation: 'Le Golden Butterfly, créé par Tyler de Portfolio Charts, répartit le capital en cinq poches égales. Il ajoute des petites entreprises américaines « value », sélectionnées selon des critères de valorisation, aux grandes actions, obligations longues, obligations courtes et or. Les actions représentent ainsi 40 % du capital.',
    adaptation: 'Les deux poches actions restent américaines. Les obligations d’État américaines du modèle d’origine sont remplacées ici par des obligations d’État en euros à 15–30 ans et à 1–3 ans. Cette adaptation modifie le risque de change et le comportement de la poche obligataire.',
    presets: [{
      id: 'euro-bonds', label: 'Golden Butterfly · obligations euro',
      description: 'Cinq poches de 20 %, dont deux poches actions américaines aux expositions différentes.',
      thesis: 'Le Golden Butterfly combine cinq poches égales : grandes actions américaines, petites entreprises américaines value, obligations longues, obligations courtes et or. Les actions pèsent 40 %. Cette adaptation emploie des obligations en euros ; le biais small value peut sous-performer durablement.',
      assets: rows([['sp500_ishares',20,'Grandes actions américaines'],['small-value-usa',20,'Petites actions américaines · value'],['oblig_eur_long_ishares',20,'États euro · 15–30 ans'],['oblig_etat_eur_short',20,'États euro · 1–3 ans'],['or',20,'Or physique']]),
    }],
  },
  {
    id: 'stock-bond', label: 'Actions / obligations', emoji: '⚖️',
    explanation: 'Le classique 60/40 place 60 % du capital en actions et 40 % en obligations. Les actions apportent le moteur de croissance ; les obligations ajoutent une autre source de rendement et de risque. Les variantes 40/60 et 80/20 changent la place accordée aux actions, sans ajouter de nouvelle classe d’actifs.',
    adaptation: 'Les actions suivent le MSCI World, composé de pays développés. Les obligations couvrent un marché mondial d’États et d’entreprises, avec couverture de change en euros. Les deux poches peuvent baisser simultanément, notamment lors d’une hausse des taux.',
    presets: [balanced(60), balanced(40), balanced(80)],
  },
]

export const MODEL_METHOD = 'Pondérations fixes, rétablies chaque année dans la simulation. Performances calculées en euros sur la période commune disponible, hors courtage et fiscalité.'

export const MODEL_ASSET_ROLES = {
  msci_world_ishares: 'Participer à la croissance des grandes et moyennes entreprises des pays développés.',
  sp500_ishares: 'Participer à la croissance des grandes entreprises américaines.',
  'small-value-usa': 'Ajouter une exposition aux petites entreprises américaines sélectionnées selon leur valorisation.',
  oblig_eur_long_ishares: 'Apporter une forte exposition aux taux longs ; cette poche peut fortement baisser lorsque les taux montent.',
  'euro-govt-5-7': 'Diversifier avec des obligations souveraines de durée intermédiaire.',
  oblig_etat_eur_short: 'Réduire la durée de la poche obligataire par rapport aux obligations longues.',
  oblig_inflation: 'Ajouter des obligations dont les flux sont indexés sur l’inflation ; leur cours reste sensible aux taux réels.',
  monetaire_xeon: 'Représenter la poche de liquidités avec une exposition aux taux monétaires en euros.',
  or: 'Diversifier avec un métal sans coupon ni dividende, dont le prix peut aussi baisser.',
  mp_large: 'Ajouter un panier de matières premières, exposé au cycle économique et aux prix des ressources.',
  oblig_global_agg_eur_hedged: 'Diversifier entre obligations d’États et d’entreprises mondiales, avec couverture de change en euros.',
}

export function getModelFamily(familyId) {
  const family = MODEL_FAMILIES.find(item => item.id === familyId)
  if (!family) throw new Error('Famille de portefeuille inconnue.')
  return family
}

export function buildModelPortfolio(familyId, presetId, history = []) {
  const family = getModelFamily(familyId)
  const preset = family.presets.find(item => item.id === presetId)
  if (!preset) throw new Error('Variante de portefeuille inconnue.')
  const portfolio = familyId === 'all-weather'
    ? buildAllWeatherPortfolio(presetId, history)
    : buildManualPortfolio(preset.assets, 'generaliste', history)
  if (annualizedReturn(portfolio.perf) === null) throw new Error('Historique commun insuffisant pour ce portefeuille modèle.')
  return { ...portfolio, mode: 'preset', familyId, presetId, title: preset.label,
    profileName: family.label, riskLabel: 'Allocation fixe', recipeLabel: preset.label,
    strategyLabel: preset.label, strategyEmoji: family.emoji, strategyThesis: preset.thesis }
}
