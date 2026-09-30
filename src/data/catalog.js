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
import { INDEX_FACTS } from './index-facts.js';
import { ASSETS } from './portfolio-assets.js';
import { ETFS } from './etf-cards.js';
import { DEFAULT_THEMES } from './etf-themes.js';
import { SUPPORTING_EVIDENCE } from './supporting-evidence.js';
import { OFFICIAL_AUM_OBSERVATIONS } from './instrument-aum-observations.js';
import { TERMES } from './financial-lexicon.js';
import { ASSETS as HISTORY } from './market-history.js';
import { FAMILIES } from './index-comparisons.js';
import { SHEETS } from './index-factsheets.js';
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
  // L’éditeur manuel/génératif des duels utilise le même roster entier.
  use(x.isin, 'Duels de portefeuilles', '/duels-portefeuilles');
});
DEFAULT_THEMES.forEach((t) => t.etfs.forEach((x) => use(x.isin, 'Comparatif ETF · Tweet Midi', '/tweet-midi')));
FAMILIES.forEach((f) => f.etfGroups.forEach((g) => g.funds.forEach((x) => use(x.isin, 'Comparateur d’indices', '/comparateur-indices'))));
SHEETS.forEach((x) => use(x.isin, 'Coulisses des indices', '/tweets-factsheets'));
function field(label, registry, value, evidence) {
  return { label, registry: `src/data/${registry}.js`, value, metadata: normalizeEvidence(evidence) };
}
function instrument(isin, identity) {
  const scope = `Part ${isin}`;
  const fields = [field('Identité', 'instruments', identity, { ...INSTRUMENT_REFERENCE_EVIDENCE[isin], scope })];
  if (ETF_TER_BY_ISIN[isin] != null) fields.push(field('Frais annuels (%)', 'etf-ter', ETF_TER_BY_ISIN[isin], { ...ETF_TER_EVIDENCE[isin], scope }) );
  const facts = INSTRUMENT_FACTS_BY_ISIN[isin];
  if (facts) fields.push(field('Caractéristiques', 'instrument-facts', facts, { ...facts.characteristicsSource, dateStatus: 'not-applicable', scope, method: 'Caractéristiques de la part ; aucune inférence sur la cotation.' }));
  const pea = PEA_REVIEWS_BY_ISIN[isin];
  if (pea) fields.push(field('Éligibilité PEA', 'instrument-pea', pea.eligible, { ...pea, dateStatus: 'not-applicable', scope }));
  const aum = INSTRUMENT_AUM_BY_ISIN[isin];
  if (aum) fields.push(field('Encours', 'instrument-aum', aum, { ...aum.source, dateStatus: aum.source.asOf ? 'dated' : 'not-published', scope: `${scope} ; périmètre du profil source`, note: aum.source.asOf ? 'Date publiée par l’émetteur ; la consultation reste distincte.' : 'Le profil justETF ne publie pas la date de valeur de cet encours. La date des positions ne date pas l’encours. La consultation reste distincte.' }));
  const listings = INSTRUMENT_LISTINGS_BY_ISIN[isin] ?? [];
  const officialAum = OFFICIAL_AUM_OBSERVATIONS[isin];
  if (officialAum) fields.push(field('Encours daté publié par l’émetteur', 'instrument-aum-observations', officialAum, officialAum));
  for (const listing of listings) fields.push(field(`Cotation ${listing.mic}`, 'instrument-listings', listing, { ...listing, dateStatus: 'not-applicable', scope: `${scope} ; ${listing.exchange}`, method: 'Devise de négociation, distincte de celle des rendements.' }));
  const evidence = getInstrumentAnnualPerformance(isin);
  const returns = PORTFOLIO_RETURN_EVIDENCE[isin] || evidence ? getInstrumentReturnValues(isin) : null;
  if (returns) {
    fields.push(field('Rendements 2020–2025', 'instrument-returns', returns, { ...PORTFOLIO_RETURN_EVIDENCE[isin], ...(evidence?.currency ? { currency: evidence.currency } : {}), ...(evidence?.source ? { source: evidence.source } : {}), scope }));
  }
  if (COMPARATOR_RETURNS_BY_ISIN[isin]) fields.push(field('Rendements 2023–2025 du comparateur', 'instrument-comparator-returns', COMPARATOR_RETURNS_BY_ISIN[isin], { ...COMPARATOR_RETURN_EVIDENCE[isin], asOf: '2025-12-31', periodStart: '2023-01-01', periodEnd: '2025-12-31', scope, note: COMPARATOR_RETURN_EVIDENCE[isin]?.note ?? 'Source individuelle non renseignée ; ne pas confondre les devises.' }));
  return { id: isin, type: 'instrument', name: identity.name, aliases: [isin, ...Object.values(identity.labels ?? {}), ...listings.map((x) => x.ticker)], consumers: uses.get(isin) ?? [], fields };
}
function index(id, history) {
  const values = Object.values(history);
  const consumers = [];
  if (SHEETS.some((s) => values.includes(s.indexFacts))) consumers.push({ tool: 'Coulisses des indices', path: '/tweets-factsheets' });
  if (FAMILIES.some((f) => f.indices.some((s) => values.includes(s.indexFacts)))) consumers.push({ tool: 'Comparateur d’indices', path: '/comparateur-indices' });
  return { id, type: 'index', name: values[0].index,
    aliases: [id, ...FAMILIES.flatMap((f) => f.indices.filter((x) => values.includes(x.indexFacts)).map((x) => x.name))], consumers,
    fields: [...Object.entries(history).sort(([a], [b]) => /^\d{4}/.test(a) !== /^\d{4}/.test(b) ? (/^\d{4}/.test(a) ? -1 : 1) : b.localeCompare(a)).map(([key, facts]) => field(`Photographie · ${facts.snapshot}`, 'index-facts', facts, { ...facts.metadata, note: `${facts.provenance} Clé : ${key}` })), ...Object.entries(INDEX_RETURNS[id] ?? {}).map(([date, series]) => field(`Rendements d’indice · ${date}`, 'index-returns', series, series.metadata))] };
}
export const DATA_CATALOG = Object.freeze([
  ...Object.entries(INSTRUMENTS_BY_ISIN).map(([isin, identity]) => instrument(isin, identity)),
  ...Object.entries(INDEX_FACTS).map(([id, history]) => index(id, history)),
  ...Object.entries(HISTORY).map(([id, value]) => ({ id: `history:${id}`, type: 'series', name: value.name ?? value.label ?? id, aliases: [id], consumers: [{ tool: 'Calculateur', path: '/calculateur-investissement' }], fields: [field('Série historique', 'market-history', value, { ...SUPPORTING_EVIDENCE[`history:${id}`], scope: id, currency: value.currency })] })),
  ...TERMES.map((value) => ({ id: `lexicon:${value.id}`, type: 'lexicon', name: value.titre ?? value.nom ?? value.title ?? value.terme ?? value.id, aliases: [value.id], consumers: [{ tool: 'Lexique · Tweet Midi', path: '/tweet-midi' }], fields: [field('Définition', 'financial-lexicon', value, { ...SUPPORTING_EVIDENCE[`lexicon:${value.id}`], dateStatus: 'not-applicable', scope: value.id })] })),
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
