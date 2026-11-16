import { labelLines, colorPositions, reportedAmount, weightLabel } from './publication.js'

export function detailBlocks(portfolio) {
  const blocks = colorPositions(portfolio.holdings).map(row => ({
    color: row.color,
    lines: [
      ...labelLines(row.issuerName, 56),
      ...labelLines([row.ticker, row.shareClass, row.cusip, row.securityId].filter(Boolean).join(' · ') || 'Identifiant et classe non transmis', 56),
      ...labelLines(`${reportedAmount(row)} · ${weightLabel(row.weight)}`, 56),
    ],
  }))
  const options = portfolio.snapshot.holdings.filter(row => row.putCall)
  options.forEach((row, index) => blocks.push({
    lines: [
      ...(index === 0 ? ['Options déclarées · hors image et total', 'Poids sur le total déclaré, options incluses.', ''] : []),
      ...labelLines(`${row.issuerName} · ${row.putCall}`, 56),
      ...labelLines([row.shareClass, row.cusip].filter(Boolean).join(' · '), 56),
      ...labelLines(`${reportedAmount(row)} · ${weightLabel(row.weight)}`, 56),
    ],
  }))
  return blocks
}

// Names, identifiers, amounts and weights travel together, including the first
// option's section heading. Keep the existing font/spacing and Canvas dimensions.
export function paginateDetailBlocks(blocks, capacity) {
  if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Capacité de page invalide.')
  const pages = []
  let page = []
  for (const block of blocks) {
    if (block.lines.length > capacity) throw new Error('Une position est trop longue pour le détail PNG. Télécharge les données JSON ou CSV complètes.')
    if (page.length && page.length + 1 + block.lines.length > capacity) {
      pages.push(page)
      page = []
    }
    if (page.length) page.push({ text: '' })
    page.push(...block.lines.map(text => ({ text, color: block.color })))
  }
  if (page.length) pages.push(page)
  return pages
}
