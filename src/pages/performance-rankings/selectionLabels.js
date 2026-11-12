// Navigation copy only: financial identities, conventions and publication labels stay intact.
export const selectionAssetLabel = asset => (asset.shortLabel ?? asset.label).replace(/ · VL\b/g, '')
export const selectionAssetName = asset => asset.label.replace(/ · VL\b/g, '')
export function selectionCategoryLabel(category) {
  return category.label.replace(/ · ETF et ETC du registre$/, '')
    .replace(/ · calendriers NAV$/, '')
    .replace(' · années officielles', ' · indices bruts')
}
export function selectionMethod(asset) {
  if (asset.frequency === 'annual') return asset.isin ? 'Performances annuelles du fonds' : 'Performances annuelles de l’indice'
  return asset.valuationBasis === 'fund-nav-total-return' ? 'Valeur du fonds, revenus réinvestis' : 'Historique mensuel'
}
