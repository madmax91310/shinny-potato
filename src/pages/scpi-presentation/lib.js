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
  const hooks = {
    'iroko-zen': `Avec Iroko Zen, tu investis dans des biens loués à des entreprises, sans gérer toi-même les locataires. Voici où va l’argent et ce que coûte cette SCPI 👇`,
    'remake-live': `Avec ${name}, tu peux investir dans un patrimoine immobilier dès ${format(c.minimum)} €. Voici où se trouvent les biens et les conditions pour percevoir des revenus 👇`,
    'corum-origin': `Une SCPI peut détenir des biens dans plusieurs pays sans répartir son argent également entre eux. Regardons le patrimoine de ${name} et les revenus qu’elle a distribués 👇`,
    'corum-xl': `Derrière les revenus d’une SCPI, il y a des biens, des locataires et des marchés immobiliers. Voici ceux auxquels ${name} donne accès 👇`,
    'corum-eurion': `Deux SCPI peuvent afficher des revenus proches avec des patrimoines très différents. Voici comment ${name} répartit ses investissements 👇`,
    'transitions-europe': `Tu peux devenir associé de ${name} dès ${format(c.minimum)} €. Avant de regarder ses distributions, voici où va l’argent investi 👇`,
    activimmo: `Avec ${format(c.minimum)} €, tu peux accéder au patrimoine immobilier d’${name}. Regardons les biens détenus et ce qui compte derrière les loyers 👇`,
    'epargne-pierre': `Investir avec ${name} commence à ${format(c.minimum)} €. Voici la répartition de son patrimoine, ses revenus publiés et les frais à comprendre 👇`,
  }
  const hook = hooks[id] ?? `Avec ${name}, tu peux devenir associé dès ${format(c.minimum)} €. Voici le patrimoine et les conditions de cette SCPI 👇`
  const snapshotDate = snapshot.asOf ? `Au ${dateLabel(snapshot.asOf)}` : `Répartition relevée le ${dateLabel(record.checkedAt)} ; date des graphiques non précisée`
  const priceHistory = price.previousValue != null && price.previousValue !== price.value
    ? `Prix de la part : ${format(price.previousValue)} € au ${dateLabel(price.previousAsOf)} → ${format(price.value)} € au ${dateLabel(price.asOf)}.`
    : `Prix de la part : ${format(price.value)} € au ${dateLabel(price.asOf)}.`
  const uk = snapshot.countries.find(row => row.label === 'Royaume-Uni')
  const france = snapshot.countries.find(row => row.label === 'France')
  const reading = id.startsWith('corum-') || !['iroko-zen','remake-live'].includes(id)
    ? `${format(sector.value)} % du patrimoine est en ${sector.label.toLowerCase()}, et ${format(country.value)} % en ${country.label}. ${id === 'corum-origin' ? 'Je regarde ces poids ensemble : investir dans plusieurs pays ne suffit pas à savoir comment le patrimoine est réparti entre les activités.' : id === 'corum-xl' ? 'Ce que je retiens, c’est la place réelle de ces expositions dans le patrimoine. Elles aident à comprendre quels marchés et quelles activités influencent les loyers.' : id === 'corum-eurion' ? 'Je garde cette répartition en tête pour comparer les revenus à ceux d’autres SCPI. Un taux proche ne signifie pas que les biens ou les locataires sont les mêmes.' : id === 'activimmo' ? 'Je regarderais aussi comment ces biens sont loués. Le taux de distribution ne dit pas, à lui seul, si les locataires paient et dans quelles conditions.' : id === 'epargne-pierre' ? 'Pour moi, cette répartition compte autant que les distributions pour comprendre où se trouve le risque immobilier.' : 'Ce qui m’intéresse ici, c’est de relier les revenus distribués aux biens détenus. Une difficulté sur ces marchés aurait davantage de poids sur le patrimoine.'}`
    : id === 'iroko-zen'
    ? `${['Commerces', 'Bureaux', 'Entrepôts', "Locaux d’activités", "Locaux d'activités"].includes(sector.label) ? `Les ${sector.label.toLowerCase()} représentent` : `Le secteur « ${sector.label.toLowerCase()} » représente`} ${format(sector.value)} % du patrimoine dans la répartition présentée. ${sector.value >= 25 ? 'C’est une part importante, que je garde en tête en regardant les revenus distribués.' : 'C’est une exposition que je garde en tête en regardant les revenus distribués.'}\n\nLes biens sont répartis dans plusieurs pays, mais les loyers restent liés à la capacité des locataires à payer.`
    : uk && france && uk.value > france.value
      ? `Le Royaume-Uni représente ${format(uk.value)} % du patrimoine, davantage que la France. C’est ce que je retiens si l’objectif était surtout d’investir dans l’immobilier français : le marché britannique et la livre sterling ont aussi leur place dans les risques à comprendre.`
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
