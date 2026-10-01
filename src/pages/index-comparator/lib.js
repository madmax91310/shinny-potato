import { getIndexComparisonEditorial } from '../../data/index-comparison-editorial.js'
import { getInstrumentPeaStatus } from '../../data/instruments.js'
import { formatInstrumentListing } from '../../data/instrument-listings.js'

export function fmtPct(raw) {
  if (raw === '' || raw === null || raw === undefined || !String(raw).trim()) return null
  const value = Number(String(raw).replace(',', '.'))
  if (!Number.isFinite(value)) return null
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
}
function renderFundGroup(group) {
  if (group.narrativeNote) return `🔎 ${group.indexName}\nL’outil ne propose pas de fonds répliquant exactement cet indice.`
  return [`🔎 ${group.indexName}`, ...group.funds.map(fund => {
    const pea = getInstrumentPeaStatus(fund.isin)
    return [fund.name,
      `🆔 ${fund.isin} · Frais annuels : ${fund.ter} · ${pea === null ? 'Statut PEA non établi' : pea ? 'Éligible PEA' : 'Non éligible PEA'}`,
      ...(fund.listing ? [`📍 ${formatInstrumentListing(fund.listing)}`] : []),
    ].join('\n')
  })].join('\n\n')
}
export function buildTweetText(family, perfValues = {}) {
  const editorial = getIndexComparisonEditorial(family)
  const exposures = family.indices.map((index, i) => `🔹 ${index.name}\n${editorial.exposures[i]}`).join('\n\n')
  const performance = family.perfFunds.map(fund => {
    if (fund.perfNote) return `📈 ${fund.label}\n${fund.perfNote}`
    const extra = perfValues[fund.key]
    return [
      `📈 ${fund.label}`,
      [2023, 2024, 2025].map(year => `${year} : ${fmtPct(fund[`y${year}`]) ?? 'Non disponible'}`).join(' · '),
      ...(extra?.ytdEnabled && fmtPct(extra.ytd) !== null ? [`YTD saisi : ${fmtPct(extra.ytd)}`] : []),
    ].join('\n')
  }).join('\n\n')
  return [editorial.hook, editorial.intro, exposures,
    `📊 Pour situer la taille de chaque panier :\n${family.diversification.chain.join('\n')}`,
    editorial.insight,
    editorial.fundTransition,
    family.etfGroups.map(renderFundGroup).join('\n\n'),
    '📈 Voilà ce qu’ont donné les parts ou actifs ci-dessous en 2023, 2024 et 2025 :',
    performance, ...(family.perfMethodNote ? [family.perfMethodNote] : []),
    editorial.takeaway, `💬 ${editorial.question}`,
  ].join('\n\n')
}
