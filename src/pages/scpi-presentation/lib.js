export const format = value => value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
export const dateLabel = value => value ? value.split('-').reverse().join('/') : null
export function allocation(rows, limit = 3) {
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  const head = sorted.slice(0, limit).map(row => `${row.label} ${format(row.value)} %`)
  if (sorted.length > limit) head.push(`autres ${format(sorted.slice(limit).reduce((sum, row) => sum + row.value, 0))} %`)
  return head.join(' · ')
}
export function buildTweet(record) {
  const { name, id, snapshot, conditions: c, annual, price } = record
  const sector = [...snapshot.sectors].sort((a, b) => b.value - a.value)[0]
  const country = [...snapshot.countries].sort((a, b) => b.value - a.value)[0]
  const hook = id === 'iroko-zen'
    ? `Toucher des loyers sans acheter un appartement ni gérer les locataires ? Iroko Zen achète de l’immobilier d’entreprise en Europe.`
    : `${format(price.value)} € pour acheter une part d’immobilier, plutôt qu’un bien entier. Mais qu’est-ce qu’on détient vraiment avec Remake Live ?`
  const snapshotDate = snapshot.asOf ? `Au ${dateLabel(snapshot.asOf)}` : `Répartition relevée le ${dateLabel(record.checkedAt)} ; date des graphiques non précisée`
  const priceHistory = price.previousValue != null && price.previousValue !== price.value
    ? `Prix de la part : ${format(price.previousValue)} € au ${dateLabel(price.previousAsOf)} → ${format(price.value)} € au ${dateLabel(price.asOf)}.`
    : `Prix de la part : ${format(price.value)} € au ${dateLabel(price.asOf)}.`
  const reading = id === 'iroko-zen'
    ? `Les ${sector.label.toLowerCase()} arrivent en tête (${format(sector.value)} %). La diversification géographique ne fait donc pas disparaître le poids de ce secteur : les loyers dépendent aussi de la santé des entreprises locataires.`
    : `Le Royaume-Uni représente ${format(snapshot.countries.find(row => row.label === 'Royaume-Uni')?.value ?? country.value)} % du patrimoine. Le pays pèse davantage que la France : les loyers et la valeur des biens restent exposés au marché britannique, ainsi qu’à la livre sterling.`
  return [hook,
    `🏢 ${name} détient des biens loués à des entreprises.\n🌍 ${allocation(snapshot.countries)}\n🏭 ${allocation(snapshot.sectors)}\n${snapshotDate}.`,
    `💶 La part coûte ${format(price.value)} €. Souscription initiale dès ${format(c.minimum)} €.\nRevenus potentiels ${c.frequency}. ${c.enjoyment}`,
    `📊 Taux de distribution : ${annual.years.map(row => `${row.year} : ${format(row.distribution)} %`).join(' · ')}.\nTaux bruts de fiscalité étrangère, pas les montants nets reçus.\n${priceHistory}`,
    `💸 Souscription : ${format(c.subscriptionFee)} %. Gestion : ${id === 'iroko-zen' ? 'jusqu’à ' : ''}${format(c.managementFee)} % TTC des ${c.managementBasis}.\nRetrait : ${c.exit}`,
    `🔎 ${reading}`,
    `Les revenus et le capital ne sont pas garantis. Revendre les parts peut prendre du temps. Les distributions passées ne garantissent pas les suivantes.`,
    `💬 Tu détiens déjà des SCPI ? Lesquelles ?`,
  ].join('\n\n')
}
