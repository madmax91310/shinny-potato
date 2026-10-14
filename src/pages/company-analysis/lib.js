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
export function calculatedRatios(company, now = new Date()) {
  const a = company.annual, q = company.quote, t = company.trailing
  if (!canPublish(company, now) || !q || !finite(q.price) || q.price <= 0 || !Array.isArray(q.splits) || !fresh(q.asOf, 10, now)) return {}
  const splitAfter = end => (q.splits ?? []).some(date => date > end && date <= q.asOf)
  const result = {}
  const splitDates = (q.splits ?? []).filter(date => date > (company.quarters?.at(-1)?.end ?? '') && date <= q.asOf)
  const verifiedShareBasis = t?.shareBasisAsOf === q.asOf && company.quarters?.every(quarter => quarter.epsShareBasisAsOf === q.asOf)
    && splitDates.every(date => t.splitAdjustments?.some(proof => proof.asOf === date && finite(proof.ratio) && proof.ratio > 0 && proof.issuerSourceUrl?.startsWith('https://')))
  if (t && fresh(t.observedAt, 45, now) && fresh(t.end, 200, now)
    && t.end >= (latestAccountsEnd(company)) && finite(t.dilutedEPS) && t.dilutedEPS > 0
    && company.quarters?.length === 4 && (!splitAfter(company.quarters[3].end) || verifiedShareBasis)) {
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
  for (const b of [company.balance, activeDecision(company, now)?.balance]) {
    if (b && fresh(b.asOf, 200, now) && fresh(b.observedAt, 45, now)
      && b.asOf >= latestAccountsEnd(company)) return b
  }
  return null
}
export function activeDecision(company, now = new Date()) {
  const d = company.decision, a = company.annual
  if (!canPublish(company, now) || !d || !fresh(d.observedAt, 45, now)
    || d.annualEnd !== a.end || !Array.isArray(d.years) || !d.years.length) return null
  const latest = d.years.at(-1)
  if (latest.end !== a.end || latest.revenue !== a.revenue || latest.netIncome !== a.netIncome
    || (finite(a.freeCashFlow) && finite(latest.freeCashFlow) && a.freeCashFlow !== latest.freeCashFlow)) return null
  if (d.years.some((r, i) => !fresh(r.end, 2500, now) || !finite(r.revenue) || r.revenue <= 0 || !finite(r.netIncome)
    || !r.sourceUrl?.startsWith('https://') || (i && r.end <= d.years[i-1].end)
    || (finite(r.freeCashFlow) && (!finite(r.operatingCashFlow) || !finite(r.capitalExpenditure)
      || r.capitalExpenditure < 0 || Math.abs(r.freeCashFlow - (r.operatingCashFlow - r.capitalExpenditure)) > 1)))) return null
  return d
}
// Issuer balances are independent of cash-flow observations and SEC access.
export function activeSolidity(company, now = new Date()) {
  const s = company.solidity, a = company.annual
  const valid = b => b && b.sourceUrl?.startsWith('https://')
    && ['assets','liabilities','equity','currentAssets','currentLiabilities','liabilitiesAndEquity'].every(k => finite(b[k]))
    && ['assets','liabilities','currentAssets','currentLiabilities'].every(k => b[k] >= 0)
    && Math.abs(b.assets-b.liabilities-b.equity) <= 1e6 && Math.abs(b.assets-b.liabilitiesAndEquity) <= 1e6
    && b.currentAssets <= b.assets && b.currentLiabilities <= b.liabilities
    && ['cash','inventories'].every(k => b[k] === undefined || (finite(b[k]) && b[k] >= 0 && b[k] <= b.currentAssets))
  if (!canPublish(company,now) || !s || s.componentVersion !== 1 || !fresh(s.observedAt,45,now)
    || s.annualEnd !== a.end || s.revenue !== a.revenue || s.netIncome !== a.netIncome
    || s.accountsEndAtCollection !== latestAccountsEnd(company)
    || s.annualBalances?.length !== 2 || !s.annualBalances.every(valid) || !valid(s.latestBalance)
    || s.latestBalance.asOf !== latestAccountsEnd(company) || !fresh(s.latestBalance.asOf,200,now)
    || s.annualBalances[0].asOf !== a.previousEnd || s.annualBalances[1].asOf !== a.end
    || s.annualBalances[0].sourceUrl !== s.annualBalances[1].sourceUrl
    || (Date.parse(a.end)-Date.parse(a.previousEnd))/86400000 < 330
    || (Date.parse(a.end)-Date.parse(a.previousEnd))/86400000 > 400) return null
  return s
}
// Require consecutive annual observations and positive values throughout the window.
export function annualizedGrowth(years, field, intervals, comparable = () => true) {
  const window = years.slice(-(intervals + 1))
  if (window.length !== intervals + 1 || intervals < 3 || window.some((r,i) => !finite(r[field]) || r[field] <= 0
    || !comparable(r,window[0]) || (i && ((Date.parse(r.end)-Date.parse(window[i-1].end))/86400000 < 330
      || (Date.parse(r.end)-Date.parse(window[i-1].end))/86400000 > 400)))) return null
  const elapsed = (Date.parse(window.at(-1).end)-Date.parse(window[0].end))/86400000/365.25
  return {value:(Math.pow(window.at(-1)[field]/window[0][field],1/elapsed)-1)*100,
    intervals, start:window[0].end, end:window.at(-1).end}
}
export function decisionRatios(company, now = new Date()) {
  if (!canPublish(company, now)) return {}
  const d = activeDecision(company, now), a = company.annual, latest = d?.years.at(-1)
  const fcf = latest?.freeCashFlow ?? a.freeCashFlow
  const result = {}
  const solidity = activeSolidity(company, now)
  if (solidity) {
    const [opening,closing] = solidity.annualBalances, b = solidity.latestBalance
    if (opening.equity > 0 && closing.equity > 0) result.roe = a.netIncome / ((opening.equity+closing.equity)/2)*100
    if (b.currentLiabilities > 0) {
      result.currentRatio = b.currentAssets/b.currentLiabilities
      if (finite(b.cash)) result.cashRatio = b.cash/b.currentLiabilities
    }
    result.solidityAsOf = b.asOf
  }
  const history = activeHistory(company, now)
  result.longTerm = []
  for (const intervals of [...new Set([3, history.length - 1])].filter(n => n >= 3)) {
    for (const [field,label] of [['revenue','Chiffre d’affaires'],['netIncome','Bénéfice net']]) {
      const value = annualizedGrowth(history,field,intervals)
      if (value) result.longTerm.push({...value,label,key:field+intervals})
    }
    const cash = annualizedGrowth(d?.years ?? [],'freeCashFlow',intervals,
      (row, first) => Boolean(row.freeCashFlowDefinition) && row.freeCashFlowDefinition === first.freeCashFlowDefinition)
    if (cash) result.longTerm.push({...cash,label:'FCF',key:'freeCashFlow'+intervals})
  }
  const operating = latest?.operatingIncome ?? a.operatingIncome
  if (finite(operating)) result.operatingMargin = operating/a.revenue*100
  const priorOperating = d?.years.at(-2)
  if (finite(result.operatingMargin)) {
    const previousValue = finite(priorOperating?.operatingIncome) && priorOperating.revenue > 0
      && (Date.parse(a.end)-Date.parse(priorOperating.end))/86400000 >= 330
      && (Date.parse(a.end)-Date.parse(priorOperating.end))/86400000 <= 400
      ? priorOperating.operatingIncome/priorOperating.revenue*100
      : finite(a.previousOperatingIncome) && a.previousRevenue > 0 && a.previousEnd
        && (Date.parse(a.end)-Date.parse(a.previousEnd))/86400000 >= 330
        && (Date.parse(a.end)-Date.parse(a.previousEnd))/86400000 <= 400
        ? a.previousOperatingIncome/a.previousRevenue*100 : null
    if (finite(previousValue)) result.operatingMarginChange = result.operatingMargin - previousValue
  }
  if (finite(latest?.capitalExpenditure) && latest.capitalExpenditure >= 0) result.capexRevenue = latest.capitalExpenditure/a.revenue*100
  for (const field of ['shareRepurchases','shareBasedCompensation']) {
    if (finite(latest?.[field]) && latest[field] >= 0) {
      result[field] = latest[field]
      result[field+'Revenue'] = latest[field]/a.revenue*100
    }
  }
  if (finite(fcf)) {
    result.freeCashFlow = fcf
    result.fcfMargin = fcf / a.revenue * 100
    if (a.netIncome > 0) result.cashConversion = fcf / a.netIncome * 100
    if (fcf > 0 && finite(latest?.dividendsPaid) && latest.dividendsPaid >= 0) result.dividendFCF = latest.dividendsPaid / fcf * 100
  }
  const priceFCF = calculatedRatios(company, now).priceFCF
  if (finite(priceFCF) && priceFCF > 0 && !['alphabet','visa','meta'].includes(company.id)) {
    result.fcfYield = 100 / priceFCF
    result.fcfSharesAsOf = company.shares.asOf
  }
  else if (fcf > 0 && d?.shares && !['alphabet','visa','meta'].includes(company.id)) {
    const s = d.shares, q = company.quote
    if (s.outstanding > 0 && fresh(s.asOf, 200, now) && fresh(s.observedAt, 45, now) && s.asOf >= latestAccountsEnd(company)
      && q?.price > 0 && fresh(q.asOf, 10, now) && Array.isArray(q.splits) && !q.splits.some(date => date > s.asOf && date <= q.asOf)) {
      result.fcfYield = fcf / (q.price * s.outstanding) * 100
      result.fcfSharesAsOf = s.asOf
    }
  }
  if (finite(latest?.interestExpense) && latest.interestExpense > 0 && finite(latest.operatingIncome)) result.interestCoverage = latest.operatingIncome / latest.interestExpense
  const b = activeBalance(company, now)
  if (finite(b?.netDebt) && b.netDebt >= 0 && fcf > 0) {
    result.netDebtFCF = b.netDebt/fcf
    result.netDebtFCFAsOf = b.asOf
  }
  const priorBalance = company.balanceHistory?.filter(row => row.asOf < b?.asOf && row.definition === b.definition
    && finite(row.netDebt) && fresh(row.asOf, 1000, now) && row.sourceUrl?.startsWith('https://')).at(-1)
  if (finite(b?.netDebt) && priorBalance) {
    result.netDebtChange = b.netDebt - priorBalance.netDebt
    result.previousBalanceAsOf = priorBalance.asOf
    result.balanceAsOf = b.asOf
  }
  const previous = d?.years.at(-2)
  const annualGap = previous && (Date.parse(a.end) - Date.parse(previous.end)) / 86400000
  if (annualGap >= 330 && annualGap <= 400 && finite(previous.freeCashFlow) && finite(latest.freeCashFlow)
    && previous.freeCashFlowDefinition === latest.freeCashFlowDefinition) {
    result.fcfChange = latest.freeCashFlow - previous.freeCashFlow
    if (previous.freeCashFlow > 0 && latest.freeCashFlow >= 0) result.fcfGrowth = (latest.freeCashFlow / previous.freeCashFlow - 1) * 100
  }
  // Use published diluted averages from the same filing, never EPS to infer shares.
  if (annualGap >= 330 && annualGap <= 400 && previous.averageDilutedShares > 0 && latest.averageDilutedShares > 0
    && previous.sharesBasisSource && previous.sharesBasisSource === latest.sharesBasisSource
    && !['visa','alphabet','meta'].includes(company.id)) result.shareChange = (latest.averageDilutedShares / previous.averageDilutedShares - 1) * 100
  return result
}
export function decisionIndicators(company, now = new Date()) {
  const r = decisionRatios(company, now), d = activeDecision(company, now), b = activeBalance(company, now)
  const rows = []
  const add = (key, label, value, explanation) => rows.push({key, label, value, explanation})
  if (finite(r.freeCashFlow)) add('fcf', 'FCF du dernier exercice', amount(r.freeCashFlow, company.currency), 'Flux d’exploitation moins investissements. Les acquisitions d’entreprises et remboursements de locations ne sont pas déduits.')
  if (finite(r.fcfGrowth)) add('fcfGrowth', 'Évolution du FCF sur un an', `${r.fcfGrowth > 0 ? '+' : ''}${fr(r.fcfGrowth)} %`, 'Comparaison de deux exercices consécutifs avec la même définition du FCF.')
  else if (finite(r.fcfChange)) add('fcfChange', 'Variation du FCF sur un an', amount(r.fcfChange, company.currency), 'Variation en montant : une base négative ne produit pas un taux de croissance ordinaire.')
  if (finite(r.fcfMargin)) add('fcfMargin', 'Marge de FCF', `${fr(r.fcfMargin)} %`, 'FCF / chiffre d’affaires du même exercice.')
  if (finite(r.fcfYield)) add('fcfYield', 'Rendement du FCF annuel', `${fr(r.fcfYield, 2)} %`, `FCF / capitalisation indicative à la dernière clôture. Actions publiées au ${dateLabel(r.fcfSharesAsOf)}. Ce ratio n’est pas un dividende.`)
  if (!finite(r.freeCashFlow) && finite(d?.years.at(-1).operatingCashFlow)) add('ocf', 'Flux de trésorerie d’exploitation annuel', amount(d.years.at(-1).operatingCashFlow, company.currency), 'Cash généré par les opérations après variation du besoin en fonds de roulement. Les investissements ne sont pas déduits : ce montant n’est pas un FCF.')
  if (finite(r.cashConversion)) add('cashConversion', 'FCF / bénéfice net', `${fr(r.cashConversion)} %`, 'Compare le cash après investissements au bénéfice comptable. Le besoin en fonds de roulement, les investissements et les éléments exceptionnels peuvent modifier ce ratio.')
  if (finite(b?.netDebt)) add('netDebt', b.netDebt < 0 ? 'Trésorerie nette' : 'Dette nette', amount(Math.abs(b.netDebt), company.currency), `${b.definition} · bilan au ${dateLabel(b.asOf)}.`)
  if (finite(r.netDebtChange)) add('netDebtChange', 'Variation de la dette nette', amount(r.netDebtChange, company.currency), `Entre les bilans du ${dateLabel(r.previousBalanceAsOf)} et du ${dateLabel(r.balanceAsOf)}, à définition identique. Un montant négatif indique une baisse de la dette nette.`)
  if (finite(r.interestCoverage)) add('interestCoverage', 'Couverture des intérêts', `${fr(r.interestCoverage)}×`, 'Résultat opérationnel / charges d’intérêts publiées du même exercice. Une valeur négative conserve le signe de la perte opérationnelle.')
  if (finite(r.shareChange)) add('shareChange', 'Variation des actions diluées moyennes sur un an', `${r.shareChange > 0 ? '+' : ''}${fr(r.shareChange)} %`, 'Nombre moyen d’actions diluées publié sur deux exercices comparables du même document. Il tient compte des instruments dilutifs ; sa variation ne mesure pas uniquement les rachats.')
  if (finite(r.dividendFCF)) add('dividendFCF', 'Dividendes versés / FCF', `${fr(r.dividendFCF)} %`, 'Dividendes payés aux actionnaires / FCF positif du même exercice. Les dividendes exceptionnels sont inclus.')
  if (finite(r.operatingMargin)) add('operatingMargin','Marge opérationnelle',`${fr(r.operatingMargin)} %`,'Résultat opérationnel publié / chiffre d’affaires du même exercice, avant charges financières et impôts.')
  if (finite(r.operatingMarginChange)) add('operatingMarginChange','Évolution de la marge opérationnelle',`${r.operatingMarginChange > 0 ? '+' : ''}${fr(r.operatingMarginChange)} point(s)`,'Écart entre deux exercices annuels consécutifs ; variation en points de pourcentage.')
  if (finite(r.capexRevenue)) add('capexRevenue','Investissements / chiffre d’affaires',`${fr(r.capexRevenue)} %`,'Achats d’immobilisations retenus dans le calcul du FCF / chiffre d’affaires annuel. Les acquisitions d’entreprises sont exclues.')
  if (finite(r.netDebtFCF)) add('netDebtFCF','Dette nette / FCF annuel',`${fr(r.netDebtFCF)}×`,`Dette nette au ${dateLabel(r.netDebtFCFAsOf)} / FCF de l’exercice clos le ${dateLabel(company.annual.end)}. Ce rapport ne constitue pas un délai de remboursement.`)
  if (finite(r.shareRepurchases)) add('shareRepurchases','Rachats d’actions payés',amount(r.shareRepurchases,company.currency),'Décaissements de rachats d’actions ordinaires sur l’exercice ; distincts de la variation nette du nombre d’actions et de l’autorisation de rachat.')
  if (finite(r.shareBasedCompensation)) add('shareBasedCompensation','Rémunération en actions',amount(r.shareBasedCompensation,company.currency),`Charge de rémunération en actions publiée : ${fr(r.shareBasedCompensationRevenue)} % du chiffre d’affaires. Elle ne mesure pas directement la dilution.`)
  if (finite(r.roe)) add('roe','ROE annuel',`${fr(r.roe)} %`,`Résultat net de l’exercice clos le ${dateLabel(company.annual.end)} / moyenne des capitaux propres publiés au ${dateLabel(company.annual.previousEnd)} et au ${dateLabel(company.annual.end)}. Deux capitaux propres positifs sont exigés. Les rachats d’actions peuvent relever ce ratio.`)
  if (finite(r.currentRatio)) add('currentRatio','Liquidité générale',`${fr(r.currentRatio,2)}×`,`Actifs courants / passifs courants au ${dateLabel(r.solidityAsOf)}. Ce ratio ne garantit pas la disponibilité immédiate des actifs.`)
  if (finite(r.cashRatio)) add('cashRatio','Liquidité immédiate (cash)',`${fr(r.cashRatio,2)}×`,`Trésorerie et équivalents / passifs courants au ${dateLabel(r.solidityAsOf)}. Les placements sont exclus ; une ligne cash et placements combinés ne convient pas.`)
  for (const row of r.longTerm ?? []) add(row.key,`${row.label} : croissance annualisée sur ${row.intervals} ans`,`${row.value > 0 ? '+' : ''}${fr(row.value)} %/an`,`Du ${dateLabel(row.start)} au ${dateLabel(row.end)}. Exercices consécutifs et valeurs positives, sans estimation.`)
  if (!d && !rows.length) return []
  return rows
}
export function decisionReadings(company, now = new Date()) {
  const r = decisionRatios(company, now), lines = []
  if (finite(r.freeCashFlow)) lines.push(r.freeCashFlow > 0 ? 'L’activité génère un flux de trésorerie disponible positif après investissements.' : r.freeCashFlow < 0 ? 'Les investissements dépassent le cash généré par l’activité sur cet exercice.' : 'Le flux de trésorerie disponible est à l’équilibre sur cet exercice.')
  if (finite(r.fcfChange) && r.fcfChange !== 0) lines.push(`Le FCF ${r.fcfChange > 0 ? 'progresse' : 'recule'} de ${amount(Math.abs(r.fcfChange), company.currency)} sur un an.`)
  if (finite(r.shareChange) && Math.abs(r.shareChange) >= .05) lines.push(`Le nombre moyen d’actions diluées ${r.shareChange > 0 ? 'augmente' : 'diminue'} de ${fr(Math.abs(r.shareChange))} % sur un an.`)
  if (r.dividendFCF > 100) lines.push('Les dividendes versés dépassent le FCF de cet exercice.')
  return lines
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
export function marginExplanation(period, voice = 0) {
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
      ? [
          `Les bénéfices ont progressé plus vite que le chiffre d’affaires. La marge nette passe de ${fr(previous)} % à ${fr(current)} %.`,
          `Le bénéfice augmente plus vite que les ventes. La marge nette monte de ${fr(previous)} % à ${fr(current)} %.`,
          `La marge nette s’améliore : ${fr(current)} %, contre ${fr(previous)} % un an plus tôt.`,
        ][voice % 3]
      : [
          `Les revenus ont progressé plus vite que les bénéfices. La marge nette passe de ${fr(previous)} % à ${fr(current)} %.`,
          `Les ventes augmentent, mais le bénéfice ne suit pas au même rythme. La marge nette recule de ${fr(previous)} % à ${fr(current)} %.`,
          `La marge nette a diminué : ${fr(current)} %, contre ${fr(previous)} % un an plus tôt.`,
        ][voice % 3]
  }
  if (netIncome > 0 && previousNetIncome > 0 && revenueGrowth > .05 && profitGrowth < -.05) return `Le chiffre d’affaires augmente, mais les bénéfices reculent : la marge nette a diminué de ${fr(previous)} % à ${fr(current)} %.`
  return `La marge nette ${improved ? 's’est améliorée' : 'a diminué'}, passant de ${fr(previous)} % à ${fr(current)} % sur un an.`
}
const currencyWord = currency => ({USD: 'dollars', EUR: 'euros'}[currency] ?? currency)
function storyAmount(value, currency) {
  const unit = Math.abs(value) >= 1e9 ? 1e9 : 1e6
  return `${fr(value / unit)} ${unit === 1e9 ? (Math.abs(value / unit) < 2 ? 'milliard' : 'milliards') : (Math.abs(value / unit) < 2 ? 'million' : 'millions')} ${currency === 'EUR' ? 'd’euros' : `de ${currencyWord(currency)}`}`
}
// Editorial evidence belongs to one exact annual comparison, never to later accounts.
export function activeAnnualContext(company, now = new Date()) {
  const context = company.annualContext, annual = company.annual
  if (!canPublish(company, now) || !context || !/^https:\/\//.test(context.sourceUrl ?? '')
    || !fresh(context.reviewedAt, 550, now)
    || ['end', 'previousEnd', 'revenue', 'previousRevenue', 'netIncome', 'previousNetIncome']
      .some(key => context[key] !== annual[key])) return null
  return context
}
// Stable phrasing per company; figures and directions still follow refreshed accounts.
function editorialVoice(company) {
  const groups = [
    ['apple', 'nvidia', 'lvmh', 'visa', 'adobe', 'intuit', 'totalenergies'],
    ['microsoft', 'amazon', 'air-liquide', 'costco', 'salesforce', 'coca-cola'],
    ['alphabet', 'schneider', 'amd', 'meta', 'mastercard', 'servicenow', 'pepsico'],
  ]
  return Math.max(0, groups.findIndex(ids => ids.includes(company.id)))
}
function annualStory(company, context) {
  const a = company.annual, voice = editorialVoice(company)
  const year = new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric', timeZone: 'UTC'}).format(new Date(`${a.end}T00:00:00Z`))
  let income = incomePhrase(a, company.currency).replace(amount(Math.abs(a.netIncome), company.currency), storyAmount(Math.abs(a.netIncome), company.currency))
  if (a.netIncome > 0) income = income.replace('Elle a dégagé ', [
    `Son bénéfice net${a.incomeBasis ? ' revenant au groupe' : ''} atteint `,
    `Le bénéfice net${a.incomeBasis ? ' revenant au groupe' : ''} s’élève à `,
    `Le groupe dégage `,
  ][voice]).replace(' de bénéfice net', voice === 2 ? ` de bénéfice net${a.incomeBasis ? ' revenant au groupe' : ''}` : '')
  const revenue = storyAmount(a.revenue, company.currency), change = changePhrase(growth(a.revenue, a.previousRevenue))
  const companyAfterDe = ['amazon', 'air-liquide'].includes(company.id) ? `d’${company.name}` : `de ${company.name}`
  const openings = [
    `💰 ${company.name} a réalisé ${revenue} de chiffre d’affaires sur l’exercice terminé en ${year}${change}.`,
    `💰 Sur l’exercice terminé en ${year}, les ventes ${companyAfterDe} atteignent ${revenue}${change}.`,
    `💰 Pour son exercice terminé en ${year}, ${company.name} affiche ${revenue} de chiffre d’affaires${change}.`,
  ]
  const lines = [`${openings[voice]} ${income}`]
  const explainedMargin = marginExplanation(a, voice)
  if (a.netIncome > 0 && ['apple','amazon','costco'].includes(company.id)) {
    lines.push(`Cela représente environ ${fr(a.netIncome / a.revenue * 100, 0)} ${currencyWord(company.currency)} de bénéfice net${a.incomeBasis ? ' revenant au groupe' : ''} pour 100 ${currencyWord(company.currency)} de ventes.`)
  } else if (!explainedMargin && finite(a.previousNetIncome) && a.netIncome > 0) {
    lines.push(`La marge nette atteint ${fr(a.netIncome / a.revenue * 100)} %.`)
  }
  if (a.netIncome < 0) lines.push(`Cela représente une perte nette de ${fr(-a.netIncome / a.revenue * 100)} ${company.currency} pour 100 ${company.currency} de ventes.`)
  if (finite(context?.previousTaxCharge) && context.previousTaxCharge > 0 && a.previousNetIncome > 0 && a.netIncome > 0) {
    lines.push(`Attention à la comparaison : une charge fiscale exceptionnelle avait pénalisé l’année précédente. En retirant cet effet, le bénéfice est${changePhrase(growth(a.netIncome, a.previousNetIncome + context.previousTaxCharge)).replace(/^,/, "")}.`)
  } else if (explainedMargin) lines.push(explainedMargin)
  return lines.join('\n\n')
}

function businessStory(company, context) {
  const s = context?.segments
  if (!s || !['services', 'previousServices', 'products', 'previousProducts', 'iphone'].every(key => finite(s[key]) && s[key] > 0)
    || s.services + s.products !== company.annual.revenue || s.previousServices + s.previousProducts !== company.annual.previousRevenue
    || s.iphone > s.products) return ''
  const a = company.annual
  const sg = growth(s.services,s.previousServices), pg = growth(s.products,s.previousProducts)
  const movement = sg > 0 && pg > 0 ? `Ils progressent${sg > pg ? ' plus vite que le matériel' : ''} : +${fr(sg)} % sur un an, contre +${fr(pg)} % pour les produits.` : `Leurs revenus sont${changePhrase(sg).replace(/^,/, '')}, contre une variation de ${fr(pg)} % pour le matériel.`
  return `Sur l’exercice clos le ${dateLabel(a.end)}, les services ont généré ${storyAmount(s.services, company.currency)}, soit ${fr(s.services / a.revenue * 100)} % des revenus du groupe. ${movement} 📈\n\nL’iPhone reste un pilier d’Apple : il représente ${fr(s.iphone / a.revenue * 100)} % de ses ventes.`
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
  if (finite(estimates?.peg)) rows.push({ label: 'PEG prévisionnel · croissance sur 5 ans', value: `${fr(estimates.peg, 2)}×` })
  if (finite(calculated.priceFCF)) rows.push({ label: 'Prix / FCF du dernier exercice', value: `${fr(calculated.priceFCF)}×` })
  const b = activeBalance(company, now)
  if (finite(b?.netDebt)) rows.push({ label: `${b.netDebt < 0 ? 'Trésorerie' : 'Dette'} nette · ${dateLabel(b.asOf)}`, value: amount(Math.abs(b.netDebt), company.currency) })
  if (b && !finite(b.netDebt) && finite(b.cash)) rows.push({ label: `Trésorerie · ${dateLabel(b.asOf)}`, value: amount(b.cash, company.currency) })
  if (finite(calculated.dividendYield)) rows.push({ label: 'Rendement · dividendes annuels déclarés', value: `${fr(calculated.dividendYield, 2)} %` })
  return rows
}
// Publication copy selects evidence; the indicator panel retains the full detail.
export function latestStoryPeriod(company, now = new Date()) {
  if (!canPublish(company, now)) return null
  return [company.quarter, company.halfYear].filter(p => p && p.end > company.annual.end
    && fresh(p.end, 200, now) && [3, 6, 9].includes(p.durationMonths)
    && finite(p.revenue) && p.revenue > 0 && finite(p.netIncome)
    && p.sourceUrl?.startsWith('https://'))
    .sort((a,b) => b.end.localeCompare(a.end))[0] ?? null
}
export function recentCash(company, now = new Date()) {
  const p = latestStoryPeriod(company, now), c = p?.cashFlow
  if (!c || c.end !== p.end || c.previousEnd !== p.previousEnd || ![3,6,9].includes(c.durationMonths)
    || !c.sourceUrl?.startsWith('https://')
    || !['operatingCashFlow','capitalExpenditure','previousOperatingCashFlow','previousCapitalExpenditure'].every(k => finite(c[k]))
    || c.capitalExpenditure < 0 || c.previousCapitalExpenditure < 0
    || (Date.parse(c.end)-Date.parse(c.previousEnd))/86400000 < 350
    || (Date.parse(c.end)-Date.parse(c.previousEnd))/86400000 > 380) return null
  return {...c, value:c.operatingCashFlow-c.capitalExpenditure, previous:c.previousOperatingCashFlow-c.previousCapitalExpenditure}
}
export function recentStory(company, now = new Date()) {
  const p = latestStoryPeriod(company, now)
  if (!p) return ''
  const duration = {3:'trois',6:'six',9:'neuf'}[p.durationMonths]
  const income = incomePhrase(p, company.currency)
    .replace(amount(Math.abs(p.netIncome), company.currency), storyAmount(Math.abs(p.netIncome), company.currency))
  return `Les derniers résultats donnent un point plus récent : sur les ${duration} mois clos le ${dateLabel(p.end)}, le chiffre d’affaires atteint ${storyAmount(p.revenue, company.currency)}${changePhrase(growth(p.revenue,p.previousRevenue))}. ${income}`
}
export function financialStory(company, now = new Date()) {
  if (!canPublish(company, now)) return ''
  const r = decisionRatios(company, now), b = activeBalance(company, now)
  const a = company.annual, paragraphs = []
  const dated = `sur l’exercice clos le ${dateLabel(a.end)}`
  const recent = recentCash(company,now)
  // Annual cash never masquerades as the direction of newer quarterly results.
  if (finite(r.freeCashFlow)) {
    let line = r.freeCashFlow > 0
      ? `💸 Après ses investissements en immobilisations, ${company.name} a généré ${storyAmount(r.freeCashFlow, company.currency)} de cash ${dated}.`
      : r.freeCashFlow < 0
        ? `💸 Les investissements en immobilisations dépassent le cash généré par l’activité ${dated}. Le FCF est négatif de ${storyAmount(-r.freeCashFlow, company.currency)}.`
        : `💸 ${dated[0].toUpperCase()+dated.slice(1)}, le cash généré par l’activité couvre exactement les investissements en immobilisations.`
    if (!latestStoryPeriod(company,now) && finite(r.fcfGrowth)) line += Math.abs(r.fcfGrowth) < .05
      ? ' Ce montant est presque stable sur un an.'
      : ` Ce montant ${r.fcfGrowth < 0 ? 'recule' : 'progresse'} de ${fr(Math.abs(r.fcfGrowth))} % sur un an.`
    if (recent) {
      const duration = {3:'trois',6:'six',9:'neuf'}[recent.durationMonths]
      line += ` Sur les ${duration} mois clos le ${dateLabel(recent.end)}, le FCF ${recent.value < 0 ? 'est négatif de' : 'atteint'} ${storyAmount(Math.abs(recent.value),company.currency)}, contre ${storyAmount(recent.previous,company.currency)} sur la même période un an plus tôt.`
    }
    paragraphs.push(line)
  }
  // At most one extra topic, prioritising a concrete tension over routine ratios.
  if (r.dividendFCF > 100) {
    paragraphs.push(`Les dividendes versés dépassent le cash généré après investissements sur cet exercice : ils représentent ${fr(r.dividendFCF)} % du FCF. Ce niveau de distribution mérite donc d’être suivi.`)
  } else if (finite(r.interestCoverage) && r.interestCoverage < 1) {
    paragraphs.push(`Sur ce même exercice, le résultat opérationnel ne couvre pas les charges d’intérêts publiées.`)
  } else if (finite(b?.netDebt) && r.netDebtFCF >= 3 && b.definition) {
    paragraphs.push(`🏦 Au ${dateLabel(b.asOf)}, la dette nette atteint ${storyAmount(b.netDebt,company.currency)}. Périmètre : ${b.definition.replace(/\.$/,'')}.`)
  } else if (!latestStoryPeriod(company,now) && finite(r.shareChange) && Math.abs(r.shareChange) >= 2) {
    paragraphs.push(`Le nombre moyen d’actions diluées a ${r.shareChange > 0 ? 'augmenté' : 'diminué'} de ${fr(Math.abs(r.shareChange))} % sur cet exercice. ${r.shareChange > 0 ? 'À bénéfice identique, davantage d’actions signifie moins de bénéfice par action.' : 'À bénéfice identique, moins d’actions signifie davantage de bénéfice par action.'}`)
  }
  return paragraphs.join('\n\n')
}
export function buildTweetText(company, now = new Date()) {
  if (!canPublish(company, now)) return ''
  const context = activeAnnualContext(company, now)
  const lines = [company.editorialHook ?? `🔎 Comment ${company.name} gagne-t-elle son argent ?`, company.activity]
  const business = businessStory(company, context)
  if (business) lines.push(business)
  lines.push(annualStory(company, context))
  const financial = financialStory(company, now)
  if (financial) lines.push(financial)
  const recent = recentStory(company, now)
  if (recent) lines.push(recent)
  // Market ratios use the same reproducible close; forecasts stay in the tool.
  const calculated = calculatedRatios(company, now)
  const q = company.quote
  const pe = calculated.peTTM ?? calculated.peAnnual
  if (q && finite(q.price) && q.price > 0 && fresh(q.asOf, 10, now)) {
    let price = `🏷️ À la clôture du ${dateLabel(q.asOf)}, l’action valait ${fr(q.price, 2)} ${currencyWord(company.currency)}`
    if (finite(pe) && pe > 0) {
      price += calculated.peTTM
        ? `. Soit environ ${fr(pe)} fois son bénéfice par action sur les douze derniers mois.`
        : `. Soit environ ${fr(pe)} fois son bénéfice dilué par action de l’exercice terminé le ${dateLabel(company.annual.end)}.`
    } else price += '.'
    lines.push(price)
    if (company.id === 'totalenergies') lines.push('Le cours retenu est celui de l’action ordinaire cotée à New York en USD, la devise des comptes présentés.')
  }
  if (company.editorialQuestion) lines.push(`${company.editorialQuestion} 🤔`)
  lines.push('Pas un conseil financier.')
  return lines.join('\n\n')
}
