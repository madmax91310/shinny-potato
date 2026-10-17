export function isStock(asset) {
  return asset?.instrumentType === 'EQUITY' || (asset?.basis === 'adjusted' && !asset.isin && !asset.priceUnit)
}
