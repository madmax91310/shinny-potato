// Construction du texte copié dans le presse-papier — reprise telle quelle de la session d'origine.
export function generateCopyText(t) {
  const lines = []
  lines.push('📌 Tout savoir sur ' + t.titre)
  lines.push('')
  lines.push(t.intro)

  if (t.variante === 'A') {
    lines.push('', '🎯 Objectif', t.objectif)
    lines.push('', '👤 Pour qui ?', t.pourQui)
    lines.push('', t.mecanismeTitre, t.mecanismeContenu)
    ;(t.sectionsOptionnelles || []).forEach((s) => {
      lines.push('', s.titre, s.contenu)
    })
    if (t.attention) lines.push('', '⚠️ ' + t.attention)
    lines.push('', t.fraisTitre, t.fraisContenu)
    lines.push('', '⭐ Avantage', t.avantage)
  } else {
    lines.push('', '📖 Définition', t.definitionContenu)
    lines.push('', t.calculTitre, t.calculContenu)
    if (t.nuance) lines.push('', t.nuance.titre, t.nuance.contenu)
    lines.push('', '💡 Pourquoi c\'est important ?', t.pourquoiImportant)
    if (t.erreurFrequente) lines.push('', '⚠️ ' + t.erreurFrequente)
    lines.push('', '⭐ À retenir', t.aRetenir)
  }

  return lines.join('\n')
}
