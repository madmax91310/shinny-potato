import { getPresentationCopy, presentationTicker } from './editorial.js'
import { CATEGORY_EMOJI } from './records.js'
import { annualPerformanceRange, formatAnnualPerformance, getAnnualPerformance, formatTweetPerformance } from './annualPerformance.js'
import { getInstrumentFacts } from '../../data/instrument-facts.js'
import { commodityAllocationLines } from '../../data/commodity-allocation.js'

export function presentationType(etf) {
  const type = getInstrumentFacts(etf.isin).instrumentType
  return type === 'ETC' || /\bETC\b/.test(etf.name) ? 'ETC'
    : type === 'ETN' || /\bETP\b/.test(etf.name) ? 'ETP' : 'ETF'
}

// Un statut inconnu n'est pas une confirmation d'éligibilité.
export const accountLabel = (etf, separator = ' | ') => [
  ...(typeof etf.pea === 'boolean' ? ['PEA : ' + (etf.pea ? '✅' : '❌')] : []),
  'CTO : ' + (etf.cto ? '✅' : '❌'),
].join(separator)

// Copie éditoriale distincte des données utilisées dans les images.
export function buildText(sourceEtf) {
  const etf = getPresentationCopy(sourceEtf)
  const tickerStr = presentationTicker(etf)
  const dot = CATEGORY_EMOJI[etf.category] || '⚫'
  const annual = getAnnualPerformance(etf)
  const commodities = commodityAllocationLines(etf.isin)
  return (
    etf.hook + '\n\n' +
    dot + ' ' + etf.name + (tickerStr ? ' (' + tickerStr + ')' : '') + '\n' +
    '\n' +
    '🆔 ISIN : ' + etf.isin + '\n' +
    (etf.listing ? '📍 Cotation : ' + etf.listing.exchange + ' · ' + etf.listing.currency + '\n' : '') +
    '💸 ' + etf.feeLabel + ' : ' + etf.ter + '\n' +
    (etf.swapFee ? '💸 Frais de swap : ' + etf.swapFee + '\n' : '') +
    (etf.positions ? '📦 ' + etf.positions + '\n' : '') +
    '💰 Encours : ' + etf.aum + '\n' +
    (etf.distribution ? '🔄 ' + etf.distribution + '\n' : '') +
    '🏦 ' + accountLabel(etf) + '\n' +
    (etf.location ? '📍 ' + etf.location + '\n' : '') +
    (etf.shareCurrency ? '💱 Devise de la part : ' + etf.shareCurrency + '\n' : '') +
    (etf.currencyHedge ? '💱 ' + etf.currencyHedge + '\n' : '') +
    (annual ? '\n' + formatTweetPerformance(annual) + '\n' : '') +
    (commodities.length ? '\n' + commodities.join('\n') + '\n' : '') +
    '\n' +
    '🔍 Ce que tu achètes\n' +
    etf.whatIs + '\n' +
    '\n' +
    '✅ Pourquoi s’y intéresser ?\n' +
    etf.whyInteresting + '\n' +
    '\n' +
    '⚠️ Le point de vigilance\n' +
    etf.whatToKnow + (etf.riskMetric ? '\n\n' + etf.riskMetric : '') + '\n' +
    '\n' +
    (etf.closing ? etf.closing + '\n\n' : '') +
    '💬 ' + etf.question + '\n\nPas un conseil financier.'
  )
}

// Lignes de faits en texte brut, utilisées pour dessiner l'image (canvas).
export function buildFactRows(sourceEtf) {
  const etf = getPresentationCopy(sourceEtf)
  const annual = getAnnualPerformance(etf)
  return [
    ...(etf.listing ? [{ icon: '📍', text: 'Cotation : ' + etf.listing.exchange + ' · ' + etf.listing.currency }] : []),
    { icon: '🆔', text: 'ISIN : ' + etf.isin, mono: true },
    { icon: '💸', text: etf.feeLabel + ' : ' + etf.ter },
    ...(etf.swapFee ? [{icon:'💸',text:'Swap : '+etf.swapFee}] : []),
    ...(etf.positions ? [{ icon: '📦', text: etf.positions }] : []),
    { icon: '💰', text: 'Encours : ' + etf.aum },
    ...(etf.distribution ? [{ icon: '🔄', text: etf.distribution }] : []),
    { icon: '🏦', text: accountLabel(etf, '   |   ') },
    ...(etf.location ? [{ icon: '📍', text: etf.location }] : []),
    ...(etf.shareCurrency ? [{icon:'💱',text:'Devise de la part : '+etf.shareCurrency}] : []),
    ...(etf.currencyHedge ? [{icon:'💱',text:etf.currencyHedge}] : []),
    ...(annual ? [{ icon: '📈', text: annualPerformanceRange(annual) + ' (' + annual.currency + ') : ' + formatAnnualPerformance(annual) }] : []),
  ]
}
