import { COMPANY_INDEX_IDS } from './index-company-facts.js'
import { QUALIFIED_METRICS } from './qualified-exposure-metrics.js';
import { marketCalendarPerformance } from './market-calendar-performance.js';
import { QUALIFIED_EXPOSURE_SHEETS } from './qualified-exposure-sheets.js'
import practicalReferences from './automated-practical-sheets.json' with { type: 'json' };
import { TOPICS as PRACTICAL_TOPICS, FUND_GROUPS as PRACTICAL_FUND_GROUPS } from './practical-sheet-topics.js';
import { REGULATORY_OBSERVATIONS, REGULATORY_LEXICON_SOURCES } from './regulatory-data.js';
import { BROKER_TARIFFS, brokerTariffCopy, brokerProfile } from './broker-tariffs.js';
import { INDEX_DECISION_CASE_DEFINITIONS } from './index-decision-cases.js'
import { REVIEWED_PERFORMANCE_META } from './instrument-performance-review.js';
import { AUTOMATED_ETF, HISTORICAL_AUTOMATED_PERFORMANCE as AUTOMATED_PERFORMANCE, AUTOMATED_PERFORMANCE as LIVE_PERFORMANCE } from './automated-etf.js';
import { VERIFIED_RETURNS } from './verified-returns.js';
import { SIMULATION_PROXIES } from './simulation-proxies.js';
import { CATALOG as DUEL_ASSETS } from './duel-assets.js';
import { FEE_COMPARISON_ASSETS } from './fee-comparison-assets.js';
import { MONTHLY_MARKET_STORY_IDS } from './market-story-selection.js';
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
import { ETF_TER_EVIDENCE } from './etf-ter-evidence.js';
import { COMPARATOR_RETURNS_BY_ISIN } from './instrument-comparator-returns.js';
import { COMPARATOR_RETURN_EVIDENCE } from './comparator-return-evidence.js';
import { INDEX_RETURNS } from './index-returns.js';
import { INDEX_FACTS, CURRENT_INDEX_SNAPSHOTS } from './index-facts.js';
import { AUTOMATED_INDICES } from './automated-indices.js';
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
import { INSURANCE, ARCHIVED_INSURANCE } from './insurance.js';
import { SCPI } from './scpi.js';
import { PRESENTATION_ACTORS } from './presentation-actors.js';
import { normalizeEvidence } from './evidence.js';
import { ECONOMIC_OBSERVATIONS, economicCalendar } from './economic-data.js';
import { LIVRET_A } from './market-history.js';

// Consommateurs dérivés des catalogues réellement utilisés, jamais une copie de leurs valeurs.
const uses = new Map();
function use(isin, tool, path) {
  if (!isin || !INSTRUMENTS_BY_ISIN[isin]) return;
  const entries = uses.get(isin) ?? [];
  if (!entries.some((x) => x.path === path)) entries.push({ tool, path });
  uses.set(isin, entries);
}
[...Object.values(PRACTICAL_FUND_GROUPS).flat(),'FR0013416716'].forEach(isin=>use(isin,'Fiches pratiques','/fiches-pratiques'));
ETFS.forEach((x) => use(x.isin, 'Présentation ETF', '/fiches-etf'));
ASSETS.forEach((x) => {
  use(x.isin, 'Générateur de portefeuilles', '/generateur-portefeuilles');

});
DUEL_ASSETS.forEach(x => use(x.isin, 'Duels de portefeuilles', '/duels-portefeuilles'));
FEE_COMPARISON_ASSETS.forEach(x => use(x.isin, 'Impact des frais', '/impact-frais'));
DEFAULT_THEMES.forEach((t) => t.etfs.forEach((x) => use(x.isin, 'Comparatif ETF', '/comparatif-etf')));
SHEETS.forEach((x) => use(x.isin, 'Coulisses des indices', '/tweets-factsheets'));
['IE00B1FZS913','IE00B2NPKV68'].forEach(isin => use(isin, 'Banque de tweets', '/banque-tweets'));
function field(label, registry, value, evidence) {
  return { label, registry: `src/data/${registry}.js`, value, metadata: normalizeEvidence(evidence) };
}
function instrument(isin, identity) {
  const scope = `Part ${isin}`;
  const fields = [field('Identité', 'instruments', identity, { ...INSTRUMENT_REFERENCE_EVIDENCE[isin], scope })];
  for (const m of Object.values(QUALIFIED_METRICS[isin] ?? {})) fields.push(field(m.label, 'qualified-exposure-metrics', {value:m.value,unit:m.unit}, {...m,note:m.method || 'Mesure publiée par l’émetteur, selon sa méthode et à sa date ; pas une prévision de performance.'}));
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
  const calculated = marketCalendarPerformance(isin);
  if(calculated && !LIVE_PERFORMANCE[isin]?.values.some(Number.isFinite)) fields.push(field('Rendements annuels de cotation','market-calendar-performance',Object.entries(calculated.years).map(([year,value])=>[Number(year),value]),{
    sourceUrls:calculated.sourceUrls,checkedAt:calculated.checkedAt,asOf:calculated.periodEnd,
    periodStart:calculated.periodStart,periodEnd:calculated.periodEnd,currency:calculated.currency,
    scope:`Part exacte ${isin} ; cotation ${calculated.listingEvidenceId}`,method:calculated.method,note:calculated.note
  }));
  const proxy = SIMULATION_PROXIES[isin];
  if (proxy) fields.push(field('Historique de simulation (proxy)', 'simulation-proxies', { ...proxy, values: getInstrumentReturnValues(isin) }, { sourceUrls: [proxy.source], checkedAt: '2026-10-03', asOf: '2025-12-31', periodStart: '2020-01-01', periodEnd: '2025-12-31', currency: proxy.currency, scope: proxy.scope, method: 'Proxy documenté, distinct de la part exacte', note: proxy.note }));
  const reviewed = REVIEWED_PERFORMANCE_META[isin];
  const candidateReturns = evidence?.sourceKind==='adjusted-market-price' ? null : AUTOMATED_PERFORMANCE[isin] ? AUTOMATED_PERFORMANCE[isin].values : reviewed ? (evidence.values.some(Number.isFinite) ? evidence.values : null) :
    proxy ? VERIFIED_RETURNS[isin].values : PORTFOLIO_RETURN_EVIDENCE[isin] || evidence ? getInstrumentReturnValues(isin) : null;
  const returns = candidateReturns?.some(Number.isFinite) ? candidateReturns : null;
  if (returns) {
    fields.push(field('Rendements 2020–2025', 'instrument-returns', returns, reviewed || AUTOMATED_PERFORMANCE[isin] ? {
      source: evidence.source, checkedAt: evidence.checkedAt, modifiedAt: evidence.modifiedAt, currency: evidence.currency,
      asOf: '2025-12-31', periodStart: `${2020 + returns.findIndex(Number.isFinite)}-01-01`, periodEnd: '2025-12-31',
      scope, method: 'Rendements calendaires NAV de la part exacte ; années complètes uniquement', note: evidence.note,
    } : { ...PORTFOLIO_RETURN_EVIDENCE[isin], ...(proxy ? {sourceUrls:[VERIFIED_RETURNS[isin].source], scope:`Part exacte ${isin}`} : {}), ...(evidence?.currency ? { currency: evidence.currency } : {}), ...(evidence?.source ? { source: evidence.source } : {}), scope }));
  }
  const live = LIVE_PERFORMANCE[isin];
  if (live?.values.some(Number.isFinite) && (live.periodStart !== '2020-01-01' || live.periodEnd !== '2025-12-31')) fields.push(field(`Rendements ${live.calendarYears[0]}–${live.calendarYears.at(-1)}`, 'automated-etf', live.values, { ...live, asOf: live.periodEnd, scope, method: live.method }));
  if (reviewed?.portfolioHistoryBasis === 'proxy' && !AUTOMATED_PERFORMANCE[isin]?.values.some(Number.isFinite)) fields.push(field('Historique de simulation 2020–2025', 'instrument-returns', getInstrumentReturnValues(isin), { ...PORTFOLIO_RETURN_EVIDENCE[isin], scope: `${scope} ; proxy de simulation, distinct du rendement réel de la part` }));
  for (const observation of evidence?.observations ?? []) fields.push(field(`Performance ${observation.label}`, AUTOMATED_ETF[isin]?.performance ? 'automated-etf' : 'instrument-performance-review', observation, { source: evidence.source, checkedAt: evidence.checkedAt, asOf: observation.asOf, currency: evidence.currency, scope, method: 'Rendement cumulé NAV sur la période explicitement publiée', note: evidence.note }));
  for(const observation of reviewed?.archivedObservations??[])fields.push(field(`Archive performance · ${observation.label}`, 'instrument-performance-review', observation, {source:reviewed.source,checkedAt:null,reviewedAt:reviewed.qualificationHold.checkedAt.slice(0,10),sourceReason:reviewed.qualificationHold.reason,asOf:observation.asOf,currency:reviewed.currency,scope,sourceStatus:'archive-unverifiable',method:'Relevé historique non recertifié pour la part exacte',note:`Relevé initial daté du ${reviewed.checkedAt}. ${reviewed.qualificationHold?.reason}`}));
  if(reviewed?.qualificationHold&&!LIVE_PERFORMANCE[isin]?.observations?.length)fields.push({...field('Rendements glissants à qualifier','instrument-performance-review',reviewed.qualificationHold.reason,{...reviewed.qualificationHold,checkedAt:reviewed.qualificationHold.checkedAt.slice(0,10),scope,method:'Contrôle de la table émetteur : identité de la part distribuante non qualifiée'}),qualificationMissing:reviewed.qualificationHold.reason});
  if (evidence?.availability) fields.push(field('Disponibilité de la performance', 'instrument-performance-review', evidence.note, { source: evidence.source, checkedAt: evidence.checkedAt, modifiedAt: evidence.modifiedAt, currency: evidence.currency, dateStatus: 'not-published', scope, method: evidence.availability === 'source-conflict' ? 'Sources émetteur divergentes ; chiffre exclu en attente de confirmation' : 'Absence de performance réelle publiée ; aucun proxy attribué à la part' }));
  if (COMPARATOR_RETURNS_BY_ISIN[isin]) fields.push(field('Rendements 2023–2025 du comparateur', 'instrument-comparator-returns', COMPARATOR_RETURNS_BY_ISIN[isin], { ...COMPARATOR_RETURN_EVIDENCE[isin], asOf: '2025-12-31', periodStart: '2023-01-01', periodEnd: '2025-12-31', scope, note: COMPARATOR_RETURN_EVIDENCE[isin]?.note ?? 'Source individuelle non renseignée ; ne pas confondre les devises.' }));
  return { id: isin, type: 'instrument', name: identity.name, aliases: [isin, ...Object.values(identity.labels ?? {}), ...listings.map((x) => x.ticker)], consumers: uses.get(isin) ?? [], fields };
}
function index(id, history) {
  const current = CURRENT_INDEX_SNAPSHOTS[id];
  const quarterly = AUTOMATED_INDICES[id]?.holdings;
  const quarterlyFields = quarterly ? [field(`Positions trimestrielles · ${quarterly.asOf}`, 'automated-indices', quarterly, {
    ...quarterly.source, asOf: quarterly.asOf, scope: `Indice exact ${id} ; dix principales lignes trimestrielles`,
    method: quarterly.method, note: 'La date de ces positions est indépendante de celle des pays, secteurs et effectifs mensuels.'
  })] : [];
  const values = [...Object.values(history), ...(current ? [current] : [])];
  const consumers = PRACTICAL_TOPICS.some(t=>t.indices?.includes(id)) ? [{tool:'Fiches pratiques',path:'/fiches-pratiques'}] : [];
  if (SHEETS.some((s) => values.includes(s.indexFacts)) || COMPANY_INDEX_IDS.includes(id)) consumers.push({ tool: 'Coulisses des indices', path: '/tweets-factsheets' });
  if ([...ALLOCATION_CASE_DEFINITIONS, ...INDEX_DECISION_CASE_DEFINITIONS].some(x => x.left === id || x.right === id)) consumers.push({ tool: 'Banque de tweets', path: '/banque-tweets' });
  return { id, type: 'index', name: values[0].index,
    aliases: [id, ...FAMILIES.flatMap((f) => f.indices.filter((x) => values.includes(x.indexFacts)).map((x) => x.name))], consumers,
    fields: [...quarterlyFields, ...(current ? [field(`Composition courante · ${current.snapshot}`, 'index-facts', current, current.metadata)] : []), ...Object.entries(history).sort(([a], [b]) => /^\d{4}/.test(a) !== /^\d{4}/.test(b) ? (/^\d{4}/.test(a) ? -1 : 1) : b.localeCompare(a)).map(([key, facts]) => field(`Photographie · ${facts.snapshot ?? facts.metadata?.asOf ?? key}`, 'index-facts', facts, { ...facts.metadata, note: `${facts.provenance} Clé : ${key}` })), ...Object.entries(INDEX_RETURNS[id] ?? {}).map(([date, series]) => field(`Rendements d’indice · ${date}`, 'index-returns', series, series.metadata))] };
}
export const DATA_CATALOG = Object.freeze([
  ...Object.entries(practicalReferences.sources).map(([id,o])=>({id:`practical:${id}`,type:'reference',name:o.label,aliases:[id,'fiches pratiques'],consumers:[{tool:'Fiches pratiques',path:'/fiches-pratiques'}],fields:[{label:'Document officiel et état de collecte',registry:'src/data/automated-practical-sheets.json',value:o,metadata:normalizeEvidence({sourceUrl:o.sourceUrl,checkedAt:o.checkedAt,asOf:o.publishedAt,scope:o.contractIds?.join(', ') ?? o.label,method:'Document officiel contrôlé automatiquement ; changement de contenu signalé pour revue éditoriale.'})}]})),
  ...['fonds_euros', 'scpi'].map(id => {
    const asset = ASSETS.find(a => a.id === id)
    const current = Object.entries(ECONOMIC_OBSERVATIONS.benchmarks ?? {}).filter(([key]) => key.startsWith(`${id}:`)).map(([,o]) => o).sort((a,b) => b.year-a.year)
    return { id: `economic:${id}`, type: 'series', name: asset.name, aliases: [id, 'rendement annuel', id === 'scpi' ? 'ASPIM RGI' : 'ACPR'],
      consumers: [{tool: 'Générateur de portefeuilles', path: '/generateur-portefeuilles'}],
      fields: current.map(o => field(`Rendement annuel · ${o.year}`, 'economic-data', economicCalendar(id,asset.r)[o.year],
        {sourceUrl:o.sourceUrl,checkedAt:o.checkedAt,periodStart:`${o.year}-01-01`,periodEnd:`${o.year}-12-31`,dateStatus:'not-applicable',currency:'EUR',scope:asset.name,method:o.method,note:asset.confidenceNote})) }
  }),
  { id: 'economic:livret-a', type: 'series', name: 'Taux légal du Livret A', aliases: ['Livret A','taux réglementé'],
    consumers: [{tool:'Calculateur',path:'/calculateur-investissement'},{tool:'Performance depuis',path:'/performance-depuis'},{tool:'Fiches pratiques',path:'/fiches-pratiques'}],
    fields: Object.values(ECONOMIC_OBSERVATIONS.savings ?? {}).map(o => field(`Taux applicable · ${o.effectiveAt}`, 'economic-data', LIVRET_A[o.effectiveAt.slice(0,7)],
      {sourceUrl:o.sourceUrl,checkedAt:o.checkedAt,asOf:o.effectiveAt,scope:'Taux légal annuel du Livret A',currency:'EUR',method:'Taux réglementé publié par la Banque de France, date d’effet conservée ; historique antérieur documenté dans market-history.js'})) },
  ...[...INSURANCE, ...ARCHIVED_INSURANCE].map(record => ({id: `insurance:${record.id}`, type: 'insurance', name: record.name + (record.availability ? ' · archive' : ''), aliases: [record.id, record.insurer, 'assurance-vie', 'fonds euros'],
    consumers: record.availability ? [] : [{tool: 'Présentation d’assurance-vie', path: '/presentations?famille=insurance'},{tool:'Fiches pratiques',path:'/fiches-pratiques'}],
    fields: [...(record.availability ? [field('Fiche archivée — successeur à qualifier', 'insurance', record.availability.statement, {sourceUrl:record.availability.sourceUrl,checkedAt:record.availability.checkedAt,scope:record.name,method:'Succession explicitement annoncée par le distributeur ; anciennes conditions conservées pour historique uniquement.'})] : []), ...['fees', 'access', 'supports', 'euroFunds'].map(key => field({fees:'Frais du contrat', access:'Versements minimums', supports:'Supports proposés', euroFunds:'Fonds euros, rendements et conditions'}[key], 'insurance', record[key],
      {sourceUrls: key === 'euroFunds' ? record.euroFunds.flatMap(fund => fund.sourceUrls ?? [fund.sourceUrl]) : (record[key].sourceUrls ?? [record[key].sourceUrl]), checkedAt: record.checkedAt, asOf: null, scope: `${record.name} · gestion libre`, currency: 'EUR', method: 'Publication officielle du distributeur ; rendements des fonds euros par année, nets de gestion et avant prélèvements sociaux et fiscaux ; collecte distincte de la date des données.'})), ...record.euroFunds.filter(fund=>fund.allocationEvidence?.status==='not-published').map(fund=>({
        ...field(`${fund.name} · Allocation maximale à confirmer`, 'insurance', fund.allocationEvidence.reason, {sourceUrls:fund.allocationEvidence.sourceUrls,checkedAt:fund.allocationEvidence.checkedAt,scope:`${record.name} · ${fund.name} · gestion libre`,method:'Vérification de la notice et des sources publiques ; maximum explicite non publié.'}),
        qualificationMissing:fund.allocationEvidence.reason,
      }))]})),
  ...PRESENTATION_ACTORS.map(record => ({ id: `actor:${record.id}`, type: 'actor', name: record.name, aliases: [record.family, record.id, ...record.offers.map(offer=>offer.name)],
    consumers: [{ tool: 'Présentations', path: `/presentations?famille=${record.family}` }],
    fields: [...record.offers.flatMap(offer => [
      ...Object.values(offer.fields).map(term => ({archived:record.activity?.status==='ceased',...field(`${offer.name} · ${term.label}`, 'presentation-actors', term.value,
        {sourceUrls: term.sourceUrls ?? [term.sourceUrl], asOf: term.effectiveAt ?? null, checkedAt:term.checkedAt, scope:offer.scope, method:`Conditions publiques collectées ; explication de l’acteur éditoriale. ${offer.availability?.status === 'closed' ? 'Souscriptions clôturées selon la publication de l’acteur.' : 'Disponibilité de souscription non établie.'}`, note:offer.warnings.join(' ')} )})),
      ...(offer.projectRequirements?.length ? [field(`${offer.name} · Conditions variables selon le projet`, 'presentation-actors', offer.projectRequirements.join(' '), {sourceUrls:record.sources.map(source=>source.url),checkedAt:record.checkedAt,scope:offer.scope,method:'Fiche générale de plateforme ; conditions contractuelles propres à chaque opération, sans projet sélectionné.'})] : []),
      ...(offer.missing.length ? [{...field(`${offer.name} · À compléter`, 'presentation-actors', offer.missing.join(' ; '), {sourceUrls:record.sources.map(source=>source.url),checkedAt:record.checkedAt,scope:offer.scope,method:'Informations non qualifiées, à obtenir dans la documentation du véhicule.'}), qualificationMissing:offer.missing.join(' ; ')}] : []),
    ]), ...(record.activity?.status==='ceased' ? [field('Statut de l’activité', 'presentation-actors', record.activity, {sourceUrls:record.activity.sources.map(s=>s.url),checkedAt:record.activity.checkedAt,asOf:record.activity.judgmentAt,scope:record.name,method:'Avis officiel de cessation ; date du jugement distincte du contrôle et des anciennes conditions.'})] : [])] })),
  ...SCPI.map(record => ({ id: `scpi:${record.id}`, type: 'scpi', name: record.name, aliases: [record.id, 'immobilier', 'SCPI'],
    consumers: [{ tool: 'Présentation de SCPI', path: '/presentations?famille=scpi' }],
    fields: [...['snapshot', 'annual', 'price', 'conditions', ...(record.priceHistory ? ['priceHistory'] : [])].map(key => field({snapshot: 'Pays et secteurs', annual: 'Taux de distribution annuels', price: 'Prix de souscription', conditions: 'Frais et conditions', priceHistory:'Historique daté du prix de souscription'}[key], 'scpi', record[key],
      { sourceUrls: record[key].sourceUrls ?? [record[key].sourceUrl], asOf: record[key].asOf ?? null, checkedAt: record[key].checkedAt ?? record.checkedAt, scope: `${record.name} · détention directe en pleine propriété`, currency: 'EUR', method: 'Publication officielle de la société de gestion ; distributions distinctes de la performance totale ; date du relevé distincte de la date des données.' })), ...Object.values(record.portfolio ?? {}).map(row => field(row.label, 'scpi', row.value, {sourceUrl:row.sourceUrl,asOf:row.asOf,checkedAt:record.checkedAt,scope:row.basis ?? `${record.name} · patrimoine de la SCPI`,method:'Indicateur publié par la société de gestion ; date propre conservée, actifs, immeubles, locataires et baux distingués.'}))] })),
  ...HOUSEHOLD_STATISTICS.map((value) => ({ id: `household:${value.id}`, type: 'household', name: value.title,
    aliases: [value.id, value.category, value.headline, 'Insee', 'ménages'], consumers: [{ tool: 'La France en 100 ménages', path: `/france-100-menages` }],
    fields: [field('Statistique de ménages', 'household-statistics', value, value.metadata)] })),
  ...Object.entries(INSTRUMENTS_BY_ISIN).map(([isin, identity]) => instrument(isin, identity)),
  ...Object.entries(INDEX_FACTS).map(([id, history]) => index(id, history)),
  ...Object.entries(INDEX_RETURNS).filter(([id]) => !INDEX_FACTS[id]).map(([id, history]) => ({
    id, type: Object.values(history)[0].performance.kind === 'actif' ? 'series' : 'index',
    name: Object.values(history)[0].performance.detail.split(' · ')[0], aliases: [id],
    consumers: [],
    fields: Object.entries(history).map(([date, series]) => field(`Rendements · ${date}`, 'index-returns', series, series.metadata)),
  })),
  ...Object.entries(HISTORY).map(([id, value]) => ({ id: `history:${id}`, type: 'series', name: value.name ?? value.label ?? id, aliases: [id], consumers: [{ tool: 'Calculateur', path: '/calculateur-investissement' }, { tool: 'Performance depuis', path: '/performance-depuis' }, ...(!SPARSE_MONTHLY_DATA_IDS.has(id) && (value.priceMethod !== 'adjusted' || value.anniversaryPoints) && value.priceUnit !== 'points' ? [{ tool: 'Il y a X ans', path: '/il-y-a-x-ans' }] : []), ...(MONTHLY_MARKET_STORY_IDS.includes(id) ? [{ tool: 'Faits marquants', path: '/faits-marquants-marches' }] : [])], fields: [field('Série historique', 'market-history', value, { ...SUPPORTING_EVIDENCE[`history:${id}`], scope: id, currency: value.currency })] })),
  ...Object.entries(BROKER_TARIFFS).map(([id, observation]) => ({
    id: `broker:${id}`, type: 'broker', name: {bourso:'BoursoBank · Découverte',fortuneo:'Fortuneo · Starter',xtb:'XTB',saxo:'Saxo · Classic',caidf:'Crédit Agricole Île-de-France',ibkr:'Interactive Brokers · France',tr:'Trade Republic',bd:'Bourse Direct'}[id], aliases: [id, 'courtage', 'tarifs'],
    consumers: [{tool: 'Comparateur de courtiers', path: '/comparatif-courtiers'}],
    fields: [field('Tarif courtage automatisé', 'broker-tariffs', {...observation.values, description: brokerTariffCopy(id).full}, observation), ...Object.entries(observation.fields ?? {}).map(([key,o]) => field(`Paramètre automatisé · ${key}`, 'broker-tariffs', {...o.values,description:o.copy.full},o)), ...Object.entries(observation.profile ?? {}).map(([key,o]) => field(`Conditions officielles · ${key}`, 'broker-tariffs', {available:o.available,status:o.status,description:o.copy.full,...(o.conversion ? {conversion:o.conversion} : {})}, {...o,sourceUrls:o.checkedSources.map(s=>s.sourceUrl),dateStatus:'not-published'})), ...Object.entries(brokerProfile(id)).filter(([,o]) => o.reviewed).map(([key,o]) => field(`Recoupement externe · ${key}`, 'broker-tariffs', {available:o.available,status:o.status,description:o.copy.full}, {...o,sourceUrls:o.refs.map(r=>r.sourceUrl),dateStatus:'not-published',note:`Sources externes relues ; revue à renouveler après le ${o.reviewUntil}`}))],
  })),
  ...TERMES.map((value) => ({ id: `lexicon:${value.id}`, type: 'lexicon', name: value.titre ?? value.nom ?? value.title ?? value.terme ?? value.id, aliases: [value.id], consumers: [{ tool: 'Fiche lexique', path: '/fiche-lexique' }], fields: [field('Définition', 'financial-lexicon', value, { ...SUPPORTING_EVIDENCE[`lexicon:${value.id}`], dateStatus: 'not-applicable', scope: value.id }),
    ...(REGULATORY_LEXICON_SOURCES[value.id] ?? []).map(key => {
      const o = REGULATORY_OBSERVATIONS[key];
      return field(`Paramètres officiels · ${o.title}`, 'regulatory-data', o.values, {...o, asOf: o.publishedAt, note: 'Date de publication de la fiche officielle, distincte de la date d’effet juridique. Régime général ; exceptions décrites dans la définition.'});
    }),
  ] })),
]);
import { searchCatalog } from './catalog-search.js'
export { exportDataRecord } from './catalog-search.js'
export function searchData(query = '', type = 'all') { return searchCatalog(DATA_CATALOG, query, type) }
