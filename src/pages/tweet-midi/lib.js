import { VRAI_FAUX } from "./data/vraiFaux.js";
import { DILEMMES, SITUATIONS } from "./data/dilemmes.js";
import { FICHE_LEXIQUE_SUBJECTS, getFicheLexiqueText } from "./data/ficheLexique.js";
import { COMPARATIF_ETF_SUBJECTS, getComparatifEtfText } from "./data/comparatifEtf.js";
import { TERMES, CATEGORY_ORDER } from "../lexique-financier/data.js";
import { MONTHS_FULL } from "../investment-calculator/data.js";
import { fmtEUR, fmtPct } from "../investment-calculator/lib.js";
import {
  MARKET_ASSETS, getAssetAvailableYears, getValidYearsBackOptions, getFirstRealPointOfYear,
  getLastRealPoint, getHistoricalPrice, ymForYearsBack, fmtYm,
} from "./data/marketHistory.js";
import { ANNIVERSAIRE_PUNCHLINES } from "./data/anniversairePunchlines.js";
import { PERFORMANCE_DEPUIS_PUNCHLINES } from "./data/performanceDepuisPunchlines.js";

export const FORMATS = {
  VRAI_FAUX: "vrai-faux",
  DILEMME: "dilemme",
  FICHE_LEXIQUE: "fiche-lexique",
  COMPARATIF_ETF: "comparatif-etf",
  ANNIVERSAIRE: "anniversaire",
  PERFORMANCE_DEPUIS: "performance-depuis",
  ALEATOIRE: "aleatoire",
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
// Format A ("Il y a X ans") : une entrée par (actif, nombre d'années en arrière) réellement
// valide pour CET actif à la date de chargement de la page (cf. TODAY ci-dessus et
// getValidYearsBackOptions dans marketHistory.js — jamais 1..10 supposé pour tous, certains
// actifs ont une plage réelle plus courte, ex. LVMH limité à 1-5 ans).
const POOL_ANNIVERSAIRE = MARKET_ASSETS.flatMap((asset) =>
  getValidYearsBackOptions(asset.id, TODAY).map((yearsBack) => ({
    id: `anniversaire:${asset.id}:${yearsBack}`,
    format: FORMATS.ANNIVERSAIRE,
    assetId: asset.id,
    yearsBack,
  }))
);
// Format B ("Performance depuis") : une entrée par (actif, année de départ) parmi les années où
// cet actif a réellement un point vérifié en base (cf. getAssetAvailableYears) — jamais une année
// antérieure au premier point réel de l'actif.
const POOL_PERFORMANCE_DEPUIS = MARKET_ASSETS.flatMap((asset) =>
  getAssetAvailableYears(asset.id).map((year) => ({
    id: `perf-depuis:${asset.id}:${year}`,
    format: FORMATS.PERFORMANCE_DEPUIS,
    assetId: asset.id,
    year,
  }))
);
export const ALL_ITEMS = [
  ...POOL_VRAI_FAUX, ...POOL_DILEMME, ...POOL_FICHE_LEXIQUE, ...POOL_COMPARATIF_ETF,
  ...POOL_ANNIVERSAIRE, ...POOL_PERFORMANCE_DEPUIS,
];

export function poolForFormat(format) {
  if (format === FORMATS.VRAI_FAUX) return POOL_VRAI_FAUX;
  if (format === FORMATS.DILEMME) return POOL_DILEMME;
  if (format === FORMATS.FICHE_LEXIQUE) return POOL_FICHE_LEXIQUE;
  if (format === FORMATS.COMPARATIF_ETF) return POOL_COMPARATIF_ETF;
  if (format === FORMATS.ANNIVERSAIRE) return POOL_ANNIVERSAIRE;
  if (format === FORMATS.PERFORMANCE_DEPUIS) return POOL_PERFORMANCE_DEPUIS;
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
// départ") — dépend du sujet (actif) choisi à l'étape 2 : si un actif précis est sélectionné, on
// ne propose que les valeurs réellement valides pour LUI (cf. pools ci-dessus, déjà filtrés par
// actif) ; si l'actif reste "Aléatoire", on propose l'union de toutes les valeurs valides pour au
// moins un actif — la combinaison finale est de toute façon revalidée au tirage (pickForSelection).
export function getSecondaryOptionsForFormat(format, subjectId) {
  const hasSubject = subjectId && subjectId !== SUBJECT_ALEATOIRE;
  if (format === FORMATS.ANNIVERSAIRE) {
    const pool = hasSubject ? POOL_ANNIVERSAIRE.filter((it) => it.assetId === subjectId) : POOL_ANNIVERSAIRE;
    return [...new Set(pool.map((it) => it.yearsBack))].sort((a, b) => a - b);
  }
  if (format === FORMATS.PERFORMANCE_DEPUIS) {
    const pool = hasSubject ? POOL_PERFORMANCE_DEPUIS.filter((it) => it.assetId === subjectId) : POOL_PERFORMANCE_DEPUIS;
    return [...new Set(pool.map((it) => it.year))].sort((a, b) => a - b);
  }
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

// ── Anti-répétition par fenêtre glissante ─────────────────────────────────────────────────
// Sur les N-1 derniers ids vus (même logique que pickNonRepeating dans le générateur de
// portefeuilles) : un item ne peut réapparaître avant que le pool entier (au format demandé)
// ait quasiment tourné une fois. `history` est un tableau plat d'ids déjà vus, partagé entre
// tous les formats — c'est ce qui rend l'anti-répétition globale plutôt que cloisonnée.
export function pickNext(format, history) {
  const pool = poolForFormat(format);
  const keep = Math.max(0, pool.length - 1);
  const recent = new Set(history.slice(-keep));
  const fresh = pool.filter((item) => !recent.has(item.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Sélection à deux ou trois étages (format, sujet, et — Anniversaire/Performance depuis
// uniquement — une deuxième précision : années en arrière / année de départ) ─────────────────
// - format ALEATOIRE : pioche dans tous les formats combinés, avec anti-répétition, et ajoute au
//   suivi de session.
// - format fixé + sujet ALEATOIRE (ou absent), secondaire ignoré : pioche dans le pool de ce
//   format, avec anti-répétition, et ajoute au suivi de session.
// - format fixé + sujet et/ou secondaire précis : pioche uniquement parmi les items qui
//   correspondent (au hasard s'il y en a plusieurs) — jamais filtré par l'anti-répétition, et
//   jamais ajouté au suivi de session, pour que l'utilisateur puisse revoir cette sélection
//   autant de fois qu'il veut sans jamais être bloqué ni polluer le pool "Aléatoire". Un filtre
//   trop strict (combinaison sujet+secondaire invalide) retombe sur le sujet seul plutôt que sur
//   tout le format, pour rester aussi proche que possible de ce qui a été demandé.
export function pickForSelection(format, subjectId, history, secondaryId) {
  const hasSubject = subjectId && subjectId !== SUBJECT_ALEATOIRE;
  const hasSecondary = secondaryId !== undefined && secondaryId !== null && secondaryId !== SUBJECT_ALEATOIRE;

  if (format === FORMATS.ALEATOIRE || (!hasSubject && !hasSecondary)) {
    const item = pickNext(format, history);
    return { item, addToHistory: true };
  }

  const bySubject = hasSubject ? poolForFormat(format).filter((item) => matchesSubject(item, subjectId)) : poolForFormat(format);
  const pool = hasSecondary ? bySubject.filter((item) => matchesSecondary(item, secondaryId)) : bySubject;
  const candidates = pool.length > 0 ? pool : bySubject.length > 0 ? bySubject : poolForFormat(format);
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

export function buildPerformanceDepuisText(item) {
  const asset = findAsset(item.assetId);
  const startPoint = getFirstRealPointOfYear(item.assetId, item.year);
  const endPoint = getLastRealPoint(item.assetId);
  const gainPct = ((endPoint.price - startPoint.price) / startPoint.price) * 100;

  const lines = [];
  lines.push(`📈 Performance depuis ${item.year}`);
  lines.push("");
  lines.push(`${asset.icon} ${asset.label} : ${fmtPct(gainPct)}`);
  lines.push("");
  lines.push(pickFromPool(PERFORMANCE_DEPUIS_PUNCHLINES, item.id));
  return lines.join("\n");
}

export function buildTweetText(item, niveauActuel) {
  if (item.format === FORMATS.VRAI_FAUX) return buildVraiFauxText(item);
  if (item.format === FORMATS.DILEMME) return buildDilemmeText(item);
  if (item.format === FORMATS.FICHE_LEXIQUE) return getFicheLexiqueText(item.termeId);
  if (item.format === FORMATS.COMPARATIF_ETF) return getComparatifEtfText(item.themeId);
  if (item.format === FORMATS.ANNIVERSAIRE) return buildAnniversaireText(item, niveauActuel ?? "");
  if (item.format === FORMATS.PERFORMANCE_DEPUIS) return buildPerformanceDepuisText(item);
  return "";
}
