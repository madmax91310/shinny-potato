// Le résultat se classe avant arrondi : +100 % signifie exactement un doublement.
export function anniversaryResult(asset, gainPct, formattedPct) {
  const subject = asset.priceUnit === 'points' ? 'son niveau' : 'son prix'
  if (gainPct === null) return 'où en est-il aujourd’hui ?'
  if (gainPct === 0) return `${subject} est au même niveau`
  if (Math.abs(gainPct) < 0.05) return `${subject} a très légèrement ${gainPct < 0 ? 'reculé' : 'progressé'}`
  if (gainPct < 0) return `${subject} a reculé de ${formattedPct.replace(/^[−-]/, '')}`
  if (gainPct === 100) return `${subject} a doublé`
  const multiple = 1 + gainPct / 100
  if (gainPct === 200) return `${subject} a triplé`
  if (gainPct === 300) return `${subject} a quadruplé`
  if (gainPct > 200) {
    const factor = multiple.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
    return `${subject} a été multiplié par ${Number.isInteger(multiple) ? '' : 'environ '}${factor}`
  }
  if (gainPct > 100) return `${subject} a plus que doublé`
  if (gainPct >= 90) return `${subject} a presque doublé`
  return `${subject} a progressé de ${formattedPct.replace(/^\+/, '')}`
}

export function anniversaryQuestion(asset) {
  if (asset.priceUnit === 'points') return `À l’époque, tu investissais déjà via un ETF qui suit ${asset.tweetPhrase} ?`
  const subject = /^[A-Z]/.test(asset.tweetPhrase) ? `l’action ${asset.label}` : asset.tweetPhrase
  return `À l’époque, tu suivais déjà ${subject} ?`
}

export function anniversaryClosing(asset, gainPct) {
  if (gainPct === null) return 'Renseigne le niveau actuel pour compléter la comparaison.'
  return `💬 ${anniversaryQuestion(asset)}`
}

// A percentage gap is meaningful only with the same currency, endpoint and income convention.
export function anniversaryComparisonNote(assetA, assetB, obsA, obsB) {
  const notes = [];
  if (assetA.currency !== assetB.currency) notes.push('Devises différentes, sans conversion de change.');
  if (!(obsA?.manual && obsB?.manual) && (obsA?.manual || obsB?.manual || obsA?.asOf !== obsB?.asOf)) {
    notes.push('Dates de valorisation différentes.');
  }
  const basis = asset => /nets réinvestis/.test(asset.anniversaryVariant ?? '') ? 'net'
    : /bruts réinvestis/.test(asset.anniversaryVariant ?? '') ? 'gross' : 'price';
  if (basis(assetA) !== basis(assetB)) notes.push('Traitement des dividendes différent.');
  return notes.join(' ');
}
