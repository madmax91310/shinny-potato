import { annualPerformanceRange, formatAnnualPerformance, getAnnualPerformance } from './annualPerformance.js'

const peaLabel = (status) => status === null ? 'à vérifier' : status ? '✅' : '❌'

// Chaque fiche fournit son accroche et ses explications. Les données chiffrées
// restent celles des registres communs, pour l'aperçu comme pour le texte copié.
export function buildText(etf) {
  const tickerStr = etf.listing?.ticker ?? ''
  const annual = getAnnualPerformance(etf)
  const facts = [
    '📦 ' + etf.positions,
    '💸 Frais annuels : ' + etf.ter,
    '🔄 ' + etf.distribution,
    '💰 Encours : ' + etf.aum,
    '🏦 PEA : ' + peaLabel(etf.pea) + ' | CTO : ' + (etf.cto ? '✅' : '❌'),
    '🆔 ISIN : ' + etf.isin,
    ...(etf.listing ? ['📍 Cotation : ' + etf.listing.exchange + ' · ' + etf.listing.currency + (tickerStr ? ' · ' + tickerStr : '')] : []),
    ...(annual ? ['📈 Performances ' + annualPerformanceRange(annual) + ' (' + annual.currency + ') : ' + formatAnnualPerformance(annual)] : []),
  ]
  return [
    etf.hook,
    'Voici ce que propose ' + etf.name + ' 👇',
    etf.whatIs,
    facts.join('\n'),
    etf.whyInteresting,
    '⚠️ ' + etf.whatToKnow,
    etf.question + ' 👀',
  ].join('\n\n')
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
    { icon: '🏦', text: 'PEA : ' + peaLabel(etf.pea) + '   |   CTO : ' + (etf.cto ? '✅' : '❌') },
    { icon: '📍', text: etf.location },
    ...(annual ? [{ icon: '📈', text: annualPerformanceRange(annual) + ' (' + annual.currency + ') : ' + formatAnnualPerformance(annual) }] : []),
  ]
}
