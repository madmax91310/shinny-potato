import { YEARS, getAsset } from "./data.js";
import {
  PROFILES, RISK_ORDER, RISK_LABELS, RISK_BOUNDS, WORLD_OPTIONS, LEVERAGE_OPTIONS, BITCOIN_OPTIONS,
  isCompatible, getFrequencyCap,
} from "./theses.js";
import { SEPARATOR, DISCLAIMER, GUARANTEE_LINE } from "./copy.js";

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function weightedPick(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Pas d'espace avant le %, virgule décimale française — format compact voulu pour le tweet.
function fmtPct(val) {
  const sign = val >= 0 ? "+" : "-";
  return `${sign}${Math.abs(val).toFixed(1).replace(".", ",")}%`;
}
function fmtAbsPct(val) {
  return `${Math.abs(val).toFixed(1).replace(".", ",")}%`;
}
// Le MSCI World est la seule valeur sourcée précisément (factsheet officiel MSCI, EUR net) —
// on garde ses 2 décimales dans la comparaison plutôt que d'arrondir comme les autres chiffres.
function fmtAbsPctPrecise(val) {
  return `${Math.abs(val).toFixed(2).replace(".", ",")}%`;
}

// ── Axe 1 (risque) × Axe 2 (profil) : une paire valide == un couple {profileId, riskId} tel que
// isCompatible(profileId, riskId), et il n'existe qu'un seul combo pour cette paire (plus besoin
// de tirer un combo parmi plusieurs comme dans l'ancien modèle mono-axe).
function pairKey(profileId, riskId) {
  return `${profileId}#${riskId}`;
}
function computePairUsage(history) {
  const counts = {};
  history.forEach((h) => {
    const key = pairKey(h.profileId, h.riskId);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}
function candidatePairs(riskId, profileId) {
  const pairs = [];
  PROFILES.forEach((p) => {
    if (profileId && profileId !== "auto" && profileId !== p.id) return;
    Object.keys(p.riskCombos).forEach((r) => {
      if (riskId && riskId !== "auto" && riskId !== r) return;
      pairs.push({ profileId: p.id, riskId: r });
    });
  });
  return pairs;
}
function pickPair(riskId, profileId, pairUsage) {
  let pairs = candidatePairs(riskId, profileId);
  if (pairs.length === 0) {
    // Combinaison demandée incompatible (ne devrait pas arriver depuis l'UI, qui filtre déjà) :
    // on retombe sur l'ensemble des paires valides plutôt que de planter.
    pairs = candidatePairs("auto", "auto");
  }
  const keys = pairs.map((p) => pairKey(p.profileId, p.riskId));
  const weights = keys.map((k) => 1 / ((pairUsage[k] || 0) + 1));
  const chosenKey = weightedPick(keys, weights);
  return pairs.find((p, i) => keys[i] === chosenKey);
}

// ── Fréquence d'usage dans la session ─────────────────────────────────────────
// Calculée à partir de l'historique déjà généré (state React, session uniquement) : sert à la
// fois à répartir les alternatives de marque (idOptions) et à privilégier les combos peu vus,
// pour qu'aucun support ne dépasse 40% des tweets générés et que les actifs moins courants
// finissent par apparaître.
function computeAssetUsage(history) {
  const counts = {};
  history.forEach((h) => {
    h.selection.forEach((s) => {
      counts[s.id] = (counts[s.id] || 0) + 1;
    });
  });
  return counts;
}

function pickLeastUsed(options, usageCounts) {
  const weights = options.map((id) => 1 / ((usageCounts[id] || 0) + 1));
  return weightedPick(options, weights);
}

// Résout un slot {id} ou {idOptions} en un asset concret. Au-delà de 5 générations dans la
// session, exclut d'abord toute option qui dépasserait déjà son plafond de fréquence (cf.
// getFrequencyCap — 40% pour l'or, 25% pour les blocs actions US/obligations, 30% par défaut),
// puis choisit parmi le reste en favorisant l'option la moins utilisée — jamais une simple
// équiprobabilité, pour que les alternatives sous-utilisées comblent vite leur retard.
function resolveAssetId(slot, usageCounts, historyLength) {
  if (!slot.idOptions) return slot.id;
  let candidates = slot.idOptions;
  if (historyLength >= 5) {
    const cap = getFrequencyCap(slot.idOptions);
    const underCap = candidates.filter((id) => (usageCounts[id] || 0) / historyLength <= cap);
    if (underCap.length > 0) candidates = underCap;
  }
  return pickLeastUsed(candidates, usageCounts);
}

function buildSelection(combo, usageCounts, historyLength) {
  return combo.assets.map((a) => {
    const id = resolveAssetId(a, usageCounts, historyLength);
    const asset = getAsset(id);
    return {
      ...asset,
      pct: a.pct,
      desc: pick(asset.desc),
      pourquoi: pick(a.pourquoi),
    };
  });
}

// Jitter (swap de points entre deux lignes) pour varier les combos d'une génération à l'autre,
// toujours revalidé contre la borne de pire année du palier ET contre l'invariante propre au
// profil (ex. Pro-Européen, minimum 70% Europe) — chaque swap individuel est vérifié et annulé
// s'il casse l'une ou l'autre, pour que le résultat final respecte toujours les deux, sans
// dépendre d'un tirage au sort favorable dans la boucle de relance.
//
// Au moins 1 swap garanti (attempts >= 1, contre 0-2 auparavant — un tirage à "0 attempts" ne
// changeait jamais rien) et magnitude variable (contre un ±5 fixe) : corrige un bug signalé où
// "Générer un nouveau portefeuille" pouvait renvoyer exactement le même résultat sur une sélection
// profil+risque étroite (peu de idOptions, jitter fixe) — l'ancien espace de combos atteignables
// s'épuisait en quelques générations dans une session, après quoi la boucle anti-doublon de
// generatePortfolio (tries < 60, puis 200) finissait par abandonner et renvoyer un doublon exact.
// Élargir l'espace atteignable ici, plutôt que relâcher la détection de doublon, pour que les
// combos restent tous valides (bornés/revérifiés) tout en étant beaucoup plus nombreux.
//
// Élargi une deuxième fois le 08/09/2026 (audit "variété insuffisante") : mesuré par script sur
// les 29 combos (30 générations chacun, taux de doublon exact + quasi-doublon à ±3pt près) que les
// combos à peu de lignes tournantes (Pro-Européen, Rentier/Offensif) restaient nettement plus
// sujets aux doublons que la moyenne malgré le premier élargissement. Testé (1-4, {2,3,5,8}) contre
// (2-6, {2,3,5,8,12,15}) sur les 4 pires combos : gain net partout sauf Pro-Européen/Prudent
// (inchangé, 2/30 avant et après) — ce dernier est dominé par 2 lignes fixes (75% du combo) sous un
// plancher de perte très serré (-5%), donc la plupart des swaps sont de toute façon annulés par la
// revalidation de borne ci-dessous, quelle que soit la magnitude : limite structurelle, pas un
// paramètre de jitter à pousser davantage (voir le rapport d'audit pour le détail des mesures).
function jitterSelection(selection, bound, profileId, riskId) {
  const attempts = randInt(2, 6);
  for (let i = 0; i < attempts; i++) {
    if (selection.length < 2) break;
    const [ia, ib] = shuffle(selection.map((_, idx) => idx)).slice(0, 2);
    const amount = pick([2, 3, 5, 8, 12, 15]);
    if (selection[ia].pct - amount < 5) continue;
    selection[ia].pct -= amount;
    selection[ib].pct += amount;
    const perf = computeYearlyPerf(selection);
    const worst = worstYearOf(perf);
    if (!withinBound(worst.value, bound) || violatesProfileInvariant(profileId, selection, riskId)) {
      selection[ia].pct += amount;
      selection[ib].pct -= amount;
    }
  }
  return selection;
}

function withinBound(value, bound) {
  if (bound.min !== null && value < bound.min) return false;
  if (bound.max !== null && value > bound.max) return false;
  return true;
}

// Le jitter (ci-dessus) ne revalide que la borne de pire année — il peut donc, par construction,
// déplacer du poids d'un actif vers un autre sans savoir qu'il casse une règle propre à un profil
// précis. Pro-Européen a une invariante supplémentaire (minimum 70% Europe) qui n'est pas capturée
// par la borne de risque : on la revérifie après jitter et on retire le tirage sinon.
const PRO_EUROPE_CORE_IDS = ["eurostoxx50", "eurostoxx50_ishares", "cac40", "tech_europe", "smallcap_europe", "oblig_etat_eur_short", "msci_europe"];

// Crypto-Curieux : plancher/plafond Bitcoin par palier de risque (audit "Ajustement Crypto-Curieux
// Dynamique", 14/09/2026) — en dessous du plancher, l'étiquette du profil n'est plus justifiée par
// l'allocation réelle ; au-dessus du plafond, on rejoint le registre du palier Offensif. Défensif =
// plafond seul (règle déjà en place avant cet audit, non modifiée). Pas d'entrée Offensif : déjà
// dominé par Bitcoin (35%) + Ethereum (25%) à poids fixes élevés, aucun risque de dilution en
// dessous d'un seuil qui aurait un sens.
const CRYPTO_CURIEUX_BITCOIN_BOUNDS = {
  defensif: { min: null, max: 10 },
  equilibre: { min: 10, max: 20 },
  dynamique: { min: 15, max: 30 },
};
function violatesProfileInvariant(profileId, selection, riskId) {
  if (profileId === "pro_europe") {
    const europePct = selection
      .filter((s) => PRO_EUROPE_CORE_IDS.includes(s.id))
      .reduce((sum, s) => sum + s.pct, 0);
    if (europePct < 70) return true;
  }
  if (profileId === "crypto_curieux") {
    const bounds = CRYPTO_CURIEUX_BITCOIN_BOUNDS[riskId];
    if (bounds) {
      const btc = selection.find((s) => s.id.startsWith("bitcoin"));
      const btcPct = btc ? btc.pct : 0;
      if (bounds.min !== null && btcPct < bounds.min) return true;
      if (bounds.max !== null && btcPct > bounds.max) return true;
    }
    // ETF à levier (lqq/cl2) : jamais laissé sous 10% par le jitter s'il est présent — poids trop
    // faible pour avoir un impact narratif ou de performance réel (cf. LEVERAGE_OPTIONS dans
    // theses.js pour le détail du stress-test qui a validé ce plancher pour ce combo précis).
    const leveraged = selection.find((s) => LEVERAGE_OPTIONS.includes(s.id));
    if (leveraged && leveraged.pct < 10) return true;
  }
  return false;
}

function signature(selection) {
  return selection
    .map((s) => `${s.id}:${s.pct}`)
    .sort()
    .join(",");
}

// Règle #4 (variété d'allocation) : deux générations du même profil ne doivent pas partager le
// même actif dominant (>35%) ni exactement le même trio de tête. Clé sur le profil (axe 2), qui
// porte la narration — le palier de risque (axe 1) peut changer d'une génération à l'autre.
function topAssets(selection, n) {
  return selection
    .slice()
    .sort((a, b) => b.pct - a.pct)
    .slice(0, n)
    .map((s) => s.id);
}
function dominantAsset(selection) {
  const top = selection.slice().sort((a, b) => b.pct - a.pct)[0];
  return top.pct > 35 ? top.id : null;
}
function tooSimilarToLast(selection, profileId, history) {
  const last = [...history].reverse().find((h) => h.profileId === profileId);
  if (!last) return false;
  const newDominant = dominantAsset(selection);
  if (newDominant && newDominant === dominantAsset(last.selection)) return true;
  const newTop3 = new Set(topAssets(selection, 3));
  const oldTop3 = new Set(topAssets(last.selection, 3));
  if (newTop3.size === oldTop3.size && [...newTop3].every((id) => oldTop3.has(id))) return true;
  return false;
}

// ── Textes variantes : jamais deux fois la même accroche / le même sous-titre / le même CTA
// pour un même profil tant que le pool n'a pas été entièrement parcouru dans la session.
// Exclusion glissante (les N-1 derniers choix pour ce champ, sur un pool de N variantes) plutôt
// qu'un simple "déjà vu un jour" : un Set d'historique complet se vide dès que tout le pool est
// passé une fois, ce qui autoriserait une répétition immédiate juste après le premier cycle.
function recentTexts(history, profileId, field, keep) {
  const seq = history.filter((h) => h.profileId === profileId).map((h) => h[field]);
  return new Set(seq.slice(-keep));
}
function pickNonRepeating(pool, history, profileId, field) {
  const recent = recentTexts(history, profileId, field, pool.length - 1);
  const fresh = pool.filter((t) => !recent.has(t));
  return pick(fresh.length > 0 ? fresh : pool);
}

// Accroche d'ouverture du tweet (hook + intro, demande utilisateur du 15/09/2026) : chaque combo
// (profil × palier) porte SA propre bibliothèque de 2-3 paires écrites à la main (cf. `hooks` sur
// chaque riskCombo dans theses.js), ancrées sur le trait le plus marquant de CE combo précis —
// jamais une formule générique substituable à un autre combo (les deux systèmes précédents, ligne
// fixe puis familles A-F par critères de palier, ont été abandonnés pour cette raison). Hook et
// intro viennent TOUJOURS de la même paire (l'intro doit répondre explicitement à la question du
// hook) — jamais mélangés entre deux paires différentes. Anti-répétition sur le combo EXACT (profil
// + palier, comme pairKey), sur le hook (qui identifie la paire de façon unique dans son pool).
function pickHookPair(profile, riskId, history) {
  const pool = profile.riskCombos[riskId].hooks;
  const recentHooks = new Set(
    history
      .filter((h) => h.profileId === profile.id && h.riskId === riskId)
      .map((h) => h.hookTemplate)
      .slice(-(pool.length - 1))
  );
  const fresh = pool.filter((p) => !recentHooks.has(p.hook));
  return pick(fresh.length > 0 ? fresh : pool);
}

// Le "pourquoi" est choisi avant le jitter (le pourcentage n'est pas encore figé) : les textes
// qui citent leur propre allocation utilisent le témoin {pct}, remplacé ici une fois le
// pourcentage final connu — jamais un chiffre codé en dur qui pourrait se décaler du jitter.
function resolvePourquoi(selection) {
  selection.forEach((s) => {
    s.pourquoi = s.pourquoi.replace(/\{pct\}/g, s.pct);
  });
  return selection;
}

function computeYearlyPerf(selection) {
  const perf = {};
  YEARS.forEach((y, idx) => {
    perf[y] = selection.reduce((sum, s) => sum + (s.r[idx] * s.pct) / 100, 0);
  });
  return perf;
}

function worstYearOf(perf) {
  let worst = YEARS[0];
  YEARS.forEach((y) => {
    if (perf[y] < perf[worst]) worst = y;
  });
  return { year: worst, value: perf[worst] };
}

function bestYearOf(perf) {
  let best = YEARS[0];
  YEARS.forEach((y) => {
    if (perf[y] > perf[best]) best = y;
  });
  return { year: best, value: perf[best] };
}

// Règle #6 (brief original) : si la meilleure année est écrasée par un seul actif extrême
// (crypto typiquement), on le signale comme non représentatif plutôt que de laisser croire que
// c'est la norme.
function boostedYearLine(selection, perf) {
  const best = bestYearOf(perf);
  const idx = YEARS.indexOf(best.year);
  let driver = null;
  selection.forEach((s) => {
    if (!driver || s.r[idx] > driver.r[idx]) driver = s;
  });
  if (driver && driver.r[idx] > 90) {
    return `→ ${best.year} boosté par ${driver.name} (${fmtPct(driver.r[idx])} cette année-là). Non représentatif.`;
  }
  return null;
}

function msciComparisonLine(selection, perf) {
  if (selection.some((s) => WORLD_OPTIONS.includes(s.id))) return null;
  const world = getAsset("msci_world");
  const worst = worstYearOf(perf);
  const idx = YEARS.indexOf(worst.year);
  const worldVal = world.r[idx];
  const diff = Math.abs(worldVal - worst.value);
  if (diff < 5) return null;
  const worldVerb = worldVal >= 0 ? "gagnait" : "perdait";
  const portVerb = worst.value >= 0 ? "gagnait" : "perdait";
  // Seul 2022 est sourcé au factsheet officiel (2 décimales) ; les autres années restent des
  // approximations illustratives, affichées avec la même précision que le reste du tweet.
  const worldFmt = worst.year === 2022 ? fmtAbsPctPrecise(worldVal) : fmtAbsPct(worldVal);
  return `→ En ${worst.year}, quand le MSCI World ${worldVerb} ${worldFmt}, ce portefeuille ${portVerb} ${fmtAbsPct(worst.value)}.`;
}

// Retourne {text, fallbackPick} plutôt qu'un simple texte : fallbackPick n'est renseigné que
// lorsque la ligne de contexte "générique" (profile.contextFallback) est effectivement utilisée,
// pour que l'anti-répétition (cf. generatePortfolio) ne porte que sur ces occurrences-là — pas
// sur les lignes "boosted year" / comparaison MSCI, qui sont déjà uniques par construction.
function contextLine(profile, selection, perf, history) {
  const boosted = boostedYearLine(selection, perf);
  if (boosted) return { text: boosted, fallbackPick: null };
  const msci = msciComparisonLine(selection, perf);
  if (msci) return { text: msci, fallbackPick: null };
  const fallbackPick = pickNonRepeating(profile.contextFallback, history, profile.id, "contextFallbackPick");
  return { text: `→ ${fallbackPick}`, fallbackPick };
}

// Résout {pct}-like tokens qui ne sont pas liés à une ligne précise mais au portefeuille dans
// son ensemble (pire année, meilleure année, dose de Bitcoin) — utilisé pour les CTA.
function resolvePortfolioPlaceholders(text, { worst, best, selection }) {
  // Le CTA "Bitcoin, Ethereum, ou les deux" (Crypto-Curieux) ne mentionne aucun placeholder, donc
  // sans ce garde-fou il resterait toujours "résolvable" même quand Ethereum n'a pas été tiré dans
  // ce portefeuille (id fixe, présent uniquement au palier Offensif de ce profil, cf. theses.js) —
  // corrigé le 14/09/2026 : le CTA doit toujours refléter la composition réellement affichée.
  if (/\bEthereum\b/.test(text) && !selection.some((s) => s.id === "ethereum")) return null;
  if (!text.includes("{")) return text;
  let out = text
    .replace(/\{worst_pct\}/g, fmtPct(worst.value))
    .replace(/\{worst_year\}/g, worst.year)
    .replace(/\{best_pct\}/g, fmtPct(best.value))
    .replace(/\{best_year\}/g, best.year);
  if (out.includes("{bitcoin_pct}")) {
    const btc = selection.find((s) => s.id.startsWith("bitcoin"));
    if (!btc) return null; // pas de ligne Bitcoin dans ce tirage : ce CTA ne peut pas s'appliquer
    out = out.replace(/\{bitcoin_pct\}/g, btc.pct);
  }
  return out;
}

// Le suivi anti-répétition porte sur le *template* du CTA, pas sur le texte résolu : deux CTA
// "Tu oserais mettre {bitcoin_pct}% en Bitcoin" tirés à des générations différentes doivent
// compter comme "le même CTA déjà utilisé" même si le pourcentage affiché diffère.
function pickCta(profile, history, ctx) {
  const resolvable = profile.ctas
    .map((template) => ({ template, resolved: resolvePortfolioPlaceholders(template, ctx) }))
    .filter((c) => c.resolved !== null);
  const recent = recentTexts(history, profile.id, "ctaTemplate", profile.ctas.length - 1);
  const fresh = resolvable.filter((c) => !recent.has(c.template));
  const pool = fresh.length > 0 ? fresh : resolvable;
  return pick(pool);
}

// Bloc ⚠️ : factorisé (utilisé par generatePortfolio ET buildManualPortfolio, cf. plus bas) pour ne
// jamais dupliquer cette logique — un seul bloc par tweet, toujours dans le même ordre (pool tiré
// au sort, puis les ajouts fixes/dynamiques propres au profil ou à la composition).
function buildWarning(profile, profileId, selection, worst, history) {
  let warning = pickNonRepeating(profile.warnings, history, profileId, "warning");
  if (profile.capitalNote) {
    // Toujours présente (pas tirée au sort) : pour un profil "revenu", la baisse de capital
    // reste un risque réel même quand les distributions continuent — jamais un simple détail.
    warning += ` En cas de forte baisse (${worst.year} : ${fmtPct(worst.value)}), le capital distribue toujours des revenus — mais sa valeur recule temporairement. Prévoir une réserve de sécurité hors portefeuille.`;
  }
  if (profile.mandatoryWarning) {
    // Toujours présente elle aussi (Pro-Européen) : le contre-pied assumé face aux US n'est
    // jamais un détail optionnel qu'un tirage au sort pourrait faire disparaître.
    warning += ` ${profile.mandatoryWarning}`;
  }
  const jepq = selection.find((s) => s.id === "jepq");
  if (jepq && jepq.pct > 30) {
    // Avertissement dynamique (pas stocké en dur dans theses.js) : ne se déclenche que si le
    // covered call dépasse effectivement 30% de CE tirage/CETTE composition précise.
    warning += " Le covered call (JEPQ) plafonne la hausse en marché bull. Ce portefeuille génère des revenus — pas une performance maximale.";
  }
  const leveraged = selection.find((s) => s.id === "lqq" || s.id === "cl2");
  if (leveraged) {
    // Toujours présente dès qu'un ETF à levier (LQQ ou CL2, cf. LEVERAGE_OPTIONS) figure dans le
    // tirage/la composition (pas de seuil de %, contrairement au JEPQ ci-dessus) : la mécanique de
    // capitalisation quotidienne du levier mérite d'être rappelée à chaque apparition.
    warning += ` ${leveraged.name} est un ETF à levier 2x quotidien : sur plusieurs années, sa performance n'est jamais un simple x2 de son indice sous-jacent (capitalisation quotidienne du levier, dans un sens comme dans l'autre). Pas fait pour être oublié en portefeuille sans suivi.`;
  }
  return warning;
}

// ── Composition manuelle (demande utilisateur du 22/09/2026) ───────────────────────────────────
// Contrairement au mode auto, dont chaque combo (profil × palier) est prédéfini et porte sa propre
// bibliothèque de hooks écrits à la main (ancrés sur les VRAIS chiffres de CE combo précis, cf.
// `hooks` plus haut), une composition manuelle est arbitraire : aucun texte pré-écrit ne peut lui
// correspondre sans risquer d'afficher un chiffre faux. Le reste du pipeline (calcul de
// performance, détection de pire année, avertissement, sous-titre, CTA, contexte, rendu du tweet)
// est en revanche identique et directement réutilisé — buildManualPortfolio ne fait que remplacer
// l'étape de tirage aléatoire des lignes/pourcentages par la saisie utilisateur.

const MANUAL_POURQUOI_TEMPLATES = [
  "{pct}% du portefeuille, un choix personnel pour cette composition.",
  "Une ligne ajoutée volontairement, à hauteur de {pct}%.",
  "{pct}% : le poids choisi pour cette ligne dans cette composition libre.",
];

// Palier de risque le plus proche, pour affichage informatif uniquement (jamais bloquant en mode
// manuel) : celui dont le plancher (RISK_BOUNDS[r].min) est numériquement le plus proche de la
// pire année réellement calculée sur CETTE composition. Offensif (pas de plancher, min: null) n'a
// rien à comparer et n'est retenu qu'en dernier recours, si aucun autre palier n'a de plancher
// défini (ne devrait jamais arriver avec le RISK_BOUNDS actuel).
function closestRiskTier(worstValue) {
  let best = null;
  let bestDiff = Infinity;
  RISK_ORDER.forEach((r) => {
    const bound = RISK_BOUNDS[r];
    if (bound.min === null) return;
    const diff = Math.abs(worstValue - bound.min);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = r;
    }
  });
  return best ?? "offensif";
}

// Détecte le fait le plus marquant de CETTE composition précise, par ordre de priorité identique
// à celui utilisé pour écrire la bibliothèque de hooks du mode auto : (1) une ligne crypto ou à
// levier à poids significatif — le pari le plus inattendu/fort ; (2) une ligne dominante (>=45%)
// à défaut ; (3) une pire année notable (<= -10%) ; (4) un fonds euros dominant (trait prudent
// caractéristique) ; (5) repli générique sur la composition dans son ensemble.
function detectManualHighlight(selection, worst) {
  const sorted = selection.slice().sort((a, b) => b.pct - a.pct);
  const top = sorted[0];
  const cryptoOrLeverage = sorted.find(
    (s) => BITCOIN_OPTIONS.includes(s.id) || s.id === "ethereum" || LEVERAGE_OPTIONS.includes(s.id)
  );
  if (cryptoOrLeverage && cryptoOrLeverage.pct >= 15) {
    return { type: "risky", asset: cryptoOrLeverage };
  }
  if (top.pct >= 45) {
    return { type: "concentration", asset: top };
  }
  if (worst.value <= -10) {
    return { type: "worstYear" };
  }
  const fondsEuros = selection.find((s) => s.id === "fonds_euros");
  if (fondsEuros && fondsEuros.pct >= 40) {
    return { type: "cautious", asset: fondsEuros };
  }
  return { type: "generic", asset: top };
}

function buildManualHookPool(selection, worst) {
  const highlight = detectManualHighlight(selection, worst);
  const lineCount = selection.length;
  if (highlight.type === "risky") {
    const a = highlight.asset;
    return [
      {
        hook: `${a.pct}% en ${a.name} dans une composition que tu as choisie toi-même. Tu assumes ce niveau de risque ?`,
        intro: "C'est le pari le plus marquant de cette sélection — le reste vient équilibrer autour.",
      },
      {
        hook: `Tu es allé jusqu'à ${a.pct}% sur ${a.name}. Volontaire, ou tu n'avais pas réalisé le poids que ça prenait ?`,
        intro: "À ce niveau, cette seule ligne pèse plus que beaucoup de portefeuilles entiers.",
      },
    ];
  }
  if (highlight.type === "concentration") {
    const a = highlight.asset;
    return [
      {
        hook: `${a.pct}% du portefeuille sur une seule ligne, ${a.name}. Concentré ou juste convaincu ?`,
        intro: "Le reste de la sélection ne pèse pas grand-chose à côté.",
      },
      {
        hook: `Une ligne à elle seule à ${a.pct}%. C'est le pari central de ta composition, ${a.name} ?`,
        intro: "Tout le reste vient en accompagnement de ce choix.",
      },
    ];
  }
  if (highlight.type === "worstYear") {
    return [
      {
        hook: `${fmtPct(worst.value)} en ${worst.year} sur cette composition. Tu encaisserais ça sans bouger ?`,
        intro: "C'est le prix des choix faits ligne par ligne dans cette sélection libre.",
      },
      {
        hook: `Ta composition serait tombée à ${fmtPct(worst.value)} en ${worst.year}. Ça change ton avis sur un des choix faits ?`,
        intro: "Rien d'imposé ici — juste la conséquence des lignes que tu as choisies.",
      },
    ];
  }
  if (highlight.type === "cautious") {
    const a = highlight.asset;
    return [
      {
        hook: `${a.pct}% en fonds euros dans une composition que tu as bâtie toi-même. Par prudence, ou par manque d'idées pour le reste ?`,
        intro: "Ça amortit tout le reste de la sélection, quel que soit le contenu des autres lignes.",
      },
      {
        hook: "Près de la moitié du portefeuille en fonds euros, et c'est toi qui l'as choisi. Volontaire ?",
        intro: "Le reste de la composition a donc beaucoup moins de marge pour faire la performance.",
      },
    ];
  }
  const top = highlight.asset;
  return [
    {
      hook: `${lineCount} lignes, ${top.pct}% sur la plus grosse (${top.name}). Une composition équilibrée, à ton avis ?`,
      intro: "Aucune ligne ne domine vraiment — la répartition reste raisonnable.",
    },
    {
      hook: `Tu as construit cette composition toi-même, ${lineCount} lignes en tout. Tu la trouves cohérente avec tes objectifs ?`,
      intro: "Pas de pari extrême ici — plutôt une sélection posée.",
    },
  ];
}

// Anti-répétition scopée sur riskId === "manuel" (cf. buildManualPortfolio) : ne se mélange jamais
// avec l'historique du mode auto pour ce même profil, exactement comme pickHookPair scope sur
// (profileId + riskId) pour les combos prédéfinis.
function pickManualHookPair(profile, selection, worst, history) {
  const pool = buildManualHookPool(selection, worst);
  const recentHooks = new Set(
    history
      .filter((h) => h.profileId === profile.id && h.riskId === "manuel")
      .map((h) => h.hookTemplate)
      .slice(-(pool.length - 1))
  );
  const fresh = pool.filter((p) => !recentHooks.has(p.hook));
  return pick(fresh.length > 0 ? fresh : pool);
}

export function buildManualPortfolio(rawSelection, profileId, history) {
  const profile = PROFILES.find((p) => p.id === profileId);
  const selection = rawSelection.map((r) => {
    const asset = getAsset(r.id);
    return {
      ...asset,
      pct: r.pct,
      desc: pick(asset.desc),
      pourquoi: pick(MANUAL_POURQUOI_TEMPLATES).replace(/\{pct\}/g, r.pct),
    };
  });

  const perf = computeYearlyPerf(selection);
  const worst = worstYearOf(perf);
  const best = bestYearOf(perf);
  const closestRiskId = closestRiskTier(worst.value);

  const warning = buildWarning(profile, profileId, selection, worst, history);
  const cta = pickCta(profile, history, { worst, best, selection });
  const { text: contextText, fallbackPick } = contextLine(profile, selection, perf, history);
  const hookPair = pickManualHookPair(profile, selection, worst, history);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sig: signature(selection),
    mode: "manual",
    profileId,
    riskId: "manuel",
    profileName: profile.label,
    riskLabel: "Composition manuelle",
    title: `${profile.label} · Composition manuelle`,
    closestRiskId,
    closestRiskLabel: RISK_LABELS[closestRiskId],
    closestBound: RISK_BOUNDS[closestRiskId],
    hook: hookPair.hook,
    hookTemplate: hookPair.hook,
    intro: hookPair.intro,
    sousTitre: pickNonRepeating(profile.sousTitres, history, profileId, "sousTitre"),
    ctaTemplate: cta.template,
    cta: cta.resolved,
    warning,
    selection,
    perf,
    worst,
    best,
    context: contextText,
    contextFallbackPick: fallbackPick,
  };
}

export function generatePortfolio(history, targetRiskKey, targetProfileKey) {
  const assetUsage = computeAssetUsage(history);
  const pairUsage = computePairUsage(history);

  let profileId, riskId, profile, combo, selection;
  let tries = 0;
  do {
    ({ profileId, riskId } = pickPair(targetRiskKey, targetProfileKey, pairUsage));
    profile = PROFILES.find((p) => p.id === profileId);
    combo = profile.riskCombos[riskId];
    selection = resolvePourquoi(
      jitterSelection(buildSelection(combo, assetUsage, history.length), RISK_BOUNDS[riskId], profileId, riskId)
    );
    tries++;
  } while (
    (history.some((h) => h.sig === signature(selection)) ||
      tooSimilarToLast(selection, profileId, history) ||
      violatesProfileInvariant(profileId, selection, riskId)) &&
    // Plafond relevé de 60 à 200 : avec le jitter élargi ci-dessus (attempts >= 1, magnitude
    // variable), l'espace de combos atteignables par combo est nettement plus grand, donc plus de
    // tentatives avant d'abandonner change concrètement le taux de réussite plutôt que de juste
    // boucler pour rien.
    tries < 200
  );

  const perf = computeYearlyPerf(selection);
  const worst = worstYearOf(perf);
  const best = bestYearOf(perf);
  const bound = RISK_BOUNDS[riskId];

  // Un seul bloc ⚠️ par tweet (cf. renderTweetText, qui préfixe déjà `warning` avec ⚠️) : tout
  // ajout ci-dessous rejoint la même phrase, jamais un second "⚠️" collé au premier. Factorisé
  // dans buildWarning (cf. plus haut), partagé avec buildManualPortfolio.
  const warning = buildWarning(profile, profileId, selection, worst, history);
  const cta = pickCta(profile, history, { worst, best, selection });
  const { text: contextText, fallbackPick } = contextLine(profile, selection, perf, history);
  const hookPair = pickHookPair(profile, riskId, history);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sig: signature(selection),
    mode: "auto",
    profileId,
    riskId,
    profileName: profile.label,
    riskLabel: RISK_LABELS[riskId],
    title: `${profile.label} ${RISK_LABELS[riskId]}`,
    bound,
    hook: hookPair.hook,
    hookTemplate: hookPair.hook,
    intro: hookPair.intro,
    sousTitre: pickNonRepeating(profile.sousTitres, history, profileId, "sousTitre"),
    ctaTemplate: cta.template,
    cta: cta.resolved,
    warning,
    selection,
    perf,
    worst,
    context: contextText,
    contextFallbackPick: fallbackPick,
  };
}

export function renderTweetText(p) {
  const blocks = [];
  blocks.push(p.hook);
  blocks.push(p.intro);
  blocks.push(p.sousTitre);
  blocks.push(SEPARATOR);
  blocks.push(
    p.selection
      .map((s) => `${s.emoji} ${s.pct}% ${s.name}\n→ ${s.desc}\n💡 ${s.pourquoi}`)
      .join("\n\n")
  );
  blocks.push(SEPARATOR);
  const yearsLine = YEARS.map((y) => `${y} ${fmtPct(p.perf[y])}`).join(" · ");
  blocks.push(
    `📈 Performances simulées :\n${yearsLine}\n\n→ Pire année : ${fmtPct(p.worst.value)} en ${p.worst.year}.\n${p.context}`
  );
  blocks.push(SEPARATOR);
  blocks.push(p.cta);
  blocks.push(`${DISCLAIMER}\n${GUARANTEE_LINE}`);
  return blocks.join("\n\n");
}

export { fmtPct, RISK_ORDER, RISK_LABELS, RISK_BOUNDS, PROFILES, isCompatible };
