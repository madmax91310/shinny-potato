import { format, annualPublicationNote } from '../scpi-presentation/lib.js'
export const fundReturn = row => row.return != null ? `${format(row.return)} %` : `${format(row.returnMin)} à ${format(row.returnMax)} % (${row.condition})`
export const fundGuarantee = fund => fund.guarantee != null ? `Garantie annuelle : ${format(fund.guarantee)} % du capital, nette des frais de gestion.${fund.guaranteeBasis ? ` ${fund.guaranteeBasis}` : ''}` : 'La garantie nette annuelle n’est pas chiffrée dans les pages collectées ; voir les conditions du fonds.'
const accessExpired = (fund, today) => fund.accessValidUntil && fund.accessValidUntil < today
const todayIso = () => new Date().toISOString().slice(0, 10)
export const fundOperations = (fund, today = todayIso()) => accessExpired(fund, today) ? '' : fund.operations
export const fundAllocation = (fund, today = todayIso()) => accessExpired(fund, today)
  ? `Conditions d’accès échues le ${fund.accessValidUntil.split('-').reverse().join('/')} ; les nouvelles conditions restent à confirmer.`
  : fund.maxAllocation == null
  ? 'La quote-part maximale actuelle n’est pas chiffrée dans les sources collectées.'
  : Math.abs(fund.maxAllocation - 100 / 3) < 0.001
    ? 'Au plus un tiers du versement sur ce fonds ; au moins deux fois ce montant en unités de compte non garanties.'
    : `Jusqu’à ${format(fund.maxAllocation)} % du versement${fund.ceiling ? `, dans la limite de ${format(fund.ceiling)} € par contrat` : ''}.`
export function buildTweet(record) {
  const { name, insurer, fees, access, supports, euroFunds } = record
  const hook = record.id === 'linxea-spirit-2'
    ? `Fonds euros, ETF ou immobilier dans une assurance-vie : qu’est-ce que Linxea Spirit 2 permet de détenir, et à quel coût ? 👇`
    : `Une assurance-vie accessible dès ${format(access.initial)} € : voici les supports et les frais de ${name} 👇`
  const fundLines = euroFunds.map(fund => [
    `🛡️ ${fund.name}`,
    fund.years.map(row => `${row.year} : ${fundReturn(row)}`).join(' · '),
    annualPublicationNote(fund.publication),
    fundAllocation(fund),
    fundGuarantee(fund),
    `Frais de gestion du fonds : ${format(fund.managementFeeMax)} % maximum/an. ${fundOperations(fund)}`,
    fund.notes ?? '',
  ].filter(Boolean).join('\n')).join('\n\n')
  return [hook,
    `📄 ${name}\nAssureur : ${insurer} · Distributeur : ${record.distributor}\nPrésentation en gestion libre.`,
    `💶 Ouverture dès ${format(access.initial)} €. Versements libres dès ${format(access.free)} €, programmés dès ${format(access.monthly)} €/mois.`,
    `📦 Plus de ${format(supports.minimumCount)} supports annoncés, dont ${supports.categories.join(', ')}. Leur disponibilité et leurs conditions dépendent du contrat.`,
    `💸 Versement : ${format(fees.subscription)} % · Arbitrage en ligne : ${format(fees.arbitrage)} %.\nGestion des unités de compte : ${format(fees.units)} %/an. Transactions ETF : ${format(fees.etfTrade)} % par opération.${fees.notes ? `\n${fees.notes}` : ''}\nLes frais propres aux supports s’ajoutent ; la gestion pilotée et certaines options ont leurs propres frais.`,
    `📊 Rendements des fonds euros publiés, nets de frais de gestion, avant prélèvements sociaux et fiscaux. Les offres de bonus ne sont pas intégrées.\n\n${fundLines}`,
    `🔎 Un contrat peut proposer plusieurs fonds euros avec des conditions différentes. Leurs rendements ne représentent pas la performance de toute l’assurance-vie : elle dépend des supports choisis.`,
    `Les unités de compte présentent un risque de perte en capital. Les rendements passés ne garantissent pas les suivants.`,
    `💬 Tu utilises surtout ton assurance-vie pour le fonds euros ou pour d’autres supports ?`,
  ].join('\n\n')
}
