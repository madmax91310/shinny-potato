import { format, annualPublicationNote } from '../scpi-presentation/lib.js'
export const fundReturn = row => row.return != null ? `${format(row.return)} %` : `${format(row.returnMin)} à ${format(row.returnMax)} % (${row.condition})`
export const fundGuarantee = fund => fund.guarantee != null ? `Garantie annuelle : ${format(fund.guarantee)} % du capital, nette des frais de gestion.${fund.guaranteeBasis ? ` ${fund.guaranteeBasis}` : ''}` : 'La garantie nette annuelle n’est pas chiffrée dans les pages collectées ; voir les conditions du fonds.'
const accessExpired = (fund, today) => fund.accessValidUntil && fund.accessValidUntil < today
const todayIso = () => new Date().toISOString().slice(0, 10)
function presentationHook(record) {
  const { id, name, access } = record
  if (id === 'linxea-spirit-2') return `Tu voudrais réunir un fonds euros et des ETF dans ton assurance-vie ? Voici ce que propose Linxea Spirit 2, avec ses frais et ses conditions d’accès 👇`
  if (id === 'linxea-avenir-2') return access.monthly < 50
    ? `Commencer une assurance-vie avec des versements réguliers ne demande pas forcément une grosse somme. ${name} permet d’en programmer dès ${format(access.monthly)} €/mois 👇`
    : `${name} permet d’alimenter une assurance-vie à ton rythme. Voici ses supports, ses frais et les conditions à regarder avant de choisir 👇`
  if (id === 'linxea-zen') return `Deux fonds euros d’un même contrat peuvent avoir des conditions différentes. Avec ${name}, regardons ce que tu peux choisir et ce que cela coûte 👇`
  if (id === 'linxea-vie') return `Une assurance-vie peut réunir un fonds euros et d’autres placements. Voici les possibilités de ${name}, avec les frais et les conditions qui vont avec 👇`
  if (id === 'lucya-cardif') return `Avoir beaucoup de supports dans une assurance-vie peut être utile, à condition d’y retrouver ceux qui t’intéressent. Regardons ce que propose ${name} 👇`
  if (id === 'placement-direct-vie') return `Choisir soi-même ses supports ou utiliser une option de gestion peut changer le coût d’une assurance-vie. Voici comment se présente ${name} 👇`
  return `Voici ce que propose ${name} pour placer ton épargne, avec ses supports et ses conditions 👇`
}
function presentationReading(record) {
  const common = 'Le rendement publié du fonds euros concerne ce fonds uniquement. Si tu choisis d’autres supports, le résultat de ton assurance-vie dépendra aussi de leur évolution. Et deux fonds euros d’un même contrat peuvent avoir des conditions différentes.'
  const observations = {
    'linxea-spirit-2': record.fees.units > 0 ? 'Pour les ETF, je retiens surtout que les frais du contrat s’ajoutent à ceux des fonds. Avoir accès à un ETF peu coûteux ne suffit donc pas à connaître le coût total.' : 'Pour les ETF, je distingue les frais des fonds et les éventuels frais de transaction du contrat.',
    'linxea-avenir-2': 'Je regarderais les conditions du fonds euros qui m’intéresse avant de choisir la répartition. Le rendement affiché ne suffit pas à savoir quelle part de mon versement pourra y être placée.',
    'linxea-zen': record.euroFunds.length > 1 ? 'Pour moi, avoir plusieurs fonds euros invite surtout à comparer leurs garanties et leurs conditions d’accès. Leurs noms ne permettent pas, à eux seuls, de choisir entre eux.' : 'Pour le fonds euros, je regarderais sa garantie et ses conditions d’accès en même temps que son rendement.',
    'linxea-vie': 'Pour les ETF, je regarderais le coût total sur la durée. Les frais du contrat, ceux des supports et les éventuels frais de transaction interviennent à des moments différents.',
    'lucya-cardif': 'Ce que je regarde dans un catalogue de supports, c’est d’abord si les placements qui m’intéressent sont disponibles, avec quelles conditions et quels frais. Un grand choix n’oblige pas à multiplier les lignes.',
    'placement-direct-vie': record.fees.options?.length ? 'Je distingue les frais de la gestion libre de ceux des options proposées. Le coût à retenir dépend du mode choisi et des supports réellement détenus.' : 'Je regarderais les frais correspondant aux supports et au mode de gestion choisis, pour comprendre ce qui sera prélevé dans la durée.',
  }
  return [observations[record.id], common].filter(Boolean).join('\n\n')
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
  const { name, insurer, fees, access, supports, euroFunds } = record
  const hook = presentationHook(record)
  const fundLines = euroFunds.map(fund => [
    `🛡️ Avec ${fund.name}, voici les rendements publiés :`,
    fund.years.map(row => `${row.year} : ${fundReturn(row)}`).join(' · '),
    annualPublicationNote(fund.publication),
    `Pour y placer ton argent : ${fundAllocation(fund)}`,
    fundCeiling(fund),
    fundGuarantee(fund),
    `Frais de gestion du fonds : ${format(fund.managementFeeMax)} % maximum/an. ${fundOperations(fund)}`,
    fund.notes ?? '',
  ].filter(Boolean).join('\n')).join('\n\n')
  return [hook,
    `📄 ${name} est distribué par ${record.distributor} et assuré par ${insurer}. Ici, on regarde la gestion libre : tu choisis toi-même où placer ton argent.`,
    `💶 Tu peux ouvrir le contrat avec ${format(access.initial)} €, puis ajouter de l’argent à ton rythme : dès ${format(access.free)} € par versement libre, ou ${format(access.monthly)} €/mois avec des versements programmés.`,
    `📦 Tu as accès à des fonds euros et à plus de ${format(supports.minimumCount)} supports annoncés, dont ${supports.categories.join(', ')}. À toi de choisir ceux qui correspondent à ton projet, en vérifiant leurs conditions d’accès.`,
    `💸 Les frais comptent aussi pendant les années où tu gardes le contrat.\nVersement : ${format(fees.subscription)} % · Arbitrage en ligne : ${format(fees.arbitrage)} %.\nPour les unités de compte, le contrat prélève ${format(fees.units)} %/an, auxquels s’ajoutent les frais des supports choisis. Pour les transactions ETF : ${format(fees.etfTrade)} % par opération.${fees.notes ? `\n${fees.notes}` : ''}\nLa gestion pilotée et certaines options ont leurs propres frais.`,
    `📊 Si tu t’intéresses surtout au fonds euros, regarde aussi ses conditions d’accès et sa garantie.\nLes rendements ci-dessous sont nets de frais de gestion, avant prélèvements sociaux et fiscaux. Les offres de bonus ne sont pas intégrées.\n\n${fundLines}`,
    `🔎 ${presentationReading(record)}`,
    `⚠️ Sur les unités de compte, tu peux perdre une partie de ton argent : elles présentent un risque de perte en capital. Les rendements passés ne garantissent pas les suivants.`,
    `💬 Tu utilises surtout ton assurance-vie pour le fonds euros ou pour d’autres supports ?`,
  ].join('\n\n')
}
