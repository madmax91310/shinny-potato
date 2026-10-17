export function fmtEUR(n, currency = 'EUR') {
  if (currency === 'GBp') return n.toLocaleString('fr-FR', {maximumFractionDigits:0}) + ' GBp'
  try {
    // currencyDisplay: 'narrowSymbol' — sans ça, l'Intl fr-FR affiche "$US" pour le dollar (retour
    // utilisateur du 22/09/2026 : juste "$" attendu, comme "€" pour l'euro, déjà narrow par défaut).
    return n.toLocaleString('fr-FR', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 })
  } catch {
    return Math.round(n).toLocaleString('fr-FR') + ' €'
  }
}

export function fmtPct(n) {
  const s = n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return (n >= 0 ? '+' : '') + s + ' %'
}
