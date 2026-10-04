import { getInstrumentPeaStatus } from '../../../data/instruments.js'
import { COMPARISON_EDITORIAL, FUND_EXPOSURES } from './editorial.js'

export function buildTweetText(theme) {
  const isEtc = theme.id === 'etc-metaux'
  const single = theme.etfs.length === 1
  const kind = isEtc ? 'ETC' : 'ETF'
  const editorial = COMPARISON_EDITORIAL[theme.id]
  const hook = theme.hook?.trim() || editorial?.hook || `${theme.emoji || '📊'} Tu cherches ${single ? 'un' : 'des'} ${kind} sur ${theme.nom}. ${single ? 'Que détient ce fonds ?' : 'Qu’est-ce qui distingue ces fonds ?'}`
  const count = ['zéro', 'un', 'deux', 'trois', 'quatre'][theme.etfs.length] ?? theme.etfs.length
  const lines = [hook, '']
  if (editorial) lines.push(`Voici ${count} ${kind} ${single ? 'à regarder' : 'à comparer'} : ${editorial.focus} 👇`, '')
  else if (theme.transition?.trim()) lines.push(theme.transition.trim(), '')

  theme.etfs.forEach((etf, index) => {
    const pea = getInstrumentPeaStatus(etf.isin)
    lines.push(`${['🟢', '🟡', '🔵', '🟣'][index % 4]} ${etf.nom || '…'}`)
    const exposure = FUND_EXPOSURES[etf.isin] || etf.differenciateur?.trim()
    if (exposure) lines.push(exposure)
    lines.push(`💰 ${etf.isCopperEtc ? 'Frais de gestion' : 'Frais annuels'} : ${etf.frais ? `${etf.frais} %` : 'non renseignés'}`)
    if (pea === true) lines.push('🏦 PEA ou CTO')
    else if (isEtc || pea === false || /\bCTO\b/.test(etf.differenciateur || '')) lines.push('🏦 CTO')
    lines.push(`🆔 ISIN : ${etf.isin || '…'}`, '')
  })
  const conclusion = editorial?.conclusion || theme.cloture?.trim()
  if (conclusion) {
    lines.push(single ? '📌 À retenir' : '📌 Ce qui change pour toi', '', conclusion, '')
  }
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
