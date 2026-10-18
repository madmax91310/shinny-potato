import { comparisonConcentration } from '../../../data/exposure-observations.js'
import { AUTOMATED_ETF } from '../../../data/automated-etf.js'
import { multiAssetAllocationLines } from '../../../data/lifestrategy.js'
import { getInstrumentPeaStatus } from '../../../data/instruments.js'
import { getPreferredInstrumentListing } from '../../../data/instrument-listings.js'
import { isComparisonEtc } from './comparisonPolicy.js'
import { getComparisonPerformance, getComparisonYears } from '../../tweet-midi/comparisonPerformance.js'
import { comparisonPct } from './comparisonDetails.js'
import { getComparisonComposition, COMPOSITION_LABELS } from './comparisonComposition.js'
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

  const years = getComparisonYears(theme.etfs.map(etf => etf.isin))
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
      else lines.push('🏦 CTO')
    }
    // Le taux de swap du cuivre n'est pas compris dans les frais de gestion.
    const swapRate = AUTOMATED_ETF[etf.isin]?.characteristics?.annualSwapRatePct
    if (etf.isCopperEtc && Number.isFinite(swapRate)) lines.push(`💸 Taux de swap annuel : ${swapRate.toLocaleString('fr-FR')} % en supplément`)
    const performance = getComparisonPerformance(etf.isin, years, theme.performanceCurrency)
    if (performance?.rows.length) {
      const currency = performance.currency === 'USD' ? 'en dollars' : performance.currency === 'EUR' ? 'en euros' : `en ${performance.currency}`
      lines.push('', `📈 Performances annuelles ${currency}`,
        ...performance.rows.map(row => `${row.year} : ${comparisonPct(row.pct)}`))
    }
    const multiAsset = multiAssetAllocationLines(etf.isin)
    if (multiAsset.length) lines.push('', ...multiAsset)
    for (const [field, title] of [['countries', '🌍 Principaux pays'], ['sectors', '🧩 Principaux secteurs']]) {
      const composition = getComparisonComposition(etf.isin, field)
      if (composition.rows.length) lines.push('', `${title}${composition.isIndex ? ' de l’indice suivi' : ''}${composition.asOf ? ` au ${composition.asOf.split('-').reverse().join('/')}` : ''}${composition.classification ? ` (${composition.classification})` : ''}`,
        ...composition.rows.map(([name, value]) => `${field === 'countries' ? countryFlag(name) : ''}${COMPOSITION_LABELS[name] ?? name} : ${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`))
    }
    lines.push('')
  })
  const note = (!COMPARISON_HOOKS[theme.id] || theme.includeComparisonNote) ? theme.comparisonNote?.trim() : ''
  const observation = comparisonConcentration(theme.etfs, AUTOMATED_ETF)
  const reading = [note, observation].filter(Boolean).join(' ')
  if (reading) lines.push(`👀 ${reading}`, '')
  // La question personnalisée clôt le texte, sans appel au partage générique.
  if (theme.ctaEngagement?.trim()) lines.push(`💬 ${theme.ctaEngagement.trim().replace(/^💬\s*/, '')}`)
  return lines.join('\n')
}

export { getLengthStatus } from '../../../lib/publication-length.js'

const COUNTRY_FLAGS = {
  'United States': '🇺🇸', 'États-Unis': '🇺🇸', Japan: '🇯🇵', Japon: '🇯🇵',
  'United Kingdom': '🇬🇧', 'Royaume-Uni': '🇬🇧', Canada: '🇨🇦', France: '🇫🇷',
  Netherlands: '🇳🇱', 'Pays-Bas': '🇳🇱', Germany: '🇩🇪', Allemagne: '🇩🇪',
  Switzerland: '🇨🇭', Suisse: '🇨🇭', China: '🇨🇳', Chine: '🇨🇳', Taiwan: '🇹🇼', 'Taïwan': '🇹🇼',
  India: '🇮🇳', Inde: '🇮🇳', Australia: '🇦🇺', Australie: '🇦🇺',
  'Korea (South)': '🇰🇷', 'South Korea': '🇰🇷', 'Korea, Republic of': '🇰🇷', 'Corée du Sud': '🇰🇷',
  Italy: '🇮🇹', Italie: '🇮🇹', Spain: '🇪🇸', Espagne: '🇪🇸',
}
function countryFlag(name) { return COUNTRY_FLAGS[name] ? `${COUNTRY_FLAGS[name]} ` : '' }
