import { getPresentationCopy, presentationTicker } from './editorial.js'
import { CATEGORY_EMOJI } from '../../data/etf-cards.js'
import { annualPerformanceRange, formatAnnualPerformance, getAnnualPerformance, formatTweetPerformance } from './annualPerformance.js'
import { getInstrumentFacts } from '../../data/instrument-facts.js'

export function presentationType(etf) {
  const type = getInstrumentFacts(etf.isin).instrumentType
  return type === 'ETC' || /\bETC\b/.test(etf.name) ? 'ETC'
    : type === 'ETN' || /\bETP\b/.test(etf.name) ? 'ETP' : 'ETF'
}

// Un statut inconnu n'est pas une confirmation d'éligibilité.
export const accountLabel = (etf, separator = ' | ') => [
  ...(etf.pea === true ? ['PEA : ✅'] : []),
  'CTO : ' + (etf.cto ? '✅' : '❌'),
].join(separator)

// Copie éditoriale distincte des données utilisées dans les images.
export function buildText(sourceEtf) {
  const etf = getPresentationCopy(sourceEtf)
  const tickerStr = presentationTicker(etf)
  const dot = CATEGORY_EMOJI[etf.category] || '⚫'
  const annual = getAnnualPerformance(etf)
  return (
    etf.hook + '\n\n' +
    dot + ' ' + etf.name + (tickerStr ? ' (' + tickerStr + ')' : '') + '\n' +
    '\n' +
    '🆔 ISIN : ' + etf.isin + '\n' +
    (etf.listing ? '📍 Cotation : ' + etf.listing.exchange + ' · ' + etf.listing.currency + '\n' : '') +
    '💸 Frais annuels : ' + etf.ter + '\n' +
    '📦 ' + etf.positions + '\n' +
    '💰 Encours : ' + etf.aum + '\n' +
    '🔄 ' + etf.distribution + '\n' +
    '🏦 ' + accountLabel(etf) + '\n' +
    '📍 ' + etf.location + '\n' +
    (annual ? '\n' + formatTweetPerformance(annual) + '\n' : '') +
    '\n' +
    '🔍 C\'est quoi ?\n' +
    etf.whatIs + '\n' +
    '\n' +
    '✅ Ce que cet ETF t’apporte\n' +
    etf.whyInteresting + '\n' +
    '\n' +
    '⚠️ Ce qu\'il faut savoir\n' +
    etf.whatToKnow + '\n' +
    '\n' +
    '🏆 À retenir\n' +
    etf.verdict + '\n' +
    '\n' +
    '💬 ' + etf.question + ' 👇\n' +
    '⚠️ Pas un conseil en investissement'
  )
}

// Lignes de faits en texte brut, utilisées pour dessiner l'image (canvas).
export function buildFactRows(etf) {
  const annual = getAnnualPerformance(etf)
  return [
    ...(etf.listing ? [{ icon: '📍', text: 'Cotation : ' + etf.listing.exchange + ' · ' + etf.listing.currency }] : []),
    { icon: '🆔', text: 'ISIN : ' + etf.isin, mono: true },
    { icon: '💸', text: 'Frais : ' + etf.ter },
    { icon: '📦', text: etf.positions },
    { icon: '💰', text: 'Encours : ' + etf.aum },
    { icon: '🔄', text: etf.distribution },
    { icon: '🏦', text: accountLabel(etf, '   |   ') },
    { icon: '📍', text: etf.location },
    ...(annual ? [{ icon: '📈', text: annualPerformanceRange(annual) + ' (' + annual.currency + ') : ' + formatAnnualPerformance(annual) }] : []),
  ]
}
