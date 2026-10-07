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
export const latestAccountsEnd = company => [company.annual?.end, company.quarter?.end, company.halfYear?.end].filter(Boolean).sort().at(-1)
export function activeValuation(company, now = new Date()) {
  const v = company.valuation
  const latest = latestAccountsEnd(company)
  return v && fresh(v.observedAt, 7, now) && fresh(v.accountsAsOf, 200, now) && v.accountsAsOf >= latest ? v : null
}
export function activeEstimates(company, now = new Date()) {
  const e = company.estimates, q = company.quote
  const latest = latestAccountsEnd(company)
  if (!canPublish(company, now) || !e || !q || !finite(q.price) || q.price <= 0
    || !fresh(q.asOf, 10, now) || !fresh(e.observedAt, 7, now)
    || e.accountsEndAtCollection !== latest || !Array.isArray(q.splits)
    || q.splits.some(date => date >= e.observedAt && date <= q.asOf)
    || !finite(e.forwardEPS) || e.forwardEPS <= 0) return null
  const forwardPE = q.price / e.forwardEPS
  return {...e, forwardPE, peg: finite(e.growthEPS5Y) && e.growthEPS5Y > 0 ? forwardPE / e.growthEPS5Y : null}
}
export function activeHistory(company, now = new Date()) {
  const h = company.history
  if (!canPublish(company, now) || !h || !fresh(h.observedAt, 45, now)
    || !Array.isArray(h.years) || h.years.length < 3 || h.years.length > 5) return []
  const years = h.years
  if (years.at(-1).end !== company.annual.end
    || years.at(-1).revenue !== company.annual.revenue || years.at(-1).netIncome !== company.annual.netIncome) return []
  if (years.some((y, i) => !fresh(y.end, 2500, now) || !finite(y.revenue) || y.revenue <= 0 || !finite(y.netIncome)
    || (i && ((Date.parse(y.end) - Date.parse(years[i-1].end)) / 86400000 < 330
      || (Date.parse(y.end) - Date.parse(years[i-1].end)) / 86400000 > 400)))) return []
  return years.map(y => ({...y, margin: y.netIncome / y.revenue * 100}))
}
function historyText(company, now) {
  const years = activeHistory(company, now)
  if (!years.length) return ''
  const first = years[0], last = years.at(-1)
  const change = growth(last.revenue, first.revenue)
  const reading = first.netIncome > 0 && last.netIncome > 0 && fr(first.margin) !== fr(last.margin)
    ? `À chiffre d’affaires comparable, l’entreprise dégage ${last.margin > first.margin ? 'davantage' : 'moins'} de bénéfice qu’au début de cette période.` : ''
  return `📊 Le recul sur ${years.length} exercices\nEntre les exercices clos le ${dateLabel(first.end)} et le ${dateLabel(last.end)}, le chiffre d’affaires est passé de ${amount(first.revenue, company.currency)} à ${amount(last.revenue, company.currency)}${finite(change) ? `, soit ${change >= 0 ? '+' : '−'}${fr(Math.abs(change))} % sur l’ensemble de la période` : ''}.\nLe résultat net est passé de ${amount(first.netIncome, company.currency)} à ${amount(last.netIncome, company.currency)}, et la marge nette de ${fr(first.margin)} % à ${fr(last.margin)} %.${reading ? `\n${reading}` : ''}`
}
export function calculatedRatios(company, now = new Date()) {
  const a = company.annual, q = company.quote, t = company.trailing
  if (!canPublish(company, now) || !q || !finite(q.price) || q.price <= 0 || !Array.isArray(q.splits) || !fresh(q.asOf, 10, now)) return {}
  const splitAfter = end => (q.splits ?? []).some(date => date > end && date <= q.asOf)
  const result = {}
  if (t && fresh(t.observedAt, 45, now) && fresh(t.end, 200, now)
    && t.end >= (latestAccountsEnd(company)) && finite(t.dilutedEPS) && t.dilutedEPS > 0
    && company.quarters?.length === 4 && !splitAfter(company.quarters[3].end)) {
    result.peTTM = q.price / t.dilutedEPS
  }
  if (!result.peTTM && company.accountingStandard === 'IFRS' && finite(a.dilutedEPS) && a.dilutedEPS > 0 && !splitAfter(a.end)) result.peAnnual = q.price / a.dilutedEPS
  const shares = company.shares
  if (shares && fresh(shares.observedAt, 45, now) && fresh(shares.asOf, 200, now)
    && shares.asOf >= (latestAccountsEnd(company)) && !splitAfter(shares.asOf)
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
    && b.asOf >= (latestAccountsEnd(company)) ? b : null
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
  if (current.toFixed(1) === previous.toFixed(1)) return `La marge nette est presque stable sur un an, autour de ${fr(current)} %.`
  const improved = current > previous
  const revenueGrowth = growth(revenue, previousRevenue)
  const profitGrowth = growth(netIncome, previousNetIncome)
  if (netIncome > 0 && previousNetIncome > 0 && revenueGrowth > .05 && profitGrowth > .05) {
    return improved
      ? 'Les bénéfices ont progressé plus vite que le chiffre d’affaires : la marge nette s’est améliorée. L’entreprise dégage davantage de bénéfice à chiffre d’affaires comparable.'
      : 'Les revenus ont progressé plus vite que les bénéfices : la marge nette a diminué. L’entreprise dégage moins de bénéfice à chiffre d’affaires comparable.'
  }
  if (netIncome > 0 && previousNetIncome > 0 && revenueGrowth > .05 && profitGrowth < -.05) return `Le chiffre d’affaires augmente, mais les bénéfices reculent. La marge nette a diminué, passant de ${fr(previous)} % à ${fr(current)} % : l’entreprise dégage moins de bénéfice à chiffre d’affaires comparable.`
  return `La marge nette ${improved ? 's’est améliorée' : 'a diminué'}, passant de ${fr(previous)} % à ${fr(current)} % sur un an.`
}
function periodText(period, company, quarterly = false, halfYear = false) {
  const dates = period.start ? `du ${dateLabel(period.start)} au ${dateLabel(period.end)}` : `clos le ${dateLabel(period.end)}`
  const lines = [quarterly ? `📈 Et les derniers résultats ?\n${halfYear ? 'Semestre' : period.durationWeeks ? `Trimestre de ${period.durationWeeks} semaines` : 'Trimestre'} ${dates}` : `💰 Et dans les comptes ?\nExercice ${dates}`,
    `Son chiffre d’affaires atteint ${amount(period.revenue, company.currency)}${changePhrase(growth(period.revenue, period.previousRevenue))}.`,
    incomePhrase(period, company.currency)]
  if (period.incomeBasis && !quarterly) lines.push('Le résultat net présenté correspond à la part du groupe, hors intérêts minoritaires.')
  if (finite(period.revenue) && period.revenue > 0 && finite(period.netIncome)) {
    const margin = period.netIncome / period.revenue * 100
    if (!quarterly) {
      if (period.netIncome > 0) lines.push(`Pour 100 ${company.currency} de chiffre d’affaires, cela représente environ ${fr(margin)} ${company.currency} de bénéfice net.`)
      else if (period.netIncome < 0) lines.push(`Cela représente une perte nette de ${fr(-margin)} ${company.currency} pour 100 ${company.currency} de chiffre d’affaires.`)
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
  const estimates = activeEstimates(company, now)
  const pe = calculated.peTTM ?? v?.peTTM
  if (finite(pe) && pe > 0) rows.push({ label: 'PER · bénéfices sur 12 mois', value: `${fr(pe)}×` })
  else if (finite(calculated.peAnnual)) rows.push({ label: 'PER · dernier exercice publié', value: `${fr(calculated.peAnnual)}×` })
  if (estimates) rows.push({ label: 'PER prévisionnel · prochain exercice', value: `${fr(estimates.forwardPE)}×` })
  if (finite(estimates?.peg)) rows.push({ label: 'PEG · croissance estimée sur 5 ans', value: `${fr(estimates.peg, 2)}×` })
  if (!estimates && finite(v?.forwardPE) && v.forwardPE > 0) rows.push({ label: 'PER prévisionnel · horizon fournisseur', value: `${fr(v.forwardPE)}×` })
  if (!estimates && finite(v?.peg) && v.peg > 0) rows.push({ label: 'PEG · méthode fournisseur', value: `${fr(v.peg)}×` })
  if (finite(calculated.priceFCF)) rows.push({ label: 'Prix / FCF du dernier exercice', value: `${fr(calculated.priceFCF)}×` })
  const b = activeBalance(company, now)
  if (finite(b?.netDebt)) rows.push({ label: `${b.netDebt < 0 ? 'Trésorerie' : 'Dette'} nette · ${dateLabel(b.asOf)}`, value: amount(Math.abs(b.netDebt), company.currency) })
  if (b && !finite(b.netDebt) && finite(b.cash)) rows.push({ label: `Trésorerie · ${dateLabel(b.asOf)}`, value: amount(b.cash, company.currency) })
  if (finite(calculated.dividendYield)) rows.push({ label: 'Rendement · dividendes annuels déclarés', value: `${fr(calculated.dividendYield, 2)} %` })
  return rows
}
export function buildTweetText(company, now = new Date()) {
  if (!canPublish(company, now)) return ''
  const lines = [company.editorialHook ?? `🔎 Que fait concrètement ${company.name}, et que montrent ses comptes ? 👇`,
    `🏭 Ce qu’elle fait concrètement\n${company.activity}`, periodText(company.annual, company)]
  const history = historyText(company, now)
  if (history) lines.push(history)
  const quarter = company.quarter
  if (quarter && fresh(quarter.end, 200, now) && finite(quarter.revenue) && quarter.revenue > 0 && finite(quarter.netIncome)) {
    lines.push(periodText(quarter, company, true))
  }
  const half = company.halfYear
  if (half && fresh(half.end, 250, now) && finite(half.revenue) && half.revenue > 0 && finite(half.netIncome)) lines.push(periodText(half, company, true, true))
  const v = activeValuation(company, now)
  const calculated = calculatedRatios(company, now)
  const estimates = activeEstimates(company, now)
  const pe = calculated.peTTM ?? v?.peTTM
  const valuation = []
  if (company.quote && finite(company.quote.price) && company.quote.price > 0 && fresh(company.quote.asOf, 10, now)) {
    valuation.push(`À la clôture du ${dateLabel(company.quote.asOf)}, l’action valait ${fr(company.quote.price, 2)} ${company.currency}.`)
  }
  if (!finite(pe) && finite(calculated.peAnnual)) valuation.push(`Le cours représente ${fr(calculated.peAnnual)} fois le BPA dilué du dernier exercice publié, clos le ${dateLabel(company.annual.end)}. Ce PER annuel utilise cet exercice précis.`)
  if (company.quoteListing && company.id === 'totalenergies') valuation.push('Le cours utilisé est celui de l’action ordinaire cotée à New York en USD, la devise des comptes présentés.')
  if (finite(pe) && pe > 0) valuation.push(`Le PER est de ${fr(pe)} : le cours représente environ ${fr(pe)} fois le bénéfice par action des douze derniers mois.\nCe ratio utilise les bénéfices déjà publiés.`)
  if (estimates) valuation.push(`Avec les bénéfices estimés pour le prochain exercice fiscal, le PER prévisionnel à cette même clôture est de ${fr(estimates.forwardPE)}. Il utilise un BPA attendu de ${fr(estimates.forwardEPS, 2)} ${company.currency}, relevé sur Finviz le ${dateLabel(estimates.observedAt)}. Cette estimation peut être révisée.`)
  if (finite(estimates?.peg)) valuation.push(`Le PEG est de ${fr(estimates.peg, 2)} : ce PER prévisionnel est divisé par la croissance annuelle du BPA estimée sur cinq ans (${fr(estimates.growthEPS5Y, 2)} % selon Finviz). Cette croissance est une prévision du fournisseur.`)
  if (!estimates && finite(v?.forwardPE) && v.forwardPE > 0) valuation.push(`Le PER prévisionnel fourni est de ${fr(v.forwardPE)}. Il utilise des bénéfices estimés, avec un horizon non précisé par ${v.sourceName ?? 'Alpha Vantage'}.`)
  if (!estimates && finite(v?.peg) && v.peg > 0) valuation.push(`Le PEG fourni est de ${fr(v.peg)}. Il rapporte le PER à un taux de croissance des bénéfices ; la croissance retenue et son horizon ne sont pas précisés par ${v.sourceName ?? 'Alpha Vantage'}.`)
  if (valuation.length) lines.push(`🏷️ Ce que représente le prix de l’action\n${valuation.join('\n\n')}`)
  return lines.join('\n\n')
}
