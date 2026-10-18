// Operational collection status is separate from the availability of a retained value.
export function fieldDiagnostic({field, present, status, gap, configured}) {
  const observed = status?.observed?.includes(field)
  const errors = status?.errors ?? []
  if (observed) return {code:'observed', reason:null}
  if (status?.pending?.includes(field)) return errors.length
    ? {code:'collection-incomplete', reason:errors.map(e=>`${e.sourceUrl}: ${e.error}`).join(' · ')}
    : {code:'not-observed', reason:'Champ non observé dans les documents consultés ; son absence de publication reste à qualifier.'}
  if (present) return {code:'available', reason:null}
  if (gap) return {code:gap.status, reason:gap.reason}
  return {code:configured?'collection-pending':'not-configured', reason:configured?'Collecte configurée, observation attendue.':'Source automatique à qualifier.'}
}
export const FIELD_TOOLS = {
  completeHoldings:['dca-profiles'], holdings:['dca-profiles','etf-sheets'], countries:['dca-profiles','etf-sheets'], sectors:['dca-profiles','etf-sheets'],
  listings:['etf-sheets','practical-sheets','investment-calculator'], pea:['etf-sheets','practical-sheets'], currencyHedge:['etf-sheets','practical-sheets'],
  monthly:['investment-calculator','performance-rankings','portfolio-generator','portfolio-duels'],
}
