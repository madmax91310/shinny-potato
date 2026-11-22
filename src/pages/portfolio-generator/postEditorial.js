import { assetEditorial } from './asset-editorial.js'
import { compactRole } from './compact.js'
import { assetReturn } from './performance.js'
import { shortAssetName } from '../../data/asset-selection.js'
import { INSTRUMENT_FACTS_BY_ISIN } from '../../data/instrument-facts.js'

export const portfolioPostName = asset => shortAssetName(asset.name)
export const postWeight = value => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 20 })} %`

const kind = asset => assetEditorial(asset).kind
const worldKinds = ['world-developed', 'world-all', 'world-imi']
const usKinds = ['us', 'us-equal', 'us-small', 'nasdaq']
const bondKinds = ['bond', 'short-bond', 'long-bond', 'inflation', 'high-yield', 'em-bond']
const worldName = asset => ({
  'world-developed': 'World', 'world-imi': 'ACWI IMI',
  'world-all': asset.name.includes('All-World') ? 'All-World' : 'ACWI',
})[kind(asset)]

const modelCopy = {
  'all-weather': {
    euro: [
      '🌦️ Le portefeuille All Weather est pensé pour traverser les hauts et les bas de l’économie. Il mélange des placements qui réagissent différemment quand la croissance ralentit ou que l’inflation repart.',
      'Voici un exemple de portefeuille All Weather avec des obligations en euros 👇',
    ],
    inflation: [
      '🌦️ Le portefeuille All Weather, dans cette variante, fait une place aux obligations indexées sur l’inflation. Une partie des paiements obligataires suit ainsi la hausse des prix.',
      'Voici comment se répartit cette variante avec des obligations indexées 👇',
    ],
    shorter: [
      '🌦️ Le portefeuille All Weather, dans cette variante, cherche à rendre ses obligations moins sensibles aux taux. Il donne plus de place aux emprunts qui arrivent plus vite à échéance.',
      'Voici la répartition de cette variante aux échéances obligataires plus courtes 👇',
    ],
  },
  permanent: {
    euro: [
      '🧩 Le Permanent Portfolio de Harry Browne cherche à répartir les risques entre plusieurs situations économiques. Il met la même somme en actions, en obligations longues, en monétaire et en or.',
      'Voici ses quatre poches dans une adaptation avec des obligations et du monétaire en euros 👇',
    ],
  },
  'golden-butterfly': {
    'euro-bonds': [
      '🦋 Le Golden Butterfly cherche à profiter de la croissance des entreprises en répartissant le capital sur cinq poches égales. En Bourse, il associe les grands groupes américains à de petites entreprises choisies pour leur valorisation.',
      'Voici ses cinq poches, avec des obligations d’État en euros 👇',
    ],
  },
  'stock-bond': {
    '60-40': [
      '⚖️ Le portefeuille 60/40 cherche à profiter de la croissance des entreprises tout en faisant une vraie place aux obligations.',
      'Voici le partage entre actions des pays développés et obligations mondiales couvertes en euros 👇',
    ],
    '40-60': [
      '⚖️ Le portefeuille 40/60 donne la majorité du capital aux obligations pour moins dépendre de la Bourse.',
      'Voici comment il répartit le capital entre obligations mondiales couvertes en euros et actions des pays développés 👇',
    ],
    '80-20': [
      '⚖️ Le portefeuille 80/20 mise d’abord sur la croissance des entreprises. Il garde un cinquième du capital en obligations pour diversifier ses sources de rendement.',
      'Voici la composition de cette version qui donne la priorité aux actions 👇',
    ],
  },
  ivy: {
    'euro-regions': [
      '🎓 L’Ivy Portfolio statique cherche à diversifier ses sources de rendement avec cinq poches égales. Il ajoute de l’immobilier coté et des matières premières aux actions et aux obligations.',
      'Voici une adaptation qui répartit les actions étrangères entre l’Europe, le Japon et le Pacifique hors Japon 👇',
    ],
  },
  larry: {
    euro: [
      '🎯 Le Larry Portfolio met 70 % du capital en obligations. Côté actions, il fait la part belle aux petites entreprises décotées et aux émergents.',
      'Voici un exemple avec des obligations d’État en euros 👇',
    ],
  },
  merriman: {
    ucits: [
      '🇺🇸 Paul Merriman donne la moitié de son Four Fund Combo aux petites entreprises américaines. Il renforce aussi les sociétés qui se paient moins cher en Bourse.',
      'Voici les quatre poches de ce portefeuille 100 % actions américaines 👇',
    ],
  },
  pinwheel: {
    euro: [
      '🧭 Le Pinwheel Portfolio fait de la place à l’immobilier coté, au monétaire et à l’or aux côtés des actions et des obligations.',
      'Voici un exemple qui utilise du monétaire et des obligations en euros 👇',
    ],
  },
  swensen: {
    'euro-regions': [
      '🏛️ Le portefeuille Swensen 2005 cherche la croissance à long terme avec des actions et de l’immobilier coté. Il garde aussi une poche d’obligations, dont une partie suit l’inflation.',
      'Voici cette adaptation régionale avec des obligations d’État en euros 👇',
    ],
  },
}

function allocationCopy(rows) {
  const [top, next] = rows
  if (!top) return ['Ce portefeuille est encore vide.']
  if (!next) return [
    `Toute l’allocation passe par un seul placement, ${portfolioPostName(top)}.`,
    'Voici le placement retenu 👇',
  ]

  const world = rows.find(row => worldKinds.includes(kind(row)))
  const sp500 = rows.find(row => kind(row) === 'us')
  const us = rows.find(row => usKinds.includes(kind(row)))
  const emerging = rows.find(row => kind(row) === 'emerging')
  const exUs = rows.find(row => kind(row) === 'world-ex-us')
  const crypto = rows.find(row => ['bitcoin', 'ethereum'].includes(kind(row)))
  const euros = rows.find(row => kind(row) === 'euros')
  const dividend = rows.find(row => kind(row) === 'dividend')
  const europe = rows.find(row => kind(row) === 'europe')
  const holding = row => `${portfolioPostName(row)} (${postWeight(row.pct)})`

  if (world && sp500) return [
    `Avec un ETF ${worldName(world)} et du S&P 500 en plus, ce portefeuille donne encore plus de poids aux grandes entreprises américaines.`,
    'Voici le poids de chaque placement 👇',
  ]
  if (world && emerging) return [
    kind(world) === 'world-developed'
      ? `Ce portefeuille complète son ETF World avec ${postWeight(emerging.pct)} sur les marchés émergents, absents du World.`
      : `Ce portefeuille renforce les marchés émergents déjà présents dans son ETF ${worldName(world)} avec une ligne dédiée.`,
    'Voici comment les placements se répartissent 👇',
  ]
  if (exUs && us) return [
    'Ce portefeuille choisit séparément le poids des actions américaines et celui des autres pays développés.',
    'Voici la place donnée à chaque ligne 👇',
  ]
  if (crypto && euros) return [
    `Ce portefeuille garde ${postWeight(euros.pct)} en fonds euros et consacre ${postWeight(crypto.pct)} à ${assetEditorial(crypto).label}.`,
    'Voici la place de ces deux choix dans la répartition 👇',
  ]
  if (crypto && bondKinds.includes(kind(top))) return [
    `Ce portefeuille met ${postWeight(top.pct)} sur ${assetEditorial(top).label} et réserve ${postWeight(crypto.pct)} à ${assetEditorial(crypto).label}.`,
    'Voici comment le capital est réparti autour de ces deux choix 👇',
  ]
  if (dividend === top) return [
    `Ce portefeuille consacre ${postWeight(dividend.pct)} à des actions choisies pour leurs dividendes.`,
    'Voici les placements qui complètent cette ligne 👇',
  ]
  if (world && euros) return [
    `Ce portefeuille investit ${postWeight(world.pct)} dans un ETF mondial et garde ${postWeight(euros.pct)} en fonds euros, à l’écart des variations de la Bourse.`,
    'Voici comment se répartissent les placements 👇',
  ]
  if (kind(top) === 'money' && world) return [
    `Ce portefeuille garde ${postWeight(top.pct)} sur un fonds qui suit les taux courts en euros et ${postWeight(world.pct)} en actions mondiales.`,
    'Voici le poids de chaque ligne 👇',
  ]
  if (world && us) return [
    `Ce portefeuille associe un ETF ${worldName(world)} à ${portfolioPostName(us)} pour donner plus de poids aux actions américaines.`,
    'Voici le poids de chaque placement 👇',
  ]
  if (world && rows.some(row => kind(row) === 'gold')) return [
    `Ce portefeuille associe un ETF ${worldName(world)} à de l’or pour faire dépendre une partie du résultat du cours du métal.`,
    'Voici la place de l’or dans la composition 👇',
  ]
  if (europe && top.id === 'smallcap_europe') return [
    `Ce portefeuille donne ${postWeight(top.pct)} aux petites entreprises européennes, à côté d’un fonds qui suit les grands et moyens groupes européens.`,
    'Voici la place de chaque fonds dans cette allocation 👇',
  ]
  return [
    `Les deux plus grosses lignes de ce portefeuille sont ${holding(top)} et ${holding(next)}.`,
    'Voici la répartition complète 👇',
  ]
}

const postRoles = {
  or: 'L’or ajoute un actif dont le prix peut évoluer différemment de celui des actions et des obligations.',
  mp_large: 'Un panier de matières premières qui peut aider quand les prix de l’énergie ou des produits agricoles augmentent.',
  'euro-govt-5-7': 'Ces emprunts d’État apportent des intérêts avec des échéances intermédiaires, moins sensibles aux taux que les obligations longues.',
  oblig_eur_long_ishares: 'Ces emprunts d’État peuvent profiter d’une baisse des taux longs, avec des variations marquées quand les taux bougent.',
  oblig_inflation: 'Les paiements de ces obligations suivent l’inflation, tandis que leur cours reste sensible aux taux réels.',
  oblig_global_agg_eur_hedged: 'On prête à des États et à des entreprises du monde entier en limitant l’effet des variations de change.',
  monetaire_xeon: 'Cette poche suit les taux courts en euros, avec un rendement qui diminue si ces taux baissent.',
  'manual-IE0008471009': 'On donne plus de poids aux grandes entreprises de la zone euro, déjà présentes dans un indice mondial large.',
  'manual-IE00B52MJY50': 'On ajoute des entreprises du Pacifique développé hors Japon, notamment en Australie et à Hong Kong.',
}

export function portfolioPostRole(row, rows) {
  const roleKind = kind(row)
  if (row.basis === 'fund-nav' && roleKind === 'commodity' && /cuivre/i.test(row.name)) {
    return 'Cette ligne expose le portefeuille au cuivre, avec des rendements simulés à partir de la valeur liquidative du produit.'
  }
  if (roleKind === 'emerging' && rows.some(asset => ['world-all', 'world-imi'].includes(kind(asset)))) {
    return 'On donne plus de poids aux marchés émergents déjà présents dans le fonds mondial.'
  }
  if (row.id === 'smallcap_monde' && rows.some(asset => kind(asset) === 'world-imi')) {
    return 'On renforce les petites entreprises des pays développés déjà présentes dans le fonds mondial.'
  }
  if (postRoles[row.id]) return postRoles[row.id]
  if (roleKind === 'fund') {
    const name = portfolioPostName(row)
    const benchmark = INSTRUMENT_FACTS_BY_ISIN[row.isin]?.benchmark
    if (row.cat === 'obligataire') return `Cette poche ajoute une exposition aux taux via ${benchmark ?? name}.`
    if (row.cat === 'matieres_premieres') return `Cette poche rend une partie du résultat sensible aux prix suivis par ${name}.`
    if (benchmark) return `On donne du poids aux entreprises retenues par l’indice ${benchmark}.`
    return `On réserve une partie de la poche actions aux entreprises sélectionnées par ${name}.`
  }
  return compactRole(row, rows, { includeSingleLineIntro: false }).split(/(?<=\.)\s/)[0]
}

function portfolioRemark(rows, perf, annualized, family) {
  const longBonds = rows.filter(row => kind(row) === 'long-bond')
  if (family === 'all-weather' && perf[2022] < 0 &&
      rows.some(row => worldKinds.includes(kind(row)) && assetReturn(row, 2022) < 0) &&
      longBonds.length && longBonds.every(row => assetReturn(row, 2022) < 0)) {
    const longWeight = longBonds.reduce((sum, row) => sum + row.pct, 0)
    return `Ce qui a fait mal en 2022, c’est que les actions et les obligations ont baissé en même temps. Et avec ${postWeight(longWeight)} d’obligations à long terme, la hausse des taux a pesé lourd.`
  }
  if (rows.some(row => kind(row) === 'leverage')) {
    return 'Le levier 2x est quotidien : sur plusieurs années, le résultat dépend aussi de l’enchaînement des hausses et des baisses.'
  }
  if (rows.some(row => kind(row) === 'options')) {
    return 'Les primes d’options se paient en renonçant à une partie de la hausse, et la poche reste exposée aux baisses des actions.'
  }
  if (annualized === null || rows.length < 2) return ''
  const worst = Object.keys(perf).reduce((year, candidate) => perf[candidate] < perf[year] ? candidate : year)
  if (perf[worst] >= 0) return ''
  const contribution = row => row.pct * assetReturn(row, worst)
  const driver = rows.reduce((biggest, row) => contribution(row) < contribution(biggest) ? row : biggest)
  return `En ${worst}, la ligne ${portfolioPostName(driver)} a le plus pesé sur la baisse du portefeuille.`
}

export function portfolioPostEditorial(portfolio, rows, perf, annualized) {
  const family = portfolio.mode === 'preset'
    ? portfolio.familyId ?? (portfolio.strategyLabel?.startsWith('All Weather') ? 'all-weather' : null)
    : null
  const model = modelCopy[family]?.[portfolio.presetId]
  const [hook, transition] = model ?? allocationCopy(rows)
  const variant = Number(portfolio.hookId?.match(/-(\d+)$/)?.[1] ?? 0) % 3
  const transitions = [transition, 'Voici les placements retenus et leur poids 👇', 'Voilà comment le capital est réparti 👇']
  return { hook, transition: model ? transition : transitions[variant], remark: portfolioRemark(rows, perf, annualized, family) }
}
