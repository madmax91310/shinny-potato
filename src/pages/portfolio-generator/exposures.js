// Familles pour mesurer la variété de composition, pas le chevauchement des titres.
// Certains indices voisins gardent des différences réelles de sociétés et de rendements.
const FAMILIES = [
  ['world', ['msci_world','msci_world_ishares','msci_world_amundi_pea']],
  ['world-all', ['msci_acwi','msci_acwi_ishares','ftse_allworld_vanguard']],
  ['emerging', ['msci_em','msci_em_amundi','msci_em_spdr','ftse_em_vanguard']],
  ['gold', ['or','or_ishares','or_amundi','or_wisdomtree']],
  ['bitcoin', ['bitcoin','bitcoin_wisdomtree','bitcoin_etcgroup','bitcoin_21shares']],
  ['corp-ig', ['oblig_corp_ig','oblig_corp_amundi','oblig_corp_vanguard','oblig_corp_spdr']],
  ['high-yield', ['oblig_hy','oblig_hy_amundi']],
  ['dividends', ['strat_dividendes','strat_dividendes_dist','high_dividend','high_dividend_dist','quality_dividend','quality_dividend_dist','dividend_leaders','dividend_aristocrats_us_spdr']],
  ['property-listed', ['foncieres_etf','foncieres_etf_dist','immo_gpr','immo_ishares_yield']],
  ['sp500', ['sp500','sp500_ishares']], ['nasdaq', ['nasdaq100','nasdaq100_ishares']],
  ['eurostoxx', ['eurostoxx50','eurostoxx50_ishares']],
  ['commodities', ['mp_large','mp_large_icom']],
];
const FAMILY_BY_ID = new Map(FAMILIES.flatMap(([family, ids]) => ids.map(id => [id, family])));

export function exposureVector(selection) {
  const vector = {};
  for (const { id, pct } of selection) {
    const family = FAMILY_BY_ID.get(id) ?? id;
    vector[family] = (vector[family] ?? 0) + pct;
  }
  return vector;
}
export function exposureSignature(selection) {
  return Object.entries(exposureVector(selection)).sort().map(([id, pct]) => `${id}:${pct}`).join(',');
}
// Nombre de points de capital à déplacer pour passer entre deux compositions.
export function exposureDistance(a, b) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .reduce((sum, id) => sum + Math.abs((a[id] ?? 0) - (b[id] ?? 0)), 0) / 2;
}
