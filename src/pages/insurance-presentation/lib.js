import { format, annualPublicationNote } from '../scpi-presentation/lib.js'
export const fundReturn = row => row.return != null ? `${format(row.return)} %` : `${format(row.returnMin)} à ${format(row.returnMax)} % (${row.condition})`
export const fundGuarantee = fund => fund.guarantee != null ? `Garantie annuelle : ${format(fund.guarantee)} % du capital, nette des frais de gestion.${fund.guaranteeBasis ? ` ${fund.guaranteeBasis}` : ''}` : 'La garantie nette annuelle n’est pas chiffrée dans les pages collectées ; voir les conditions du fonds.'
const accessExpired = (fund, today) => fund.accessValidUntil && fund.accessValidUntil < today
const todayIso = () => new Date().toISOString().slice(0, 10)
export const fundOperations = (fund, today = todayIso()) => accessExpired(fund, today) ? '' : fund.operations
export const fundAllocation = (fund, today = todayIso()) => accessExpired(fund, today)
  ? `Conditions d’accès échues le ${fund.accessValidUntil.split('-').reverse().join('/')} ; les nouvelles conditions restent à confirmer.`
  : fund.maxAllocation == null
  ? 'La quote-part maximale actuelle n’est pas chiffrée dans les sources collectées.' + (fund.allocationEvidence?.reason ? ' '+fund.allocationEvidence.reason : '')
  : Math.abs(fund.maxAllocation - 100 / 3) < 0.001
    ? 'Au plus un tiers du versement sur ce fonds ; au moins deux fois ce montant en unités de compte non garanties.'
    : `Jusqu’à ${format(fund.maxAllocation)} % du versement${fund.ceiling ? `, dans la limite de ${format(fund.ceiling)} € par contrat` : ''}.`
export function buildTweet(record) {
  const { name, insurer, fees, access, supports, euroFunds } = record
  const hook = record.id === 'linxea-spirit-2'
    ? `Tu voudrais réunir un fonds euros et des ETF dans ton assurance-vie ? Linxea Spirit 2 permet de choisir ces supports dans un même contrat. Regardons comment ça fonctionne 👇`
    : access.monthly < 50
    ? `Tu veux alimenter une assurance-vie petit à petit ? ${name} permet de programmer des versements dès ${format(access.monthly)} €/mois. Voici les détails 👇`
    : `Avant d’ouvrir une assurance-vie, je regarderais ce qu’on peut y mettre et ce qu’elle coûte dans la durée. Prenons ${name} pour voir ça concrètement 👇`
  const fundLines = euroFunds.map(fund => [
    `🛡️ Avec ${fund.name}, voici les rendements publiés :`,
    fund.years.map(row => `${row.year} : ${fundReturn(row)}`).join(' · '),
    annualPublicationNote(fund.publication),
    `Pour y placer ton argent : ${fundAllocation(fund)}`,
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
    `🔎 Le chiffre à retenir dépend de ce que tu choisis : le rendement d’un fonds euros ne sera pas celui de toute ton assurance-vie si tu y ajoutes d’autres supports. Et deux fonds euros d’un même contrat peuvent avoir des conditions différentes.`,
    `⚠️ Sur les unités de compte, tu peux perdre une partie de ton argent : elles présentent un risque de perte en capital. Les rendements passés ne garantissent pas les suivants.`,
    `💬 Tu utilises surtout ton assurance-vie pour le fonds euros ou pour d’autres supports ?`,
  ].join('\n\n')
}
