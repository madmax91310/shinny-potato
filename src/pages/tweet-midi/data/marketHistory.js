// Formats "Anniversaire" et "Performance depuis" (Tweet Midi) — aucune donnée de prix dupliquée
// ici : tout vient directement de la bibliothèque déjà vérifiée du Calculateur d'investissement
// (src/data/market-history.js), via les mêmes fonctions d'interpolation que le
// Calculateur utilise lui-même (src/pages/investment-calculator/lib.js). Si cette bibliothèque
// est mise à jour (nouveaux points, nouvel actif), ces deux formats suivent automatiquement.
import {
  ASSETS, ASSET_ORDER, LIVRET_A, INFLATION, LATEST_YM, getAssetMinDate, SPARSE_MONTHLY_DATA_IDS,
} from '../../../data/market-history.js';
import { ymIndex, indexToYm, interpolatePrice, computeBenchmarkSeries, pct } from "../../investment-calculator/lib.js";

const LATEST_YEAR = Number(LATEST_YM.slice(0, 4));

// getAssetMinDate (plancher LVMH pré-2020-12 non vérifié) déplacé le 04/09/2026 dans
// src/data/market-history.js — c'était la seule protection contre les points LVMH "NON
// VÉRIFIÉS... valeurs illustratives" jusqu'à cette date, désormais partagée avec le Calculateur
// lui-même plutôt que dupliquée ici. Réexportée pour ne rien casser côté appelants existants.
export { getAssetMinDate };

function assetPoints(assetId) {
  return ASSETS[assetId].points;
}

// Dernier point réellement présent en base pour CET actif précis — jamais supposé identique à
// LATEST_YM du Calculateur : cette fonction reste nécessaire même après l'ajout du point 2026-08
// de stoxx600/sp500/msciWorld le 05/09/2026 (avant ça, ces 3 s'arrêtaient à 2026-07), car un
// nouvel écart de ce type peut réapparaître à tout mois futur non encore comblé.
export function getAssetMaxDate(assetId) {
  const points = assetPoints(assetId);
  return points[points.length - 1].date;
}

// Années civiles pour lesquelles cet actif a au moins un point réellement vérifié (donc jamais
// une année antérieure au plancher lvmh ci-dessus, même si data.js contient des points bruts
// avant cette date).
export function getAssetAvailableYears(assetId) {
  const minDate = getAssetMinDate(assetId);
  const minIdx = ymIndex(minDate);
  const years = new Set();
  assetPoints(assetId).forEach((p) => {
    if (ymIndex(p.date) >= minIdx) years.add(Number(p.date.slice(0, 4)));
  });
  return [...years].sort((a, b) => a - b);
}

// Prix interpolé à une date donnée, borné au plancher vérifié (jamais résolu avant lui, même si
// interpolatePrice accepterait une date antérieure et renverrait par défaut le premier point brut
// — potentiellement une des valeurs "NON VÉRIFIÉES" de LVMH).
export function getHistoricalPrice(assetId, ym) {
  const minDate = getAssetMinDate(assetId);
  const clampedYm = ymIndex(ym) < ymIndex(minDate) ? minDate : ym;
  return interpolatePrice(ASSETS[assetId].anniversaryPoints ?? assetPoints(assetId), clampedYm);
}

// Le point réel le plus proche (à la date exacte ou avant) du premier jour de l'année donnée —
// jamais une date de janvier supposée si l'actif n'a pas de point ce mois-là (cf. contrainte du
// brief : jamais estimer une année sans donnée réelle). Pour une année dont le premier point réel
// tombe en cours d'année (ex. Ethereum 2017 → premier mois complet 2017-12), on utilise CE point précis,
// jamais une valeur de janvier interpolée à partir de plus tard.
export function getFirstRealPointOfYear(assetId, year) {
  const points = assetPoints(assetId);
  const minDate = getAssetMinDate(assetId);
  const minIdx = ymIndex(minDate);
  const inYear = points.filter((p) => p.date.slice(0, 4) === String(year) && ymIndex(p.date) >= minIdx);
  if (inYear.length === 0) return null;
  return inYear.reduce((min, p) => (ymIndex(p.date) < ymIndex(min.date) ? p : min), inYear[0]);
}

// Dernier point réel de l'actif (jamais LATEST_YM du Calculateur, qui est une borne globale — cf.
// getAssetMaxDate ci-dessus).
export function getLastRealPoint(assetId) {
  const points = assetPoints(assetId);
  return points[points.length - 1];
}

// Symétrique de getFirstRealPointOfYear : le point réel le plus proche de la FIN de l'année
// donnée (jamais un 31 décembre supposé si l'actif n'a pas de point ce mois-là). Sert de valeur
// de clôture d'année pour le détail annuel du format Performance depuis (cf. getAnnualReturns).
export function getLastRealPointOfYear(assetId, year) {
  const points = assetPoints(assetId);
  const minDate = getAssetMinDate(assetId);
  const minIdx = ymIndex(minDate);
  const inYear = points.filter((p) => p.date.slice(0, 4) === String(year) && ymIndex(p.date) >= minIdx);
  if (inYear.length === 0) return null;
  return inYear.reduce((max, p) => (ymIndex(p.date) > ymIndex(max.date) ? p : max), inYear[0]);
}

// Années de départ valides pour le détail annuel du format Performance depuis (cf.
// getAnnualReturns juste après) : la ligne de CHAQUE année affichée compare sa propre clôture à
// celle de l'année précédente — donc l'année de départ elle-même a besoin d'une clôture vérifiée
// pour l'année N-1, sinon sa ligne ne peut pas être calculée sans deviner un point (ex. LVMH :
// le plancher vérifié est 2020-12, donc 2020 n'a pas de clôture N-1 vérifiée et n'est pas une
// année de départ valide — 2021 l'est). Exclut aussi l'année en cours (celle de LATEST_YM) :
// elle n'a qu'un point partiel, jamais une vraie clôture annuelle.
export function getAnnualReturnStartYears(assetId) {
  return getAssetAvailableYears(assetId).filter(
    (year) => year < LATEST_YEAR && annualClose(assetId, year - 1) && annualClose(assetId, year),
  );
}

function annualClose(assetId, year) {
  const point = getLastRealPointOfYear(assetId, year);
  return point?.date === `${year}-12` && Number.isFinite(point.price) && point.price > 0 ? point : null;
}

// Détail annuel réel depuis `startYear` (inclus) jusqu'à la dernière année civile complète —
// jamais l'année en cours (cf. getAnnualReturnStartYears). Chaque ligne : clôture de fin d'année
// N vs clôture de fin d'année N-1, jamais une variation calculée sur des points partiels ou
// interpolés au-delà de ce que l'actif couvre réellement.
export function getAnnualReturns(assetId, startYear) {
  const out = [];
  for (let year = startYear; year <= LATEST_YEAR - 1; year++) {
    const prev = annualClose(assetId, year - 1);
    const cur = annualClose(assetId, year);
    // A cumulative return must never silently skip an unavailable year.
    if (!prev || !cur) break;
    out.push({ year, pct: ((cur.price - prev.price) / prev.price) * 100, startDate: prev.date, endDate: cur.date });
  }
  return out;
}

// Format A ("Il y a X ans") : mois de référence décalé depuis le mois courant, jamais un
// nombre d'années fixe supposé disponible pour tous les actifs — filtré au plancher vérifié de
// CET actif. `today` est un objet Date réel (jamais codé en dur : passé par l'appelant à partir
// de `new Date()` au moment du clic, pour rester exact indéfiniment).
export function getValidYearsBackOptions(assetId, today) {
  const minDate = getAssetMinDate(assetId);
  const minIdx = ymIndex(minDate);
  const options = [];
  for (let yearsBack = 1; yearsBack <= 10; yearsBack++) {
    const past = new Date(today.getFullYear() - yearsBack, today.getMonth(), 1);
    const ym = past.getFullYear() + "-" + String(past.getMonth() + 1).padStart(2, "0");
    if (ymIndex(ym) >= minIdx) options.push(yearsBack);
  }
  return options;
}

export function ymForYearsBack(yearsBack, today) {
  const past = new Date(today.getFullYear() - yearsBack, today.getMonth(), 1);
  return past.getFullYear() + "-" + String(past.getMonth() + 1).padStart(2, "0");
}

export function fmtYm(ym, { monthLabels }) {
  const [y, m] = ym.split("-");
  return `${monthLabels[Number(m) - 1]} ${y}`;
}

// Mode Comparatif, Format B uniquement : la date de fin partagée par les deux actifs, pour que la
// fenêtre de comparaison soit rigoureusement identique des deux côtés — jamais la propre dernière
// date de chacun (qui peut différer d'un mois, cf. getAssetMaxDate). Toujours la PLUS ANCIENNE des
// deux fins réelles, jamais une date au-delà de ce que l'un des deux actifs couvre réellement.
export function getSharedEndDate(assetIdA, assetIdB) {
  const a = getAssetMaxDate(assetIdA);
  const b = getAssetMaxDate(assetIdB);
  return ymIndex(a) <= ymIndex(b) ? a : b;
}

// Réutilise directement computeBenchmarkSeries + pct du Calculateur (aucune donnée ni formule
// dupliquée) pour situer la performance Livret A / inflation cumulée sur la même fenêtre
// [startYm, endYm] que l'actif affiché. Base 100 arbitraire : seul le pourcentage final compte.
export function getBenchmarkPerformance(startYm, endYm) {
  const livret = computeBenchmarkSeries(LIVRET_A, startYm, endYm, 100, "lump");
  const inflation = computeBenchmarkSeries(INFLATION, startYm, endYm, 100, "lump");
  return {
    livretPct: pct(livret.finalValue, livret.totalInvested),
    inflationPct: pct(inflation.finalValue, inflation.totalInvested),
  };
}

// Les indices disposent de niveaux officiels ; leur variante doit rester explicite
// dans le sélecteur, la saisie, le tweet et l’image pour ne jamais mélanger Price/TR.
export const ANNIVERSARY_INDEX_VARIANTS = {
  msciAcwiImi: 'Net Return · USD · dividendes nets réinvestis',
  msciAcwi: 'Net Return · USD · dividendes nets réinvestis',
  msciWorldExUsa: 'Net Return · USD · dividendes nets réinvestis',
  cac40: 'Prix · EUR · hors dividendes',
  sp500: 'Total Return · USD · dividendes bruts réinvestis',
  stoxx600: 'Net Return · EUR · dividendes nets réinvestis',
  msciWorld: 'Gross Return · USD · dividendes bruts réinvestis',
  msciEmerging: 'Gross Return · USD · dividendes bruts réinvestis',
  msciWorldSmallCap: 'Gross Return · USD · dividendes bruts réinvestis',
};

export function performanceBasis(assetId) {
  const asset = ASSETS[assetId];
  if (ANNIVERSARY_INDEX_VARIANTS[assetId]) return ANNIVERSARY_INDEX_VARIANTS[assetId];
  if (asset.priceMethod === 'adjusted') return `${asset.currency} · revenus réinvestis`;
  if (assetId === 'or') return `${asset.currency} · moyennes mensuelles du prix de l’or`;
  if (assetId === 'silver') return `${asset.currency} · futures COMEX, hors frais et roulement`;
  if (assetId === 'nasdaq100' || assetId === 'soxx') return `${asset.currency} · hors dividendes`;
  return `${asset.currency} · variation du prix`;
}
const REBASED_INDEX_IDS = new Set(ASSET_ORDER.filter(id => ASSETS[id].priceUnit === 'points'));

// Les séries éparses sont exclues des anniversaires : interpoler entre deux clôtures
// annuelles ne fournit pas un prix mensuel réel. La liste est partagée avec le Calculateur,
// qui bloque leur DCA. Ethereum en est retiré le 30/09/2026 après contrôle des 105 mois
// complets Yahoo ; sa plage commence en décembre 2017. Performance depuis conserve
// les seuls points réels de clôture d’année (getLastRealPointOfYear).
const ANNIVERSAIRE_EXCLUDED_IDS = new Set([...SPARSE_MONTHLY_DATA_IDS, ...ASSET_ORDER.filter(id => ASSETS[id].priceMethod === 'adjusted' && !ASSETS[id].anniversaryPoints)]);

// Performance depuis conserve son comportement historique : pas de niveau d’indice.
export function hasComparableLevel(assetId) {
  return !REBASED_INDEX_IDS.has(assetId);
}

// Liste des actifs exposée aux deux formats — reprend telle quelle celle du Calculateur (même
// ordre, mêmes libellés/icônes), sans dupliquer les prix.
export const MARKET_ASSETS = ASSET_ORDER.map((id) => ({
  id,
  label: ASSETS[id].label,
  tweetPhrase: ASSETS[id].tweetPhrase,
  icon: ASSETS[id].icon,
  currency: ASSETS[id].currency,
  sourceCredit: ASSETS[id].sourceCredit,
  anniversaryVariant: ANNIVERSARY_INDEX_VARIANTS[id],
  priceUnit: ASSETS[id].priceUnit,
}));

// Sous-ensemble de MARKET_ASSETS utilisable par le format Anniversaire (cf.
// ANNIVERSAIRE_EXCLUDED_IDS ci-dessus) — Performance depuis continue d'utiliser MARKET_ASSETS en
// entier, sans restriction.
export const ANNIVERSAIRE_ELIGIBLE_ASSETS = MARKET_ASSETS.filter((a) => !ANNIVERSAIRE_EXCLUDED_IDS.has(a.id));

export { indexToYm };

// La liste explique les absences dans l’interface, sans supprimer les actifs de la base.
export const ANNIVERSAIRE_EXCLUDED_ASSETS = MARKET_ASSETS.filter(a => ANNIVERSAIRE_EXCLUDED_IDS.has(a.id));
