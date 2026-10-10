import { benchmarkKey } from '../../data/asset-selection.js';
import { portfolioPostEditorial, portfolioPostName } from './postEditorial.js';
import { ASSETS, getAsset } from '../../data/portfolio-assets.js';
import { computeYearlyPerf, performanceExcerpt, performanceYears, assetReturn, performanceNotes } from './performance.js';
import {
  PROFILES, RISK_ORDER, RISK_LABELS, RISK_BOUNDS, WORLD_OPTIONS, LEVERAGE_OPTIONS,
  isCompatible, getFrequencyCap, PRO_EUROPE_CORE_IDS,
} from "./theses.js";
import { exposureVector, exposureSignature, exposureDistance } from "./exposures.js";
import { getRecipes, withinRecipe } from "./recipes.js";
import { buildEditorial } from "./editorial.js";

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
// isCompatible(profileId, riskId). Chaque paire dispose de plusieurs constructions.
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
      desc: asset.desc[0],
    };
  });
}

// Échange de 1 à 25 points entre deux lignes, dans les limites propres à la recette.
// Chaque échange est annulé s’il casse ces limites, le filtre historique ou une règle
// du profil. Le levier et la conviction centrale thématique sont fixes dans recipes.js.
function jitterSelection(selection, bound, profileId, riskId, recipe) {
  const attempts = randInt(3, 9);
  for (let i = 0; i < attempts; i++) {
    if (selection.length < 2) break;
    const [ia, ib] = shuffle(selection.map((_, idx) => idx)).slice(0, 2);
    const amount = randInt(1, 25);
    if (selection[ia].pct - amount < 5) continue;
    selection[ia].pct -= amount;
    selection[ib].pct += amount;
    const perf = computeYearlyPerf(selection);
    const worst = worstYearOf(perf);
    if (!withinRecipe(selection, recipe) || !withinBound(worst.value, bound) || violatesProfileInvariant(profileId, selection, riskId)) {
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

function worstYearOf(perf) {
  const availableYears = performanceYears(perf).filter((y) => Number.isFinite(perf[y]));
  let worst = availableYears[0];
  availableYears.forEach((y) => {
    if (perf[y] < perf[worst]) worst = y;
  });
  return { year: worst, value: perf[worst] };
}

function bestYearOf(perf) {
  const availableYears = performanceYears(perf).filter((y) => Number.isFinite(perf[y]));
  let best = availableYears[0];
  availableYears.forEach((y) => {
    if (perf[y] > perf[best]) best = y;
  });
  return { year: best, value: perf[best] };
}

// Règle #6 (brief original) : si la meilleure année est écrasée par un seul actif extrême
// (crypto typiquement), on le signale comme non représentatif plutôt que de laisser croire que
// c'est la norme.
function boostedYearLine(selection, perf) {
  const best = bestYearOf(perf);

  let driver = null;
  selection.forEach((s) => {
    if (!driver || assetReturn(s, best.year) > assetReturn(driver, best.year)) driver = s;
  });
  if (driver && assetReturn(driver, best.year) > 90) {
    return `→ ${best.year} boosté par ${driver.name} (${fmtPct(assetReturn(driver, best.year))} cette année-là). Non représentatif.`;
  }
  return null;
}

function msciComparisonLine(selection, perf) {
  if (selection.some((s) => WORLD_OPTIONS.includes(s.id))) return null;
  const world = getAsset("msci_world");
  const worst = worstYearOf(perf);
  const worldVal = assetReturn(world, worst.year);
  if (!Number.isFinite(worldVal)) return null;
  const diff = Math.abs(worldVal - worst.value);
  if (diff < 5) return null;
  const worldVerb = worldVal >= 0 ? "gagnait" : "perdait";
  const portVerb = worst.value >= 0 ? "gagnait" : "perdait";
  // Seul 2022 est sourcé au factsheet officiel (2 décimales) ; les autres années restent des
  // approximations illustratives, affichées avec la même précision que le reste du tweet.
  const worldFmt = worst.year === 2022 ? fmtAbsPctPrecise(worldVal) : fmtAbsPct(worldVal);
  return `→ En ${worst.year}, quand le MSCI World ${worldVerb} ${worldFmt}, ce portefeuille ${portVerb} ${fmtAbsPct(worst.value)}.`;
}

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

// La saisie manuelle partage le modèle éditorial de la génération automatique.
export function buildManualPortfolio(rawSelection, profileId, history) {
  const profile = PROFILES.find((p) => p.id === profileId);
  const selection = rawSelection.filter(r => r.pct > 0).map((r) => {
    const asset = getAsset(r.id);
    return {
      ...asset,
      pct: r.pct,
      desc: asset.desc[0],
    };
  });

  const perf = computeYearlyPerf(selection);
  const worst = worstYearOf(perf);
  const best = bestYearOf(perf);
  const closestRiskId = closestRiskTier(worst.value);

  const contextText = boostedYearLine(selection, perf) || msciComparisonLine(selection, perf) || "";
  const editorial = buildEditorial(selection, history, profileId, "manuel");

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
    selection,
    perf,
    worst,
    best,
    context: contextText,
    contextFallbackPick: null,
    ...editorial,
  };
}

function pickRecipe(profileId, riskId, history) {
  const recipes = getRecipes(profileId, riskId);
  const recent = history.filter(h => h.profileId === profileId && h.riskId === riskId);
  const last = recent.at(-1)?.recipeId;
  const candidates = recipes.filter(r => r.id !== last);
  const count = r => recent.filter(h => h.recipeId === r.id).length;
  const minimum = Math.min(...candidates.map(count));
  return pick(candidates.filter(r => count(r) === minimum));
}

export function generatePortfolio(history, targetRiskKey, targetProfileKey) {
  const assetUsage = computeAssetUsage(history);
  const pairUsage = computePairUsage(history);

  const { profileId, riskId } = pickPair(targetRiskKey, targetProfileKey, pairUsage);
  const profile = PROFILES.find(p => p.id === profileId);
  const combo = pickRecipe(profileId, riskId, history);
  const bound = RISK_BOUNDS[riskId];
  const used = new Set(history.map(h => h.exposureSig ?? exposureSignature(h.selection)));
  const recent = history.filter(h => h.profileId === profileId && h.riskId === riskId)
    .slice(-20).map(h => exposureVector(h.selection));
  let selection, fallback, bestScore = -Infinity, freshCandidates = 0;
  // Compare plusieurs tirages de la même recette ; la rotation des recettes reste prioritaire.
  // Un changement d’émetteur ne suffit plus à faire passer une allocation pour nouvelle.
  for (let tries = 0; tries < 200 && freshCandidates < 16; tries++) {
    const candidate = jitterSelection(buildSelection(combo, assetUsage, history.length), bound, profileId, riskId, combo);
    if (!withinRecipe(candidate, combo) || !withinBound(worstYearOf(computeYearlyPerf(candidate)).value, bound)
      || violatesProfileInvariant(profileId, candidate, riskId)) continue;
    fallback ??= candidate;
    if (used.has(exposureSignature(candidate))) continue;
    freshCandidates++;
    const vector = exposureVector(candidate);
    const score = recent.length ? Math.min(...recent.map(old => exposureDistance(vector, old))) : 100;
    if (score > bestScore) { selection = candidate; bestScore = score; }
  }
  // Un historique saturé ne doit jamais conduire à relâcher les règles de risque.
  selection ??= fallback;
  if (!selection) throw new Error("Aucune composition respectant le profil et le risque n’a été trouvée.");

  const perf = computeYearlyPerf(selection);
  const worst = worstYearOf(perf);
  if (!withinBound(worst.value, bound) || violatesProfileInvariant(profileId, selection, riskId)) throw new Error("Aucune composition respectant le profil et le risque n’a été trouvée.");

  const contextText = boostedYearLine(selection, perf) || msciComparisonLine(selection, perf) || "";
  const editorial = buildEditorial(selection, history, profileId, riskId);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sig: signature(selection),
    mode: "auto",
    exposureSig: exposureSignature(selection),
    recipeId: combo.id,
    recipeLabel: combo.label,
    profileId,
    riskId,
    profileName: profile.label,
    riskLabel: RISK_LABELS[riskId],
    title: `${profile.label} ${RISK_LABELS[riskId]}`,
    bound,
    selection,
    perf,
    worst,
    context: contextText,
    contextFallbackPick: null,
    ...editorial,
  };
}

export function renderTweetText(p) {
  // Rebuild from the actual holdings as saved history can contain the old copy.
  const index = Number(p.hookId?.match(/-(\d+)$/)?.[1] ?? 0) % 3;
  const editorial = portfolioPostEditorial(p.selection);
  const blocks = [editorial.hooks[index], '💼 La répartition'];
  // Sort a copy: recipe slots and replacements still rely on the stored order.
  const ordered = [...p.selection].filter(s => s.pct > 0).sort((a, b) => b.pct - a.pct);
  blocks.push(ordered.map(s => `${s.emoji} ${s.pct}% ${portfolioPostName(s)}`).join("\n"));
  blocks.push(performanceExcerpt(computeYearlyPerf(p.selection)));
  const notes = performanceNotes(p.selection, { includeMethod: false });
  if (notes) blocks.push(notes);
  blocks.push('La pire année civile observée n’est pas une perte maximale : une baisse en cours d’année peut être plus forte.');
  blocks.push(`📌 ${editorial.thesis}`);
  blocks.push('💬 Que penses-tu de ce portefeuille ?');
  return blocks.join("\n\n");
}

export { fmtPct, RISK_ORDER, RISK_LABELS, RISK_BOUNDS, PROFILES, isCompatible };


// Replacements use the recipe's allowed slots, plus supports of exactly the same
// benchmark. Keep income policy for income profiles; revalidate historical risk.
export function getReplacementCandidates(portfolio, assetId) {
  if (portfolio.mode !== 'auto') return [];
  const index = portfolio.selection.findIndex(asset => asset.id === assetId);
  const recipe = getRecipes(portfolio.profileId, portfolio.riskId).find(item => item.id === portfolio.recipeId);
  if (index < 0 || !recipe?.assets[index]) return [];
  const slot = recipe.assets[index];
  const ids = slot.idOptions ?? [slot.id];
  const original = portfolio.selection[index];
  const existing = new Set(portfolio.selection.map(asset => asset.id));
  const keys = new Set(ids.map(id => benchmarkKey(getAsset(id)?.isin)).filter(Boolean));
  return ASSETS.filter(asset => !existing.has(asset.id) &&
    (ids.includes(asset.id) || (benchmarkKey(asset.isin) && keys.has(benchmarkKey(asset.isin)))) &&
    (portfolio.profileId !== 'rentier' || Boolean(asset.distributing) === Boolean(original.distributing)))
    .filter(asset => {
      const selection = portfolio.selection.map((row, i) => i === index ? { ...asset, pct: row.pct, desc: asset.desc[0] } : row);
      const perf = computeYearlyPerf(selection);
      return performanceYears(perf).length === 6 && performanceYears(perf).every(year => Number.isFinite(perf[year])) && withinRecipe(selection, recipe) &&
        withinBound(worstYearOf(perf).value, RISK_BOUNDS[portfolio.riskId]) &&
        !violatesProfileInvariant(portfolio.profileId, selection, portfolio.riskId);
    }).map(asset => ({ ...asset, sameBenchmark: Boolean(benchmarkKey(original.isin)) && benchmarkKey(asset.isin) === benchmarkKey(original.isin) }))
    .sort((a, b) => Number(b.sameBenchmark) - Number(a.sameBenchmark) || a.name.localeCompare(b.name, 'fr'));
}

export function replacePortfolioAsset(portfolio, assetId, replacementId, history = []) {
  const replacement = getReplacementCandidates(portfolio, assetId).find(asset => asset.id === replacementId);
  if (!replacement) throw new Error('Ce remplacement ne respecte pas les règles du portefeuille.');
  const selection = portfolio.selection.map(asset => asset.id === assetId ? { ...getAsset(replacementId), pct: asset.pct, desc: getAsset(replacementId).desc[0] } : asset);
  const perf = computeYearlyPerf(selection);
  return { ...portfolio, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sig: signature(selection), exposureSig: exposureSignature(selection), selection, perf,
    worst: worstYearOf(perf), best: bestYearOf(perf),
    context: boostedYearLine(selection, perf) || msciComparisonLine(selection, perf) || '',
    contextFallbackPick: null, ...buildEditorial(selection, history, portfolio.profileId, portfolio.riskId) };
}

