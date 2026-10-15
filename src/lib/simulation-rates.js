// Convention commune aux projections hypothétiques : rendement annuel effectif,
// frais proportionnels, versement en fin de mois. Les historiques restent distincts.
export function annualAfterFees(grossPct, feePct = 0) {
  if (![grossPct, feePct].every(Number.isFinite) || grossPct <= -100 || feePct < 0 || feePct >= 100) throw new Error('Rendement ou frais invalides.')
  return (1 + grossPct / 100) * (1 - feePct / 100) - 1
}
export function monthlyEffective(annualRate) {
  if (!Number.isFinite(annualRate) || annualRate <= -1) throw new Error('Rendement annuel invalide.')
  return Math.expm1(Math.log1p(annualRate) / 12)
}
