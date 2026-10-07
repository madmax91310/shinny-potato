import { INDEX_DECISION_CASE_DEFINITIONS } from './index-decision-cases.js'
import { REVIEWED_PERFORMANCE_META } from './instrument-performance-review.js';
import { AUTOMATED_ETF, HISTORICAL_AUTOMATED_PERFORMANCE as AUTOMATED_PERFORMANCE, AUTOMATED_PERFORMANCE as LIVE_PERFORMANCE } from './automated-etf.js';
import { VERIFIED_RETURNS } from './verified-returns.js';
import { SIMULATION_PROXIES } from './simulation-proxies.js';
import { CATALOG as DUEL_ASSETS } from './duel-assets.js';
import { FEE_COMPARISON_ASSETS } from './fee-comparison-assets.js';
import { HISTORY_STATISTIC_IDS } from './history-statistics.js';
import { ALLOCATION_CASE_DEFINITIONS } from './allocation-cases.js';
import { INSTRUMENTS_BY_ISIN } from './instruments.js';
import { ETF_TER_BY_ISIN } from './etf-ter.js';
import { INSTRUMENT_FACTS_BY_ISIN } from './instrument-facts.js';
import { INSTRUMENT_AUM_BY_ISIN } from './instrument-aum.js';
import { PEA_REVIEWS_BY_ISIN } from './instrument-pea.js';
import { INSTRUMENT_LISTINGS_BY_ISIN } from './instrument-listings.js';
import { getInstrumentAnnualPerformance, getInstrumentReturnValues } from './instrument-returns.js';
import { PORTFOLIO_RETURN_EVIDENCE } from './portfolio-return-evidence.js';
import { INSTRUMENT_REFERENCE_EVIDENCE } from './instrument-reference-evidence.js';
import { ETF_TER_EVIDENCE } from './etf-ter.js';
import { COMPARATOR_RETURNS_BY_ISIN } from './instrument-comparator-returns.js';
import { COMPARATOR_RETURN_EVIDENCE } from './comparator-return-evidence.js';
import { INDEX_RETURNS } from './index-returns.js';
import { INDEX_FACTS, CURRENT_INDEX_SNAPSHOTS } from './index-facts.js';
import { ASSETS } from './portfolio-assets.js';
import { ETFS } from './etf-cards.js';
import { DEFAULT_THEMES } from './etf-themes.js';
import { SUPPORTING_EVIDENCE } from './supporting-evidence.js';
import { OFFICIAL_AUM_OBSERVATIONS } from './instrument-aum-observations.js';
import { TERMES } from './financial-lexicon.js';
import { ASSETS as HISTORY, SPARSE_MONTHLY_DATA_IDS } from './market-history.js';
import { FAMILIES } from './index-comparisons.js';
import { SHEETS } from './index-factsheets.js';
import { HOUSEHOLD_STATISTICS } from './household-statistics.js';
import { COMPANIES } from './companies.js';
import { normalizeEvidence } from './evidence.js';

// Consommateurs dérivés des catalogues réellement utilisés, jamais une copie de leurs valeurs.
const uses = new Map();
function use(isin, tool, path) {
  if (!isin || !INSTRUMENTS_BY_ISIN[isin]) return;
  const entries = uses.get(isin) ?? [];
  if (!entries.some((x) => x.path === path)) entries.push({ tool, path });
  uses.set(isin, entries);
}
ETFS.forEach((x) => use(x.isin, 'Présentation ETF', '/fiches-etf'));
ASSETS.forEach((x) => {
  use(x.isin, 'Générateur de portefeuilles', '/generateur-portefeuilles');

});
DUEL_ASSETS.forEach(x => use(x.isin, 'Duels de portefeuilles', '/duels-portefeuilles'));
FEE_COMPARISON_ASSETS.forEach(x => use(x.isin, 'Impact des frais', '/impact-frais'));
DEFAULT_THEMES.forEach((t) => t.etfs.forEach((x) => use(x.isin, 'Comparatif ETF', '/comparatif-etf')));
FAMILIES.forEach((f) => f.etfGroups.forEach((g) => g.funds.forEach((x) => use(x.isin, 'Comparateur d’indices', '/comparateur-indices'))));
SHEETS.forEach((x) => use(x.isin, 'Coulisses des indices', '/tweets-factsheets'));
['IE00B1FZS913','IE00B2NPKV68'].forEach(isin => use(isin, 'Cas concrets', '/cas-concrets'));
function field(label, registry, value, evidence) {
  return { label, registry: `src/data/${registry}.js`, value, metadata: normalizeEvidence(evidence) };
}
function instrument(isin, identity) {
  const scope = `Part ${isin}`;
  const fields = [field('Identité', 'instruments', identity, { ...INSTRUMENT_REFERENCE_EVIDENCE[isin], scope })];
  const commodities = AUTOMATED_ETF[isin]?.commodityAllocation;
  if (commodities) fields.push(field('Allocation matières premières de l’indice suivi', 'automated-etf', commodities.rows, { ...commodities, note: 'Groupes de matières premières publiés par Invesco ; ni secteurs actions, ni panier de swap. Les arrondis signés publiés restent conservés.' }));
  if (ETF_TER_BY_ISIN[isin] != null) fields.push(field('Frais annuels (%)', 'etf-ter', ETF_TER_BY_ISIN[isin], { ...ETF_TER_EVIDENCE[isin], scope }) );
  const facts = INSTRUMENT_FACTS_BY_ISIN[isin];
  if (facts) fields.push(field('Caractéristiques', 'instrument-facts', facts, { ...facts.characteristicsSource, dateStatus: 'not-applicable', scope, method: 'Caractéristiques de la part ; aucune inférence sur la cotation.' }));
  const pea = PEA_REVIEWS_BY_ISIN[isin];
  if (pea) fields.push(field('Éligibilité PEA', 'instrument-pea', pea.eligible, { ...pea, dateStatus: 'not-applicable', scope }));
  const aum = INSTRUMENT_AUM_BY_ISIN[isin];
  if (aum) fields.push(field('Encours', 'instrument-aum', aum, { ...aum.source, dateStatus: aum.source.asOf ? 'dated' : 'not-published', scope: aum.source.scope ?? `${scope} ; périmètre du profil source`, note: aum.source.asOf ? 'Date publiée par l’émetteur ; la consultation reste distincte.' : 'Le profil justETF ne publie pas la date de valeur de cet encours. La date des positions ne date pas l’encours. La consultation reste distincte.' }));
  const listings = INSTRUMENT_LISTINGS_BY_ISIN[isin] ?? [];
  const officialAum = OFFICIAL_AUM_OBSERVATIONS[isin];
  if (officialAum) fields.push(field('Encours daté publié par l’émetteur', 'instrument-aum-observations', officialAum, officialAum));
  for (const listing of listings) fields.push(field(`Cotation ${listing.mic}`, 'instrument-listings', listing, { ...listing, dateStatus: 'not-applicable', scope: `${scope} ; ${listing.exchange}`, method: 'Devise de négociation, distincte de celle des rendements.' }));
  const evidence = AUTOMATED_PERFORMANCE[isin] ?? getInstrumentAnnualPerformance(isin);
  const proxy = SIMULATION_PROXIES[isin];
  if (proxy) fields.push(field('Historique de simulation (proxy)', 'simulation-proxies', { ...proxy, values: getInstrumentReturnValues(isin) }, { sourceUrls: [proxy.source], checkedAt: '2026-10-03', asOf: '2025-12-31', periodStart: '2020-01-01', periodEnd: '2025-12-31', currency: proxy.currency, scope: proxy.scope, method: 'Proxy documenté, distinct de la part exacte', note: proxy.note }));
  const reviewed = REVIEWED_PERFORMANCE_META[isin];
  const candidateReturns = AUTOMATED_PERFORMANCE[isin] ? AUTOMATED_PERFORMANCE[isin].values : reviewed ? (evidence.values.some(Number.isFinite) ? evidence.values : null) :
    proxy ? VERIFIED_RETURNS[isin].values : PORTFOLIO_RETURN_EVIDENCE[isin] || evidence ? getInstrumentReturnValues(isin) : null;
  const returns = candidateReturns?.some(Number.isFinite) ? candidateReturns : null;
  if (returns) {
    fields.push(field('Rendements 2020–2025', 'instrument-returns', returns, reviewed || AUTOMATED_PERFORMANCE[isin] ? {
      source: evidence.source, checkedAt: evidence.checkedAt, currency: evidence.currency,
      asOf: '2025-12-31', periodStart: `${2020 + returns.findIndex(Number.isFinite)}-01-01`, periodEnd: '2025-12-31',
      scope, method: 'Rendements calendaires NAV de la part exacte ; années complètes uniquement', note: evidence.note,
    } : { ...PORTFOLIO_RETURN_EVIDENCE[isin], ...(proxy ? {sourceUrls:[VERIFIED_RETURNS[isin].source], scope:`Part exacte ${isin}`} : {}), ...(evidence?.currency ? { currency: evidence.currency } : {}), ...(evidence?.source ? { source: evidence.source } : {}), scope }));
  }
  const live = LIVE_PERFORMANCE[isin];
  if (live && (live.periodStart !== '2020-01-01' || live.periodEnd !== '2025-12-31')) fields.push(field(`Rendements ${live.calendarYears[0]}–${live.calendarYears.at(-1)}`, 'automated-etf', live.values, { ...live, asOf: live.periodEnd, scope, method: live.method }));
  if (reviewed?.portfolioHistoryBasis === 'proxy' && !AUTOMATED_PERFORMANCE[isin]?.values.every(Number.isFinite)) fields.push(field('Historique de simulation 2020–2025', 'instrument-returns', getInstrumentReturnValues(isin), { ...PORTFOLIO_RETURN_EVIDENCE[isin], scope: `${scope} ; proxy de simulation, distinct du rendement réel de la part` }));
  for (const observation of evidence?.observations ?? []) fields.push(field(`Performance ${observation.label}`, 'instrument-performance-review', observation, { source: evidence.source, checkedAt: evidence.checkedAt, asOf: observation.asOf, currency: evidence.currency, scope, method: 'Rendement cumulé NAV sur la période explicitement publiée', note: evidence.note }));
  if (evidence?.availability) fields.push(field('Disponibilité de la performance', 'instrument-performance-review', evidence.note, { source: evidence.source, checkedAt: evidence.checkedAt, currency: evidence.currency, dateStatus: 'not-published', scope, method: evidence.availability === 'source-conflict' ? 'Sources émetteur divergentes ; chiffre exclu en attente de confirmation' : 'Absence de performance réelle publiée ; aucun proxy attribué à la part' }));
  if (COMPARATOR_RETURNS_BY_ISIN[isin]) fields.push(field('Rendements 2023–2025 du comparateur', 'instrument-comparator-returns', COMPARATOR_RETURNS_BY_ISIN[isin], { ...COMPARATOR_RETURN_EVIDENCE[isin], asOf: '2025-12-31', periodStart: '2023-01-01', periodEnd: '2025-12-31', scope, note: COMPARATOR_RETURN_EVIDENCE[isin]?.note ?? 'Source individuelle non renseignée ; ne pas confondre les devises.' }));
  return { id: isin, type: 'instrument', name: identity.name, aliases: [isin, ...Object.values(identity.labels ?? {}), ...listings.map((x) => x.ticker)], consumers: uses.get(isin) ?? [], fields };
}
function index(id, history) {
  const current = CURRENT_INDEX_SNAPSHOTS[id];
  const values = [...Object.values(history), ...(current ? [current] : [])];
  const consumers = [];
  if (SHEETS.some((s) => values.includes(s.indexFacts))) consumers.push({ tool: 'Coulisses des indices', path: '/tweets-factsheets' });
  if (FAMILIES.some((f) => f.indices.some((s) => values.includes(s.indexFacts)))) consumers.push({ tool: 'Comparateur d’indices', path: '/comparateur-indices' });
  if ([...ALLOCATION_CASE_DEFINITIONS, ...INDEX_DECISION_CASE_DEFINITIONS].some(x => x.left === id || x.right === id)) consumers.push({ tool: 'Cas concrets', path: '/cas-concrets' });
  return { id, type: 'index', name: values[0].index,
    aliases: [id, ...FAMILIES.flatMap((f) => f.indices.filter((x) => values.includes(x.indexFacts)).map((x) => x.name))], consumers,
    fields: [...(current ? [field(`Composition courante · ${current.snapshot}`, 'index-facts', current, current.metadata)] : []), ...Object.entries(history).sort(([a], [b]) => /^\d{4}/.test(a) !== /^\d{4}/.test(b) ? (/^\d{4}/.test(a) ? -1 : 1) : b.localeCompare(a)).map(([key, facts]) => field(`Photographie · ${facts.snapshot}`, 'index-facts', facts, { ...facts.metadata, note: `${facts.provenance} Clé : ${key}` })), ...Object.entries(INDEX_RETURNS[id] ?? {}).map(([date, series]) => field(`Rendements d’indice · ${date}`, 'index-returns', series, series.metadata))] };
}
function companyRecord(company) {
  const scope = `${company.name} · comptes consolidés · ${company.currency}`;
  const fields = [field('Activité', 'companies', company.activity, { url: company.sourceUrl, checkedAt: company.activityReviewedAt, scope, dateStatus: 'not-applicable', method: 'Présentation éditoriale de l’activité ; revue distincte des résultats' })];
  for (const [key, label] of [['annual', 'Comptes annuels'], ['quarter', 'Comptes trimestriels'], ['halfYear', 'Comptes semestriels']]) {
    const period = company[key];
    if (period) fields.push(field(label, 'companies', period, { url: period.sourceUrl ?? company.accountsSourceUrl, asOf: period.end, checkedAt: company.accountsObservedAt, currency: company.currency, scope, periodStart: period.start, periodEnd: period.end, method: 'Comptes consolidés GAAP/IFRS SEC ou publication officielle ; période annuelle, semestrielle ou trimestrielle, jamais un cumul présenté comme un trimestre ; FCF = flux d’exploitation moins acquisitions d’immobilisations (et incorporels pour Nvidia)' }));
  }
  if (company.quote) fields.push(field('Cours de clôture', 'companies', company.quote.price, { url: company.quote.sourceUrl, asOf: company.quote.asOf, checkedAt: company.quote.observedAt, currency: company.currency, scope: `${company.symbol} · action cotée`, method: 'Clôture brute de la dernière séance précédant la date locale de collecte ; aucune séance en cours' }));
  for (const [key, label] of [['trailing', 'BPA sur douze mois'], ['balance', 'Dette et trésorerie'], ['shares', 'Actions en circulation']]) {
    const value = company[key];
    if (value) fields.push(field(label, 'companies', value, { url: value.sourceUrl ?? value.sourceUrls?.[0] ?? company.accountsSourceUrl, asOf: value.asOf ?? value.end, checkedAt: value.observedAt, currency: company.currency, scope, method: value.definition ?? (key === 'balance' ? 'Trésorerie et équivalents du bilan officiel ; dette nette omise si une composante manque' : 'Nombre d’actions à la date du bilan ; capitalisation indicative au cours de clôture') }));
  }
  if (company.history) for (const year of company.history.years) fields.push(field(`Historique annuel · ${year.end}`, 'companies', year, { url: year.sourceUrl, asOf: year.end, checkedAt: company.history.observedAt, currency: company.currency, scope, periodStart: year.start, periodEnd: year.end, method: company.history.definition }));
  if (company.estimates) fields.push(field('Estimations prévisionnelles', 'companies', company.estimates, { url: company.estimates.sourceUrl, checkedAt: company.estimates.observedAt, currency: company.currency, scope, method: 'PER prévisionnel = clôture Yahoo / BPA estimé du prochain exercice fiscal Finviz ; PEG = ce PER / croissance annuelle estimée du BPA sur cinq ans (en points de pourcentage)', note: company.estimates.earningsBasis }));
  if (company.valuation) fields.push(field('Valorisation', 'companies', company.valuation, { url: company.valuation.sourceUrl, checkedAt: company.valuation.observedAt, currency: company.currency, scope, method: 'Ratios fournis par Alpha Vantage ; horizons prévisionnels et méthode PEG non précisés', note: 'La date du relevé ne certifie pas une date de cours ; ratios omis de la publication après sept jours ou si les comptes sous-jacents sont dépassés.' }));
  return { id: `company:${company.id}`, type: 'company', name: company.name, aliases: [company.symbol, company.cik, company.id].filter(Boolean), consumers: [{ tool: 'Analyse d’entreprise', path: '/analyse-entreprise' }], fields };
}
export const DATA_CATALOG = Object.freeze([
  ...COMPANIES.map(companyRecord),
  ...HOUSEHOLD_STATISTICS.map((value) => ({ id: `household:${value.id}`, type: 'household', name: value.title,
    aliases: [value.id, value.category, value.headline, 'Insee', 'ménages'], consumers: [{ tool: 'La France en 100 ménages', path: `/france-100-menages` }],
    fields: [field('Statistique de ménages', 'household-statistics', value, value.metadata)] })),
  ...Object.entries(INSTRUMENTS_BY_ISIN).map(([isin, identity]) => instrument(isin, identity)),
  ...Object.entries(INDEX_FACTS).map(([id, history]) => index(id, history)),
  ...Object.entries(INDEX_RETURNS).filter(([id]) => !INDEX_FACTS[id]).map(([id, history]) => ({
    id, type: Object.values(history)[0].performance.kind === 'actif' ? 'series' : 'index',
    name: Object.values(history)[0].performance.detail.split(' · ')[0], aliases: [id],
    consumers: [{ tool: 'Comparateur d’indices', path: '/comparateur-indices' }],
    fields: Object.entries(history).map(([date, series]) => field(`Rendements · ${date}`, 'index-returns', series, series.metadata)),
  })),
  ...Object.entries(HISTORY).map(([id, value]) => ({ id: `history:${id}`, type: 'series', name: value.name ?? value.label ?? id, aliases: [id], consumers: [{ tool: 'Calculateur', path: '/calculateur-investissement' }, { tool: 'Performance depuis', path: '/performance-depuis' }, ...(!SPARSE_MONTHLY_DATA_IDS.has(id) && (value.priceMethod !== 'adjusted' || value.anniversaryPoints) && value.priceUnit !== 'points' ? [{ tool: 'Il y a X ans', path: '/il-y-a-x-ans' }] : []), ...(HISTORY_STATISTIC_IDS.includes(id) ? [{ tool: 'Faits marquants', path: '/faits-marquants-marches' }] : [])], fields: [field('Série historique', 'market-history', value, { ...SUPPORTING_EVIDENCE[`history:${id}`], scope: id, currency: value.currency })] })),
  ...TERMES.map((value) => ({ id: `lexicon:${value.id}`, type: 'lexicon', name: value.titre ?? value.nom ?? value.title ?? value.terme ?? value.id, aliases: [value.id], consumers: [{ tool: 'Fiche lexique', path: '/fiche-lexique' }], fields: [field('Définition', 'financial-lexicon', value, { ...SUPPORTING_EVIDENCE[`lexicon:${value.id}`], dateStatus: 'not-applicable', scope: value.id })] })),
]);
const normalize = (value) => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
export function searchData(query = '', type = 'all') {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return DATA_CATALOG.filter((record) => (type === 'all' || record.type === type)
    && words.every((word) => normalize([record.id, record.name, ...record.aliases].join(' ')).includes(word)))
    .sort((a, b) => (normalize(b.id) === normalize(query)) - (normalize(a.id) === normalize(query)) || a.name.localeCompare(b.name, 'fr'));
}
export function exportDataRecord(record) {
  return JSON.stringify({ schemaVersion: 1, ...record }, null, 2);
}
