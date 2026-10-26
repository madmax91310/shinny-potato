import { format, dateLabel, annualPublicationNote } from '../presentation-shared/labels.js'
export { format, dateLabel, annualPublicationNote } from '../presentation-shared/labels.js'
export function allocation(rows, limit = 3) {
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  const head = sorted.slice(0, limit).map(row => `${row.label} ${format(row.value)} %`)
  if (sorted.length > limit) head.push(`autres ${format(sorted.slice(limit).reduce((sum, row) => sum + row.value, 0))} %`)
  return head.join(' · ')
}
export function buildTweet(record) {
  const { name, id, snapshot, conditions: c, annual, price } = record
  const hooks = {
    'iroko-zen': `Avec Iroko Zen, tu investis dans des biens loués à des entreprises, sans gérer toi-même les locataires. Voici où va l’argent et ce que coûte cette SCPI 👇`,
    'remake-live': `Avec ${name}, tu peux investir dans un patrimoine immobilier dès ${format(c.minimum)} €. Voici où se trouvent les biens et les conditions pour percevoir des revenus 👇`,
    'corum-origin': `Une SCPI peut détenir des biens dans plusieurs pays sans répartir son argent également entre eux. Regardons le patrimoine de ${name} et les revenus qu’elle a distribués 👇`,
    'corum-xl': `Derrière les revenus d’une SCPI, il y a des biens, des locataires et des marchés immobiliers. Voici ceux auxquels ${name} donne accès 👇`,
    'corum-eurion': `Deux SCPI peuvent afficher des revenus proches avec des patrimoines très différents. Voici comment ${name} répartit ses investissements 👇`,
    'transitions-europe': `Tu peux devenir associé de ${name} dès ${format(c.minimum)} €. Regardons les biens détenus avant de comparer les revenus distribués 👇`,
    activimmo: `Avec ${format(c.minimum)} €, tu peux accéder au patrimoine immobilier d’${name}. Regardons les biens détenus et ce qui compte derrière les loyers 👇`,
    'epargne-pierre': `Investir avec ${name} commence à ${format(c.minimum)} €. Voici la répartition de son patrimoine, ses revenus publiés et les frais à comprendre 👇`,
  }
  const hook = hooks[id] ?? `Avec ${name}, tu peux devenir associé dès ${format(c.minimum)} €. Regardons les biens détenus, les revenus publiés et les conditions de cette SCPI 👇`
  const snapshotDate = snapshot.asOf ? `Au ${dateLabel(snapshot.asOf)}` : `Répartition relevée le ${dateLabel(record.checkedAt)} ; date des graphiques non précisée`
  const priceHistory = price.previousValue != null && price.previousValue !== price.value
    ? `Prix de la part : ${format(price.previousValue)} € au ${dateLabel(price.previousAsOf)} → ${format(price.value)} € au ${dateLabel(price.asOf)}.`
    : `Prix de la part : ${format(price.value)} € au ${dateLabel(price.asOf)}.`
  const management = c.managementZones
    ? `${format(c.managementZones.euro)} % TTC en zone euro et ${format(c.managementZones.outside)} % TTC hors zone euro`
    : `${id === 'iroko-zen' || c.managementFeeMax ? 'jusqu’à ' : ''}${format(c.managementFee)} % ${c.managementTax ?? 'TTC'}`
  const occupancy = record.portfolio?.occupancy
  const latest = annual.years.at(-1)
  return [hook,
    `🏢 Où investit ${name} ?\n🌍 ${allocation(snapshot.countries)}\n🏭 ${allocation(snapshot.sectors)}\n${snapshotDate}.`,
    `💶 Accessible dès ${format(c.minimum)} €, avec une part à ${format(price.value)} €.\nRevenus ${c.frequency}, non garantis. Début du droit aux revenus : ${c.enjoyment}`,
    `📊 Taux de distribution ${latest.year} : ${format(latest.distribution)} %.\nTaux brut de fiscalité étrangère, distinct de la performance totale des parts.${annualPublicationNote(annual.publication) ? `\n${annualPublicationNote(annual.publication)}` : ''}`,
    `💸 Les principaux frais :\n• Souscription : ${c.subscriptionFeeMax ? 'jusqu’à ' : ''}${format(c.subscriptionFee)} %${c.subscriptionTax ? ` ${c.subscriptionTax}` : ''}\n• Gestion : ${management} des ${c.managementBasis}\n• Sortie : ${c.exit}${c.otherFees ? '\nD’autres frais peuvent s’ajouter selon les opérations.' : ''}${c.otherFees?.includes('distributions mensuelles') ? `\n${c.otherFees.split(' ; ').at(-1)}` : ''}`,
    occupancy ? `🏗️ Taux d’occupation financier : ${format(occupancy.value)} % au ${dateLabel(occupancy.asOf)}.` : '',
    record.priceHistory?.corporateActions?.length ? historyText(record) : price.previousValue != null && price.previousValue !== price.value ? priceHistory : '',
    `⚠️ Le capital et les revenus ne sont pas garantis. La revente des parts peut prendre du temps. Les distributions passées ne garantissent pas les suivantes.`,
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
