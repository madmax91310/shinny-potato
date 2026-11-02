// Annual returns and percentage weights are provided as decimal Numbers by the
// caller. Multiply and sum their decimal representations exactly, converting
// back to Number only once. No epsilon or intermediate rounding: a genuine
// 6.45% tie must not become 6.449999999999999% when rows change order.
function decimalParts(value) {
  const [mantissa, exponent = '0'] = String(value).split('e')
  const decimals = mantissa.split('.')[1]?.length ?? 0
  return { coefficient: BigInt(mantissa.replace('.', '')), exponent: Number(exponent) - decimals }
}

export function weightedAnnualReturn(terms) {
  if (!terms.length || terms.some(({ value, weight }) => !Number.isFinite(value) || !Number.isFinite(weight))) return null
  const products = terms.map(({ value, weight }) => {
    const a = decimalParts(value), b = decimalParts(weight)
    return { coefficient: a.coefficient * b.coefficient, exponent: a.exponent + b.exponent - 2 }
  })
  const exponent = Math.min(...products.map(term => term.exponent))
  const coefficient = products.reduce((sum, term) => sum + term.coefficient * 10n ** BigInt(term.exponent - exponent), 0n)
  const result = Number(`${coefficient}e${exponent}`)
  return Number.isFinite(result) ? result : null
}
