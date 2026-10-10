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
  const number = value => ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit'][value] || value.toLocaleString('fr-FR')
  const de = name => (/^[aeiouyhàâéèêëîïôùûü]/i.test(name) ? 'd’' : 'de ') + name
  const almostAll = value => value < 1 && value >= .9995 ? 'près de 100 %' : percentage(value)
  let summary = top.length === 1
    ? 'Cette ligne représente ' + percentage(topSum) + ' du portefeuille déclaré.'
    : 'À elles seules, ces ' + number(top.length) + ' positions représentent ' + almostAll(topSum) + ' du portefeuille déclaré.'
  let observation = second && lead.weight - second.weight <= .005 + 1e-9
    ? 'Ce qui me frappe, c’est le peu d’écart entre ' + leadName + ' et ' + holdingName(second) + '. Les deux premières lignes sont presque à égalité, même si ' + leadName + ' arrive en tête.'
    : 'Je m’arrête d’abord sur ' + leadName + ', qui pèse ' + percentage(lead.weight) + ' des positions déclarées' + (second ? ', devant ' + holdingName(second) + ' à ' + percentage(second.weight) : '') + '.'
  let question = top.length > 1 ? 'Parmi ces ' + number(top.length) + ' positions, laquelle t’intéresse le plus ?' : 'Qu’est-ce qui t’intéresse dans cette position ?'
  if (lead.weight > total / 2 && companies.length > 1) {
    observation = 'Ce qui me frappe, c’est qu’une seule ligne pèse plus lourd que toutes les autres réunies : ' + percentage(lead.weight) + ' pour ' + leadName + ', contre ' + percentage(total - lead.weight) + ' pour le reste. C’est donc l’entreprise que j’aurais envie de creuser en premier.'
    question = 'Qu’est-ce que tu voudrais vérifier avant de donner autant de poids à ' + leadName + ' ?'
  }
  const hooks = {
    tepper: 'Chez David Tepper, je m’arrête sur ' + leadName + ', la première ligne du portefeuille déclaré 👀',
    ackman: leadName + ' est la première position du portefeuille déclaré de Bill Ackman, et je trouve intéressant de regarder ce qu’il y a autour 👀',
    berkshire: leadName + ' arrive en tête des actions déclarées par Berkshire Hathaway, mais je m’intéresse aussi aux entreprises qui suivent 👀',
    'cathie-wood': leadName + ' arrive en tête chez Cathie Wood, et je trouve son poids intéressant à comparer aux autres lignes 👀',
    thiel: 'Le portefeuille déclaré de Peter Thiel via Thiel Macro mérite qu’on s’y attarde, avec ' + leadName + ' en tête 👀',
    druckenmiller: 'Chez Stanley Druckenmiller, c’est le poids ' + de(leadName) + ' qui me frappe 👀',
    loeb: 'Chez Daniel Loeb, je m’arrête sur ' + leadName + ', qui arrive en tête des positions déclarées 👀',
    aschenbrenner: 'Chez Leopold Aschenbrenner, ce qui me frappe, c’est le poids donné à quelques entreprises 👀',
    'li-lu': 'Chez Li Lu, je m’arrête sur la place ' + de(leadName) + ' dans le portefeuille déclaré 👀',
    'gates-trust': 'Je m’intéresse aux entreprises choisies par le Gates Foundation Trust pour gérer sa dotation 👀',
    klarman: 'Chez Seth Klarman, je m’arrête sur ' + leadName + ', la première position déclarée par Baupost 👀',
    'terry-smith': 'Chez Terry Smith, je trouve intéressant de voir le poids donné à ' + leadName + ' et aux lignes qui suivent 👀',
    pabrai: 'Le portefeuille déclaré de Mohnish Pabrai compte ' + number(companies.length) + (companies.length === 1 ? ' position' : ' positions') + ', et je trouve leur répartition intéressante à regarder 👀',
    hohn: 'Chez Christopher Hohn, je remarque d’abord la place ' + de(leadName) + ' dans le portefeuille déclaré par TCI 👀',
    'baker-bros': 'Les frères Baker investissent dans les biotechnologies, et je m’intéresse aux entreprises auxquelles ils donnent le plus de poids 🧬',
    icahn: 'Chez Carl Icahn, le poids ' + de(leadName) + ' est le premier élément qui me frappe 👀',
    laffont: 'Chez Philippe Laffont, je m’intéresse à ce que les premières lignes ont en commun 👀',
    renaissance: 'Chez Renaissance Technologies, le nombre de positions me frappe autant que les noms en tête du classement 👀',
  }
  const slug = identity.slug
  if (slug === 'tepper') {
    const chips = inTop(['MU', 'TSM'])
    if (chips.length === 2) {
      hooks[slug] = 'Amazon arrive en tête chez David Tepper, mais ce sont Micron et TSMC qui retiennent mon attention 👀'
      if (lead.ticker !== 'AMZN') hooks[slug] = leadName + ' arrive en tête chez David Tepper, et je m’arrête aussi sur Micron et TSMC 👀'
      observation = 'Micron et TSMC représentent ensemble ' + percentage(weight(chips)) + ' des positions déclarées. Ce qui m’intéresse, c’est qu’elles travaillent toutes les deux dans les semi-conducteurs, même si elles n’y occupent pas la même place. Deux entreprises différentes peuvent donc exposer à une même industrie.'
    }
  } else if (slug === 'ackman') {
    if (inTop(['MSFT', 'AMZN', 'BN', 'HHH']).length === 4) observation = 'Ce qui me frappe, c’est de retrouver Microsoft et Amazon aux côtés d’entreprises comme Brookfield, présente dans la gestion d’actifs, et Howard Hughes, dans l’immobilier 🏘️\n\n' + (lead.ticker === 'UBER' ? 'Avec Uber en tête, on pourrait s’attendre à un portefeuille très orienté technologie, mais ces premières lignes montrent une répartition plus variée.' : 'Je trouve ce mélange intéressant, avec des entreprises aux activités très différentes parmi les premières lignes.')
  } else if (slug === 'berkshire') {
    const familiar = inTop(['AAPL', 'AXP', 'KO'])
    if (familiar.length >= 2) {
      hooks[slug] = names(familiar) + ' : je trouve intéressant de voir le poids de ces noms familiers chez Berkshire Hathaway 👀'
      observation = 'Ce qui me frappe, c’est que ' + names(familiar) + ' représentent ensemble ' + percentage(weight(familiar)) + ' des actions déclarées. Et Berkshire possède aussi directement des entreprises : cette liste d’actions ne raconte donc qu’une partie de ses activités.'
    }
  } else if (slug === 'cathie-wood' && companies.length > top.length && topSum < .5) {
    hooks[slug] = leadName + ' arrive en tête chez Cathie Wood avec ' + percentage(lead.weight) + ' des positions déclarées 👀'
    summary = ''
    observation = 'Je trouve intéressant que les ' + number(top.length) + ' premières lignes ne représentent que ' + percentage(topSum) + ' des positions déclarées. Le relevé en compte ' + number(companies.length) + ' au total, donc une grande partie de la répartition se joue aussi dans les entreprises qui suivent. '
  } else if (slug === 'thiel') {
    if (topSum >= .7) hooks[slug] = 'Le portefeuille déclaré de Peter Thiel via Thiel Macro mérite qu’on s’y attarde car il est très concentré 👀'
    const energy = group(['VIST', 'VST', 'AEP', 'DTE', 'FE', 'CMS', 'XE'])
    if (energy.length >= 3 && weight(energy) >= .3) observation = 'Ce qui me frappe, c’est la place des entreprises liées à l’énergie, comme ' + names(energy.slice(0, 2)) + '. Les ' + number(energy.length) + ' lignes de ce groupe totalisent ' + percentage(weight(energy)) + ' du relevé.\n\nAvec son parcours dans la technologie, je trouve cette place donnée à l’énergie assez surprenante.'
  } else if (slug === 'druckenmiller' && second && lead.weight > second.weight * 2) {
    observation = leadName + ' pèse plus de deux fois autant que ' + holdingName(second) + ', la deuxième ligne. C’est donc l’entreprise que j’aurais envie de creuser en premier.'
    question = 'Tu connaissais déjà ' + leadName + ' ?'
  } else if (slug === 'loeb' && top.length >= 3) {
    const newLeader = portfolio.snapshot.holdings?.some(row => row.ticker === lead.ticker && row.isNew === true)
    if (newLeader) {
      hooks[slug] = leadName + ' apparaît comme une nouvelle ligne chez Daniel Loeb, et elle arrive directement en tête du relevé 👀'
      observation = 'Je trouve cette entrée frappante : ' + leadName + ' représente déjà ' + percentage(lead.weight) + ' des positions déclarées, devant ' + names(top.slice(1, 3)) + '. C’est cette nouvelle ligne que j’aurais envie de découvrir en premier.'
    } else observation = 'Ce qui m’intéresse, c’est le trio ' + names(top.slice(0, 3)) + ', qui représente ' + percentage(weight(top.slice(0, 3))) + ' des positions déclarées. Je commencerais par ces trois entreprises pour regarder les choix de Third Point, avant de passer aux autres lignes.'
  } else if (slug === 'aschenbrenner') {
    const memory = inTop(['SNDK', 'MU'])
    if (memory.length === 2) {
      hooks[slug] = 'Chez Leopold Aschenbrenner, Sandisk et Micron représentent ensemble ' + percentage(weight(memory)) + ' des positions déclarées, et c’est ce qui me frappe 👀'
      observation = 'Sandisk et Micron sont présentes dans le stockage et la mémoire. Je trouve ça intéressant dans un portefeuille centré sur l’intelligence artificielle : une place importante est donnée aux entreprises qui fournissent ces équipements.'
    }
  } else if (slug === 'li-lu' && top.length >= 3 && weight(top.slice(0, 3)) >= .7) {
    hooks[slug] = leadName + ' représente ' + percentage(lead.weight) + ' du portefeuille déclaré de Li Lu, et ce poids me frappe 👀'
    observation = 'Avec ' + names(top.slice(0, 3)) + ', on arrive à ' + percentage(weight(top.slice(0, 3))) + ' des positions déclarées. Je trouve cette concentration frappante : ces trois entreprises portent l’essentiel du poids, même si le relevé compte ' + number(companies.length) + ' positions.'
    question = 'Parmi ces trois entreprises, laquelle aurais-tu envie de regarder de plus près ?'
  } else if (slug === 'gates-trust') {
    const operating = inTop(['CAT', 'CNI', 'WM', 'DE'])
    if (operating.length === 4) observation = 'Ce qui me frappe, c’est de retrouver ' + names(operating) + ' avec autant de poids : ensemble, ces entreprises représentent ' + percentage(weight(operating)) + ' des positions déclarées. Je trouve ça intéressant de voir la place donnée à ces activités concrètes, comme les engins de chantier, le transport ferroviaire, les déchets ou les machines agricoles.'
  } else if (slug === 'klarman' && top.length > 1) {
    observation = 'Je trouve intéressant de retrouver ' + names(top.slice(0, 2)) + ' en tête chez un gestionnaire qui recherche la valeur à long terme. Ça me donne surtout envie de regarder leur valorisation : avoir les mêmes entreprises en portefeuille ne veut pas dire les avoir achetées au même prix.'
  } else if (slug === 'terry-smith' && topSum < .5 && companies.length > top.length) {
    hooks[slug] = 'Chez Terry Smith, les ' + number(top.length) + ' premières lignes pèsent ' + percentage(topSum) + ' des positions déclarées, et ça retient mon attention 👀'
    summary = ''
    observation = 'Les ' + number(companies.length - top.length) + ' autres positions représentent ' + percentage(Math.max(0, total - topSum)) + ' du relevé. Je trouve ça assez parlant : les noms en tête du classement ne suffisent pas à montrer comment ce portefeuille déclaré est réparti.'
  } else if (slug === 'pabrai') {
    const energy = inTop(['HCC', 'RIG', 'AMR'])
    if (energy.length === 3 && weight(energy) >= .8) {
      hooks[slug] = 'Chez Mohnish Pabrai, trois entreprises représentent ' + almostAll(weight(energy)) + ' des positions déclarées, et leur concentration me frappe 👀'
      summary = ''
      observation = 'Warrior Met Coal, Transocean et Alpha Metallurgical Resources sont liées au charbon ou au forage pétrolier. Je trouve cette sélection frappante : presque tout le poids du portefeuille déclaré repose sur ces trois entreprises, avec des activités liées à l’énergie.'
    }
  } else if (slug === 'hohn') {
    const services = inTop(['V', 'MCO', 'SPGI'])
    if (services.length >= 2) observation = 'Après ' + leadName + ', je m’arrête sur ' + names(services) + ', qui représentent ensemble ' + percentage(weight(services)) + ' des positions déclarées. Entre les paiements, la notation et les données financières, je trouve intéressant de voir la place donnée à ces services.'
  } else if (slug === 'baker-bros' && top.length > 1) {
    observation = 'Je commencerais par ' + leadName + ' et ' + holdingName(second) + ', qui représentent ensemble ' + percentage(lead.weight + second.weight) + ' des positions déclarées. Dans ce fonds spécialisé dans les biotechnologies, ça me donne envie de découvrir ce que font ces deux entreprises avant de regarder les ' + number(companies.length - 2) + ' autres lignes.'
    question = 'Tu suis déjà certaines de ces entreprises ?'
  } else if (slug === 'icahn' && lead.ticker === 'IEP' && lead.weight > total / 2) {
    observation = 'La première ligne est Icahn Enterprises, l’entreprise qui porte son nom. Avec ' + percentage(lead.weight) + ' des positions déclarées, elle pèse plus lourd que toutes les autres réunies. Je trouve ce poids frappant pour une seule entreprise.'
    question = 'Tu connaissais Icahn Enterprises, ou surtout Carl Icahn lui-même ?'
  } else if (slug === 'laffont') {
    const chips = inTop(['TSM', 'LRCX', 'MU', 'AMAT', 'AVGO', 'NVDA'])
    if (chips.length >= 2) {
      hooks[slug] = 'Chez Philippe Laffont, plusieurs premières lignes sont liées aux puces, et leur poids cumulé retient mon attention 👀'
      observation = names(chips) + ' représentent ensemble ' + percentage(weight(chips)) + ' des positions déclarées. Ces entreprises sont liées aux semi-conducteurs ou à leurs équipements, même si elles n’y occupent pas toutes la même place. Je trouve ce point intéressant : plusieurs noms différents peuvent exposer à une même industrie.'
    }
  } else if (slug === 'renaissance' && companies.length > 100 && topSum < .2) {
    hooks[slug] = 'Renaissance Technologies déclare ' + number(companies.length) + ' positions, et ce nombre me frappe 👀'
    summary = ''
    observation = 'Même ' + leadName + ', en première position, ne pèse que ' + percentage(lead.weight) + ' du relevé. Les ' + number(top.length) + ' premières lignes représentent ensemble ' + percentage(topSum) + ' des positions déclarées. Je trouve l’écart frappant entre les noms qu’on remarque en tête et la quantité de lignes qu’il reste derrière.'
    question = 'Parmi ces premières lignes, laquelle t’intéresse le plus ?'
  }
  // Questions invite a discussion about the actual selection, without assuming an intent to buy.
  const questions = {
    tepper: 'Quelle entreprise de cette sélection suis-tu de plus près ?',
    berkshire: 'Quelle position de Berkshire aurais-tu envie de creuser ?',
    'cathie-wood': 'Parmi ces positions d’ARK, laquelle te semble la plus intéressante à suivre ?',
    thiel: 'Quelle position du relevé de Peter Thiel te surprend le plus ?',
    druckenmiller: second && lead.weight > second.weight * 2 ? 'Tu connaissais déjà ' + leadName + ' ?' : 'Quelle entreprise de cette sélection aurais-tu envie de creuser ?',
    loeb: 'Tu suis déjà ' + leadName + ' ?',
    aschenbrenner: 'Quelle position aurais-tu envie de creuser dans ce portefeuille centré sur l’IA ?',
    'gates-trust': 'Quelle entreprise de cette sélection te paraît intéressante pour le long terme ?',
    klarman: 'Sur laquelle de ces entreprises aimerais-tu regarder la valorisation ?',
    'terry-smith': 'Quelle position de Fundsmith aimerais-tu regarder de plus près ?',
    pabrai: 'Tu connaissais déjà ces entreprises ?',
    hohn: 'Quel dossier parmi ces premières lignes de TCI suis-tu déjà ?',
    laffont: 'Quelle entreprise de cette sélection de Coatue retient le plus ton attention ?',
  }
  question = questions[slug] || question
  return { hook: hooks[slug] || 'Je te propose de regarder le portefeuille déclaré ' + owner + ', avec ' + leadName + ' en tête 👀', top, explanation: [summary, observation].filter(Boolean).join('\n\n'), question }
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
  return '🔄 Quelques mouvements depuis le ' + period + '\n' + selected.join('\n')
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
