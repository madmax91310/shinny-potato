// Estimates are displayed below the current ledger and never become its rows.
export function projectBudgetScenario(scenario, totals) {
  if (scenario.type === 'reserve') {
    const monthlyWithdrawal = Math.max(0, -(totals.balance + scenario.monthlyPension))
    return { monthlyWithdrawal, remainingReserve: scenario.startingReserve - monthlyWithdrawal * scenario.months }
  }
  const rate = scenario.annualRate / 12
  const payment = rate ? scenario.assumedPrincipal * rate / (1 - (1 + rate) ** -scenario.months) : scenario.assumedPrincipal / scenario.months
  const monthlyPayment = Math.round(payment)
  const rents = scenario.rentOptions.map(rent => {
    const beforeLoan = Math.round((totals.balance + scenario.currentRent - rent) * 100) / 100
    return { rent, beforeLoan, afterLoan: beforeLoan - monthlyPayment }
  })
  return { payment, monthlyPayment, rents }
}

export function budgetScenarioText(scenario, totals, money) {
  const projection = projectBudgetScenario(scenario, totals)
  if (scenario.type === 'reserve') {
    return `Supposons que Djamila ne reçoive aucune pension alimentaire pendant ${scenario.months} mois. Si Djamila disposait de ${money(scenario.startingReserve)} sur un livret, elle pourrait y prendre ${money(projection.monthlyWithdrawal)} par mois. La réserve tomberait à ${money(projection.remainingReserve)} à la fin des ${scenario.months} mois. Ce retrait finance le manque, sans augmenter ses revenus.`
  }
  const decimal = new Intl.NumberFormat('fr-FR')
  const projections = projection.rents.map(({ rent, beforeLoan, afterLoan }) =>
    `Avec un loyer de ${money(rent)}, il lui resterait ${money(beforeLoan)} avant le prêt, puis il lui manquerait ${money(-afterLoan)} par mois une fois le remboursement commencé.`)
  return [
    `Supposons qu’il lui reste ${money(scenario.assumedPrincipal)} à rembourser sur ${scenario.months / 12} ans, à ${decimal.format(scenario.annualRate * 100)} % hors frais et assurance. Cela donnerait environ ${money(projection.monthlyPayment)} par mois.`,
    ...projections,
    `Les autres dépenses et le versement de ${money(totals.savings)} prévu au livret restent inchangés dans cette projection. Les économies de trajet éventuelles n’y figurent pas.`,
  ].join(' ')
}
