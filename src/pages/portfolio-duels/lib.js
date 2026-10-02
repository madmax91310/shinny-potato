import { YEARS } from '../../data/portfolio-assets.js'
import { ITEM_BY_ID, CATALOG, FX_SOURCE, ROLES, euroReturn } from './catalog.js'

export { CATALOG, ROLES }
const INITIAL = 10_000

export function formatPercent(value) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}
export function formatCapital(value, currency = 'EUR') {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(value))} ${currency === 'USD' ? '$' : '€'}`
}

export function validateAllocation(lines, side) {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 3) throw new Error(`Le portefeuille ${side} doit avoir 1 à 3 ETF.`)
  if (lines.some((line) => !ITEM_BY_ID.has(line.id) || !Number.isInteger(line.pct) || line.pct < 1 || line.pct > 100)) {
    throw new Error(`Choix ou pondération invalide dans le portefeuille ${side}.`)
  }
  const roles = lines.map((line) => ITEM_BY_ID.get(line.id).role)
  if (roles.filter((role) => role === 'base').length !== 1 || new Set(roles).size !== roles.length) {
    throw new Error(`Le portefeuille ${side} doit contenir une base, au plus un complément et une thématique.`)
  }
  if (lines.reduce((total, line) => total + line.pct, 0) !== 100) throw new Error(`Le portefeuille ${side} doit totaliser 100 %.`)
}

function exposureReading(portfolio) {
  const base = portfolio.assets.find((asset) => asset.role === 'base')
  const complement = portfolio.assets.find((asset) => asset.role === 'complement')
  const theme = portfolio.assets.find((asset) => asset.role === 'theme')
  const parts = []
  if (base.exposure === 'world') parts.push('Le World couvre les pays développés.')
  else if (['acwi', 'allworld'].includes(base.exposure)) parts.push(`Le ${base.exposure === 'acwi' ? 'MSCI ACWI' : 'FTSE All-World'} inclut les pays développés et émergents.`)
  else parts.push('Le S&P 500 constitue une base d’actions américaines.')
  if (complement?.exposure === 'em') {
    parts.push(['acwi', 'allworld'].includes(base.exposure)
      ? `Les ${complement.pct} % d’émergents IMI renforcent une zone déjà présente dans la base et incluent aussi des petites capitalisations.`
      : `Les ${complement.pct} % d’émergents IMI ajoutent ces marchés, avec leurs grandes, moyennes et petites capitalisations.`)
  }
  if (complement?.exposure === 'europe') parts.push(base.exposure === 'sp500'
    ? `Les ${complement.pct} % d’Europe ajoutent une autre zone géographique.`
    : `Les ${complement.pct} % d’Europe renforcent une zone déjà présente dans la base.`)
  if (complement?.exposure === 'smallcap') parts.push(`Les ${complement.pct} % de petites capitalisations des pays développés ajoutent un segment absent de la base.`)
  if (complement?.exposure === 'nasdaq') parts.push(`Les ${complement.pct} % de Nasdaq-100 renforcent les grandes entreprises non financières cotées au Nasdaq, avec un poids important de la technologie. Plusieurs figurent déjà dans la base.`)
  if (complement?.exposure === 'japan') parts.push(base.exposure === 'sp500'
    ? `Les ${complement.pct} % de Japon IMI ajoutent les actions japonaises, y compris des petites capitalisations.`
    : `Les ${complement.pct} % de Japon IMI renforcent un pays déjà présent dans la base et incluent aussi des petites capitalisations.`)
  if (complement?.exposure === 'india') parts.push(['acwi', 'allworld'].includes(base.exposure)
    ? `Les ${complement.pct} % d’Inde renforcent un pays déjà présent dans la base.`
    : `Les ${complement.pct} % d’Inde ajoutent une exposition à ce marché émergent.`)
  const factorReadings = {
    value: 'privilégient les actions des pays développés jugées peu chères par rapport à leurs fondamentaux',
    quality: 'privilégient les actions des pays développés sélectionnées selon leur rentabilité, leur endettement et la stabilité de leurs bénéfices',
    minvol: 'visent une volatilité plus faible dans les actions des pays développés, sans garantir une protection contre les baisses',
  }
  if (factorReadings[complement?.exposure]) parts.push(`Les ${complement.pct} % de ${complement.label} ${factorReadings[complement.exposure]}. Ce filtre peut retenir des entreprises déjà présentes dans la base.`)
  if (theme) parts.push(`La poche ${theme.label.toLowerCase()} représente ${theme.pct} % du portefeuille. Les entreprises de ce thème peuvent aussi être présentes dans les autres ETF.`)
  return parts.join(' ')
}

export function buildCustomDuel(definition) {
  validateAllocation(definition.left, 'A')
  validateAllocation(definition.right, 'B')
  const selection = [...definition.left, ...definition.right]
  const years = YEARS.filter((year) => selection.every((line) => Number.isFinite(euroReturn(ITEM_BY_ID.get(line.id), year))))
  if (years.length < 3 || years.some((year, i) => i && year !== years[i - 1] + 1) || years.at(-1) !== YEARS.at(-1)) {
    throw new Error('Il faut au moins trois années consécutives communes se terminant en 2025.')
  }
  const makePortfolio = (lines, name) => {
    const assets = lines.map((line) => ({ ...ITEM_BY_ID.get(line.id), pct: line.pct }))
      .sort((a, b) => ['base', 'complement', 'theme'].indexOf(a.role) - ['base', 'complement', 'theme'].indexOf(b.role))
    const annual = Object.fromEntries(years.map((year) => [year, assets.reduce((total, asset) => total + asset.pct * euroReturn(asset, year) / 100, 0)]))
    const final = years.reduce((capital, year) => capital * (1 + annual[year] / 100), INITIAL)
    const worstYear = years.reduce((worst, year) => annual[year] < annual[worst] ? year : worst)
    return { name, assets, annual, final, worstYear, worst: annual[worstYear] }
  }
  const a = makePortfolio(definition.left, definition.labels?.[0] ?? 'Portefeuille A')
  const b = makePortfolio(definition.right, definition.labels?.[1] ?? 'Portefeuille B')
  const baseA = a.assets[0].label
  const baseB = b.assets[0].label
  const unique = [...new Set(selection.map((line) => line.id))].map((id) => ITEM_BY_ID.get(id))
  return {
    id: definition.id ?? 'composition-personnalisee', title: definition.title ?? 'Deux façons de construire ton portefeuille',
    hook: definition.hook ?? (a.assets[0].exposure !== b.assets[0].exposure
      ? `${baseA} ou ${baseB} : quelle base choisirais-tu pour ton portefeuille ?`
      : `Tu pars d’un ${baseA}. Qu’est-ce que tu ajoutes autour ?`),
    question: definition.question ?? 'Tu aurais construit le portefeuille A ou le B ?',
    currency: 'EUR', years, a, b,
    readings: [exposureReading(a), exposureReading(b)],
    sources: [...unique.map((asset) => ({ name: asset.name, isin: asset.isin, url: asset.source, note: asset.note })),
      ...(unique.some((asset) => asset.currency === 'USD') ? [{ name: 'Taux EUR/USD de fin d’année (BCE)', url: FX_SOURCE, note: 'Conversion annuelle des rendements USD vers EUR.' }] : [])],
  }
}
export function buildDuel(definition) { return buildCustomDuel(definition) }

export function resultReading(duel) {
  const { a, b, years } = duel
  const difference = b.final - a.final
  if (Math.abs(difference) < .5) return 'Les deux portefeuilles terminent au même montant à l’euro près.'
  const winner = difference > 0 ? 'B' : 'A'
  const year = years.reduce((largest, current) => Math.abs(a.annual[current] - b.annual[current]) > Math.abs(a.annual[largest] - b.annual[largest]) ? current : largest)
  return `Le portefeuille ${winner} termine devant. L’écart annuel le plus marqué apparaît en ${year} : A ${formatPercent(a.annual[year])}, B ${formatPercent(b.annual[year])}.`
}

export function buildTweet(duel) {
  const { a, b, years, currency } = duel
  const difference = b.final - a.final
  const allocation = (portfolio) => portfolio.assets.map((asset) => `${asset.pct} % ${asset.name}`).join('\n')
  const gap = Math.abs(difference) < .5 ? 'Même capital final à l’euro près.'
    : `${formatCapital(Math.abs(difference), currency)} de plus pour le portefeuille ${difference > 0 ? 'B' : 'A'}.`
  return [
    `⚔️ ${duel.hook}`, '',
    `Deux portefeuilles, ${formatCapital(INITIAL, currency)} investis début ${years[0]}, sans versement supplémentaire jusqu’à fin ${years.at(-1)} 👇`, '',
    `🅰️ ${a.name}`, allocation(a), '', `🅱️ ${b.name}`, allocation(b), '',
    'Ce que tu détiens :', `🅰️ ${duel.readings[0]}`, `🅱️ ${duel.readings[1]}`, '',
    `💰 Fin ${years.at(-1)} :`, `🅰️ ${formatCapital(a.final, currency)}`, `🅱️ ${formatCapital(b.final, currency)}`, gap, '',
    '📊 Chaque année (A / B) :', ...years.map((year) => `${year} : ${formatPercent(a.annual[year])} / ${formatPercent(b.annual[year])}`), '',
    `📉 Pire année : A ${formatPercent(a.worst)} en ${a.worstYear}, B ${formatPercent(b.worst)} en ${b.worstYear}.`, '',
    resultReading(duel), '', `💬 ${duel.question}`, '',
    '📌 Simulation en euros, revenus réinvestis, pondérations rétablies chaque début d’année. Rendements USD convertis en EUR. Hors courtage, frais de rééquilibrage et fiscalité.',
    '⚠️ Les performances passées ne préjugent pas des performances futures. Pas un conseil financier.',
  ].join('\n')
}
