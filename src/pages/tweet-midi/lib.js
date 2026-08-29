import { VRAI_FAUX } from "./data/vraiFaux.js";
import { DILEMMES, SITUATIONS } from "./data/dilemmes.js";
import { FICHE_LEXIQUE_SUBJECTS, getFicheLexiqueText } from "./data/ficheLexique.js";
import { COMPARATIF_ETF_SUBJECTS, getComparatifEtfText } from "./data/comparatifEtf.js";
import { TERMES, CATEGORY_ORDER } from "../lexique-financier/data.js";
import { MONTHS_FULL } from "../investment-calculator/data.js";
import { fmtEUR, fmtPct, ymIndex } from "../investment-calculator/lib.js";
import {
  MARKET_ASSETS, getAssetAvailableYears, getValidYearsBackOptions, getFirstRealPointOfYear,
  getLastRealPoint, getHistoricalPrice, ymForYearsBack, fmtYm, getSharedEndDate, getBenchmarkPerformance,
} from "./data/marketHistory.js";
import { ANNIVERSAIRE_PUNCHLINES } from "./data/anniversairePunchlines.js";
import { PERFORMANCE_DEPUIS_PUNCHLINES } from "./data/performanceDepuisPunchlines.js";
import { ANNIVERSAIRE_COMPARATIF_PUNCHLINES } from "./data/anniversaireComparatifPunchlines.js";
import { PERFORMANCE_DEPUIS_COMPARATIF_PUNCHLINES } from "./data/performanceDepuisComparatifPunchlines.js";

export const FORMATS = {
  VRAI_FAUX: "vrai-faux",
  DILEMME: "dilemme",
  FICHE_LEXIQUE: "fiche-lexique",
  COMPARATIF_ETF: "comparatif-etf",
  ANNIVERSAIRE: "anniversaire",
  PERFORMANCE_DEPUIS: "performance-depuis",
  ALEATOIRE: "aleatoire",
};

// Mode "Simple" (un actif) vs "Comparatif" (deux actifs) — propre aux formats Anniversaire et
// Performance depuis, au choix de l'utilisateur à chaque génération (jamais un 3e format séparé,
// cf. brief). Portée par chaque item (`item.mode`) pour que l'anti-répétition globale et le mode
// Aléatoire traitent les deux variantes d'un même actif comme des tirages distincts.
export const MODES = {
  SIMPLE: "simple",
  COMPARATIF: "comparatif",
};

export const FORMAT_LABELS = {
  [FORMATS.VRAI_FAUX]: "Vrai ou Faux",
  [FORMATS.DILEMME]: "Dilemme",
  [FORMATS.FICHE_LEXIQUE]: "Fiche lexique",
  [FORMATS.COMPARATIF_ETF]: "Comparatif ETF",
  [FORMATS.ANNIVERSAIRE]: "Il y a X ans",
  [FORMATS.PERFORMANCE_DEPUIS]: "Performance depuis",
  [FORMATS.ALEATOIRE]: "Aléatoire (tous formats)",
};

// Ancrée une seule fois au chargement du module (donc à chaque ouverture/rechargement de page,
// jamais codée en dur) : sert à déterminer quels décalages "il y a X ans" restent dans la plage
// réellement couverte par chaque actif. Le prix "actuel" du Format A, lui, n'est jamais dérivé de
// cette date — il est saisi manuellement à chaque génération (cf. buildAnniversaireText).
const TODAY = new Date();

// Sentinelle pour "pas de sujet précis choisi à l'étape 2" — ne collisionne avec aucun id réel
// (termes du lexique, situations de dilemme, thématiques ETF).
export const SUBJECT_ALEATOIRE = "aleatoire";

// Questions d'engagement génériques, piochées pour clore un tweet "Vrai ou Faux" (optionnel,
// cf. brief). Pas de pool par item — un seul pool partagé suffit pour ce format court.
const QUESTIONS_ENGAGEMENT = [
  "Tu le savais ?",
  "Tu l'aurais deviné ?",
  "Ça te surprend ?",
  "Tu connaissais cette règle ?",
  "Vrai ou faux, t'étais sûr de toi ?",
];

// ── Pools par format ──────────────────────────────────────────────────────────────────────
// Chaque entrée porte son format d'origine pour permettre le filtrage par format ET
// l'anti-répétition globale (même pool d'ids, cf. pickNext). Les formats "Fiche lexique" et
// "Comparatif ETF" ne dupliquent aucune donnée : ce sont de simples enveloppes autour des ids
// déjà définis dans le Lexique financier et le Générateur de tweets ETF, résolues à l'affichage
// via getFicheLexiqueText / getComparatifEtfText.
const POOL_VRAI_FAUX = VRAI_FAUX.map((item) => ({ ...item, format: FORMATS.VRAI_FAUX }));
const POOL_DILEMME = DILEMMES.map((item) => ({ ...item, format: FORMATS.DILEMME }));
const POOL_FICHE_LEXIQUE = TERMES.map((t) => ({ id: `fiche:${t.id}`, format: FORMATS.FICHE_LEXIQUE, termeId: t.id }));
const POOL_COMPARATIF_ETF = COMPARATIF_ETF_SUBJECTS.map((t) => ({
  id: `comparatif:${t.id}`,
  format: FORMATS.COMPARATIF_ETF,
  themeId: t.id,
}));
// Format A ("Il y a X ans"), mode Simple : une entrée par (actif, nombre d'années en arrière)
// réellement valide pour CET actif à la date de chargement de la page (cf. TODAY ci-dessus et
// getValidYearsBackOptions dans marketHistory.js — jamais 1..10 supposé pour tous, certains
// actifs ont une plage réelle plus courte, ex. LVMH limité à 1-5 ans).
const POOL_ANNIVERSAIRE = MARKET_ASSETS.flatMap((asset) =>
  getValidYearsBackOptions(asset.id, TODAY).map((yearsBack) => ({
    id: `anniversaire:${asset.id}:${yearsBack}`,
    format: FORMATS.ANNIVERSAIRE,
    mode: MODES.SIMPLE,
    assetId: asset.id,
    yearsBack,
  }))
);
// Format B ("Performance depuis"), mode Simple : une entrée par (actif, année de départ) parmi
// les années où cet actif a réellement un point vérifié en base (cf. getAssetAvailableYears) —
// jamais une année antérieure au premier point réel de l'actif.
const POOL_PERFORMANCE_DEPUIS = MARKET_ASSETS.flatMap((asset) =>
  getAssetAvailableYears(asset.id).map((year) => ({
    id: `perf-depuis:${asset.id}:${year}`,
    format: FORMATS.PERFORMANCE_DEPUIS,
    mode: MODES.SIMPLE,
    assetId: asset.id,
    year,
  }))
);

// Mode Comparatif des deux formats : une entrée par PAIRE d'actifs distincts (assetIdA/assetIdB,
// ordre d'itération arbitraire — jamais un ordre choisi par l'utilisateur, cf. matchesPair plus
// bas, et l'ordre d'affichage final est décidé à la génération selon la performance) × la valeur
// (années en arrière / année de départ) réellement valide pour LES DEUX actifs à la fois, jamais
// pour un seul (contrainte du brief).
const POOL_ANNIVERSAIRE_COMPARATIF = [];
const POOL_PERFORMANCE_DEPUIS_COMPARATIF = [];
for (let i = 0; i < MARKET_ASSETS.length; i++) {
  for (let j = i + 1; j < MARKET_ASSETS.length; j++) {
    const a = MARKET_ASSETS[i];
    const b = MARKET_ASSETS[j];
    const yearsBackA = new Set(getValidYearsBackOptions(a.id, TODAY));
    getValidYearsBackOptions(b.id, TODAY).forEach((yearsBack) => {
      if (yearsBackA.has(yearsBack)) {
        POOL_ANNIVERSAIRE_COMPARATIF.push({
          id: `anniversaire-cmp:${a.id}:${b.id}:${yearsBack}`,
          format: FORMATS.ANNIVERSAIRE,
          mode: MODES.COMPARATIF,
          assetIdA: a.id,
          assetIdB: b.id,
          yearsBack,
        });
      }
    });
    const yearsA = new Set(getAssetAvailableYears(a.id));
    getAssetAvailableYears(b.id).forEach((year) => {
      if (yearsA.has(year)) {
        POOL_PERFORMANCE_DEPUIS_COMPARATIF.push({
          id: `perf-depuis-cmp:${a.id}:${b.id}:${year}`,
          format: FORMATS.PERFORMANCE_DEPUIS,
          mode: MODES.COMPARATIF,
          assetIdA: a.id,
          assetIdB: b.id,
          year,
        });
      }
    });
  }
}

export const ALL_ITEMS = [
  ...POOL_VRAI_FAUX, ...POOL_DILEMME, ...POOL_FICHE_LEXIQUE, ...POOL_COMPARATIF_ETF,
  ...POOL_ANNIVERSAIRE, ...POOL_PERFORMANCE_DEPUIS,
  ...POOL_ANNIVERSAIRE_COMPARATIF, ...POOL_PERFORMANCE_DEPUIS_COMPARATIF,
];

export function poolForFormat(format, mode = MODES.SIMPLE) {
  if (format === FORMATS.VRAI_FAUX) return POOL_VRAI_FAUX;
  if (format === FORMATS.DILEMME) return POOL_DILEMME;
  if (format === FORMATS.FICHE_LEXIQUE) return POOL_FICHE_LEXIQUE;
  if (format === FORMATS.COMPARATIF_ETF) return POOL_COMPARATIF_ETF;
  if (format === FORMATS.ANNIVERSAIRE) return mode === MODES.COMPARATIF ? POOL_ANNIVERSAIRE_COMPARATIF : POOL_ANNIVERSAIRE;
  if (format === FORMATS.PERFORMANCE_DEPUIS) return mode === MODES.COMPARATIF ? POOL_PERFORMANCE_DEPUIS_COMPARATIF : POOL_PERFORMANCE_DEPUIS;
  return ALL_ITEMS;
}

// ── Sujets d'étape 2, par format ──────────────────────────────────────────────────────────
// Toujours la même forme : un tableau de groupes {categorie, items:[{id,label}]}. `categorie`
// vaut null pour les formats sans regroupement (Dilemme, Comparatif ETF) — l'UI affiche alors
// une liste plate plutôt que des <optgroup>.
const coveredTermIds = new Set(VRAI_FAUX.map((v) => v.sourceTermeId));
export const VRAI_FAUX_SUBJECTS = CATEGORY_ORDER.map((categorie) => ({
  categorie,
  items: TERMES.filter((t) => t.categorie === categorie && coveredTermIds.has(t.id)).map((t) => ({
    id: t.id,
    label: t.titre,
  })),
})).filter((g) => g.items.length > 0);

const DILEMME_SUBJECTS = [{ categorie: null, items: SITUATIONS.map((s) => ({ id: s.id, label: s.label })) }];
const COMPARATIF_ETF_SUBJECTS_FLAT = [{ categorie: null, items: COMPARATIF_ETF_SUBJECTS }];
const MARKET_ASSET_SUBJECTS_FLAT = [
  { categorie: null, items: MARKET_ASSETS.map((a) => ({ id: a.id, label: `${a.icon} ${a.label}` })) },
];

export function getSubjectsForFormat(format) {
  if (format === FORMATS.VRAI_FAUX) return VRAI_FAUX_SUBJECTS;
  if (format === FORMATS.DILEMME) return DILEMME_SUBJECTS;
  if (format === FORMATS.FICHE_LEXIQUE) return FICHE_LEXIQUE_SUBJECTS;
  if (format === FORMATS.COMPARATIF_ETF) return COMPARATIF_ETF_SUBJECTS_FLAT;
  if (format === FORMATS.ANNIVERSAIRE) return MARKET_ASSET_SUBJECTS_FLAT;
  if (format === FORMATS.PERFORMANCE_DEPUIS) return MARKET_ASSET_SUBJECTS_FLAT;
  return [];
}

// Étape 3, propre aux formats Anniversaire ("années en arrière") et Performance depuis ("année de
// départ") — dépend du/des sujet(s) (actif(s)) choisi(s) à l'étape 2.
// - Mode Simple : un actif précis restreint aux valeurs valides pour LUI ; "Aléatoire" propose
//   l'union de toutes les valeurs valides pour au moins un actif.
// - Mode Comparatif : filtre sur la paire (les deux sujets, un seul, ou aucun si les deux restent
//   "Aléatoire") — cf. matchesPair. La combinaison finale est de toute façon revalidée au tirage
//   (pickForSelection), donc une option listée ici reste toujours atteignable.
export function getSecondaryOptionsForFormat(format, mode, subjectId, subjectIdB) {
  const pool = poolForFormat(format, mode);
  const isComparatif = mode === MODES.COMPARATIF;
  const filtered = isComparatif
    ? pool.filter((it) => matchesPair(it, subjectId, subjectIdB))
    : subjectId && subjectId !== SUBJECT_ALEATOIRE
      ? pool.filter((it) => matchesSubject(it, subjectId))
      : pool;
  if (format === FORMATS.ANNIVERSAIRE) return [...new Set(filtered.map((it) => it.yearsBack))].sort((a, b) => a - b);
  if (format === FORMATS.PERFORMANCE_DEPUIS) return [...new Set(filtered.map((it) => it.year))].sort((a, b) => a - b);
  return [];
}

function matchesSubject(item, subjectId) {
  if (item.format === FORMATS.VRAI_FAUX) return item.sourceTermeId === subjectId;
  if (item.format === FORMATS.DILEMME) return item.situationId === subjectId;
  if (item.format === FORMATS.FICHE_LEXIQUE) return item.termeId === subjectId;
  if (item.format === FORMATS.COMPARATIF_ETF) return item.themeId === subjectId;
  if (item.format === FORMATS.ANNIVERSAIRE) return item.assetId === subjectId;
  if (item.format === FORMATS.PERFORMANCE_DEPUIS) return item.assetId === subjectId;
  return false;
}

function matchesSecondary(item, secondaryId) {
  if (item.format === FORMATS.ANNIVERSAIRE) return String(item.yearsBack) === String(secondaryId);
  if (item.format === FORMATS.PERFORMANCE_DEPUIS) return String(item.year) === String(secondaryId);
  return true;
}

// Mode Comparatif uniquement : un item "paire" correspond à (idA, idB) si les deux ids demandés
// (ceux effectivement fixés — l'un des deux, les deux, ou aucun) figurent dans la paire, quel que
// soit l'ordre dans lequel l'utilisateur les a choisis aux deux menus déroulants — l'ordre
// d'affichage final est décidé à la génération selon la performance, jamais selon "actif A/B".
function matchesPair(item, idA, idB) {
  const hasA = idA && idA !== SUBJECT_ALEATOIRE;
  const hasB = idB && idB !== SUBJECT_ALEATOIRE;
  if (!hasA && !hasB) return true;
  const pairIds = new Set([item.assetIdA, item.assetIdB]);
  if (hasA && hasB) return idA !== idB && pairIds.has(idA) && pairIds.has(idB);
  return pairIds.has(hasA ? idA : idB);
}

// ── Anti-répétition par fenêtre glissante ─────────────────────────────────────────────────
// Sur les N-1 derniers ids vus (même logique que pickNonRepeating dans le générateur de
// portefeuilles) : un item ne peut réapparaître avant que le pool entier (au format demandé)
// ait quasiment tourné une fois. `history` est un tableau plat d'ids déjà vus, partagé entre
// tous les formats — c'est ce qui rend l'anti-répétition globale plutôt que cloisonnée.
export function pickNext(format, history, mode = MODES.SIMPLE) {
  const pool = poolForFormat(format, mode);
  const keep = Math.max(0, pool.length - 1);
  const recent = new Set(history.slice(-keep));
  const fresh = pool.filter((item) => !recent.has(item.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Sélection à deux, trois ou quatre étages ──────────────────────────────────────────────
// - format ALEATOIRE : pioche dans tous les formats et modes combinés, avec anti-répétition, et
//   ajoute au suivi de session.
// - mode Simple (tous formats) : sujet + secondaire éventuels, comportement inchangé depuis
//   l'introduction d'Anniversaire/Performance depuis.
// - mode Comparatif (Anniversaire/Performance depuis uniquement) : jusqu'à DEUX sujets (les deux
//   actifs) + un secondaire (années en arrière / année de départ), filtrés via matchesPair.
// Dans tous les cas : au moins un critère précis (sujet, sujetB ou secondaire) → pioche parmi les
// items qui correspondent, jamais anti-répété, jamais ajouté au suivi de session (l'utilisateur
// peut revoir cette sélection autant de fois qu'il veut sans polluer le pool "Aléatoire"). Aucun
// critère précis → pickNext classique, anti-répété et suivi.
export function pickForSelection({ format, mode = MODES.SIMPLE, subjectId, subjectIdB, secondaryId, history }) {
  if (format === FORMATS.ALEATOIRE) {
    const item = pickNext(format, history);
    return { item, addToHistory: true };
  }

  const isComparatif = mode === MODES.COMPARATIF && (format === FORMATS.ANNIVERSAIRE || format === FORMATS.PERFORMANCE_DEPUIS);
  const hasSecondary = secondaryId !== undefined && secondaryId !== null && secondaryId !== SUBJECT_ALEATOIRE;

  if (isComparatif) {
    const hasA = subjectId && subjectId !== SUBJECT_ALEATOIRE;
    const hasB = subjectIdB && subjectIdB !== SUBJECT_ALEATOIRE;
    if (!hasA && !hasB && !hasSecondary) {
      const item = pickNext(format, history, mode);
      return { item, addToHistory: true };
    }
    const pool = poolForFormat(format, mode);
    const byPair = pool.filter((item) => matchesPair(item, subjectId, subjectIdB));
    const bySecondary = hasSecondary ? byPair.filter((item) => matchesSecondary(item, secondaryId)) : byPair;
    const candidates = bySecondary.length > 0 ? bySecondary : byPair.length > 0 ? byPair : pool;
    const item = candidates[Math.floor(Math.random() * candidates.length)];
    return { item, addToHistory: false };
  }

  const hasSubject = subjectId && subjectId !== SUBJECT_ALEATOIRE;
  if (!hasSubject && !hasSecondary) {
    const item = pickNext(format, history, mode);
    return { item, addToHistory: true };
  }
  const bySubject = hasSubject ? poolForFormat(format, mode).filter((item) => matchesSubject(item, subjectId)) : poolForFormat(format, mode);
  const pool = hasSecondary ? bySubject.filter((item) => matchesSecondary(item, secondaryId)) : bySubject;
  const candidates = pool.length > 0 ? pool : bySubject.length > 0 ? bySubject : poolForFormat(format, mode);
  const item = candidates[Math.floor(Math.random() * candidates.length)];
  return { item, addToHistory: false };
}

// Déterministe à partir de l'id de l'item (pas d'état supplémentaire à gérer) : le même item
// retombe toujours sur la même entrée du pool, mais deux items différents varient. Réutilisé pour
// les questions d'engagement (Vrai/Faux) et les deux pools de punchlines (Anniversaire /
// Performance depuis).
function pickFromPool(pool, seedId) {
  let hash = 0;
  for (let i = 0; i < seedId.length; i++) hash = (hash * 31 + seedId.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

export function buildVraiFauxText(item) {
  const lines = [];
  lines.push("🤔 Vrai ou faux ?");
  lines.push("");
  lines.push(item.affirmation);
  lines.push("");
  lines.push(`${item.reponse ? "✅ Vrai" : "❌ Faux"}. ${item.explication}`);
  lines.push("");
  lines.push(pickFromPool(QUESTIONS_ENGAGEMENT, item.id));
  return lines.join("\n");
}

export function buildDilemmeText(item) {
  const lines = [];
  lines.push(item.contexteTexte);
  lines.push("");
  lines.push(`A) ${item.optionA}`);
  lines.push(`B) ${item.optionB}`);
  lines.push("");
  lines.push("Toi tu ferais quoi ? 👇");
  return lines.join("\n");
}

function findAsset(assetId) {
  return MARKET_ASSETS.find((a) => a.id === assetId);
}

// Le "niveau actuel" (rawNiveauActuel) n'est jamais dérivé ni deviné : tant qu'il n'est pas
// renseigné, la performance et le niveau actuel restent en placeholder plutôt que d'inventer une
// valeur — cf. contrainte du brief ("jamais deviné ni estimé automatiquement").
export function buildAnniversaireText(item, rawNiveauActuel) {
  const asset = findAsset(item.assetId);
  const ym = ymForYearsBack(item.yearsBack, TODAY);
  const historicalPrice = getHistoricalPrice(item.assetId, ym);
  const dateLabel = fmtYm(ym, { monthLabels: MONTHS_FULL });

  const niveauActuel = Number(rawNiveauActuel);
  const hasCurrent = rawNiveauActuel !== "" && rawNiveauActuel !== null && rawNiveauActuel !== undefined && Number.isFinite(niveauActuel) && niveauActuel > 0;
  const gainPct = hasCurrent ? ((niveauActuel - historicalPrice) / historicalPrice) * 100 : null;

  const lines = [];
  lines.push(`🎂 Il y a ${item.yearsBack} an${item.yearsBack > 1 ? "s" : ""} jour pour jour`);
  lines.push("");
  lines.push(`${asset.icon} ${asset.label}`);
  lines.push(`Prix en ${dateLabel} : ${fmtEUR(historicalPrice, asset.currency)}`);
  lines.push(`Niveau actuel : ${hasCurrent ? fmtEUR(niveauActuel, asset.currency) : "[à saisir]"}`);
  lines.push(`Performance : ${hasCurrent ? fmtPct(gainPct) : "—"}`);
  lines.push("");
  lines.push(pickFromPool(ANNIVERSAIRE_PUNCHLINES, item.id).replace(/\{years\}/g, item.yearsBack));
  return lines.join("\n");
}

function fmtEcart(pctA, pctB) {
  const ecart = Math.abs(pctA - pctB);
  return `Écart : ${ecart.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} points de pourcentage.`;
}

function buildBenchmarkLine(startYm, endYm) {
  const { livretPct, inflationPct } = getBenchmarkPerformance(startYm, endYm);
  return `Sur la même période, le Livret A aurait fait ${fmtPct(livretPct)} et l'inflation cumulée est de ${fmtPct(inflationPct)}.`;
}

export function buildPerformanceDepuisText(item, includeBenchmark) {
  const asset = findAsset(item.assetId);
  const startPoint = getFirstRealPointOfYear(item.assetId, item.year);
  const endPoint = getLastRealPoint(item.assetId);
  const gainPct = ((endPoint.price - startPoint.price) / startPoint.price) * 100;

  const lines = [];
  lines.push(`📈 Performance depuis ${item.year}`);
  lines.push("");
  lines.push(`${asset.icon} ${asset.label} : ${fmtPct(gainPct)}`);
  if (includeBenchmark) {
    lines.push("");
    lines.push(buildBenchmarkLine(startPoint.date, endPoint.date));
  }
  lines.push("");
  lines.push(pickFromPool(PERFORMANCE_DEPUIS_PUNCHLINES, item.id));
  return lines.join("\n");
}

// Mode Comparatif, Format A : deux champs de saisie manuelle distincts (un par actif), avec la
// même règle que le mode Simple — jamais devinés, jamais mémorisés. Le tri "plus performant en
// premier" ne s'applique qu'une fois les deux niveaux connus ; tant qu'un des deux manque, l'ordre
// de tirage est conservé plutôt que de trier sur une donnée absente.
export function buildAnniversaireComparatifText(item, rawNiveauActuelA, rawNiveauActuelB) {
  const assetA = findAsset(item.assetIdA);
  const assetB = findAsset(item.assetIdB);
  const ym = ymForYearsBack(item.yearsBack, TODAY);
  const dateLabel = fmtYm(ym, { monthLabels: MONTHS_FULL });
  const histA = getHistoricalPrice(item.assetIdA, ym);
  const histB = getHistoricalPrice(item.assetIdB, ym);

  const curA = Number(rawNiveauActuelA);
  const curB = Number(rawNiveauActuelB);
  const hasA = rawNiveauActuelA !== "" && rawNiveauActuelA !== null && rawNiveauActuelA !== undefined && Number.isFinite(curA) && curA > 0;
  const hasB = rawNiveauActuelB !== "" && rawNiveauActuelB !== null && rawNiveauActuelB !== undefined && Number.isFinite(curB) && curB > 0;
  const pctA = hasA ? ((curA - histA) / histA) * 100 : null;
  const pctB = hasB ? ((curB - histB) / histB) * 100 : null;
  const bothKnown = hasA && hasB;

  const rows = [
    { asset: assetA, hist: histA, cur: curA, hasCur: hasA, gain: pctA },
    { asset: assetB, hist: histB, cur: curB, hasCur: hasB, gain: pctB },
  ];
  const ordered = bothKnown && pctB > pctA ? [rows[1], rows[0]] : rows;

  const lines = [];
  lines.push(`🎂 Il y a ${item.yearsBack} an${item.yearsBack > 1 ? "s" : ""}, ${assetA.tweetPhrase} et ${assetB.tweetPhrase} valaient...`);
  lines.push("");
  ordered.forEach(({ asset, hist, cur, hasCur, gain }, i) => {
    lines.push(`${asset.icon} ${asset.label}`);
    lines.push(`Prix en ${dateLabel} : ${fmtEUR(hist, asset.currency)}`);
    lines.push(`Niveau actuel : ${hasCur ? fmtEUR(cur, asset.currency) : "[à saisir]"}`);
    lines.push(`Performance : ${hasCur ? fmtPct(gain) : "—"}`);
    if (i === 0) lines.push("");
  });
  lines.push("");
  if (bothKnown) lines.push(fmtEcart(pctA, pctB));
  lines.push(pickFromPool(ANNIVERSAIRE_COMPARATIF_PUNCHLINES, item.id).replace(/\{years\}/g, item.yearsBack));
  return lines.join("\n");
}

// Mode Comparatif, Format B : fenêtre de fin PARTAGÉE entre les deux actifs (cf.
// getSharedEndDate) pour que la comparaison porte sur exactement la même période des deux côtés —
// jamais la propre dernière donnée de chacun, qui peut différer d'un mois selon l'actif.
export function buildPerformanceDepuisComparatifText(item, includeBenchmark) {
  const assetA = findAsset(item.assetIdA);
  const assetB = findAsset(item.assetIdB);
  const startA = getFirstRealPointOfYear(item.assetIdA, item.year);
  const startB = getFirstRealPointOfYear(item.assetIdB, item.year);
  const sharedEnd = getSharedEndDate(item.assetIdA, item.assetIdB);
  const endPriceA = getHistoricalPrice(item.assetIdA, sharedEnd);
  const endPriceB = getHistoricalPrice(item.assetIdB, sharedEnd);
  const gainA = ((endPriceA - startA.price) / startA.price) * 100;
  const gainB = ((endPriceB - startB.price) / startB.price) * 100;

  const rows = [{ asset: assetA, gain: gainA }, { asset: assetB, gain: gainB }];
  const ordered = gainB > gainA ? [rows[1], rows[0]] : rows;

  const lines = [];
  lines.push(`📈 ${assetA.label} vs ${assetB.label} depuis ${item.year}`);
  lines.push("");
  ordered.forEach(({ asset, gain }) => lines.push(`${asset.icon} ${asset.label} : ${fmtPct(gain)}`));
  lines.push("");
  lines.push(fmtEcart(gainA, gainB));
  if (includeBenchmark) {
    // Fenêtre du benchmark : le début le plus tardif des deux (le seul commun aux deux actifs) à
    // la fin partagée — jamais un mois où l'un des deux actifs n'a pas encore de donnée réelle.
    const sharedStart = ymIndex(startA.date) >= ymIndex(startB.date) ? startA.date : startB.date;
    lines.push("");
    lines.push(buildBenchmarkLine(sharedStart, sharedEnd));
  }
  lines.push("");
  lines.push(pickFromPool(PERFORMANCE_DEPUIS_COMPARATIF_PUNCHLINES, item.id));
  return lines.join("\n");
}

export function buildTweetText(item, extra = {}) {
  const { niveauActuel, niveauActuelB, includeBenchmark } = extra;
  if (item.format === FORMATS.VRAI_FAUX) return buildVraiFauxText(item);
  if (item.format === FORMATS.DILEMME) return buildDilemmeText(item);
  if (item.format === FORMATS.FICHE_LEXIQUE) return getFicheLexiqueText(item.termeId);
  if (item.format === FORMATS.COMPARATIF_ETF) return getComparatifEtfText(item.themeId);
  if (item.format === FORMATS.ANNIVERSAIRE && item.mode === MODES.COMPARATIF) {
    return buildAnniversaireComparatifText(item, niveauActuel ?? "", niveauActuelB ?? "");
  }
  if (item.format === FORMATS.ANNIVERSAIRE) return buildAnniversaireText(item, niveauActuel ?? "");
  if (item.format === FORMATS.PERFORMANCE_DEPUIS && item.mode === MODES.COMPARATIF) {
    return buildPerformanceDepuisComparatifText(item, !!includeBenchmark);
  }
  if (item.format === FORMATS.PERFORMANCE_DEPUIS) return buildPerformanceDepuisText(item, !!includeBenchmark);
  return "";
}
