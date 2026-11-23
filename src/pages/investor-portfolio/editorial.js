import COPY from './editorial-copy.json' with { type: 'json' }
import reviewedFacts from './editorial-facts.json' with { type: 'json' }
import { portfolioOwner, weightLabel } from './publication.js'

export function quarterLabel(period) {
  return `T${Math.ceil(Number(period.slice(5, 7)) / 3)} ${period.slice(0, 4)}`
}

export function financialFacts(portfolio) {
  if (!portfolio || portfolio.problem || !portfolio.total || portfolio.kind === 'model') return null
  const { holdings, total, snapshot } = portfolio
  const top = [...holdings].sort((a, b) => b.value - a.value).slice(0, 10)
  return {
    period: snapshot.periodEnd,
    filing: snapshot.filingUrl,
    total,
    count: holdings.length,
    rows: top.map(({ cusip, shareClass, value }) => [cusip, shareClass, value]),
    leading: top.slice(0, 3),
    topThree: top.slice(0, 3).reduce((sum, row) => sum + row.value, 0) / total,
  }
}

export function draftBasis(portfolio) {
  if (!portfolio) return null
  return JSON.stringify([
    portfolio.snapshot.periodEnd, portfolio.snapshot.filingUrl, portfolio.total, portfolioOwner(portfolio),
    portfolio.holdings.map(({ cusip, shareClass, value, weight }) => [cusip, shareClass, value, weight]).sort(),
  ])
}

function totalInWords(total) {
  const scale = total >= 1e9 ? 1e9 : 1e6
  const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: scale === 1e9 ? 1 : 0 }).format(total / scale)
  return `${amount} ${scale === 1e9 ? 'milliard' : 'million'}${total / scale >= 2 ? 's' : ''} de dollars`
}

// An earlier angle survives a new quarter only as a comparison to review.
// Match its securities by CUSIP and class, even if their ranks have changed.
function updatedComparisons(portfolio, copy, review) {
  const key = (cusip, shareClass) => JSON.stringify([cusip, shareClass])
  const current = new Map(portfolio.holdings.map(row => [key(row.cusip, row.shareClass), row]))
  return copy.picks.filter(group => group.length > 1).flatMap(group => {
    const rows = group.map(rank => current.get(key(...review.rows[rank - 1])))
    if (rows.some(row => !row)) return []
    return [{ rows, weight: rows.reduce((sum, row) => sum + row.value, 0) / portfolio.total }]
  }).slice(0, 3)
}

export function editorialCopy(portfolio) {
  const slug = portfolio.identity.slug
  const facts = financialFacts(portfolio)
  const review = reviewedFacts[slug]
  const copy = COPY[slug]
  if (!facts) return { status: 'blocked', text: '', short: '', review }
  if (!review || !copy) return { status: 'review', text: '', short: '', facts }

  const current = facts.period === review.period && facts.filing === review.filing
    && facts.total === review.total && facts.count === review.count
    && portfolioOwner(portfolio) === portfolio.identity.displayName
    && review.rows.every((row, index) => row.every((value, field) => facts.rows[index]?.[field] === value))
  const weights = copy.picks.map(group => group.reduce((sum, rank) => sum + review.rows[rank - 1][2], 0) / review.total)
  const quarter = quarterLabel(review.period)
  const context = `Pour le ${quarter}, le 13F fait état de ${totalInWords(review.total)} de positions hors options`
  const render = template => template.replace(/\{(context|quarter|(?:shock|amount)?\d+)\}/g, (_, token) => {
    if (token === 'context') return context
    if (token === 'quarter') return quarter
    if (token.startsWith('amount')) return totalInWords(weights[Number(token.slice(6)) - 1] * review.total)
    return token.startsWith('shock') ? weightLabel(weights[Number(token.slice(5)) - 1] * .3) : weightLabel(weights[Number(token) - 1])
  })
  return { status: current ? 'reviewed' : 'review', text: render(copy.text), short: render(copy.short), review, facts, weights,
    comparisons: current ? [] : updatedComparisons(portfolio, copy, review) }
}
