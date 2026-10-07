const finite = value => typeof value === 'number' && Number.isFinite(value)
const fr = (value, digits = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)
export const dateLabel = value => new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
export function amount(value, currency = 'USD') {
  if (!finite(value)) return 'Non disponible'
  const unit = Math.abs(value) >= 1e9 ? 1e9 : 1e6
  return `${fr(value / unit)} ${unit === 1e9 ? 'Md' : 'M'} ${currency}`
}
export function fresh(date, days, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) return false
  const age = (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.parse(`${date}T00:00:00Z`)) / 86400000
  return age >= 0 && age <= days
}
export function canPublish(company, now = new Date()) {
  const a = company.annual
  return Boolean(a && finite(a.revenue) && a.revenue > 0 && finite(a.netIncome) && fresh(a.end, 550, now) && fresh(company.accountsObservedAt, 45, now))
}
export function activeValuation(company, now = new Date()) {
  const v = company.valuation
  const latest = company.quarter?.end ?? company.annual?.end
  return v && fresh(v.observedAt, 7, now) && fresh(v.accountsAsOf, 200, now) && v.accountsAsOf >= latest ? v : null
}
export function calculatedRatios(company, now = new Date()) {
  const a = company.annual, q = company.quote, t = company.trailing
  if (!canPublish(company, now) || !q || !Array.isArray(q.splits) || !fresh(q.asOf, 10, now)) return {}
  const splitAfter = end => (q.splits ?? []).some(date => date > end && date <= q.asOf)
  const result = {}
  if (t && fresh(t.observedAt, 45, now) && fresh(t.end, 200, now)
    && t.end >= (company.quarter?.end ?? a.end) && finite(t.dilutedEPS) && t.dilutedEPS > 0
    && company.quarters?.length === 4 && !splitAfter(company.quarters[3].end)) {
    result.peTTM = q.price / t.dilutedEPS
  }
  const shares = company.shares
  if (shares && fresh(shares.observedAt, 45, now) && fresh(shares.asOf, 200, now)
    && shares.asOf >= (company.quarter?.end ?? a.end) && !splitAfter(shares.asOf)
    && finite(shares.outstanding) && shares.outstanding > 0 && finite(a.freeCashFlow) && a.freeCashFlow > 0) {
    result.priceFCF = q.price * shares.outstanding / a.freeCashFlow
  }
  if (finite(a.dividendPerShare) && a.dividendPerShare > 0 && !splitAfter(a.end)) {
    result.dividendYield = a.dividendPerShare / q.price * 100
    if (finite(a.dilutedEPS) && a.dilutedEPS > 0) result.payout = a.dividendPerShare / a.dilutedEPS * 100
  }
  return result
}
export function activeBalance(company, now = new Date()) {
  const b = company.balance
  return b && fresh(b.asOf, 200, now) && fresh(b.observedAt, 45, now)
    && b.asOf >= (company.quarter?.end ?? company.annual?.end) ? b : null
}
function growth(current, previous) {
  return finite(current) && finite(previous) && previous > 0 && current >= 0 ? (current / previous - 1) * 100 : null
}
function changePhrase(value) {
  if (!finite(value)) return ''
  if (Math.abs(value) < .05) return ', presque stable sur un an'
  return `, en ${value > 0 ? 'hausse' : 'baisse'} de ${fr(Math.abs(value))} % sur un an`
}
export function incomePhrase(period, currency) {
  const current = period.netIncome, previous = period.previousNetIncome
  if (current < 0) {
    const base = `L’entreprise a enregistré une perte nette de ${amount(-current, currency)}`
    if (finite(previous) && previous < 0) {
      if (current > previous) return `${base}. Sa perte s’est réduite sur un an.`
      if (current < previous) return `${base}. Sa perte s’est creusée sur un an.`
      return `${base}, comme un an plus tôt.`
    }
    if (finite(previous) && previous > 0) return `${base}, après un bénéfice un an plus tôt.`
    return `${base}.`
  }
  if (current === 0) return 'Le résultat net est à l’équilibre.'
  const base = `Elle a dégagé ${amount(current, currency)} de bénéfice net`
  if (finite(previous) && previous < 0) return `${base}. Elle est revenue au bénéfice après une perte un an plus tôt.`
  return `${base}${changePhrase(growth(current, previous))}.`
}
// Explain only what the published figures establish; recompute after every refresh.
export function marginExplanation(period) {
  const { revenue, netIncome, previousRevenue, previousNetIncome } = period
  if (!finite(revenue) || revenue <= 0 || !finite(netIncome)
    || !finite(previousRevenue) || previousRevenue <= 0 || !finite(previousNetIncome)) return ''
  const current = netIncome / revenue * 100
  const previous = previousNetIncome / previousRevenue * 100
  // Compare the displayed precision to avoid describing an invisible change.
  if (current.toFixed(1) === previous.toFixed(1)) return 'La marge nette est presque stable sur un an.'
  const improved = current > previous
  const revenueGrowth = growth(revenue, previousRevenue)
  const profitGrowth = growth(netIncome, previousNetIncome)
  if (netIncome > 0 && previousNetIncome > 0 && revenueGrowth > .05 && profitGrowth > .05) {
    return improved
      ? 'Les bénéfices ont progressé plus vite que les ventes : la marge nette s’est améliorée.'
      : 'Les ventes ont progressé plus vite que les bénéfices : la marge nette a diminué.'
  }
  return `La marge nette ${improved ? 's’est améliorée' : 'a diminué'}, passant de ${fr(previous)} % à ${fr(current)} % sur un an.`
}
function periodText(period, company, quarterly = false) {
  const dates = period.start ? `du ${dateLabel(period.start)} au ${dateLabel(period.end)}` : `clos le ${dateLabel(period.end)}`
  const lines = [quarterly ? `📈 Et les derniers résultats ?\nTrimestre ${dates}` : `💰 Ce que l’entreprise gagne\nExercice ${dates}`,
    `Son chiffre d’affaires atteint ${amount(period.revenue, company.currency)}${changePhrase(growth(period.revenue, period.previousRevenue))}.`,
    incomePhrase(period, company.currency)]
  if (finite(period.revenue) && period.revenue > 0 && finite(period.netIncome)) {
    const margin = period.netIncome / period.revenue * 100
    if (!quarterly) {
      if (period.netIncome > 0) lines.push(`Pour 100 ${company.currency} de ventes, elle a donc conservé environ ${fr(margin)} ${company.currency} de bénéfice net.`)
      else if (period.netIncome < 0) lines.push(`Cela représente une perte nette de ${fr(-margin)} ${company.currency} pour 100 ${company.currency} de ventes.`)
    }
    const explanation = marginExplanation(period)
    if (explanation) lines.push(explanation)
  }
  return lines.join('\n')
}
export function metrics(company, now = new Date()) {
  if (!canPublish(company, now)) return []
  const a = company.annual
  const rows = [{ label: 'Chiffre d’affaires annuel', value: amount(a.revenue, company.currency) },
    { label: a.netIncome < 0 ? 'Perte nette annuelle' : 'Bénéfice net annuel', value: amount(Math.abs(a.netIncome), company.currency) },
    { label: finite(a.operatingIncome) ? 'Marge opérationnelle annuelle' : 'Marge nette annuelle', value: `${fr((a.operatingIncome ?? a.netIncome) / a.revenue * 100)} %` }]
  if (finite(a.dilutedEPS)) rows.push({ label: 'BPA dilué annuel', value: `${fr(a.dilutedEPS, 2)} ${company.currency}` })
  if (finite(a.freeCashFlow)) rows.push({ label: 'Flux de trésorerie disponible annuel', value: amount(a.freeCashFlow, company.currency) })
  const v = activeValuation(company, now)
  const calculated = calculatedRatios(company, now)
  const pe = calculated.peTTM ?? v?.peTTM
  if (finite(pe) && pe > 0) rows.push({ label: 'PER · bénéfices sur 12 mois', value: `${fr(pe)}×` })
  if (finite(v?.forwardPE) && v.forwardPE > 0) rows.push({ label: 'PER prévisionnel · horizon fournisseur', value: `${fr(v.forwardPE)}×` })
  if (finite(v?.peg) && v.peg > 0) rows.push({ label: 'PEG · méthode fournisseur', value: `${fr(v.peg)}×` })
  if (finite(calculated.priceFCF)) rows.push({ label: 'Prix / FCF du dernier exercice', value: `${fr(calculated.priceFCF)}×` })
  const b = activeBalance(company, now)
  if (finite(b?.netDebt)) rows.push({ label: `${b.netDebt < 0 ? 'Trésorerie' : 'Dette'} nette · ${dateLabel(b.asOf)}`, value: amount(Math.abs(b.netDebt), company.currency) })
  if (b && !finite(b.netDebt) && finite(b.cash)) rows.push({ label: `Trésorerie · ${dateLabel(b.asOf)}`, value: amount(b.cash, company.currency) })
  if (finite(calculated.dividendYield)) rows.push({ label: 'Rendement · dividendes annuels déclarés', value: `${fr(calculated.dividendYield, 2)} %` })
  return rows
}
export function buildTweetText(company, now = new Date()) {
  if (!canPublish(company, now)) return ''
  const lines = [`🔎 Quand tu achètes une action ${company.name}, qu’est-ce que tu achètes vraiment ? 👇`,
    `🏭 Son activité\n${company.activity}`, periodText(company.annual, company)]
  const quarter = company.quarter
  if (quarter && fresh(quarter.end, 200, now) && finite(quarter.revenue) && quarter.revenue > 0 && finite(quarter.netIncome)) {
    lines.push(periodText(quarter, company, true))
  }
  const v = activeValuation(company, now)
  const calculated = calculatedRatios(company, now)
  const pe = calculated.peTTM ?? v?.peTTM
  const valuation = []
  if (company.quote && finite(company.quote.price) && company.quote.price > 0 && fresh(company.quote.asOf, 10, now)) {
    valuation.push(`À la clôture du ${dateLabel(company.quote.asOf)}, l’action valait ${fr(company.quote.price, 2)} ${company.currency}${finite(pe) && pe > 0 ? ` pour un PER de ${fr(pe)}` : ''}.`)
  } else if (finite(pe) && pe > 0) valuation.push(`Le PER est de ${fr(pe)}.`)
  if (finite(pe) && pe > 0) valuation.push(`Autrement dit, le cours représente environ ${fr(pe)} fois le bénéfice par action des douze derniers mois.\nCe ratio utilise les bénéfices déjà publiés. Il ne mesure pas leur croissance future.`)
  if (finite(v?.forwardPE) && v.forwardPE > 0) valuation.push(`Le PER prévisionnel fourni est de ${fr(v.forwardPE)}. Il utilise des bénéfices estimés, avec un horizon non précisé par ${v.sourceName ?? 'Alpha Vantage'}.`)
  if (finite(v?.peg) && v.peg > 0) valuation.push(`Le PEG fourni est de ${fr(v.peg)}. Il rapporte le PER à un taux de croissance des bénéfices ; la croissance retenue et son horizon ne sont pas précisés par ${v.sourceName ?? 'Alpha Vantage'}.`)
  if (valuation.length) lines.push(`🏷️ Et le prix de l’action ?\n${valuation.join('\n\n')}`)
  lines.push('💬 Tu connaissais toutes ses activités ?')
  return lines.join('\n\n')
}
