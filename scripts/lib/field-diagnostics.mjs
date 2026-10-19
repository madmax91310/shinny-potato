// Operational collection status is separate from the availability of a retained value.
export function fieldDiagnostic({field, present, status, gap, configured, state}) {
  const observed = status?.observed?.includes(field)
  const errors = status?.errors ?? []
  if (observed && field==='listings' && state==='check-overdue') return {code:'partial-renewal', reason:'Certaines cotations ont été renouvelées, mais au moins une ancienne cotation reste sans nouvelle preuve exacte. Sa date initiale est conservée.'}
  if (observed) return {code:'observed', reason:null}
  if (status?.pending?.includes(field)) return errors.length
    ? {code:'collection-incomplete', reason:errors.map(e=>`${e.sourceUrl}: ${e.error}`).join(' · ')}
    : {code:'not-observed', reason:'Aucune preuve exacte de ce champ extraite des sources configurées lors du dernier passage. Limite de couverture du collecteur ; cela ne prouve ni la non-publication du champ ni une valeur négative.'}
  if (present) return {code:'available', reason:null}
  if (gap) return {code:gap.status, reason:gap.reason}
  return {code:configured?'collection-pending':'not-configured', reason:configured?'Collecte configurée, observation attendue.':'Source automatique à qualifier.'}
}
export const FIELD_TOOLS = {
  completeHoldings:['dca-profiles'], holdings:['dca-profiles','etf-sheets'], countries:['dca-profiles','etf-sheets'], sectors:['dca-profiles','etf-sheets'],
  listings:['etf-sheets','practical-sheets','investment-calculator'], pea:['etf-sheets','practical-sheets'], currencyHedge:['etf-sheets','practical-sheets'],
  monthly:['investment-calculator','performance-rankings','portfolio-generator','portfolio-duels'],
}
