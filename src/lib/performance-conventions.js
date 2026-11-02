// Conventions de performance partagées : une seule façon d’écrire la devise, le traitement des
// dividendes, la période et la conversion. Les outils composent leurs textes à partir d’ici au
// lieu de redire chacun « dividendes nets réinvestis » à leur manière.
export const CURRENCY_WORDS = { EUR: 'euros', USD: 'dollars', GBP: 'livres', CHF: 'francs suisses', JPY: 'yens' }
export const INCOME_LABELS = {
  gross: 'dividendes bruts réinvestis',
  net: 'dividendes nets réinvestis',
  reinvested: 'revenus réinvestis',
  price: 'hors dividendes',
}
export const currencyWord = currency => CURRENCY_WORDS[currency] ?? currency

// Base courte « EUR · dividendes nets réinvestis » affichée sous un chiffre.
export function performanceBasisLabel({ currency, income, detail }) {
  return [currency, detail ?? INCOME_LABELS[income] ?? null].filter(Boolean).join(' · ')
}

// The valuation basis travels with the qualified history. An official NAV total
// return is neither an exchange quotation nor necessarily a tradable unit price.
export const isNavTotalReturn = asset => ['fund-nav-total-return', 'nav-total-return'].includes(asset.historyConvention ?? asset.valuationBasis ?? asset.basis)
export function monthlyHistoryMethod(asset) {
  if (isNavTotalReturn(asset)) {
    return ['ETC', 'ETN', 'ETP'].includes(asset.instrumentType)
      ? `Valeur liquidative de l’${asset.instrumentType}, frais du produit inclus ; hors courtage et fiscalité.`
      : 'Valeurs liquidatives, revenus réinvestis, frais du fonds inclus ; hors courtage et fiscalité.'
  }
  if (asset.priceMethod !== 'adjusted') return ''
  if (['ETC', 'ETN', 'ETP'].includes(asset.instrumentType)) return `Cours de l’${asset.instrumentType}, frais du produit inclus ; hors courtage et fiscalité.`
  return asset.isin && asset.instrumentType !== 'EQUITY'
    ? 'Cours ajustés de l’ETF, revenus réinvestis, frais du fonds inclus ; hors courtage et fiscalité.'
    : 'Cours ajustés des dividendes et divisions d’actions, réinvestissement théorique ; hors frais et fiscalité.'
}

// Note de méthode d’un indice utilisé comme série de simulation : jamais la performance d’un ETF.
export function indexMethodNote({ name, variant, currency, income }) {
  return `Indice ${name} ${variant} en ${currencyWord(currency)}, ${INCOME_LABELS[income]}, hors frais ; ce n’est pas la performance d’un ETF précis.`
}

// Mention de conversion quand une série est affichée dans une autre devise que sa source.
export function conversionNote({ method }) {
  return `${method === 'official' ? 'série officielle' : method === 'h10-ecb' ? 'conversion Federal Reserve H.10 et BCE aux mêmes dates' : 'conversion BCE'}, sans couverture de change`
}

// Période « de début 2016 à fin 2025 » à partir de rendements annuels.
export function annualPeriodLabel(returns) {
  if (!returns?.length) return ''
  return `de début ${returns[0].year} à fin ${returns.at(-1).year}`
}
