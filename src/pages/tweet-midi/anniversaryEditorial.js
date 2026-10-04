// Le résultat se classe avant arrondi : +100 % signifie exactement un doublement.
export function anniversaryResult(asset, gainPct, formattedPct) {
  const subject = asset.priceUnit === 'points' ? 'son niveau' : 'son prix'
  if (gainPct === null) return 'où en est-il aujourd’hui ?'
  if (gainPct === 0) return `${subject} est au même niveau`
  if (gainPct < 0) return `${subject} a reculé de ${formattedPct.replace(/^[−-]/, '')}`
  if (gainPct === 100) return `${subject} a doublé`
  if (gainPct > 100) return `${subject} a plus que doublé`
  if (gainPct >= 90) return `${subject} a presque doublé`
  return `${subject} a progressé de ${formattedPct}`
}

export function anniversaryQuestion(asset, year) {
  if (asset.priceUnit === 'points') return `En ${year}, tu investissais déjà via un ETF qui suit ${asset.tweetPhrase}, ou tu suivais seulement l’indice ?`
  if (['or', 'silver', 'copper'].includes(asset.id)) return `En ${year}, tu envisageais déjà d’investir dans ${asset.tweetPhrase}, ou tu ne suivais pas son prix ?`
  const holding = /^[A-Z]/.test(asset.tweetPhrase) ? `des actions ${asset.label}` : asset.tweetPhrase
  return `En ${year}, tu détenais déjà ${holding}, tu hésitais à en acheter ou tu ne t’y intéressais pas ?`
}

export function anniversaryClosing(asset, gainPct, year) {
  if (gainPct === null) return 'Renseigne le niveau actuel pour compléter la comparaison.'
  const noun = asset.priceUnit === 'points' ? 'niveaux' : 'prix'
  const context = gainPct === 0
    ? `Le même résultat au départ et à l’arrivée ne signifie pas que ${asset.label} est resté stable entre les deux.`
    : `Ces deux ${noun} ne montrent pas les hausses et les baisses traversées pendant la période.`
  return `${context}\n\n💬 ${anniversaryQuestion(asset, year)}`
}
