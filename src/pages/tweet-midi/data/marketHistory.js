// Formats "Anniversaire" et "Performance depuis" (Tweet Midi) — aucune donnée de prix dupliquée
// ici : tout vient directement de la bibliothèque déjà vérifiée du Calculateur d'investissement
// (src/pages/investment-calculator/data.js), via les mêmes fonctions d'interpolation que le
// Calculateur utilise lui-même (src/pages/investment-calculator/lib.js). Si cette bibliothèque
// est mise à jour (nouveaux points, nouvel actif), ces deux formats suivent automatiquement.
import { ASSETS, ASSET_ORDER, LIVRET_A, INFLATION, LATEST_YM } from "../../investment-calculator/data.js";
import { ymIndex, indexToYm, interpolatePrice, computeBenchmarkSeries, pct } from "../../investment-calculator/lib.js";

const LATEST_YEAR = Number(LATEST_YM.slice(0, 4));

// Un seul actif a une plage réellement utilisable plus courte que ses points bruts : LVMH a des
// points de 2015-01 à 2019-10 explicitement marqués "NON VÉRIFIÉS... valeurs illustratives
// d'origine conservées" dans data.js (cf. commentaire sur l'actif lvmh). On ne les traite jamais
// comme des données réelles ici, même si `interpolatePrice` les utiliserait sans distinction —
// d'où ce plancher dédié, jamais déduit automatiquement de `points[0]`. Premier point réellement
// vérifié : 2020-12.
const VERIFIED_MIN_DATE_OVERRIDES = {
  lvmh: "2020-12",
};

function assetPoints(assetId) {
  return ASSETS[assetId].points;
}

// Premier point réellement vérifié (cf. VERIFIED_MIN_DATE_OVERRIDES ci-dessus).
export function getAssetMinDate(assetId) {
  return VERIFIED_MIN_DATE_OVERRIDES[assetId] ?? assetPoints(assetId)[0].date;
}

// Dernier point réellement présent en base pour CET actif précis — jamais supposé identique à
// LATEST_YM du Calculateur : stoxx600, sp500 et msciWorld s'arrêtent réellement à 2026-07 (pas
// 2026-08) dans leurs points bruts, vérifié à l'implémentation de ce module.
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
  return interpolatePrice(assetPoints(assetId), clampedYm);
}

// Le point réel le plus proche (à la date exacte ou avant) du premier jour de l'année donnée —
// jamais une date de janvier supposée si l'actif n'a pas de point ce mois-là (cf. contrainte du
// brief : jamais estimer une année sans donnée réelle). Pour une année dont le premier point réel
// tombe en cours d'année (ex. Ethereum 2016 → premier point 2016-12), on utilise CE point précis,
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
    (year) => year < LATEST_YEAR && getLastRealPointOfYear(assetId, year - 1) !== null,
  );
}

// Détail annuel réel depuis `startYear` (inclus) jusqu'à la dernière année civile complète —
// jamais l'année en cours (cf. getAnnualReturnStartYears). Chaque ligne : clôture de fin d'année
// N vs clôture de fin d'année N-1, jamais une variation calculée sur des points partiels ou
// interpolés au-delà de ce que l'actif couvre réellement.
export function getAnnualReturns(assetId, startYear) {
  const out = [];
  for (let year = startYear; year <= LATEST_YEAR - 1; year++) {
    const prev = getLastRealPointOfYear(assetId, year - 1);
    const cur = getLastRealPointOfYear(assetId, year);
    if (!prev || !cur) continue;
    out.push({ year, pct: ((cur.price - prev.price) / prev.price) * 100, startDate: prev.date, endDate: cur.date });
  }
  return out;
}

// Format A ("il y a X ans jour pour jour") : décalage réel du mois/jour courant, jamais un
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

// Trois actifs du Calculateur (stoxx600, sp500, msciWorld) sont stockés en indice total-return
// REBASÉ à une valeur arbitraire ("base 10 000 au [date]", cf. commentaires sur ces actifs dans
// investment-calculator/data.js) — un niveau interne qui sert uniquement au calcul de ratio du
// Calculateur, jamais un niveau que l'actif "cote" réellement quelque part. Le format Anniversaire
// demande à l'utilisateur de saisir le niveau ACTUEL réel (vérifié sur Yahoo Finance...) et de le
// comparer au prix historique affiché : pour ces 3 actifs, le prix historique affiché (base 10 000
// rebasée, ex. S&P 500 à ~211 000 en août 2021) n'a rien à voir avec ce qu'on trouve coté ailleurs
// (le vrai S&P 500 valait ~4 500 points à cette date) — comparaison non-sens garantie. Signalé par
// un utilisateur le 29/08/2026 (S&P 500, 5 ans en arrière → 211 265 affiché). Exclus du format
// Anniversaire pour cette raison (cf. ANNIVERSAIRE_ELIGIBLE_ASSETS plus bas) ; restent disponibles
// pour Performance depuis, qui ne compare jamais à une source externe — seul le ratio interne
// compte, valide quelle que soit la base de l'indice. Même règle réutilisée par lib.js pour décider
// si Performance depuis peut afficher les DEUX niveaux de prix bruts (début/fin) en plus du
// pourcentage : pour ces 3 actifs, seul le pourcentage est affiché (cf. hasComparableLevel).
const REBASED_INDEX_IDS = new Set(["stoxx600", "sp500", "msciWorld"]);
const ANNIVERSAIRE_EXCLUDED_IDS = REBASED_INDEX_IDS;

// Un niveau de prix brut n'a de sens à afficher (ex. "Prix en 2015 : 625 $US") que pour un actif
// dont les points sont de vrais prix/indices externes — jamais pour les 3 indices rebasés
// ci-dessus, où le nombre affiché ne correspondrait à rien de vérifiable ailleurs.
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
}));

// Sous-ensemble de MARKET_ASSETS utilisable par le format Anniversaire (cf.
// ANNIVERSAIRE_EXCLUDED_IDS ci-dessus) — Performance depuis continue d'utiliser MARKET_ASSETS en
// entier, sans restriction.
export const ANNIVERSAIRE_ELIGIBLE_ASSETS = MARKET_ASSETS.filter((a) => !ANNIVERSAIRE_EXCLUDED_IDS.has(a.id));

export { indexToYm };
