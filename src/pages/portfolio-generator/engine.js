import { YEARS, getAsset } from "./data.js";
import { PROFILES, RISK_ORDER, RISK_LABELS, RISK_BOUNDS, WORLD_OPTIONS, isCompatible, getFrequencyCap } from "./theses.js";
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

// Léger jitter (±5 points entre deux lignes) pour varier les combos d'une génération à l'autre,
// toujours revalidé contre la borne de pire année du palier ET contre l'invariante propre au
// profil (ex. Pro-Européen, minimum 70% Europe) — chaque swap individuel est vérifié et annulé
// s'il casse l'une ou l'autre, pour que le résultat final respecte toujours les deux, sans
// dépendre d'un tirage au sort favorable dans la boucle de relance.
function jitterSelection(selection, bound, profileId) {
  const attempts = randInt(0, 2);
  for (let i = 0; i < attempts; i++) {
    if (selection.length < 2) break;
    const [ia, ib] = shuffle(selection.map((_, idx) => idx)).slice(0, 2);
    if (selection[ia].pct - 5 < 5) continue;
    selection[ia].pct -= 5;
    selection[ib].pct += 5;
    const perf = computeYearlyPerf(selection);
    const worst = worstYearOf(perf);
    if (!withinBound(worst.value, bound) || violatesProfileInvariant(profileId, selection)) {
      selection[ia].pct += 5;
      selection[ib].pct -= 5;
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
function violatesProfileInvariant(profileId, selection) {
  if (profileId === "pro_europe") {
    const europePct = selection
      .filter((s) => PRO_EUROPE_CORE_IDS.includes(s.id))
      .reduce((sum, s) => sum + s.pct, 0);
    if (europePct < 70) return true;
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
      jitterSelection(buildSelection(combo, assetUsage, history.length), RISK_BOUNDS[riskId], profileId)
    );
    tries++;
  } while (
    (history.some((h) => h.sig === signature(selection)) ||
      tooSimilarToLast(selection, profileId, history) ||
      violatesProfileInvariant(profileId, selection)) &&
    tries < 60
  );

  const perf = computeYearlyPerf(selection);
  const worst = worstYearOf(perf);
  const best = bestYearOf(perf);
  const bound = RISK_BOUNDS[riskId];

  // Un seul bloc ⚠️ par tweet (cf. renderTweetText, qui préfixe déjà `warning` avec ⚠️) : tout
  // ajout ci-dessous rejoint la même phrase, jamais un second "⚠️" collé au premier.
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
    // covered call dépasse effectivement 30% de CE tirage précis, jitter inclus.
    warning += " Le covered call (JEPQ) plafonne la hausse en marché bull. Ce portefeuille génère des revenus — pas une performance maximale.";
  }
  if (selection.some((s) => s.id === "lqq")) {
    // Toujours présente dès que le LQQ figure dans le tirage (pas de seuil de %, contrairement au
    // JEPQ ci-dessus) : la mécanique de capitalisation quotidienne du levier mérite d'être
    // rappelée à chaque apparition, quel que soit son poids dans CE tirage précis.
    warning += " Le LQQ est un ETF à levier 2x quotidien : sur plusieurs années, sa performance n'est jamais un simple x2 du Nasdaq-100 (capitalisation quotidienne du levier, dans un sens comme dans l'autre). Pas fait pour être oublié en portefeuille sans suivi.";
  }
  const cta = pickCta(profile, history, { worst, best, selection });
  const { text: contextText, fallbackPick } = contextLine(profile, selection, perf, history);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sig: signature(selection),
    profileId,
    riskId,
    profileName: profile.label,
    riskLabel: RISK_LABELS[riskId],
    title: `${profile.label} ${RISK_LABELS[riskId]}`,
    bound,
    accroche: pickNonRepeating(profile.accroches, history, profileId, "accroche"),
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
  blocks.push(`📊 Exemple de répartition de patrimoine · ${p.title}`);
  blocks.push(p.accroche);
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
  blocks.push(`⚠️ ${p.warning}\n${GUARANTEE_LINE}`);
  blocks.push(SEPARATOR);
  blocks.push(p.cta);
  blocks.push(DISCLAIMER);
  return blocks.join("\n\n");
}

export { fmtPct, RISK_ORDER, RISK_LABELS, RISK_BOUNDS, PROFILES, isCompatible };
