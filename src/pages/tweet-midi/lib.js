import { VRAI_FAUX } from "./data/vraiFaux.js";
import { DILEMMES, SITUATIONS } from "./data/dilemmes.js";
import { FICHE_LEXIQUE_SUBJECTS, getFicheLexiqueText } from "./data/ficheLexique.js";
import { COMPARATIF_ETF_SUBJECTS, getComparatifEtfText } from "./data/comparatifEtf.js";
import { TERMES, CATEGORY_ORDER } from "../lexique-financier/data.js";

export const FORMATS = {
  VRAI_FAUX: "vrai-faux",
  DILEMME: "dilemme",
  FICHE_LEXIQUE: "fiche-lexique",
  COMPARATIF_ETF: "comparatif-etf",
  ALEATOIRE: "aleatoire",
};

export const FORMAT_LABELS = {
  [FORMATS.VRAI_FAUX]: "Vrai ou Faux",
  [FORMATS.DILEMME]: "Dilemme",
  [FORMATS.FICHE_LEXIQUE]: "Fiche lexique",
  [FORMATS.COMPARATIF_ETF]: "Comparatif ETF",
  [FORMATS.ALEATOIRE]: "Aléatoire (tous formats)",
};

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
export const ALL_ITEMS = [...POOL_VRAI_FAUX, ...POOL_DILEMME, ...POOL_FICHE_LEXIQUE, ...POOL_COMPARATIF_ETF];

export function poolForFormat(format) {
  if (format === FORMATS.VRAI_FAUX) return POOL_VRAI_FAUX;
  if (format === FORMATS.DILEMME) return POOL_DILEMME;
  if (format === FORMATS.FICHE_LEXIQUE) return POOL_FICHE_LEXIQUE;
  if (format === FORMATS.COMPARATIF_ETF) return POOL_COMPARATIF_ETF;
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

export function getSubjectsForFormat(format) {
  if (format === FORMATS.VRAI_FAUX) return VRAI_FAUX_SUBJECTS;
  if (format === FORMATS.DILEMME) return DILEMME_SUBJECTS;
  if (format === FORMATS.FICHE_LEXIQUE) return FICHE_LEXIQUE_SUBJECTS;
  if (format === FORMATS.COMPARATIF_ETF) return COMPARATIF_ETF_SUBJECTS_FLAT;
  return [];
}

function matchesSubject(item, subjectId) {
  if (item.format === FORMATS.VRAI_FAUX) return item.sourceTermeId === subjectId;
  if (item.format === FORMATS.DILEMME) return item.situationId === subjectId;
  if (item.format === FORMATS.FICHE_LEXIQUE) return item.termeId === subjectId;
  if (item.format === FORMATS.COMPARATIF_ETF) return item.themeId === subjectId;
  return false;
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

// ── Sélection à deux étages (format, puis sujet) ──────────────────────────────────────────
// - format ALEATOIRE : pioche dans les 4 formats combinés, avec anti-répétition, et ajoute au
//   suivi de session.
// - format fixé + sujet ALEATOIRE (ou absent) : pioche dans le pool de ce format, avec
//   anti-répétition, et ajoute au suivi de session.
// - format fixé + sujet précis : pioche uniquement parmi les items de ce sujet (au hasard s'il
//   y en a plusieurs, ex. plusieurs affirmations pour un même terme, ou plusieurs montants pour
//   une même situation de dilemme) — jamais filtré par l'anti-répétition, et jamais ajouté au
//   suivi de session, pour que l'utilisateur puisse revoir ce sujet autant de fois qu'il veut
//   sans jamais être bloqué ni polluer le pool "Aléatoire".
export function pickForSelection(format, subjectId, history) {
  if (format === FORMATS.ALEATOIRE || !subjectId || subjectId === SUBJECT_ALEATOIRE) {
    const item = pickNext(format, history);
    return { item, addToHistory: true };
  }
  const pool = poolForFormat(format).filter((item) => matchesSubject(item, subjectId));
  const candidates = pool.length > 0 ? pool : poolForFormat(format);
  const item = candidates[Math.floor(Math.random() * candidates.length)];
  return { item, addToHistory: false };
}

function pickEngagementQuestion(seedId) {
  // Déterministe à partir de l'id de l'item (pas d'état supplémentaire à gérer) : le même
  // item retombe toujours sur la même question, mais deux items différents varient.
  let hash = 0;
  for (let i = 0; i < seedId.length; i++) hash = (hash * 31 + seedId.charCodeAt(i)) >>> 0;
  return QUESTIONS_ENGAGEMENT[hash % QUESTIONS_ENGAGEMENT.length];
}

export function buildVraiFauxText(item) {
  const lines = [];
  lines.push("🤔 Vrai ou faux ?");
  lines.push("");
  lines.push(item.affirmation);
  lines.push("");
  lines.push(`${item.reponse ? "✅ Vrai" : "❌ Faux"}. ${item.explication}`);
  lines.push("");
  lines.push(pickEngagementQuestion(item.id));
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

export function buildTweetText(item) {
  if (item.format === FORMATS.VRAI_FAUX) return buildVraiFauxText(item);
  if (item.format === FORMATS.DILEMME) return buildDilemmeText(item);
  if (item.format === FORMATS.FICHE_LEXIQUE) return getFicheLexiqueText(item.termeId);
  if (item.format === FORMATS.COMPARATIF_ETF) return getComparatifEtfText(item.themeId);
  return "";
}
