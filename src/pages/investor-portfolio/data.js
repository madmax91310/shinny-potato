import { investorIntroduction } from '../../data/investor-profiles.js'
export const INVESTORS = [
  ['tepper', 'David Tepper'], ['ackman', 'Bill Ackman'], ['berkshire', 'Berkshire Hathaway'],
  ['cathie-wood', 'Cathie Wood'], ['thiel', 'Peter Thiel'],
  ['druckenmiller', 'Stanley Druckenmiller'], ['loeb', 'Daniel Loeb'],
  ['aschenbrenner', 'Leopold Aschenbrenner'],
  ['li-lu', 'Li Lu'], ['gates-trust', 'Gates Foundation Trust'], ['klarman', 'Seth Klarman'],
  ['terry-smith', 'Terry Smith'], ['pabrai', 'Mohnish Pabrai'], ['hohn', 'Christopher Hohn'],
  ['baker-bros', 'Baker Bros. Advisors'], ['icahn', 'Carl Icahn'],
  ['laffont', 'Philippe Laffont'], ['renaissance', 'Renaissance Technologies'],
]

export const ATTRIBUTION = 'Données : Tracefour · tracefour.com · CC BY 4.0'
export const COLORS = ['#dcba75', '#54d5b0', '#6da9e7', '#d9928b', '#a89bd9', '#84b6ae']
const SHORT_NAMES = { AMZN: 'Amazon', MU: 'Micron', TSM: 'TSMC', GOOG: 'Alphabet', GOOGL: 'Alphabet', UBER: 'Uber',
  BN: 'Brookfield', MSFT: 'Microsoft', HHH: 'Howard Hughes', QSR: 'Restaurant Brands',
  AAPL: 'Apple', AXP: 'American Express', KO: 'Coca-Cola', BAC: 'Bank of America',
  TSLA: 'Tesla', AMD: 'AMD', SPCX: 'SpaceX', TEM: 'Tempus AI', HOOD: 'Robinhood',
  VIST: 'Vista Energy', VST: 'Vistra', AEP: 'American Electric Power', DTE: 'DTE Energy',
  NTRA: 'Natera', STM: 'STMicroelectronics', INSM: 'Insmed', FOXA: 'Fox',
  WBD: 'Warner Bros. Discovery', CRH: 'CRH', TDS: 'Telephone and Data Systems',
  SNDK: 'Sandisk', BE: 'Bloom Energy', NBIS: 'Nebius', PDD: 'PDD Holdings',
  EWBC: 'East West Bancorp', CROX: 'Crocs', CAT: 'Caterpillar', CNI: 'Canadian National',
  WM: 'Waste Management', DE: 'Deere', ELV: 'Elevance Health', FERG: 'Ferguson',
  MAR: 'Marriott', SYK: 'Stryker', WAT: 'Waters', V: 'Visa', CHD: 'Church & Dwight',
  HCC: 'Warrior Met Coal', RIG: 'Transocean', AMR: 'Alpha Metallurgical Resources', KSPI: 'Kaspi',
  GE: 'General Electric', MCO: 'Moody’s', SPGI: 'S&P Global', INCY: 'Incyte', ONC: 'BeiGene',
  RVMD: 'Revolution Medicines', MDGL: 'Madrigal Pharmaceuticals', ACAD: 'ACADIA Pharmaceuticals',
  IEP: 'Icahn Enterprises', CVI: 'CVR Energy', UAN: 'CVR Partners', CTRI: 'Centuri', IFF: 'International Flavors & Fragrances',
  LRCX: 'Lam Research', AMAT: 'Applied Materials', NVDA: 'Nvidia', META: 'Meta', INTC: 'Intel', UTHR: 'United Therapeutics',
}
export function holdingName(row) {
  return SHORT_NAMES[row.ticker] || (row.issuerName === row.issuerName.toUpperCase()
    ? row.issuerName.toLocaleLowerCase('fr-FR').replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('fr-FR'))
    : row.issuerName)
}

export function normalizePortfolio(payload) {
  const identity = payload?.data?.identity
  const snapshot = payload?.data?.snapshot
  if (identity?.archetype !== 'hedge_fund' || !snapshot?.periodEnd || !Array.isArray(snapshot.holdings)) {
    throw new Error('Ce portefeuille 13F ne contient pas de photographie exploitable.')
  }
  const holdings = snapshot.holdings.filter((row) => !row.putCall && Number.isFinite(row.weight) && row.weight > 0)
    .sort((a, b) => b.weight - a.weight)
  if (!holdings.length || holdings.some((row) => row.weight > 1) || holdings.reduce((sum, row) => sum + row.weight, 0) > 1.02) {
    throw new Error('Les poids transmis ne permettent pas une répartition fiable.')
  }
  return { identity, snapshot, holdings: portfolioCompanies(holdings), filingHistory: payload.data.filingHistory || [], sourceUrl: payload.data.sourceUrl || `https://tracefour.com/trackers/${identity.slug}`, fetchedAt: payload.as_of }
}

export function percentage(weight) {
  return `${(weight * 100).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

export function dateFR(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))
}

// Regroupe les catégories d’actions connues ; les poids restent ceux du relevé.
// Les positions en fonds/ETF restent des positions, pas des entreprises.
export function portfolioCompanies(holdings) {
  const groups = new Map()
  for (const row of holdings) {
    const alphabet = ['GOOG', 'GOOGL', 'GOOG(L)'].includes(row.ticker)
    const berkshire = ['BRK.A', 'BRK.B', 'BRK.{A,B}'].includes(row.ticker)
    const key = alphabet ? 'alphabet' : berkshire ? 'berkshire' : row.issuerName.trim().toLocaleLowerCase('fr-FR')
    const ticker = row.ticker
    const previous = groups.get(key)
    if (previous) {
      previous.weight += row.weight
      if (alphabet && previous.ticker !== ticker) previous.ticker = 'GOOG(L)'
      if (berkshire && previous.ticker !== ticker) previous.ticker = 'BRK.{A,B}'
    }
    else groups.set(key, { ...row, ticker, issuerName: alphabet ? 'Alphabet' : berkshire ? 'Berkshire Hathaway' : row.issuerName })
  }
  return [...groups.values()].sort((a, b) => b.weight - a.weight)
}

function tickers(row) {
  return row.ticker ? ({ 'GOOG(L)': '$GOOG $GOOGL', 'BRK.{A,B}': '$BRK.A $BRK.B' }[row.ticker] || '$' + row.ticker) : ''
}

// Editorial observations follow the loaded filing, not a fixed list of holdings.
// Named groups describe only those companies, never an inferred full sector allocation.
export function portfolioEditorial(portfolio) {
  const { identity, holdings } = portfolio
  const companies = portfolioCompanies(holdings)
  const top = companies.slice(0, 5)
  const lead = top[0]
  const second = top[1]
  const total = companies.reduce((sum, row) => sum + row.weight, 0)
  const topSum = top.reduce((sum, row) => sum + row.weight, 0)
  const owner = identity.slug === 'gates-trust' ? 'du Gates Foundation Trust'
    : identity.slug === 'baker-bros' ? 'des frères Baker' : 'de ' + identity.displayName
  const leadName = holdingName(lead)
  const group = tickers => companies.filter(row => tickers.includes(row.ticker))
  const inTop = tickers => top.filter(row => tickers.includes(row.ticker))
  const weight = rows => rows.reduce((sum, row) => sum + row.weight, 0)
  const names = rows => {
    const labels = rows.map(holdingName)
    return labels.length < 2 ? labels[0] : labels.slice(0, -1).join(', ') + ' et ' + labels.at(-1)
  }
  const de = name => (/^[aeiouyhàâéèêëîïôùûü]/i.test(name) ? 'd’' : 'de ') + name
  const almostAll = value => value < 1 && value >= .9995 ? 'près de 100 %' : percentage(value)
  const summary = top.length === 1
    ? 'Cette ligne représente ' + percentage(topSum) + ' du portefeuille déclaré.'
    : 'À elles seules, ces ' + top.length + ' positions représentent ' + almostAll(topSum) + ' du portefeuille déclaré.'
  let observation = second && lead.weight - second.weight <= .005 + 1e-9
    ? 'Ce qui me frappe, c’est la proximité de ' + leadName + ' et ' + holdingName(second) + ' : leurs poids sont presque à égalité en tête de ce relevé.'
    : 'Je retiens surtout la place ' + de(leadName) + ' dans cette répartition' + (second ? ' : son poids dépasse celui de ' + holdingName(second) + ' de ' + percentage(lead.weight - second.weight).replace(' %', ' points') : ', avec une seule position présentée') + '.'
  let question = top.length > 1 ? 'Parmi ces ' + top.length + ' positions, laquelle t’intéresse le plus ?' : 'Qu’est-ce qui t’intéresse dans cette position ?'
  if (lead.weight > total / 2 && companies.length > 1) {
    observation = 'Ce qui me frappe, c’est le poids de ' + leadName + ' : cette ligne pèse davantage que toutes les autres positions présentées réunies, soit ' + percentage(lead.weight) + ' contre ' + percentage(total - lead.weight) + '. Je regarderais donc cette entreprise de près pour comprendre cette répartition.'
    question = 'Qu’est-ce que tu voudrais vérifier avant de donner autant de poids à ' + leadName + ' ?'
  }
  const hooks = {
    tepper: leadName + ' arrive en tête chez David Tepper, et je trouve intéressant de regarder les positions qui suivent 👀',
    ackman: leadName + ' est la première position du portefeuille déclaré de Bill Ackman, et je trouve intéressant de regarder ce qu’il y a autour 👀',
    berkshire: 'Je te propose de regarder les principales actions déclarées par Berkshire Hathaway, avec ' + leadName + ' en tête 👀',
    'cathie-wood': 'Chez Cathie Wood, je m’arrête sur la place de ' + leadName + ' parmi les positions déclarées par ARK 👀',
    thiel: 'Le portefeuille déclaré de Peter Thiel mérite qu’on s’y attarde : je te propose de regarder ce qui accompagne ' + leadName + ' 👀',
    druckenmiller: 'Chez Stanley Druckenmiller, le poids ' + de(leadName) + ' retient mon attention 👀',
    loeb: 'Je te propose de regarder les principales positions de Daniel Loeb, en commençant par ' + leadName + ' 👀',
    aschenbrenner: 'Ce qui m’intéresse dans le portefeuille déclaré de Leopold Aschenbrenner, c’est le poids de ses premières lignes 👀',
    'li-lu': 'Quand je regarde le portefeuille déclaré de Li Lu, je m’arrête d’abord sur sa concentration 👀',
    'gates-trust': 'Je trouve intéressant de regarder les entreprises qui composent le portefeuille déclaré du Gates Foundation Trust 👀',
    klarman: 'Je te propose de regarder les choix déclarés par Seth Klarman chez Baupost, avec ' + leadName + ' en première position 👀',
    'terry-smith': 'Chez Terry Smith, je trouve intéressant de regarder comment les poids se répartissent entre les premières lignes 👀',
    pabrai: 'Le portefeuille déclaré de Mohnish Pabrai compte ' + companies.length + ' positions, et leur répartition retient mon attention 👀',
    hohn: 'Chez Christopher Hohn, je m’arrête sur la place ' + de(leadName) + ' dans les positions déclarées par TCI 👀',
    'baker-bros': 'Je te propose de regarder les principales positions des frères Baker, spécialisés dans les biotechnologies 🧬',
    icahn: 'Chez Carl Icahn, le poids ' + de(leadName) + ' est le premier élément qui me frappe 👀',
    laffont: 'Je trouve intéressant de regarder ce qui relie les grandes positions déclarées par Philippe Laffont 👀',
    renaissance: 'Chez Renaissance Technologies, je m’intéresse autant au nombre de positions qu’aux premières lignes 👀',
  }
  const slug = identity.slug
  if (slug === 'tepper') {
    const chips = inTop(['MU', 'TSM'])
    if (chips.length === 2) observation = 'Ce qui retient mon attention, c’est la place de Micron et TSMC : ensemble, ces deux entreprises des semi-conducteurs pèsent ' + percentage(weight(chips)) + ' du relevé. Deux lignes distinctes exposent donc à une même industrie, ce que je garderais en tête pour lire cette répartition.'
  } else if (slug === 'ackman') {
    if (inTop(['MSFT', 'AMZN', 'BN', 'HHH']).length === 4) observation = 'Ce qui me frappe, c’est de retrouver Microsoft et Amazon aux côtés d’entreprises comme Brookfield, présente dans la gestion d’actifs, et Howard Hughes, dans l’immobilier 🏘️\n\n' + (lead.ticker === 'UBER' ? 'Avec Uber en tête, on pourrait s’attendre à un portefeuille très orienté technologie, mais ces premières lignes montrent une répartition plus variée.' : 'Ces premières lignes donnent un aperçu d’activités très différentes au sein du même relevé.')
  } else if (slug === 'berkshire') {
    const familiar = inTop(['AAPL', 'AXP', 'KO'])
    if (familiar.length >= 2) observation = 'Ce qui m’intéresse ici, c’est la place ' + de(names(familiar)) + ', qui représentent ensemble ' + percentage(weight(familiar)) + ' du relevé. Ces actions donnent un aperçu de Berkshire, qui possède aussi directement des entreprises en dehors de ce portefeuille déclaré.'
  } else if (slug === 'cathie-wood' && companies.length > top.length && topSum < .5) {
    observation = 'Je trouve intéressant de rapprocher ces premières lignes des ' + companies.length + ' positions présentes dans le relevé. Même dans une société de gestion centrée sur l’innovation, les cinq premiers noms ne suffisent pas à raconter toute la répartition.'
  } else if (slug === 'thiel') {
    const energy = group(['VIST', 'VST', 'AEP', 'DTE', 'FE', 'CMS', 'XE'])
    if (energy.length >= 3 && weight(energy) >= .3) observation = 'Ce qui me frappe, c’est la place des entreprises liées à l’énergie, comme ' + names(energy.slice(0, 2)) + '. Les ' + energy.length + ' lignes de ce groupe totalisent ' + percentage(weight(energy)) + ' du relevé. Le parcours de Peter Thiel dans la technologie rend cette présence intéressante à regarder.'
  } else if (slug === 'druckenmiller' && second && lead.weight > second.weight * 2) {
    observation = 'Ce qui retient mon attention, c’est l’écart entre ' + leadName + ' et ' + holdingName(second) + ' : la première ligne pèse plus de deux fois la suivante. Je regarderais donc ce qui distingue cette entreprise pour mieux comprendre sa place dans le relevé.'
  } else if (slug === 'loeb' && top.length >= 3) {
    observation = 'Je m’arrête sur le trio ' + names(top.slice(0, 3)) + ', qui représente ' + percentage(weight(top.slice(0, 3))) + ' du relevé. Avec ' + companies.length + ' positions déclarées au total, ce trio donne un premier aperçu des choix de Third Point.'
  } else if (slug === 'aschenbrenner') {
    const memory = inTop(['SNDK', 'MU'])
    if (memory.length === 2) observation = 'Ce qui me frappe, c’est la place de Sandisk et Micron, deux entreprises présentes dans le stockage et la mémoire. Ensemble, elles représentent ' + percentage(weight(memory)) + ' du relevé. Dans un portefeuille centré sur l’intelligence artificielle, je trouve intéressant de voir le poids donné à ces équipements.'
  } else if (slug === 'li-lu' && top.length >= 3 && weight(top.slice(0, 3)) >= .7) {
    observation = 'Je retiens surtout le poids de ces trois entreprises : ' + names(top.slice(0, 3)) + ' représentent ensemble ' + percentage(weight(top.slice(0, 3))) + ' du relevé. Sur les ' + companies.length + ' positions déclarées, une grande partie du poids repose donc sur ces trois entreprises.'
    question = 'Parmi ces trois entreprises, laquelle aurais-tu envie de regarder de plus près ?'
  } else if (slug === 'gates-trust') {
    const operating = inTop(['CAT', 'CNI', 'WM', 'DE'])
    if (operating.length >= 2) observation = 'Ce qui retient mon attention, c’est la place ' + de(names(operating)) + '. Ces entreprises représentent ensemble ' + percentage(weight(operating)) + ' du relevé. Je trouve intéressant de regarder ces choix dans le contexte d’une dotation qui finance les activités de la fondation.'
  } else if (slug === 'klarman' && top.length > 1) {
    observation = 'Je trouve intéressant de retrouver ' + names(top.slice(0, 2)) + ' en tête chez un gestionnaire qui recherche la valeur à long terme. Le relevé montre leur poids actuel, mais il ne permet pas de connaître le prix payé ni ce que Klarman attend de ces entreprises.'
  } else if (slug === 'terry-smith' && topSum < .5 && companies.length > top.length) {
    observation = 'Ce qui m’intéresse ici, c’est la répartition au-delà du top 5 : les ' + (companies.length - top.length) + ' autres positions déclarées représentent ' + percentage(Math.max(0, total - topSum)) + ' du relevé. Pour regarder les choix de Terry Smith, je garderais donc aussi un œil sur les lignes qui suivent.'
  } else if (slug === 'pabrai') {
    const energy = inTop(['HCC', 'RIG', 'AMR'])
    if (energy.length === 3 && weight(energy) >= .8) observation = 'Ce qui me frappe, c’est que Warrior Met Coal, Transocean et Alpha Metallurgical Resources totalisent ' + almostAll(weight(energy)) + ' du relevé. Ces trois entreprises liées au charbon ou au forage pétrolier donnent un aperçu très marqué des positions déclarées par Pabrai.'
  } else if (slug === 'hohn') {
    const services = inTop(['V', 'MCO', 'SPGI'])
    if (services.length >= 2) observation = 'Je m’arrête aussi sur ' + names(services) + ', qui représentent ensemble ' + percentage(weight(services)) + ' du relevé. Ces entreprises actives dans les paiements, la notation ou les données financières occupent une place importante aux côtés de ' + leadName + '.'
  } else if (slug === 'baker-bros' && top.length > 1) {
    observation = 'Dans ce fonds spécialisé dans les biotechnologies, je regarderais de près le poids ' + de(leadName) + ' et ' + de(holdingName(second)) + '. Ces deux premières lignes représentent ensemble ' + percentage(lead.weight + second.weight) + ' du relevé, sur ' + companies.length + ' positions déclarées.'
    question = 'Quelle entreprise de cette sélection aurais-tu envie de découvrir ?'
  } else if (slug === 'icahn' && lead.ticker === 'IEP' && lead.weight > total / 2) {
    observation = 'Ce qui me frappe, c’est que la première ligne est Icahn Enterprises, l’entreprise qui porte son nom. Elle représente à elle seule ' + percentage(lead.weight) + ' du relevé et pèse davantage que toutes les autres positions présentées réunies.'
    question = 'Qu’est-ce que tu regarderais en premier pour comprendre la place d’Icahn Enterprises dans ce portefeuille ?'
  } else if (slug === 'laffont') {
    const chips = inTop(['TSM', 'LRCX', 'MU', 'AMAT', 'AVGO', 'NVDA'])
    if (chips.length >= 2) observation = 'Ce qui retient mon attention, c’est la présence de ' + names(chips) + ' parmi les premières lignes. Ces entreprises des semi-conducteurs ou de leurs équipements représentent ensemble ' + percentage(weight(chips)) + ' du relevé. Plusieurs lignes exposent donc à une même industrie, et je trouve leur poids cumulé plus parlant pour lire cette partie du portefeuille de Coatue.'
  } else if (slug === 'renaissance' && companies.length > 100 && topSum < .2) {
    observation = 'Ce qui me frappe, c’est l’ampleur du relevé : ' + companies.length.toLocaleString('fr-FR') + ' positions au total. Pour cette société de gestion quantitative, les premières lignes donnent donc un aperçu très partiel de la répartition.'
    question = 'Parmi ces premières lignes, laquelle t’intéresse le plus ?'
  }
  // Questions invite a discussion about the actual selection, without assuming an intent to buy.
  const questions = {
    tepper: 'Quelle entreprise de cette sélection suis-tu de plus près ?',
    berkshire: 'Quelle position de Berkshire aurais-tu envie de creuser ?',
    'cathie-wood': 'Parmi ces positions d’ARK, laquelle te semble la plus intéressante à suivre ?',
    thiel: 'Quelle position du relevé de Peter Thiel te surprend le plus ?',
    druckenmiller: 'Qu’aimerais-tu savoir sur ' + leadName + ' pour comprendre son poids dans ce relevé ?',
    loeb: 'Quelle entreprise parmi les premières lignes de Third Point retient ton attention ?',
    aschenbrenner: 'Quelle position aurais-tu envie de creuser dans ce portefeuille centré sur l’IA ?',
    'gates-trust': 'Quelle entreprise de cette sélection te paraît intéressante pour le long terme ?',
    klarman: 'Sur laquelle de ces entreprises aimerais-tu regarder la valorisation ?',
    'terry-smith': 'Quelle position de Fundsmith aimerais-tu regarder de plus près ?',
    pabrai: 'Quelle entreprise de ce relevé voudrais-tu mieux comprendre ?',
    hohn: 'Quel dossier parmi ces premières lignes de TCI suis-tu déjà ?',
    laffont: 'Quelle entreprise de cette sélection de Coatue retient le plus ton attention ?',
  }
  question = questions[slug] || question
  return { hook: hooks[slug] || 'Je te propose de regarder le portefeuille déclaré ' + owner + ', avec ' + leadName + ' en tête 👀', top, explanation: summary + '\n\n' + observation, question }
}

// Compare reported security lines, before company/class grouping. Weight changes
// are intentionally never interpreted as changes in the number of shares.
export function movementExcerpt(snapshot) {
  const prior = snapshot.quarterChanges?.priorPeriodLabel
  if (!prior || !Array.isArray(snapshot.holdings)) return ''
  const rows = snapshot.holdings.filter(row => !row.putCall && row.weight > 0)
    .sort((a, b) => b.weight - a.weight)
  const label = row => [holdingName(row), tickers(row)].filter(Boolean).join(' ')
  const change = row => Math.abs(row.sharesChangePct).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  const buckets = [
    rows.filter(row => row.isNew === true).map(row => '🆕 Nouvelle ligne : ' + label(row)),
    rows.filter(row => !row.isNew && row.ticker !== 'BRK.{A,B}' && Number.isFinite(row.sharesChangePct) && row.sharesChangePct >= .05)
      .map(row => '📈 ' + label(row) + ' : nombre d’actions +' + change(row) + ' %'),
    rows.filter(row => !row.isNew && row.ticker !== 'BRK.{A,B}' && Number.isFinite(row.sharesChangePct) && row.sharesChangePct <= -.05 && row.sharesChangePct >= -100)
      .map(row => '📉 ' + label(row) + ' : nombre d’actions −' + change(row) + ' %'),
    (snapshot.quarterChanges.exits || []).filter(row => !row.putCall && !rows.some(current => row.ticker ? current.ticker === row.ticker : current.issuerName === row.issuerName))
      .map(row => '🚪 Ligne sortie : ' + label(row)),
  ]
  // One example per available category, then fill remaining slots by position size.
  const selected = buckets.flatMap(bucket => bucket.slice(0, 1))
  for (const bucket of buckets) {
    for (const line of bucket.slice(1)) if (selected.length < 4) selected.push(line)
  }
  if (!selected.length) return ''
  const period = String(prior).replace(/^Q([1-4]) /, 'T$1 ')
  return '🔄 Quelques mouvements depuis ' + period + '\n' + selected.join('\n')
}

export function buildTweet(portfolio, intro = '') {
  const { identity, snapshot } = portfolio
  const editorial = portfolioEditorial(portfolio)
  const icon = ['🥇', '🥈', '🥉', '📍', '📍']
  const presentation = intro.trim() || investorIntroduction(identity.slug) || identity.displayName + ' gère les investissements déclarés par ' + (identity.entityName || identity.displayName) + '.'
  return [
    editorial.hook,
    (['berkshire', 'gates-trust', 'renaissance', 'baker-bros'].includes(identity.slug) ? presentation : 'Pour ceux qui ne ' + (identity.slug === 'cathie-wood' ? 'la' : 'le') + ' connaissent pas, ' + presentation),
    '💼 Ses principales positions au ' + dateFR(snapshot.periodEnd) + '\n' + editorial.top.map((row, i) => icon[i] + ' ' + holdingName(row) + ' ' + tickers(row) + ' : ' + percentage(row.weight)).join('\n'),
    snapshot.holdings?.some(row => row.putCall) ? 'Les options du relevé sont exclues de cette liste ; les poids restent calculés sur le total déclaré.' : '',
    movementExcerpt(snapshot),
    editorial.explanation,
    '💬 ' + editorial.question,
  ].filter(Boolean).join('\n\n')
}

export async function loadPortfolio(slug, signal) {
  if (!INVESTORS.some(([key]) => key === slug)) throw new Error('Investisseur inconnu.')
  const url = `${import.meta.env.BASE_URL}data/investors/${slug}.json`
  const response = await fetch(url, { signal, cache: 'no-cache' })
  if (!response.ok) throw new Error(`Données indisponibles (${response.status}). Réessaie plus tard.`)
  const portfolio = normalizePortfolio(await response.json())
  if (portfolio.identity.slug !== slug) throw new Error('La réponse ne correspond pas à l’investisseur choisi.')
  return portfolio
}
