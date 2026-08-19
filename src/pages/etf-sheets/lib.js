import { CATEGORY_EMOJI } from './data'

// Texte du post X — repris tel quel de la session d'origine.
export function buildText(etf) {
  const tickerStr = etf.tickers.join('/')
  const newTag = etf.isNew ? ' 🆕' : ''
  const dot = CATEGORY_EMOJI[etf.category] || '⚫'
  return (
    '📋 Présentation d\'ETF\n' +
    dot + ' ' + etf.name + ' (' + tickerStr + ')' + newTag + '\n' +
    '🆔 ISIN : ' + etf.isin + '\n' +
    '💸 Frais : ' + etf.ter + '\n' +
    '📦 ' + etf.positions + '\n' +
    '💰 Encours : ' + etf.aum + '\n' +
    '🔄 ' + etf.distribution + '\n' +
    '🏦 PEA : ' + (etf.pea ? '✅' : '❌') + ' | CTO : ' + (etf.cto ? '✅' : '❌') + '\n' +
    '📍 ' + etf.location + '\n' +
    '\n' +
    '🔍 C\'est quoi ?\n' +
    etf.whatIs + '\n' +
    '\n' +
    '✅ Pourquoi c\'est intéressant ?\n' +
    etf.whyInteresting + '\n' +
    '\n' +
    '⚠️ Ce qu\'il faut savoir\n' +
    etf.whatToKnow + '\n' +
    '\n' +
    '🏆 Verdict\n' +
    etf.verdict + '\n' +
    '\n' +
    '💬 ' + etf.question + ' 👇\n' +
    '⚠️ Pas un conseil en investissement'
  )
}

// Lignes de faits en texte brut, utilisées pour dessiner l'image (canvas).
export function buildFactRows(etf) {
  return [
    { icon: '🆔', text: 'ISIN : ' + etf.isin, mono: true },
    { icon: '💸', text: 'Frais : ' + etf.ter },
    { icon: '📦', text: etf.positions },
    { icon: '💰', text: 'Encours : ' + etf.aum },
    { icon: '🔄', text: etf.distribution },
    { icon: '🏦', text: 'PEA : ' + (etf.pea ? '✅' : '❌') + '   |   CTO : ' + (etf.cto ? '✅' : '❌') },
    { icon: '📍', text: etf.location },
  ]
}
