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
  // Reviewed 28/10/2026, high confidence on reference weights (sources below).
  // Regional splits are editorial adaptations, never historical EAFE/ex-USA proxies.
  {
    id: 'ivy', label: 'Ivy Portfolio · statique adapté', emoji: '🎓',
    explanation: 'Mebane Faber et Eric Richardson proposent cinq poches égales pour diversifier au-delà du couple actions/obligations. La version retenue est l’Ivy statique : elle reste investie, sans filtre de tendance ni passage automatique en liquidités.',
    origin: 'Mebane Faber et Eric Richardson · The Ivy Portfolio (2009), version statique à cinq classes ; définition illustrée dans Global Asset Allocation (2015), figure 37.',
    reference: rows([['us',20,'Actions américaines'],['international',20,'Actions développées étrangères'],['bonds',20,'Emprunts du Trésor américain à 10 ans'],['property',20,'Immobilier coté américain'],['commodities',20,'Matières premières diversifiées']]),
    rebalancing: 'Rééquilibrage annuel au début de chaque année simulée. Faber recommande un retour annuel aux poids cibles en compte défiscalisé pour la version statique ; en compte imposable, il évoque les flux. Le filtre mensuel de la version tactique n’est pas appliqué.',
    adaptation: 'Adaptation européenne et régionale, sans reproduction exacte : S&P 500 pour les actions américaines ; 10 % Europe, 6 % Japon et 4 % Pacifique hors Japon pour les 20 % développés étrangers. Ce partage fixe 50/30/20 est un choix éditorial, pas la pondération d’un indice international ; il exclut les émergents, le Canada et Israël, et ajoute les petites capitalisations japonaises via Japan IMI. Obligations d’États euro 5–7 ans à la place des Treasuries à 10 ans, immobilier développé mondial au lieu des REIT américains et Bloomberg Commodity au lieu du panier GSCI étudié dans le papier de Faber. Durées, devises, pays et poids des matières premières diffèrent.',
    limits: 'Les 20 % de matières premières utilisent des contrats à terme : le renouvellement des contrats peut coûter, même si les prix au comptant montent. Les foncières restent des actions sensibles aux taux. Quatre poches peuvent baisser ensemble ; aucun signal ne les vend pour éviter un krach. Une cotation en euros ne couvre pas les monnaies des actions.',
    comparison: 'Par rapport à l’All Weather euro, davantage d’immobilier coté et de matières premières, moins d’obligations et aucun or. Contrairement au Permanent Portfolio et au Golden Butterfly, aucune poche de liquidités ni d’or. Les cinq parts égales ne signifient pas cinq risques égaux.',
    performanceNote: 'Rendements totaux des parts exactes, revenus réinvestis : NAV pour les autres poches et cours de marché ajustés en EUR pour le Pacifique hors Japon. Cette dernière série peut différer de la NAV. Les rendements USD sont convertis en EUR aux fixings BCE de décembre ; aucune série d’indice ni année antérieure au lancement n’est ajoutée.',
    sources: [
      { label: 'Faber · Global Asset Allocation, chapitre 9, figure 37 (2015)', url: 'https://mebfaber.com/wp-content/uploads/2016/04/GAA-Book-1.pdf#page=67' },
      { label: 'Faber · papier QTAA, classes de référence (2013)', url: 'https://mebfaber.com/wp-content/uploads/2016/05/SSRN-id962461.pdf#page=15' },
      { label: 'Faber · FAQ sur le rééquilibrage statique et tactique (2013)', url: 'https://mebfaber.com/2013/06/14/qtaa-update-conclustions-and-faqs/' },
    ],
    presets: [{
      id: 'euro-regions', label: 'Ivy statique · adaptation euro et régions',
      description: 'Cinq poches de 20 %, dont la poche étrangère répartie entre trois fonds régionaux : sept supports au total.',
      thesis: 'L’Ivy statique de Faber et Richardson répartit le capital entre cinq classes égales, sans filtre de tendance. Cette adaptation utilise des actions Europe/Japon/Pacifique hors Japon, des obligations euro, de l’immobilier mondial et Bloomberg Commodity. Rééquilibrage annuel ; foncières et matières premières peuvent subir de fortes baisses.',
      assets: rows([['sp500_ishares',20,'Actions américaines · S&P 500'],['msci_europe',10,'Actions étrangères · Europe'],['actions_japon',6,'Actions étrangères · Japon IMI'],['manual-IE00B52MJY50',4,'Actions étrangères · Pacifique hors Japon'],['euro-govt-5-7',20,'États euro · 5–7 ans'],['immo_ishares_yield',20,'Immobilier coté développé mondial'],['mp_large',20,'Matières premières · Bloomberg Commodity']]),
    }],
  },
  {
    id: 'swensen', label: 'Swensen 2005 · adapté', emoji: '🏛️',
    explanation: 'Dans Unconventional Success, David Swensen propose aux particuliers un portefeuille orienté vers la croissance : 50 % d’actions, 20 % d’immobilier coté et 30 % d’obligations souveraines, dont la moitié indexée sur l’inflation. Ce portefeuille de particuliers est distinct de la dotation de Yale et de ses placements privés.',
    origin: 'David Swensen · Unconventional Success (2005). Version initiale à 20 % de REIT et 5 % d’émergents ; la révision citée par Yale en 2009, à 15 % de REIT et 10 % d’émergents, n’est pas retenue.',
    reference: rows([['us',30,'Actions américaines'],['international',15,'Actions développées hors États-Unis'],['emerging',5,'Actions émergentes'],['property',20,'REIT américains'],['bonds',15,'Treasuries américains'],['inflation',15,'TIPS américains']]),
    rebalancing: 'Swensen recommande de revenir régulièrement aux allocations cibles. L’entretien Yale cité ne fixe pas de calendrier annuel : le retour aux poids au début de chaque année est ici la convention explicite du simulateur, pas une règle annuelle attribuée à l’auteur.',
    adaptation: 'Adaptation européenne et régionale : S&P 500 au lieu du marché américain total ; les 15 % développés étrangers sont répartis en 7,5 % Europe, 4,5 % Japon IMI et 3 % Pacifique hors Japon. Ce partage éditorial fixe 50/30/20 exclut le Canada et Israël et ajoute les petites capitalisations japonaises ; il ne réplique pas un indice hors États-Unis. Immobilier développé mondial au lieu des REIT américains. Les Treasuries et TIPS sont remplacés respectivement par des États euro 5–7 ans et des obligations indexées sur l’inflation euro : autres émetteurs, durées et inflation de référence. Le risque souverain euro ne se confond pas avec celui du Trésor américain.',
    limits: 'Les actions et foncières représentent 70 % du capital et peuvent chuter ensemble. L’immobilier est coté, pas un revenu locatif garanti. Les obligations indexées baissent si les taux réels montent ; elles ne garantissent pas le pouvoir d’achat du portefeuille ni l’inflation personnelle. Les marchés émergents ajoutent des risques politiques, de liquidité et de change.',
    comparison: 'À la différence de l’Ivy statique, aucune matière première : Swensen distingue développés/émergents et obligations nominales/indexées. Face au 60/40, l’immobilier coté et l’indexation sont des choix structurels supplémentaires. Aucune poche d’or ou de liquidités comme dans le Permanent Portfolio.',
    performanceNote: 'Rendements totaux des parts exactes, revenus réinvestis : NAV pour les autres poches et cours de marché ajustés en EUR pour le Pacifique hors Japon. Cette dernière série peut différer de la NAV. Les rendements USD sont convertis en EUR aux fixings BCE de décembre ; aucune série d’indice ni année antérieure au lancement n’est ajoutée.',
    sources: [
      { label: 'Yale Alumni Magazine · entretien avec Swensen et allocations 2005/2009', url: 'https://www.yalealumnimagazine.com/articles/2398' },
    ],
    presets: [{
      id: 'euro-regions', label: 'Swensen 2005 · adaptation euro et régions',
      description: '30 % actions américaines, 15 % développés étrangers, 5 % émergents, 20 % immobilier coté, 15 % obligations nominales et 15 % indexées : huit supports.',
      thesis: 'Inspirée de Swensen 2005 pour les particuliers, cette adaptation conserve 70 % d’actions et foncières. Elle utilise S&P 500, Europe/Japon/Pacifique hors Japon, émergents, immobilier mondial et obligations euro nominales et indexées. Rééquilibrage annuel choisi pour la simulation. Les taux réels peuvent faire baisser les obligations indexées ; ce n’est pas le portefeuille de Yale.',
      assets: rows([['sp500_ishares',30,'Actions américaines · S&P 500'],['msci_europe',7.5,'Actions étrangères · Europe'],['actions_japon',4.5,'Actions étrangères · Japon IMI'],['manual-IE00B52MJY50',3,'Actions étrangères · Pacifique hors Japon'],['msci_em_spdr',5,'Actions émergentes'],['immo_ishares_yield',20,'Immobilier coté développé mondial'],['euro-govt-5-7',15,'États euro · 5–7 ans'],['oblig_inflation',15,'États euro · indexés inflation']]),
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
  msci_europe: 'Participer à la croissance des grandes et moyennes entreprises européennes ; cette région ne représente pas tous les marchés développés hors États-Unis.',
  actions_japon: 'Ajouter les grandes, moyennes et petites entreprises japonaises via MSCI Japan IMI, avec risque de change.',
  'manual-IE00B52MJY50': 'Compléter avec le Pacifique développé hors Japon, notamment Australie, Hong Kong, Singapour et Nouvelle-Zélande ; cours ajustés en EUR, sans couverture de change du fonds.',
  msci_em_spdr: 'Ajouter les grandes et moyennes entreprises des pays émergents, avec leurs risques politiques, économiques et de change.',
  immo_ishares_yield: 'Investir dans des sociétés immobilières cotées des pays développés avec un filtre de rendement en dividendes ; ce sont des actions sensibles aux taux, pas des immeubles détenus directement ni les seuls REIT américains.',
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
