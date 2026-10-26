import { format, annualPublicationNote } from '../presentation-shared/labels.js'
export const fundReturn = row => row.return != null ? `${format(row.return)} %` : `${format(row.returnMin)} à ${format(row.returnMax)} % (${row.condition})`
export const fundGuarantee = fund => fund.guarantee != null ? `Garantie annuelle : ${format(fund.guarantee)} % du capital, nette des frais de gestion.${fund.guaranteeBasis ? ` ${fund.guaranteeBasis}` : ''}` : 'La garantie nette annuelle n’est pas chiffrée dans les pages collectées ; voir les conditions du fonds.'
const accessExpired = (fund, today) => fund.accessValidUntil && fund.accessValidUntil < today
const todayIso = () => new Date().toISOString().slice(0, 10)
function presentationHook({ name }) {
  return `💶 ${name} : quel budget à l’ouverture, quels placements et quels frais ? 👇`
}
// Keep contractual detail in the data and UI; publish only decision-relevant conditions.
function shortFundAccess(fund) {
  // The tweet states only established conditions; unknown or expired terms stay in the UI.
  if (accessExpired(fund, todayIso())) return ''
  const deadline = fund.accessValidUntil ? ` jusqu’au ${fund.accessValidUntil.split('-').reverse().join('/')}` : ''
  const conditions = fund.maxAllocation == null ? [] : [fundAllocation(fund).replace(/\.$/, '') + (deadline ? ` (conditions valables${deadline})` : '') + '.']
  if (fund.ceilingEvidence?.status === 'insurer-defined') conditions.push('Plafond annuel fixé par l’assureur.')
  if (fund.ceilingEvidence?.minimumUnits != null) conditions.push(`Au moins ${format(fund.ceilingEvidence.minimumUnits)} % en unités de compte.`)
  if (fund.operations?.includes('Versements uniquement')) conditions.push('Accessible par versement uniquement, pas par arbitrage entrant.')
  if (fund.operations?.includes('2 % de pénalité')) conditions.push('2 % de pénalité pour un arbitrage vers Apicil Euro Garanti.')
  if (fund.notes?.includes('rachat total')) conditions.push('Un rachat total en cours d’année peut réduire le rendement servi.')
  if (fund.notes?.includes('TME')) conditions.push('Une limitation conditionnelle à 30 % est prévue dans la notice.')
  return conditions.join(' ')
}
export const fundOperations = (fund, today = todayIso()) => accessExpired(fund, today) ? '' : fund.operations
export const fundCeiling = (fund, today = todayIso()) => accessExpired(fund, today) || fund.ceiling != null ? ''
  : fund.ceilingEvidence?.status === 'unlimited'
    ? `Sans limite de montant pour les ${fund.ceilingEvidence.scope?.toLowerCase() ?? 'souscriptions, versements complémentaires et programmés'}${fund.ceilingEvidence.minimumUnits != null ? ` ; au moins ${format(fund.ceilingEvidence.minimumUnits)} % en unités de compte non garanties` : ''}${fund.ceilingEvidence.validUntil ? `, jusqu’au ${fund.ceilingEvidence.validUntil.split('-').reverse().join('/')}` : ''}.`
    : fund.ceilingEvidence?.status === 'insurer-defined'
      ? `Plafond annuel communiqué par l’assureur, entre 0 et ${format(fund.ceilingEvidence.openingYearUpperBound)} € l’année de souscription, puis entre 0 et ${format(fund.ceilingEvidence.followingYearUpperBound)} € par année civile. Le montant applicable à ton contrat reste à confirmer.`
    : 'Le plafond en euros applicable à l’opération reste à confirmer auprès du distributeur.'
export const fundAllocation = (fund, today = todayIso()) => accessExpired(fund, today)
  ? `Conditions d’accès échues le ${fund.accessValidUntil.split('-').reverse().join('/')} ; les nouvelles conditions restent à confirmer.`
  : fund.maxAllocation == null
  ? 'La quote-part maximale actuelle n’est pas chiffrée dans les sources collectées.' + (fund.allocationEvidence?.reason ? ' '+fund.allocationEvidence.reason : '')
  : Math.abs(fund.maxAllocation - 100 / 3) < 0.001
    ? 'Au plus un tiers du versement sur ce fonds ; au moins deux fois ce montant en unités de compte non garanties.'
    : `Jusqu’à ${format(fund.maxAllocation)} % du versement${fund.ceiling ? `, dans la limite de ${format(fund.ceiling)} € par contrat` : ''}.`
export function buildTweet(record) {
  const { insurer, fees, access, supports, euroFunds } = record
  const fundLines = euroFunds.map(fund => {
    const latest = fund.years.at(-1)
    return [
      `• ${fund.name} : ${latest.year} → ${fundReturn(latest)}`,
      fund.guarantee != null ? `Garantie annuelle : ${format(fund.guarantee)} % du capital, après frais de gestion.` : '',
      shortFundAccess(fund),
      annualPublicationNote(fund.publication),
    ].filter(Boolean).join('\n')
  }).join('\n\n')
  const extraFees = [
    fees.membership != null ? `Adhésion : ${format(fees.membership)} € à l’ouverture.` : '',
    fees.notes?.split('. ').find(note => note.startsWith('Gestion des actions en direct')) ? fees.notes.split('. ').find(note => note.startsWith('Gestion des actions en direct')) + '.' : '',
    fees.notes?.split('. ').find(note => note.startsWith('Les supports immobiliers')) ? fees.notes.split('. ').find(note => note.startsWith('Les supports immobiliers')) + '.' : '',
  ].filter(Boolean).join('\n')
  return [presentationHook(record),
    `📄 Distribuée par ${record.distributor} et assurée par ${insurer}. En gestion libre, c’est toi qui choisis les supports parmi ceux du contrat.`,
    `💰 Accessible dès ${format(access.initial)} €.\nPour les versements suivants : ${format(access.free)} € minimum par versement libre ou dès ${format(access.monthly)} €/mois.`,
    `📦 Plus de ${format(supports.minimumCount)} supports annoncés : ${supports.categories.join(', ')}… et ${euroFunds.length > 1 ? `${euroFunds.length} fonds euros` : 'un fonds euros'}.`,
    `💸 Les principaux frais :\n• Versements : ${format(fees.subscription)} % · Arbitrages en ligne : ${format(fees.arbitrage)} %\n• Unités de compte : ${format(fees.units)} %/an, en plus des frais des supports\n• Transactions ETF : ${format(fees.etfTrade)} % par opération${extraFees ? `\n${extraFees}` : ''}${fees.options?.length ? '\nLes options de gestion ont des frais supplémentaires.' : ''}`,
    `🛡️ Derniers rendements publiés des fonds euros :\n${fundLines}\n\nTaux nets de frais de gestion, avant prélèvements sociaux et fiscaux, hors bonus liés aux offres commerciales.`,
    `⚠️ Les unités de compte présentent un risque de perte en capital. Les rendements passés ne garantissent pas les suivants.`,
    `💬 Dans ton assurance-vie, quelle place donnes-tu au fonds euros ?`,
  ].join('\n\n')
}
