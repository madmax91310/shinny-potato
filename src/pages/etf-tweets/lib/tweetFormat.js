import { INSTRUMENT_FACTS_BY_ISIN } from '../../../data/instrument-facts.js'
import { getInstrumentPeaStatus } from '../../../data/instruments.js'

const REPLICATION_LABELS = {
  'Synthetic (Unfunded swap)': 'synthétique (swap)',
  'Physical (Full replication)': 'physique intégrale',
  'Physical (Optimized sampling)': 'physique par échantillonnage',
  'Physical (sampling)': 'physique par échantillonnage',
  'Physical (Physically backed)': 'adossé à du métal physique',
}

export function buildTweetText(theme) {
  const isEtc = theme.id === 'etc-metaux'
  const single = theme.etfs.length === 1
  const kind = isEtc ? 'ETC' : 'ETF'
  const lines = [`${single ? '📋 Présentation' : '⚖️ Comparatif'} ${kind} : ${theme.nom}`, '']
  if (theme.transition?.trim()) lines.push(theme.transition.trim(), '')

  theme.etfs.forEach((etf, index) => {
    const facts = INSTRUMENT_FACTS_BY_ISIN[etf.isin]
    const pea = getInstrumentPeaStatus(etf.isin)
    lines.push(`${['🟢', '🟡', '🔵', '🟣'][index % 4]} ${etf.nom || '…'}`)
    lines.push(`💰 ${etf.isCopperEtc ? 'Frais de gestion' : 'Frais annuels'} : ${etf.frais ? `${etf.frais} %` : 'non renseignés'}`)
    if (facts?.benchmark) lines.push(`📊 Indice : ${facts.benchmark}`)
    if (REPLICATION_LABELS[facts?.replicationMethod]) {
      lines.push(`🔄 Réplication : ${REPLICATION_LABELS[facts.replicationMethod]}`)
    }
    if (!isEtc && ['accumulating', 'distributing'].includes(facts?.incomePolicy)) {
      lines.push(`💶 Dividendes : ${facts.incomePolicy === 'accumulating' ? 'capitalisés' : 'distribués'}`)
    }
    if (pea !== null) lines.push(`🏛️ Éligible au PEA : ${pea ? 'oui' : 'non'}`)
    if (etf.differenciateur?.trim()) lines.push(`🎯 À savoir : ${etf.differenciateur.trim()}`)
    if (etf.encours) lines.push(`🏦 Encours : ${etf.encours}`)
    lines.push(`🔎 ISIN : ${etf.isin || '…'}`, '')
  })
  if (theme.cloture?.trim()) {
    lines.push(single ? '📌 À retenir' : '📌 Les différences', theme.cloture.trim(), '')
  }
  // La question personnalisée clôt le texte, sans appel au partage générique.
  if (theme.ctaEngagement?.trim()) lines.push(theme.ctaEngagement.trim())
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
