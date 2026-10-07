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
function periodText(period, company, label) {
  const lines = [`${label} · du ${dateLabel(period.start)} au ${dateLabel(period.end)}`,
    `Son chiffre d’affaires atteint ${amount(period.revenue, company.currency)}${changePhrase(growth(period.revenue, period.previousRevenue))}.`,
    incomePhrase(period, company.currency)]
  // Compute the prose from raw figures; never trust a stored editorial assessment.
  const margin = period.netIncome / period.revenue * 100
  if (period.netIncome > 0) lines.push(`Cela représente une marge nette de ${fr(margin)} %.`)
  else if (period.netIncome < 0) lines.push(`La marge nette est de ${fr(margin)} %.`)
  if (finite(period.freeCashFlow)) lines.push(period.freeCashFlow >= 0
    ? `Après ses investissements en immobilisations, son flux de trésorerie disponible ressort à ${amount(period.freeCashFlow, company.currency)}.`
    : `Après ses investissements en immobilisations, son flux de trésorerie disponible est négatif : ${amount(period.freeCashFlow, company.currency)}.`)
  return lines.join('\n')
}
export function metrics(company, now = new Date()) {
  if (!canPublish(company, now)) return []
  const a = company.annual
  const rows = [{ label: 'Chiffre d’affaires annuel', value: amount(a.revenue, company.currency) },
    { label: a.netIncome < 0 ? 'Perte nette annuelle' : 'Bénéfice net annuel', value: amount(Math.abs(a.netIncome), company.currency) },
    { label: 'Marge nette annuelle', value: `${fr(a.netIncome / a.revenue * 100)} %` }]
  if (finite(a.freeCashFlow)) rows.push({ label: 'Flux de trésorerie disponible annuel', value: amount(a.freeCashFlow, company.currency) })
  const v = activeValuation(company, now)
  if (finite(v?.peTTM) && v.peTTM > 0) rows.push({ label: 'PER · bénéfices sur 12 mois', value: `${fr(v.peTTM)}×` })
  if (finite(v?.forwardPE) && v.forwardPE > 0) rows.push({ label: 'PER prévisionnel · horizon fournisseur', value: `${fr(v.forwardPE)}×` })
  return rows
}
export function buildTweetText(company, now = new Date()) {
  if (!canPublish(company, now)) return ''
  const lines = [`🔎 Tu connais ${company.name}. Mais comment cette entreprise gagne-t-elle son argent ? 👇`,
    `🏭 Son activité\n${company.activity}`, periodText(company.annual, company, '💰 Le dernier exercice publié')]
  if (company.quarter && fresh(company.quarter.end, 200, now)) lines.push(periodText(company.quarter, company, '📈 Le dernier trimestre publié'))
  if (company.quote && fresh(company.quote.asOf, 10, now)) lines.push(`🏷️ L’action cotait ${fr(company.quote.price, 2)} ${company.currency} à la clôture du ${dateLabel(company.quote.asOf)}.`)
  const v = activeValuation(company, now)
  const ratios = []
  if (finite(v?.peTTM) && v.peTTM > 0) ratios.push(`Le PER est de ${fr(v.peTTM)} : le marché valorise l’action à environ ${fr(v.peTTM)} fois ses bénéfices par action sur les douze derniers mois.`)
  if (finite(v?.forwardPE) && v.forwardPE > 0) ratios.push(`Le PER prévisionnel fourni est de ${fr(v.forwardPE)}. Il repose sur des bénéfices estimés, avec un horizon non précisé par Alpha Vantage.`)
  if (ratios.length) lines.push(`📊 Valorisation · relevé du ${dateLabel(v.observedAt)}\n${ratios.join('\n')}`)
  lines.push(`👀 Ce que je regarderais\n${company.watch}`, '💬 Tu connaissais toutes ses activités ?')
  return lines.join('\n\n')
}
