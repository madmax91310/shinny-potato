export function formatMention(theme) {
  const mention = theme.mentionReglementaire?.trim() || 'Pas un conseil en investissement.'
  const eligibilite = theme.eligibilite?.trim()
  return eligibilite ? `${eligibilite} · ${mention}` : mention
}

export function buildTweetText(theme) {
  const lines = []
  const action = theme.hookAction?.trim() || '…'
  const dilemme = theme.hookDilemme?.trim() || '…'

  lines.push(`${theme.emoji} **Tu veux ${action}, mais tu sais pas ${dilemme} ?**`)
  lines.push('')

  if (theme.transition?.trim()) {
    lines.push(theme.transition.trim())
    lines.push('')
  }

  theme.etfs.forEach((etf, index) => {
    lines.push(`📊 ${etf.nom || '…'}`)
    lines.push(`🔑 ISIN : ${etf.isin || '…'}`)
    lines.push(`💰 Frais : ${etf.frais ? `${etf.frais}%` : '…'}`)
    lines.push(`🏦 Encours : ${etf.encours || '…'}`)
    lines.push(`→ ${etf.differenciateur || '…'}`)
    if (index < theme.etfs.length - 1) lines.push('')
  })
  if (theme.etfs.length > 0) lines.push('')

  if (theme.cloture?.trim()) {
    lines.push(theme.cloture.trim())
    lines.push('')
  }

  if (theme.ctaEngagement?.trim()) lines.push(theme.ctaEngagement.trim())
  if (theme.ctaPartage?.trim()) lines.push(theme.ctaPartage.trim())
  lines.push('')

  lines.push(`*${formatMention(theme)}*`)

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
