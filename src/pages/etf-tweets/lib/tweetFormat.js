import { getInstrumentPeaStatus } from '../../../data/instruments.js'
import { getPreferredInstrumentListing } from '../../../data/instrument-listings.js'
import { isComparisonEtc } from './comparisonPolicy.js'

export function buildTweetText(theme) {
  const isEtc = theme.etfs.length > 0 && theme.etfs.every(isComparisonEtc)
  const single = theme.etfs.length === 1
  const kind = isEtc ? 'ETC' : 'ETF'
  if (theme.peaOnly && theme.etfs.some(etf => getInstrumentPeaStatus(etf.isin) !== true)) {
    throw new Error(`Comparatif PEA : part non éligible ou non vérifiée dans ${theme.id}`)
  }
  const question = QUESTIONS[theme.id] || `Quels ${kind} choisir pour ${theme.nom} ?`
  const hook = theme.hook?.trim() || `${theme.emoji || '📊'} ${question}`
  const count = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq'][theme.etfs.length] ?? theme.etfs.length
  const lines = [hook, '']
  lines.push(`Voici ${count} ${kind}${theme.peaOnly ? ' éligibles au PEA' : ''} ${single ? 'à découvrir' : 'à comparer'} 👇`, '')

  theme.etfs.forEach((etf, index) => {
    const pea = getInstrumentPeaStatus(etf.isin)
    const ticker = getPreferredInstrumentListing(etf.isin)?.ticker
    lines.push(`${['🟢', '🔵', '🟣', '🟠', '🟡'][index % 5]} ${etf.nom || '…'}${ticker ? ` (${ticker})` : ''}`)
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
  if (theme.comparisonNote?.trim()) lines.push(`👀 ${theme.comparisonNote.trim()}`, '')
  // La question personnalisée clôt le texte, sans appel au partage générique.
  if (theme.ctaEngagement?.trim()) lines.push(`💬 ${theme.ctaEngagement.trim().replace(/^💬\s*/, '')}`)
  return lines.join('\n')
}

// Des accroches courtes : les chiffres de composition restent dans l'image.
const QUESTIONS = {
  monde: 'Quels ETF permettent de s’exposer aux marchés mondiaux ?',
  usa: 'Quels ETF permettent de s’exposer aux actions américaines ?',
  europe: 'Quels ETF permettent d’investir sur les actions européennes ?',
  'tech-europe': 'Quels ETF permettent de s’exposer à la technologie européenne ?',
  emergents: 'Quels ETF permettent de s’exposer aux marchés émergents ?',
  luxe: 'Quels ETF permettent de s’exposer au luxe ?',
  'ia-robotique': 'Quels ETF permettent de s’exposer à l’IA et à la robotique ?',
  sante: 'Quels ETF permettent d’investir dans la santé ?',
  renouvelables: 'Quels ETF permettent de s’exposer aux énergies propres ?',
  dividendes: 'Quels ETF permettent d’investir sur les dividendes ?',
  japon: 'Quels ETF permettent de s’exposer au Japon ?',
  defense: 'Quels ETF permettent de s’exposer à la défense ?',
  quantique: 'Quels ETF permettent de s’exposer à l’informatique quantique ?',
  spatial: 'Quel ETF permet de s’exposer à l’industrie spatiale ?',
  'ressources-naturelles': 'Quels ETF permettent d’investir dans les ressources naturelles ?',
  'etc-metaux': 'Quels ETC permettent de s’exposer aux métaux précieux et au cuivre ?',
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
