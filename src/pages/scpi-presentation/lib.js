import { format, dateLabel, annualPublicationNote } from '../presentation-shared/labels.js'
export { format, dateLabel, annualPublicationNote } from '../presentation-shared/labels.js'
export function allocation(rows, limit = 3) {
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  const head = sorted.slice(0, limit).map(row => `${row.label} ${format(row.value)} %`)
  if (sorted.length > limit) head.push(`autres ${format(sorted.slice(limit).reduce((sum, row) => sum + row.value, 0))} %`)
  return head.join(' · ')
}
// Editorial copy is derived from the same observations as the image and evidence panel.
export function buildTweet(record) {
  const { name, id, snapshot, conditions: c, annual, price } = record
  const top = [...snapshot.sectors].sort((a, b) => b.value - a.value)[0]
  const country = [...snapshot.countries].sort((a, b) => b.value - a.value)[0]
  const latest = annual.years.at(-1)
  const concentration = top.label === 'Bureaux' ? `les bureaux représentent à eux seuls ${format(top.value)} % du patrimoine` : `le secteur « ${top.label} » représente à lui seul ${format(top.value)} % du patrimoine`
  const management = c.managementZones
    ? `${format(c.managementZones.euro)} % TTC en zone euro et ${format(c.managementZones.outside)} % TTC hors zone euro`
    : `${id === 'iroko-zen' || c.managementFeeMax ? 'jusqu’à ' : ''}${format(c.managementFee)} % ${c.managementTax ?? 'TTC'}`
  const hooks = {
    'corum-origin': `${name} détient des immeubles dans plusieurs pays. Mais ${concentration} 🏢`,
    'corum-xl': `${country.label} : ${format(country.value)} % du patrimoine de ${name}. Avant de regarder les revenus, je trouve utile de regarder où se trouvent les immeubles 🌍`,
    'corum-eurion': `${format(top.value)} % du patrimoine de ${name} dans le secteur « ${top.label} ». C’est un chiffre qui mérite qu’on s’y arrête 🏢`,
    'iroko-zen': `${name} ne facture pas de commission de souscription. Mais ça ne veut pas dire qu’investir dans cette SCPI est sans frais 🏘️`,
    'remake-live': `Avec ${format(c.minimum)} €, tu peux acheter une part de ${name}. Le ticket d’entrée est une chose ; les immeubles derrière en sont une autre 🏘️`,
    'transitions-europe': `${name} investit dans plusieurs secteurs immobiliers. Le premier reste « ${top.label} », avec ${format(top.value)} % du patrimoine 🏢`,
    activimmo: `Avec ${name}, on parle surtout d’immobilier logistique. Le secteur « ${top.label} » représente ${format(top.value)} % du patrimoine 🚚`,
    'epargne-pierre': `Une part à ${format(price.value)} € ne veut pas dire qu’on peut investir avec cette seule somme. Chez ${name}, le minimum est de ${format(c.minimum)} € 🏘️`,
  }
  // Do not turn a historical marketing feature into a permanent assertion.
  const hook = id === 'iroko-zen' && c.subscriptionFee !== 0
    ? `${name} : regardons les immeubles détenus avant de nous arrêter au taux de distribution 🏘️`
    : hooks[id] ?? `${name} : regardons les immeubles détenus avant de nous arrêter au taux de distribution 🏘️`
  const opinion = top.value >= 50
    ? `💭 Personnellement, je trouve le principe intéressant pour investir dans l’immobilier sans gérer directement un bien. Mais le poids du secteur « ${top.label} » (${format(top.value)} %) me fait réfléchir : j’aurais envie de regarder de plus près les immeubles et leurs locataires avant d’investir.`
    : `💭 Personnellement, je trouve le principe intéressant pour investir dans l’immobilier sans gérer directement un bien. Mais la répartition entre plusieurs secteurs ne suffit pas à me convaincre : je regarderais aussi les locataires, les frais et les conditions de revente.`
  const access = c.minimum === price.value
    ? `💶 Pour investir, le minimum est d’une part à ${format(price.value)} €.`
    : `💶 La part coûte ${format(price.value)} €, avec un minimum de souscription de ${format(c.minimum)} €.`
  const occupancy = record.portfolio?.occupancy
  return [
    hook,
    'Je te fais les présentations 👇',
    `🌍 Côté pays : ${allocation(snapshot.countries)}.\n🏭 Côté immeubles : ${allocation(snapshot.sectors)}.`,
    `${access} Les revenus sont ${c.frequency}, sans garantie.\nPour commencer à en percevoir : ${c.enjoyment}`,
    `📊 En ${latest.year}, le taux de distribution s’est établi à ${format(latest.distribution)} %, brut de fiscalité étrangère. Ce n’est pas la performance totale du placement : la valeur des parts compte aussi.${annualPublicationNote(annual.publication) ? `\n${annualPublicationNote(annual.publication)}` : ''}`,
    `💸 Avant de souscrire, je regarderais aussi les frais : ${c.subscriptionFeeMax ? 'jusqu’à ' : ''}${format(c.subscriptionFee)} %${c.subscriptionTax ? ` ${c.subscriptionTax}` : ''} à la souscription, puis ${management} de frais de gestion sur les ${c.managementBasis}.${c.otherFees ? ' D’autres frais peuvent s’ajouter selon les opérations.' : ''}\nÀ la sortie : ${c.exit}`,
    c.otherFees?.includes('distributions mensuelles') ? c.otherFees.split(' ; ').at(-1) : '',
    occupancy ? `Le taux d’occupation financier est de ${format(occupancy.value)} %. Il renseigne sur les loyers, pas sur la proportion de surfaces occupées.` : '',
    record.priceHistory?.corporateActions?.length ? historyText(record) : '',
    opinion,
    'Le capital peut baisser et la revente des parts peut prendre du temps. Les distributions passées ne garantissent pas les suivantes.',
    '💬 Tu détiens déjà des SCPI ? Lesquelles ?',
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
