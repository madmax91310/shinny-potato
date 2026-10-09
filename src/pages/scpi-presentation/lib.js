export const format = value => value.toLocaleString('fr-FR', { maximumFractionDigits: 3 })
export const dateLabel = value => value ? value.split('-').reverse().join('/') : null
export const annualPublicationNote = publication => publication?.awaitingPublication
  ? `Dernier exercice publié : ${publication.latestPublishedYear}. Les chiffres ${publication.expectedYear} restent en attente de publication.`
  : ''
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
  const hook = id.startsWith('corum-')
    ? `Tu aimerais percevoir des loyers, mais acheter et gérer un bien te freine ? ${name} permet d’investir dans de l’immobilier d’entreprise à plusieurs. Regardons ce qu’il y a derrière 👇`
    : id === 'iroko-zen'
    ? `Investir dans l’immobilier sans chercher un appartement ni gérer les locataires, ça te parle ? Avec Iroko Zen, tu achètes des parts d’un patrimoine loué à des entreprises 👇`
    : `Tu n’as pas besoin d’acheter un bien entier pour investir dans l’immobilier. Avec ${name}, tu peux devenir associé dès ${format(c.minimum)} €. Regardons où va cet argent 👇`
  const snapshotDate = snapshot.asOf ? `Au ${dateLabel(snapshot.asOf)}` : `Répartition relevée le ${dateLabel(record.checkedAt)} ; date des graphiques non précisée`
  const priceHistory = price.previousValue != null && price.previousValue !== price.value
    ? `Prix de la part : ${format(price.previousValue)} € au ${dateLabel(price.previousAsOf)} → ${format(price.value)} € au ${dateLabel(price.asOf)}.`
    : `Prix de la part : ${format(price.value)} € au ${dateLabel(price.asOf)}.`
  const uk = snapshot.countries.find(row => row.label === 'Royaume-Uni')
  const france = snapshot.countries.find(row => row.label === 'France')
  const reading = id.startsWith('corum-') || !['iroko-zen','remake-live'].includes(id)
    ? `Si tu regardes cette SCPI pour diversifier ton épargne, garde ces deux poids en tête : ${format(sector.value)} % en ${sector.label.toLowerCase()} et ${format(country.value)} % en ${country.label}. Une difficulté sur ces marchés aurait davantage de poids sur le patrimoine.`
    : id === 'iroko-zen'
    ? `Ce que je regarderais aussi : la place des ${sector.label.toLowerCase()} (${format(sector.value)} %). Même avec des biens dans plusieurs pays, les loyers dépendent de la santé des entreprises qui les occupent.`
    : uk && france && uk.value > france.value
      ? `Si tu pensais surtout investir dans l’immobilier français, regarde la répartition : le Royaume-Uni représente ${format(uk.value)} % du patrimoine, davantage que la France. Le marché britannique et la livre sterling ont donc leur place dans les risques à comprendre.`
      : `${country.label} représente ${format(country.value)} % du patrimoine. C’est le pays que je regarderais en premier pour comprendre à quels marchés immobiliers ton argent est exposé.`
  const management = c.managementZones
    ? `${format(c.managementZones.euro)} % TTC en zone euro et ${format(c.managementZones.outside)} % TTC hors zone euro`
    : `${id === 'iroko-zen' || c.managementFeeMax ? 'jusqu’à ' : ''}${format(c.managementFee)} % ${c.managementTax ?? 'TTC'}`
  return [hook,
    `🏢 Ton argent rejoint un patrimoine de biens loués à des entreprises. Voici où ${name} investit :\n🌍 ${allocation(snapshot.countries)}\n🏭 ${allocation(snapshot.sectors)}\n${snapshotDate}.${snapshot.regions ? `\n📍 En France : ${allocation(snapshot.regions)}.` : ''}`,
    `💶 Pour commencer, il faut au moins ${format(c.minimum)} €, avec une part à ${format(price.value)} €.\nTu peux ensuite percevoir des revenus ${c.frequency}, sans montant garanti. Ils ne démarrent pas dès ton versement : ${c.enjoyment}`,
    `📊 Et côté revenus, qu’a-t-elle distribué ?\nTaux de distribution : ${annual.years.map(row => `${row.year} : ${format(row.distribution)} %`).join(' · ')}.\nCes taux sont bruts de fiscalité étrangère : ils ne correspondent pas aux montants nets que tu reçois, ni à la performance totale de tes parts.${annualPublicationNote(annual.publication) ? `\n${annualPublicationNote(annual.publication)}` : ''}${historyText(record) ? '' : `\n${priceHistory}`}`,
    `💸 Avant de souscrire, regarde aussi ce qui est prélevé.\nSouscription : ${c.subscriptionFeeMax ? 'jusqu’à ' : ''}${format(c.subscriptionFee)} %${c.subscriptionTax ? ` ${c.subscriptionTax}` : ''}. La gestion représente ${management} des ${c.managementBasis}.\nSi tu veux revendre : ${c.exit}${c.otherFees ? `\n${c.otherFees}` : ''}`,
    portfolioText(record),
    historyText(record),
    `🔎 ${reading}`,
    `⚠️ Tu dois pouvoir laisser cet argent investi : revendre les parts peut prendre du temps. Les revenus et le capital ne sont pas garantis, et les distributions passées ne garantissent pas les suivantes.`,
    `💬 Tu détiens déjà des SCPI ? Lesquelles ?`,
  ].filter(Boolean).join('\n\n')
}

export function portfolioText(record) {
  const rows = Object.entries(record.portfolio ?? {}).map(([key, row]) => `${row.label} : ${format(row.value)}${key === 'occupancy' ? ' %' : ''} au ${dateLabel(row.asOf)}.${row.basis ? ` ${row.basis}` : ''}`)
  return rows.length ? `🏗️ Pour voir comment ce patrimoine est loué, voici quelques repères :\n${rows.join('\n')}\nLe taux d’occupation financier te renseigne sur les loyers facturés ou facturables, pas sur la proportion de surfaces occupées.` : ''
}
export function historyText(record) {
  const rows=record.priceHistory?.years
  if (!rows?.length) return ''
  if (record.priceHistory.corporateActions?.length) return `📊 ${record.priceHistory.corporateActions.map(row => row.description).join(' ')} Ce prix ne garantit pas le montant ni le délai de revente.`
  const first=rows[0],last=rows.at(-1)
  return `📈 Prix de souscription publié : ${format(first.value)} € au ${dateLabel(first.asOf)} → ${format(last.value)} € au ${dateLabel(last.asOf)}. Ce prix ne garantit pas le montant ni le délai de revente.`
}
