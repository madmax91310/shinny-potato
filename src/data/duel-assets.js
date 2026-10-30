import { ANNUAL_PORTFOLIO_FUNDS } from './annual-portfolio-funds.js'
import EQUITY_DUEL_RETURNS from './equity-duel-returns.json' with {type:'json'};
import MONTHLY_DUEL_RETURNS from './monthly-duel-returns.json' with {type:'json'};
import { RESOURCE_DUEL_CHOICES } from './resource-selections.js'
import { NON_BOND_SHEETS } from './non-bond-expansion.js';
export { euroReturn } from '../lib/duel-returns.js'
import annualFx from './annual-fx.json' with { type: 'json' };
import { ASSETS } from './portfolio-assets.js'
import { getInstrumentDuelSeries, getInstrumentCalendarReturns } from './instrument-returns.js'
import { COMPARATOR_RETURNS_BY_ISIN } from './instrument-comparator-returns.js'
import { COMPARATOR_RETURN_EVIDENCE } from './comparator-return-evidence.js'
import { PORTFOLIO_RETURN_EVIDENCE } from './portfolio-return-evidence.js'
import { getInstrumentName } from './instruments.js'
import { DISTINCT_PORTFOLIO_CANDIDATES } from './distinct-portfolio-assets.js'
import { latestCommonYears } from './annual-window.js'

// Taux de fin d’année BCE déjà utilisés dans le duel, sans modification des valeurs.
// Clôtures BCE de fin d’année (USD par EUR) : un seul registre, collecté avec les données ETF.
export const EUR_USD = Object.fromEntries(Object.entries(annualFx.years).map(([year, row]) => [year, row.value]))
export const FX_SOURCE = annualFx.sourceUrl
export const ROLES = { base: 'Base', complement: 'Complément', theme: 'Thématique' }

// Sélection éditoriale : les chiffres restent exclusivement dans les registres communs.
const choices = [
 ['em-value-ishares','complement','Émergents value','emerging-value'],
 ['euro-ultrashort-ishares','complement','Obligations euro ultracourtes','euro-ultrashort'],
 ['industry_world_dws','theme','Industrie mondiale','industrials'],
 ['world-staples','theme','Consommation de base mondiale','staples'],
 ['world-discretionary','theme','Consommation discrétionnaire mondiale','discretionary'],
 ['europe-food','theme','Alimentation et boissons européennes','europe-food'],
 ['europe-media','theme','Médias européens','europe-media'],
 ['europe-retail','theme','Distribution européenne','europe-retail'],
 ['world-eur-hedged','base','World couvert en euros','world-hedged'],
 ['euro-govt-5-7','complement','Obligations euro 5–7 ans','intermediatebond'],
 ['europe-property','theme','Immobilier européen hors Royaume-Uni','property-europe'],
 ['europe-utilities','theme','Services publics européens','utilities-europe'],
 ['europe-telecom','theme','Télécommunications européennes','telecom-europe'],
 ['europe-banks','theme','Banques européennes','europe-banks'],
 ['europe-insurance','theme','Assurances européennes','europe-insurance'],
 ...[20,40,60,80].map(n=>[`lifestrategy${n}`,'base',`LifeStrategy ${n}/${100-n}`,`lifestrategy${n}`]),
 ['utilities_world_dws','theme','Services publics mondiaux','utilities-world'],
 ['health_world_ishares','theme','Santé mondiale','health-world'],
 ['materials_world_dws','theme','Matériaux mondiaux','materials-world'],
 ['private_equity_ishares', 'theme', 'Private equity coté', 'listed-private-equity'],
 ['gaming_vaneck', 'theme', 'Jeux vidéo et eSport', 'gaming'],
 ['medical_innovation_ishares', 'theme', 'Innovation médicale', 'medical'],
 ['acwi_imi_spdr', 'base', 'MSCI ACWI IMI', 'acwi-imi'],
['sp500_equal_weight', 'base', 'S&P 500 équipondéré', 'equalweight'],
 ['pea_global_amundi', 'base', 'MSCI ACWI en PEA', 'acwi-pea'],
 ['world_ex_usa', 'complement', 'World hors États-Unis', 'exusa'],
 ['russell2000_spdr', 'complement', 'Petites capitalisations américaines', 'us-small'],
 ['oblig_em_usd_ishares', 'complement', 'Dette émergente en dollars', 'em-bond'],
 ['oblig_em_local_ishares_acc', 'complement', 'Dette émergente en monnaies locales', 'em-local-bond'],
 ['oblig_eur_long_ishares', 'complement', 'Obligations d’État euro longues', 'longbond'],
  ['msci_world_ishares', 'base', 'MSCI World', 'world'],
  ['msci_acwi_ishares', 'base', 'MSCI ACWI', 'acwi'],
  ['ftse_allworld_vanguard', 'base', 'FTSE All-World', 'allworld'],
  ['sp500_ishares', 'base', 'S&P 500 (iShares)', 'sp500'],
  ['msci_em', 'complement', 'Marchés émergents IMI', 'em'],
  ['msci_europe', 'complement', 'MSCI Europe', 'europe'],
  ['smallcap_monde', 'complement', 'Petites capitalisations mondiales', 'smallcap'],
  ['nasdaq100', 'complement', 'Nasdaq-100', 'nasdaq'],
  ['actions_japon', 'complement', 'Japon IMI', 'japan'],
  ['actions_india_ishares', 'complement', 'Inde', 'india'],
  ['actions_value', 'complement', 'World Value', 'value'],
  ['world_quality_ishares', 'complement', 'World Quality', 'quality'],
  ['world_momentum_ishares', 'complement', 'World Momentum', 'momentum'],
  ['strat_dividendes', 'complement', 'Global Dividend Aristocrats', 'dividend'],
  ['high_dividend', 'complement', 'High Dividend', 'dividend'],
  ['quality_dividend', 'complement', 'Quality Dividend', 'dividend'],
  ['monetaire_xeon', 'complement', 'Monétaire EUR (XEON)', 'cash'],
  ['oblig_0_1_ishares', 'complement', 'Obligations EUR 0–1 an', 'shortbond'],
 ['oblig_etat_eur_short', 'complement', 'Obligations d’État EUR 1–3 ans', 'short13bond'],
 ['oblig_etat_eur', 'complement', 'Obligations d’État EUR', 'governmentbond'],
 ['oblig_corp_ig', 'complement', 'Obligations d’entreprises EUR investment grade', 'corporatebond'],
 ['oblig_hy', 'complement', 'Obligations d’entreprises EUR high yield', 'highyieldbond'],
 ['oblig_inflation', 'complement', 'Obligations EUR indexées sur l’inflation', 'inflationbond'],
  ['oblig_global_agg_eur_hedged', 'complement', 'Obligations mondiales couvertes EUR', 'globalbond'],
  ['sect_financieres', 'theme', 'Financières américaines', 'financials'],
  ['world_minvol_ishares', 'complement', 'World Minimum Volatility', 'minvol'],
  ['sect_tech_world_ishares', 'theme', 'Technologie mondiale', 'tech'],
  ['sect_energy_spdr', 'theme', 'Énergie mondiale', 'energy'],
  ['sect_sante', 'theme', 'Santé américaine', 'health'],
  ['sect_cyber_lg', 'theme', 'Cybersécurité', 'cyber'],
  ['sect_ai_lg', 'theme', 'Intelligence artificielle', 'ai'],
  ['sect_robotique', 'theme', 'Robotique', 'robotics'],
  ['sect_biotech_ishares', 'theme', 'Biotechnologie américaine', 'biotech'],
  ['sect_water_amundi', 'theme', 'Eau', 'water'],
  ['sect_luxury_amundi', 'theme', 'Luxe', 'luxury'],
  ['sect_batteries_lg', 'theme', 'Batteries', 'batteries'],
  ['sect_energie_propre', 'theme', 'Énergies propres', 'cleanenergy'],
  ['infrastructure_ishares', 'theme', 'Infrastructures mondiales', 'infrastructure'],
  ['immo_ishares_yield', 'theme', 'Immobilier coté des pays développés', 'property'],
]
// Devises explicites dans les commentaires vérifiés de portfolio-assets.js (24/09/2026).
// Japon : capture de la fiche officielle du 30/08/2026 ; énergies propres : contrôle du 24/09/2026.
const legacyCurrencies = { msci_europe: 'EUR', sect_sante: 'USD', actions_japon: 'USD', sect_energie_propre: 'USD' }
const fundItems = choices.map(([id, role, label, exposure]) => {
  const asset = ASSETS.find((item) => item.id === id)
  if (!asset?.isin) throw new Error(`ETF absent : ${id}`)
  const evidence = PORTFOLIO_RETURN_EVIDENCE[asset.isin]
  const original = getInstrumentDuelSeries(asset.isin)
  const series = { values: original?.values ?? asset.r, currency: original?.currency ?? evidence?.currency ?? legacyCurrencies[id], source: original?.source ?? evidence?.sourceUrls[0] }
  if (!series?.source || !['EUR', 'USD'].includes(series.currency)) throw new Error(`Preuve de part absente : ${id}`)
  if (asset.r.some((value, i) => series.values[i] !== null && value !== series.values[i])) throw new Error(`Rendements divergents : ${id}`)
  return { id, isin: asset.isin, name: asset.name, role, label, exposure, group: ROLES[role],
    currency: series.currency, values: series.values, source: series.source,
    note: original?.basis === 'proxy' ? original.note : 'Rendements de la part du fonds, revenus réinvestis.', basis: original?.basis ?? 'fund' }
})
// Revue du 02/10/2026 déjà consignée dans verified-returns.js ; aucune année inventée.
const extraFunds = [
 ['europe-construction','DE000A0H08F7','Construction et matériaux européens','construction-europe'],
 ['em-small-cap','IE00B3F81G20','Petites capitalisations émergentes','em-smallcap','complement'],
 ['copper-miners','IE0003Z9E2Y3','Mines de cuivre','copper-miners'],
  ...RESOURCE_DUEL_CHOICES,
  ['world_multifactor_ishares', 'IE00BZ0PKT83', 'World multifactoriel', 'multifactor', 'complement'],
  ['or_ishares', 'IE00B4ND3602', 'Or physique (ETC)', 'gold', 'complement'],
  ['em_ex_china', 'IE00BMG6Z448', 'Émergents hors Chine', 'em-ex-china', 'complement'],
  ['semiconducteurs_monde', 'IE000I8KRLL9', 'Semi-conducteurs mondiaux', 'semiconductors'],
  ['financieres_monde', 'IE00BJ5JP097', 'Financières mondiales', 'financials'],
  ['blockchain_ishares', 'IE000RDRMSD1', 'Blockchain', 'blockchain'],
].map(([id, isin, label, exposure, role = 'theme']) => {
  const market = MONTHLY_DUEL_RETURNS[isin]
  const official = getInstrumentDuelSeries(isin)
  const officialYears=official?.years ?? Object.fromEntries((official?.values ?? []).map((v,i)=>[2020+i,v]))
  // When the same share is also a manual Générateur asset (market-price calendar), both tools
  // must show one number: use that same market series here.
  const sharedManual = market && ASSETS.some(a => a.id === `manual-${isin}` && a.automatedManual)
  const sharedAnnual = ANNUAL_PORTFOLIO_FUNDS.find(a=>a.isin===isin && a.preferQualifiedAnnual && ASSETS.some(p=>p.isin===isin && p.annualManual))
  // Keep the existing Duel identity while retaining the whole qualified annual
  // contract, not just numerically equal returns from a separate adapter.
  const series = sharedAnnual ? {...sharedAnnual,id,currency:sharedAnnual.returnCurrency,values:sharedAnnual.r,note:sharedAnnual.confidenceNote}
    : sharedManual && latestCommonYears([market.years],{minimum:3}).length>=3 ? market
    : latestCommonYears([officialYears],{minimum:3}).length>=3 ? official : market && latestCommonYears([market.years],{minimum:3}).length>=3 ? market : official
  if (!series?.source) throw new Error(`Historique de part absent : ${isin}`)
  return { id, isin, label, exposure, name: getInstrumentName(isin), role, group: ROLES[role],
    ...series, note: series.note ?? (['copper','platinum','palladium'].includes(exposure) ? 'Rendements NAV de l’ETC exact, frais inclus, en USD. '+(exposure==='copper'?'Contrats à terme via swap ; renouvellement des contrats et frais de swap distincts.':'Adossé à du métal physique ; sans revenu distribué.') : exposure === 'multifactor' ? 'Rendements NAV de la part exacte, revenus réinvestis. Le fonds a changé d’indice : cet historique ne décrit pas uniquement la stratégie STOXX actuelle.' : exposure === 'gold' ? 'Rendements de l’ETC adossé à de l’or physique, sans revenu distribué ; années complètes communes.' : 'Rendements de la part exacte, revenus réinvestis ; seules les années complètes disponibles sont comparées.') }
})
const stoxxIsin = 'FR0011550193'
const stoxxEvidence = COMPARATOR_RETURN_EVIDENCE[stoxxIsin]
const expansionFunds=[...NON_BOND_SHEETS.map(r=>({id:r.id,isin:r.isin,label:r.title,exposure:r.id,role:'complement',group:ROLES.complement,name:r.name,...getInstrumentDuelSeries(r.isin),note:r.whatToKnow})),{id:'world-islamic',isin:'IE00B27YCN58',label:'World Islamic',exposure:'world-islamic',role:'complement',group:ROLES.complement,name:getInstrumentName('IE00B27YCN58'),...getInstrumentDuelSeries('IE00B27YCN58'),note:'Rendements NAV de la part exacte, revenus réinvestis ; critères sectoriels et financiers de finance islamique.'}];
const routedFunds = [...DISTINCT_PORTFOLIO_CANDIDATES, {id:'cloud-wisdomtree',isin:'IE00BJGWQN72',label:'Cloud',note:'Les logiciels et services du cloud ; une poche actions thématique.'}].flatMap(c=>{
 if([...expansionFunds,...fundItems,...extraFunds].some(a=>a.isin===c.isin))return []
 const s=getInstrumentDuelSeries(c.isin) ?? MONTHLY_DUEL_RETURNS[c.isin]
 if(!s?.source || !s.values)return []
 return [{...s,id:c.id,isin:c.isin,name:getInstrumentName(c.isin),label:c.label,exposure:c.id,
  role:'complement',group:ROLES.complement,note:[c.note,s.note].filter(Boolean).join(' ')}]
})
const equityItems = EQUITY_DUEL_RETURNS.map(item => ({...item, name: item.label, instrumentType: 'EQUITY', role: 'complement', group: 'Actions individuelles', exposure: item.id, basis: 'adjusted-price', note: 'Cours ajustés des dividendes et divisions ; rendements calculés entre clôtures de décembre, sur années complètes uniquement.'}))
const allAutomatedFunds = Object.values(MONTHLY_DUEL_RETURNS).filter(s=>![...routedFunds,...expansionFunds,...fundItems,...extraFunds].some(a=>a.isin===s.isin) && s.isin!==stoxxIsin).flatMap(s=>{
 const asset=ASSETS.find(a=>a.isin===s.isin)
 if(asset?.annualManual)return [] // Use the same qualified annual NAV contract in both tools.
 const official=asset&&!asset.distinctCandidate?getInstrumentDuelSeries(s.isin):null
 // A legacy mixed/proxy portfolio history cannot silently become exact-share market returns.
 if(asset&&!asset.distinctCandidate&&!official?.source)return []
 const series=official?{...official,source:official.source??PORTFOLIO_RETURN_EVIDENCE[s.isin]?.sourceUrls[0],values:asset.r,currency:asset.returnCurrency??official.currency,calendarReturns:asset.calendarReturns}:s
 return [{...series,isin:s.isin,id:`manual-${s.isin}`,name:getInstrumentName(s.isin),label:getInstrumentName(s.isin),exposure:s.isin,role:'complement',group:ROLES.complement}]
});
const existingFundIsins = new Set([...allAutomatedFunds, ...routedFunds, ...expansionFunds, ...fundItems, ...extraFunds].map(a => a.isin));
existingFundIsins.add(stoxxIsin);
const annualFunds = ANNUAL_PORTFOLIO_FUNDS.filter(a => !existingFundIsins.has(a.isin)).map(a => ({ ...a,
  label: a.name, exposure: a.isin, role: 'complement', group: ROLES.complement, currency: a.returnCurrency, values: a.r,
}));
export const CATALOG = [...annualFunds, ...allAutomatedFunds, ...equityItems, ...routedFunds, ...expansionFunds, ...fundItems, ...extraFunds, {
  id: 'stoxx600_bnp', isin: stoxxIsin, name: getInstrumentName(stoxxIsin),
  role: 'complement', label: 'STOXX Europe 600', exposure: 'europe', group: ROLES.complement,
  currency: stoxxEvidence.currency, values: [null, null, null, ...COMPARATOR_RETURNS_BY_ISIN[stoxxIsin]],
  source: stoxxEvidence.sourceUrls[0], note: 'Rendements de la part exacte, disponibles sur 2023–2025 seulement.',
  ...(MONTHLY_DUEL_RETURNS[stoxxIsin] ?? {}),
}].filter((item) => {
  item.calendarReturns ??= getInstrumentCalendarReturns(item.isin, item.values)
  const expiry=item.id.match(/^ibonds-euro-(\d{4})$/)?.[1]
  return (!expiry || new Date().getUTCFullYear()<=Number(expiry)) && latestCommonYears([item.calendarReturns],{minimum:3}).length>=3
})
for (const item of CATALOG) item.calendarReturns ??= getInstrumentCalendarReturns(item.isin, item.values);
export const ITEM_BY_ID = new Map(CATALOG.map((item) => [item.id, item]))
