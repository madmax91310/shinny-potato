// A currency conversion never changes the dividend convention.
export function returnConvention(asset) {
  const value = [asset.variant, asset.basis, asset.anniversaryVariant, asset.methodNote, asset.detail].filter(Boolean).join(' ')
  if (/NETR|index-net|Net Return|rendements? nets?|dividendes nets/i.test(value)) return 'NETR'
  if (/GRTR|index-gross|Gross Return|Total Return|rendements? bruts?|dividendes bruts/i.test(value)) return 'GRTR'
  if (/price-index|Price Return|hors dividendes/i.test(value)) return 'PRICE'
  return null
}
export function compatibleIndexReturns(assets) {
  return new Set(assets.filter(a => a?.priceUnit === 'points').map(returnConvention).filter(Boolean)).size <= 1
}
