import { VRAI_FAUX } from "./data/vraiFaux.js";
import { DILEMMES } from "./data/dilemmes.js";

export const FORMATS = {
  VRAI_FAUX: "vrai-faux",
  DILEMME: "dilemme",
  ALEATOIRE: "aleatoire",
};

export const FORMAT_LABELS = {
  [FORMATS.VRAI_FAUX]: "Vrai ou Faux",
  [FORMATS.DILEMME]: "Dilemme",
  [FORMATS.ALEATOIRE]: "Aléatoire (les deux)",
};

// Questions d'engagement génériques, piochées pour clore un tweet "Vrai ou Faux" (optionnel,
// cf. brief). Pas de pool par item — un seul pool partagé suffit pour ce format court.
const QUESTIONS_ENGAGEMENT = [
  "Tu le savais ?",
  "Tu l'aurais deviné ?",
  "Ça te surprend ?",
  "Tu connaissais cette règle ?",
  "Vrai ou faux, t'étais sûr de toi ?",
];

// Chaque entrée porte son format d'origine pour permettre le filtrage par format ET
// l'anti-répétition globale (même pool d'ids, cf. pickNext).
const POOL_VRAI_FAUX = VRAI_FAUX.map((item) => ({ ...item, format: FORMATS.VRAI_FAUX }));
const POOL_DILEMME = DILEMMES.map((item) => ({ ...item, format: FORMATS.DILEMME }));
export const ALL_ITEMS = [...POOL_VRAI_FAUX, ...POOL_DILEMME];

export function poolForFormat(format) {
  if (format === FORMATS.VRAI_FAUX) return POOL_VRAI_FAUX;
  if (format === FORMATS.DILEMME) return POOL_DILEMME;
  return ALL_ITEMS;
}

// Anti-répétition par fenêtre glissante sur les N-1 derniers ids vus (même logique que
// pickNonRepeating dans le générateur de portefeuilles) : un item ne peut réapparaître avant
// que le pool entier (au format demandé) ait quasiment tourné une fois. `history` est un
// tableau plat d'ids déjà vus, partagé entre les deux formats — c'est ce qui rend
// l'anti-répétition globale plutôt que cloisonnée par format.
export function pickNext(format, history) {
  const pool = poolForFormat(format);
  const keep = Math.max(0, pool.length - 1);
  const recent = new Set(history.slice(-keep));
  const fresh = pool.filter((item) => !recent.has(item.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
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
  return item.format === FORMATS.VRAI_FAUX ? buildVraiFauxText(item) : buildDilemmeText(item);
}
