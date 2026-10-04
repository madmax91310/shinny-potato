import { getIndexComparisonPerformance, getIndexComparisonPerformanceHeading, getIndexComparisonPerformanceLabel } from '../../data/index-comparison-performance.js'
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
  const rows = getIndexComparisonPerformance(family)
  const detailedLabels = ['emergents-pea', 'style', 'dividendes-cto', 'dividendes-pea'].includes(family.id)
  const exposures = family.indices.map((index, i) => `🔹 ${detailedLabels ? rows[i].label : index.name}\n${editorial.exposures[i]}`).join('\n\n')
  const performance = rows.map((row, i) => {
    const extra = perfValues[row.key]
    return [
      `${['🟢', '🔵', '🟣', '🟠', '🔴'][i]} ${getIndexComparisonPerformanceLabel(row, rows)}`,
      [2023, 2024, 2025].map(year => `${year} : ${fmtPct(row[`y${year}`]) ?? 'Non disponible'}`).join(' · '),
      ...(row.currency && extra?.ytdEnabled && fmtPct(extra.ytd) !== null ? [`YTD saisi : ${fmtPct(extra.ytd)}`] : []),
    ].join('\n')
  }).join('\n\n')
  const size = family.indices.map((index, i) => {
    const facts = index.indexFacts
    if (facts?.constituents) return `${detailedLabels ? rows[i].label : index.name} : ${facts.constituents.toLocaleString('fr-FR').replaceAll('\u202f', ' ')} valeurs`
    if (facts?.targetConstituents) return `${detailedLabels ? rows[i].label : index.name} : ${facts.targetConstituents.toLocaleString('fr-FR')} sociétés visées`
    return `${index.name} : exposition à un seul actif`
  }).join('\n')
  return [editorial.hook, editorial.intro, exposures,
    `📊 Pour situer la taille de chaque panier :\n\n${size}`,
    editorial.insight,
    editorial.fundTransition,
    family.etfGroups.map(renderFundGroup).join('\n\n'),
    getIndexComparisonPerformanceHeading(family, rows),
    performance,
    editorial.takeaway, `💬 ${editorial.question}`,
  ].join('\n\n')
}
