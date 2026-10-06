import { AUTOMATED_ETF, AUTOMATED_PERFORMANCE } from './automated-etf.js';
import { REVIEWED_PERFORMANCE_META } from './instrument-performance-review.js';
import { SIMULATION_PROXIES } from './simulation-proxies.js';
// Rendements 2020–2025 par part (ISIN), repris sans modification du générateur.
// Les commentaires de provenance historiques restent dans src/data/portfolio-assets.js.
// Ce déplacement ne constitue pas une nouvelle vérification des cours.
import { calendarMap, latestCommonYears, HISTORICAL_YEARS } from './annual-window.js';
import { VERIFIED_RETURNS } from './verified-returns.js';

export const PORTFOLIO_RETURNS_BY_ISIN = Object.freeze({
  'LU1834983550': Object.freeze([12.32, 26.65, 9.57, -2.07, -8.16, 31.8]),
  'FR0013411998': Object.freeze([5.36, 10.55, -3.92, 31.24, 22.72, 25.86]),
  'CH0454664001': Object.freeze([303.16, 59.67, -64.27, 155.42, 121.05, -6.34]),
  'DE000A27Z304': Object.freeze([303.16, 55.46, -64.67, 150.42, 120.73, -9.68]),
  'FR0010342592': Object.freeze([74.02, 67.05, -57.69, 110.24, 52.51, 14.97]),
  'FR0010755611': Object.freeze([8.23, 81.38, -31.43, 41.19, 65.62, -0.19]),
  'FR0011871110': Object.freeze([36.07, 36.59, -28.35, 49.32, 33.58, 6.01]),
  'FR0011871128': Object.freeze([8.55, 38.23, -13, 21.68, 32.85, 3.45]),
  'FR0013380607': Object.freeze([-5.11, 31.58, -6.88, 19.9, 0.68, 13.97]),
  'FR0013416716': Object.freeze([23.98, -3.89, -0.54, 13.66, 26.44, 64.8]),
  'FR001400U5Q4': Object.freeze([6.33, 31.07, -12.78, 19.6, 26.6, 6.77]),
  'GB00BJYDH287': Object.freeze([295.13, 65.77, -65.94, 156.24, 122.57, -7.91]),
  'GB00BLD4ZL17': Object.freeze([303.16, 59.67, -64.27, 155.42, 121.05, -6.34]),
  'GB00BLD4ZM24': Object.freeze([469.25, 399.13, -67.5, 90.64, 46.07, -10.97]),
  'IE0000N55FP4': Object.freeze([4.37, 23.72, -22.11, 12.86, 5.7, 16.62]),
  'IE00B0M62X26': Object.freeze([2.87, 6.08, -9.73, 5.87, -0.04, 0.83]),
  'IE00B0M63623': Object.freeze([35.7, 27.47, -29.52, 28.65, 23.92, 31.74]),
  'IE00B14X4Q57': Object.freeze([-0.14, -0.85, -4.28, 3.51, 3.09, 2.3]),
  'IE00B1XNHC34': Object.freeze([140.24, -24.07, -5.61, -20.53, -26.07, 46]),
  'IE00B3F81R35': Object.freeze([2.53, -1.15, -13.86, 8.04, 4.58, 3.13]),
  'IE00B3T9LM79': Object.freeze([2.58, -1.19, -14.11, 8.04, 4.6, 3.06]),
  'IE00B3WJKG14': Object.freeze([42.66, 33.46, -28.43, 57.57, 37.17, 23.76]),
  'IE00B40B8R38': Object.freeze([10.15, 18.02, -1.11, -0.05, 14.28, 3.38]),
  'IE00B42NKQ00': Object.freeze([-34.32, 53.81, 64.81, -1.97, 5.06, 7.99]),
  'IE00B43HR379': Object.freeze([12.96, 25.65, -2.33, 1.71, 2.18, 14.12]),
  'IE00B44Z5B48': Object.freeze([15.7, 18.59, -18.3, 22.01, 17.36, 22.81]),
  'IE00B469F816': Object.freeze([18, -2.5, -20.39, 9.8, 7.62, 33.8]),
  'IE00B4JNQZ49': Object.freeze([-2.2, 34.46, -10.93, 11.65, 30.12, 14.6]),
  'IE00B4K48X80': Object.freeze([-3.17, 25.46, -9.25, 16.14, 8.84, 19.72]),
  'IE00B4KBBD01': Object.freeze([-0.14, 16.94, 1.03, -7.68, 22.7, 15.36]),
  'IE00B4L5Y983': Object.freeze([15.95, 21.9, -18.03, 23.86, 18.7, 21.16]),
  'IE00B4L5YX21': Object.freeze([13.03, 0.92, -15.88, 18.86, 7.47, 25.36]),
  'IE00B4ND3602': Object.freeze([23.9, -3.9, -0.5, 13.7, 26.4, 64.8]),
  'IE00B4WXJJ64': Object.freeze([4.84, -3.53, -18.52, 7.06, 1.75, 0.61]),
  'IE00B53L3W79': Object.freeze([-2.89, 23.98, -9.04, 22.78, 11.54, 21.78]),
  'IE00B53SZB19': Object.freeze([48.2, 27, -32.7, 54.4, 25.3, 20.5]),
  'IE00B579F325': Object.freeze([23.95, -3.9, -0.54, 13.66, 26.44, 64.8]),
  'IE00B5BMR087': Object.freeze([18.02, 28.36, -18.35, 25.92, 24.69, 17.58]),
  'IE00B5W4TY14': Object.freeze([43.5, -8.4, -29.2, 21.8, -22.9, 99.2]),
  'IE00B66F4759': Object.freeze([0.92, 2.97, -9.72, 11.33, 6.67, 4.8]),
  'IE00B8GKDB10': Object.freeze([-0.26, 17.88, -5.74, 11.51, 9.39, 26.4]),
  'IE00B9CQXS71': Object.freeze([-9.17, 15.32, -6.97, 6.93, 7.74, 17.02]),
  'IE00BD6FTQ80': Object.freeze([-3.13, 26.7, 14.9, -8.47, 5.02, 15.39]),
  'IE00BDFL4P12': Object.freeze([-3.11, 26.76, 15.08, -8.36, 5.22, 15.65]),
  'IE00BF4RFH31': Object.freeze([15.83, 15.81, -18.64, 16.02, 7.93, 19.84]),
  'IE00BG0J4C88': Object.freeze([26.79, 16.29, -28.56, 32.54, 16.46, 11.47]),
  'IE00BK5BQT80': Object.freeze([16, 18.3, -18.1, 22, 17.2, 22.6]),
  'IE00BK5BR626': Object.freeze([-0.26, 17.88, -5.74, 11.51, 9.39, 26.4]),
  'IE00BK5BR733': Object.freeze([14.66, -0.66, -17.5, 7.86, 12.06, 25.67]),
  'IE00BK95B138': Object.freeze([7.9, -2.5, -12.6, 4.1, 0.7, 6.2]),
  'IE00BKM4GZ66': Object.freeze([18.35, -0.24, -19.79, 11.58, 7.21, 31.58]),
  'IE00BKPSFC54': Object.freeze([0.12, 15.79, -7.28, 17.16, 9.76, 23.97]),
  'IE00BKPX3K41': Object.freeze([25.1, -8.92, -21.95, 2.3, 11.67, 39.91]),
  'IE00BM8R0J59': Object.freeze([8.76, 10.34, -19, 22.82, 19.13, 9.31]),
  'IE00BMW42413': Object.freeze([11.61, 36.57, -28.76, 35.04, 7.93, 9.64]),
  'IE00BP3QZB59': Object.freeze([-3.9, 20, -10, 19.4, 5.3, 39.6]),
  'IE00BYYHSQ67': Object.freeze([0.12, 15.78, -7.28, 17.16, 9.76, 23.97]),
  'IE00BYZK4552': Object.freeze([38.76, 21.01, -34.17, 38.49, 5.45, 17.39]),
  'IE00BZ163G84': Object.freeze([2.6, -1.1, -13.7, 8, 4.6, 3]),
  'JE00B1VS3770': Object.freeze([23.69, -4.13, -0.81, 13.35, 26.1, 64.36]),
  'LU1437018838': Object.freeze([-16.53, 35.57, -20.34, 6.02, 7.62, -3.43]),
  'LU1681043599': Object.freeze([6.26, 30.94, -12.87, 19.46, 26.33, 6.39]),
  'LU1681045370': Object.freeze([7.98, 4.54, -14.94, 5.97, 14.62, 17.81]),
  'LU1681047236': Object.freeze([-2.93, 23.93, -9.04, 22.74, 11.54, 21.8]),
  'LU1737652823': Object.freeze([-16.53, 35.57, -20.34, 6.02, 7.62, -3.43]),
  'LU1931975079': Object.freeze([2.42, -1.21, -14.15, 7.82, 4.64, 2.99]),
  'LU2970735911': Object.freeze([1.5, 3.1, -9.6, 11.6, 6.8, 4.7]),
  'NL0009690239': Object.freeze([-14.72, 39.21, -21.13, 9.05, 9.44, -0.19]),
  'NL0011683594': Object.freeze([-10.33, 26.94, 15.77, 11.76, 16, 23.78]),
});

export function getInstrumentReturnValues(isin) {
  const calendar = AUTOMATED_ETF[isin]?.performance?.years;
  if (calendar && HISTORICAL_YEARS.every(year => Number.isFinite(calendar[year]))) return HISTORICAL_YEARS.map(year => calendar[year]);
  const proxy = SIMULATION_PROXIES[isin];
  const values = proxy ? proxy.values ?? VERIFIED_RETURNS[proxy.referenceIsin]?.values : VERIFIED_RETURNS[isin]?.values ?? PORTFOLIO_RETURNS_BY_ISIN[isin];
  if (!values) throw new Error(`Rendements absents pour ${isin}`);
  return values;
}

// Les fiches ne publient que les historiques de la part effectivement recoupés.
// Les identifiants et devises sont ceux déjà employés dans annualPerformance.js.
const CARD_SERIES_BY_ISIN = Object.freeze({
  'IE00B0M62X26': { id: 'oblig_inflation', currency: 'EUR' },

  'FR0011871128': { id: 'sp500', currency: 'EUR' },
  'FR0011871110': { id: 'nasdaq100', currency: 'EUR' },
  'LU1681047236': { id: 'eurostoxx50', currency: 'EUR' },
  'IE00BKM4GZ66': { id: 'msci_em', currency: 'USD' },
  'IE00BK5BQT80': { id: 'ftse_allworld_vanguard', currency: 'USD' },
  'IE00BYZK4552': { id: 'sect_robotique', currency: 'USD' },
  'IE00BP3QZB59': { id: 'actions_value', currency: 'USD' },
  'IE00BF4RFH31': { id: 'smallcap_monde', currency: 'USD' },
  'IE00B4WXJJ64': { id: 'oblig_etat_eur', currency: 'EUR' },
  'IE00B66F4759': { id: 'oblig_hy', currency: 'EUR' },
  'IE00B3F81R35': { id: 'oblig_corp_ig', currency: 'EUR' },
  'IE00B4ND3602': { id: 'or_ishares', currency: 'USD' },
});

export function getInstrumentAnnualPerformance(isin) {
  if (AUTOMATED_PERFORMANCE[isin]) return AUTOMATED_PERFORMANCE[isin];
  const reviewed = REVIEWED_PERFORMANCE_META[isin];
  if (reviewed) return { ...reviewed, values: reviewed.values ?? PORTFOLIO_RETURNS_BY_ISIN[isin] };
  if (VERIFIED_RETURNS[isin]) return VERIFIED_RETURNS[isin].values.some(Number.isFinite) ? VERIFIED_RETURNS[isin] : null;
  const card = CARD_SERIES_BY_ISIN[isin];
  return card ? { ...card, values: getInstrumentReturnValues(isin) } : null;
}

// Compléments de devise et de provenance utilisés par les Duels de portefeuilles.
// Ils identifient la part exacte, y compris les cinq parts absentes des Fiches ETF.
export const DUEL_SERIES_BY_ISIN = Object.freeze({
  // Réutilisation du contrôle documenté dans portfolio-assets.js, pas une nouvelle revue externe.
  IE00B9CQXS71: { currency: 'USD', source: 'https://www.ssga.com/library-content/products/fund-docs/etfs/emea/kid-supplement/PRIIPS%20Performance%20file_IE00B9CQXS71.pdf' },
  IE00BK5BR626: { currency: 'USD', source: 'https://fund-docs.vanguard.com/ie00bk5br626-en.pdf' },
  IE00BKPSFC54: { currency: 'USD', source: 'https://www.ishares.com/gls-download/literature/fact-sheet/wqda-ishares-msci-world-quality-dividend-advanced-ucits-etf-fund-fact-sheet-en-gb.pdf' },
  IE00B4JNQZ49: { currency: 'USD', source: 'https://www.ishares.com/uk/individual/en/products/280523/' },
  IE00B4L5Y983: { currency: 'USD', source: 'https://www.ishares.com/gls-download/literature/fact-sheet/swda-ishares-core-msci-world-ucits-etf-fund-fact-sheet-en-gb.pdf' },
  IE00B5BMR087: { currency: 'USD', source: 'https://www.ishares.com/uk/individual/en/products/253743/ishares-core-sp-500-ucits-etf' },
  IE00B44Z5B48: { currency: 'USD', source: 'https://www.ssga.com/uk/en_gb/intermediary/etfs/spdr-msci-acwi-ucits-etf-spyy-gy' },
  IE00B579F325: { currency: 'USD', source: 'https://www.invesco.com/content/dam/invesco/emea/en/product-documents/etf/share-class/factsheet/IE00B579F325_factsheet_en.pdf' },
  LU1437018838: { currency: 'EUR', source: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1437018838/FRA/FRA/INSTITUTIONNEL/ETF/20251231' },
  IE00BKM4GZ66: { source: 'https://www.ishares.com/de/privatanleger/de/literature/fact-sheet/eimi-ishares-core-msci-em-imi-ucits-etf-fund-fact-sheet-de-de.pdf' },
  IE00BK5BQT80: { source: 'https://fund-docs.vanguard.com/ie00bk5bqt80-en.pdf' },
});

export function getInstrumentDuelSeries(isin) {
  const proxy = SIMULATION_PROXIES[isin];
  if (proxy && !latestCommonYears([AUTOMATED_ETF[isin]?.performance?.years ?? {}]).length) return { ...proxy, values: getInstrumentReturnValues(isin), basis: 'proxy' };
  const annual = getInstrumentAnnualPerformance(isin);
  const historicalValues = annual?.calendarYears ? HISTORICAL_YEARS.map(year => annual.years[year] ?? null) : annual?.values;
  const base = historicalValues?.some(Number.isFinite) ? { ...annual, values: historicalValues } : null;
  const supplement = DUEL_SERIES_BY_ISIN[isin];
  const result = base ? { ...supplement, ...base, source: base.source ?? supplement?.source ?? null } :
    supplement?.currency ? { ...supplement, values: getInstrumentReturnValues(isin) } : null;
  // La part Acc Quality Dividend n’a pas d’année 2020 complète ; exclure le proxy Dist.
  return result && isin === 'IE00BKPSFC54' ? { ...result, values: result.values.map((v, i) => i === 0 ? null : v) } : result;
}

// Preserve archive-based getters above. Live simulations use dated year keys.
export function getInstrumentCalendarReturns(isin, fallbackValues, { allowProxy = true } = {}) {
  const record = AUTOMATED_ETF[isin];
  const performance = record?.performance;
  const legacy = getInstrumentAnnualPerformance(isin);
  const proxy = SIMULATION_PROXIES[isin];
  let archive;
  try { archive = fallbackValues ?? getInstrumentReturnValues(isin); } catch { archive = legacy?.values; }
  const actual = performance?.years ?? {};
  const hasFullActualWindow = latestCommonYears([actual]).length > 0;
  const proxyHistory = proxy || REVIEWED_PERFORMANCE_META[isin]?.portfolioHistoryBasis === 'proxy';
  if (proxyHistory && !hasFullActualWindow) {
    if (proxy?.referenceIsin && allowProxy) return getInstrumentCalendarReturns(proxy.referenceIsin, undefined, { allowProxy: false });
    return calendarMap(proxy?.values ?? archive);
  }
  const result = proxyHistory ? {} : calendarMap(archive);
  if (performance?.basis === 'fund' && performance.currency === (legacy?.currency ?? record.currency)) {
    for (const [year, value] of Object.entries(performance.years)) {
      if (/^20\d{2}$/.test(year) && Number.isFinite(value) && value > -100 && Number(year) < new Date().getUTCFullYear()) result[year] = value;
    }
  }
  return result;
}
