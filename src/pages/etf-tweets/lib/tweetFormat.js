import { getInstrumentPeaStatus } from '../../../data/instruments.js'
import { getPreferredInstrumentListing } from '../../../data/instrument-listings.js'
import { isComparisonEtc } from './comparisonPolicy.js'
import { COMPARISON_HOOKS, getEtfExposureCopy } from './exposureCopy.js'

export function buildTweetText(theme) {
  const isEtc = theme.etfs.length > 0 && theme.etfs.every(isComparisonEtc)
  const single = theme.etfs.length === 1
  const kind = isEtc ? 'ETC' : 'ETF'
  if (theme.peaOnly && theme.etfs.some(etf => getInstrumentPeaStatus(etf.isin) !== true)) {
    throw new Error(`Comparatif PEA : part non éligible ou non vérifiée dans ${theme.id}`)
  }
  const question = COMPARISON_HOOKS[theme.id] || `Quel ${kind} choisir pour ${theme.nom} ?`
  const hook = (COMPARISON_HOOKS[theme.id] ? '' : theme.hook?.trim()) || `${theme.emoji || '📊'} ${question}`
  const count = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq'][theme.etfs.length] ?? theme.etfs.length
  const lines = [hook, '']
  lines.push(`Voici ${count} ${kind}${theme.peaOnly ? ' éligibles au PEA' : ''} ${single ? 'à découvrir' : 'à comparer'} 👇`, '')

  theme.etfs.forEach((etf, index) => {
    const pea = getInstrumentPeaStatus(etf.isin)
    const ticker = getPreferredInstrumentListing(etf.isin)?.ticker
    lines.push(`${['🟢', '🔵', '🟣', '🟠', '🟡'][index % 5]} ${etf.nom || '…'}${ticker ? ` (${ticker})` : ''}`)
    const exposure = getEtfExposureCopy(etf)
    if (exposure) lines.push('', exposure, '')
    lines.push(`🆔 ISIN : ${etf.isin || '…'}`)
    lines.push(`💸 ${etf.isCopperEtc ? 'Frais de gestion' : 'Frais annuels'} : ${etf.frais ? `${etf.frais.replace(/\s*%$/, '')} %` : 'non renseignés'}`)
    if (!theme.peaOnly) {
      if (pea === true) lines.push('🏦 PEA : ✅ | CTO : ✅')
      else if (isEtc || pea === false) lines.push('🏦 CTO')
    }
    // Le taux de swap du cuivre n'est pas compris dans les frais de gestion.
    if (etf.isCopperEtc) lines.push('💸 Taux de swap annuel : 0,45 % en supplément')
    lines.push('')
  })
  if (!COMPARISON_HOOKS[theme.id] && theme.comparisonNote?.trim()) lines.push(`👀 ${theme.comparisonNote.trim()}`, '')
  // La question personnalisée clôt le texte, sans appel au partage générique.
  if (theme.ctaEngagement?.trim()) lines.push(`💬 ${theme.ctaEngagement.trim().replace(/^💬\s*/, '')}`)
  return lines.join('\n')
}

export function getLengthStatus(length) {
  if (length <= 280) {
    return { level: 'ok', label: `${length} / 280 — format tweet classique` }
  }
  if (length <= 25000) {
    return {
      level: 'warn',
      label: `${length} caractères — nécessite une note longue (X Premium) ou un thread`,
    }
  }
  return { level: 'danger', label: `${length} caractères — trop long, à scinder en thread` }
}
