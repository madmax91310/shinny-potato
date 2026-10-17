// ECB rates are units of currency per EUR. London prices in GBp are pence.
export function fxRate(rates, currency) {
  const value = currency === 'EUR' ? 1 : currency === 'GBp' ? rates?.GBP * 100 : rates?.[currency]
  return Number.isFinite(value) && value > 0 ? value : null
}
