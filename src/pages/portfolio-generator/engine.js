import { assetKind, constructionIssues } from './controls.js';
import { benchmarkKey } from '../../data/asset-selection.js';
import { portfolioPostEditorial, portfolioPostName } from './postEditorial.js';
import { ASSETS, getAsset } from '../../data/portfolio-assets.js';
import { getInstrumentName } from '../../data/instruments.js';
import { computeYearlyPerf, annualizedReturn, formatPerformance, performanceExcerpt, performanceYears, assetReturn, performanceNotes, hasCompleteAutomaticWindow } from './performance.js';
import {
  PROFILES, RISK_ORDER, RISK_LABELS, RISK_BOUNDS, WORLD_OPTIONS, LEVERAGE_OPTIONS,
  isCompatible, getFrequencyCap, PRO_EUROPE_CORE_IDS,
} from "./theses.js";
import { exposureFamily, exposureVector, exposureSignature, exposureDistance } from "./exposures.js";
import { getRecipes, withinRecipe } from "./recipes.js";
import { buildEditorial } from "./editorial.js";

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
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
  for (const h of history) {
    for (const family of new Set(h.selection.map(s => exposureFamily(s.id)))) {
      counts[`family:${family}`] = (counts[`family:${family}`] || 0) + 1;
    }
  }
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
  // Qualify the existing options before frequency rotation. An unavailable
  // alternative must not crowd out the remaining qualified issuer once its
  // session cap is reached. Keep the six-year financial admission unchanged.
  const eligible = slot.idOptions.filter(id => hasCompleteAutomaticWindow(getAsset(id)));
  // The final combined-window guard rejects recipes with no qualified option.
  if (!eligible.length) return slot.idOptions[0];
  // Choose an exposure first: multiple issuers must not give a theme extra tickets.
  const families = [...new Set(eligible.map(exposureFamily))];
  const family = weightedPick(families, families.map(key => 1 / ((usageCounts[`family:${key}`] || 0) + 1)));
  let candidates = eligible.filter(id => exposureFamily(id) === family);
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
function jitterSelection(selection, bound, profileId, riskId, recipe, locked = []) {
  const attempts = randInt(3, 9);
  for (let i = 0; i < attempts; i++) {
    const movable = selection.map((row, idx) => locked.some(lock => lock.id === row.id) ? -1 : idx).filter(idx => idx >= 0);
    if (movable.length < 2) break;
    const [ia, ib] = shuffle(movable).slice(0, 2);
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
  if (!Number.isFinite(value)) return false;
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
  if (constructionIssues(selection, riskId).length) return true;
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

// Same construction ceilings and historical floor as Auto, on a complete common
// six-year window. Missing years never become index returns for the selected share.
export function compatibleRiskTier(selection, perf) {
  const years = performanceYears(perf);
  if (years.length !== 6 || years.some((year, i) => !Number.isFinite(perf[year]) || perf[year] < -100 ||
    (i > 0 && year !== years[i - 1] + 1))) return null;
  // Underlying equity/bond weights of mixed funds are not qualified by this model.
  if (selection.some(row => assetKind(row.id) === 'multi-asset')) return null;
  const worst = Math.min(...years.map(year => perf[year]));
  return RISK_ORDER.find(risk => withinBound(worst, RISK_BOUNDS[risk]) &&
    constructionIssues(selection, risk).length === 0) ?? null;
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
  const closestRiskId = compatibleRiskTier(selection, perf);

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
    closestRiskLabel: closestRiskId ? RISK_LABELS[closestRiskId] : null,
    closestBound: closestRiskId ? RISK_BOUNDS[closestRiskId] : null,
    selection,
    perf,
    worst,
    best,
    context: contextText,
    contextFallbackPick: null,
    ...editorial,
  };
}

// Match exact supports to distinct slots, preserving each recipe's limits.
function lockSlots(recipe, locked) {
  const matched = new Map();
  function match(i) {
    if (i === locked.length) return true;
    const lock = locked[i];
    for (let j = 0; j < recipe.assets.length; j++) {
      const slot = recipe.assets[j];
      if (matched.has(j) || !(slot.idOptions ?? [slot.id]).includes(lock.id)
        || lock.pct < slot.minPct || lock.pct > slot.maxPct) continue;
      matched.set(j, lock);
      if (match(i + 1)) return true;
      matched.delete(j);
    }
    return false;
  }
  if (!match(0)) return null;
  const fixed = locked.reduce((sum, row) => sum + row.pct, 0);
  const free = recipe.assets.filter((_, i) => !matched.has(i));
  return fixed + free.reduce((sum, row) => sum + row.minPct, 0) <= 100
    && fixed + free.reduce((sum, row) => sum + row.maxPct, 0) >= 100 ? matched : null;
}
function lockedSelection(recipe, locked, usage, length) {
  const slots = lockSlots(recipe, locked);
  if (!slots) return null;
  const selection = buildSelection(recipe, usage, length);
  for (const [index, lock] of slots) selection[index] = { ...getAsset(lock.id), pct: lock.pct, desc: getAsset(lock.id).desc[0] };
  let delta = 100 - selection.reduce((sum, row) => sum + row.pct, 0);
  for (const index of shuffle(selection.map((_, i) => i).filter(i => !slots.has(i)))) {
    const row = selection[index], slot = recipe.assets[index];
    const transfer = delta > 0 ? Math.min(delta, slot.maxPct - row.pct) : -Math.min(-delta, row.pct - slot.minPct);
    row.pct += transfer; delta -= transfer;
  }
  return delta === 0 ? selection : null;
}
function rankedRecipes(profileId, riskId, history, locked) {
  const recipes = getRecipes(profileId, riskId).filter(r => lockSlots(r, locked));
  const recent = history.filter(h => h.profileId === profileId && h.riskId === riskId);
  const last = recent.at(-1)?.recipeId;
  const counts = new Map();
  for(const h of recent)counts.set(h.recipeId,(counts.get(h.recipeId)||0)+1);
  const usage = computeAssetUsage(recent);
  // Preserve recipe rotation, then favour families least seen in this profile/risk.
  // Multiple issuers for the same exposure do not get extra weight.
  const rarity = r => {
    const families = [...new Set(r.assets.flatMap(slot => (slot.idOptions || [slot.id]).map(exposureFamily)))];
    return families.reduce((sum,family)=>sum+1/(1+(usage[`family:${family}`]||0)),0)/families.length;
  };
  const scores=new Map(recipes.map(r=>[r.id,rarity(r)]));
  return shuffle(recipes).sort((a,b) => Number(a.id === last) - Number(b.id === last) || (counts.get(a.id)||0) - (counts.get(b.id)||0) || scores.get(b.id)-scores.get(a.id));
}

export function generatePortfolio(history, targetRiskKey, targetProfileKey, { locked = [] } = {}) {
  if (new Set(locked.map(row => row.id)).size !== locked.length || locked.some(row => !Number.isInteger(row.pct) || row.pct <= 0))
    throw new Error('Les lignes conservées doivent être distinctes et avoir un poids entier positif.');
  if (locked.length && (!targetRiskKey || targetRiskKey === 'auto' || !targetProfileKey || targetProfileKey === 'auto'))
    throw new Error('Conserver une ligne nécessite de conserver le profil et le risque.');
  if (locked.length && !isCompatible(targetProfileKey, targetRiskKey)) throw new Error('Profil et risque incompatibles avec les lignes conservées.');
  const assetUsage = computeAssetUsage(history);
  const pairUsage = computePairUsage(history);

  const { profileId, riskId } = pickPair(targetRiskKey, targetProfileKey, pairUsage);
  const profile = PROFILES.find(p => p.id === profileId);
  const recipes = rankedRecipes(profileId, riskId, history, locked);
  let combo;
  const bound = RISK_BOUNDS[riskId];
  const used = new Set(history.map(h => h.exposureSig ?? exposureSignature(h.selection)));
  const recent = history.filter(h => h.profileId === profileId && h.riskId === riskId)
    .slice(-20).map(h => exposureVector(h.selection));
  let selection, fallback, bestScore = -Infinity, freshCandidates = 0;
  // Compare plusieurs tirages de la même recette ; la rotation des recettes reste prioritaire.
  // Un changement d’émetteur ne suffit plus à faire passer une allocation pour nouvelle.
  for (const recipe of recipes) {
    combo = recipe;
    for (let tries = 0; tries < 240 && freshCandidates < 32; tries++) {
      const initial = lockedSelection(combo, locked, assetUsage, history.length);
      if (!initial) continue;
      const candidate = jitterSelection(initial, bound, profileId, riskId, combo, locked);
      const candidatePerf = computeYearlyPerf(candidate);
      if (performanceYears(candidatePerf).length !== 6 || !Object.values(candidatePerf).every(Number.isFinite)) continue;
      if (!withinRecipe(candidate, combo) || !withinBound(worstYearOf(computeYearlyPerf(candidate)).value, bound)
        || violatesProfileInvariant(profileId, candidate, riskId)) continue;
      fallback ??= candidate;
      if (used.has(exposureSignature(candidate))) continue;
      freshCandidates++;
      const vector = exposureVector(candidate);
      const score = recent.length ? Math.min(...recent.map(old => exposureDistance(vector, old))) : 100;
      const diverseScore = score + Math.random() * 3;
      if (diverseScore > bestScore) { selection = candidate; bestScore = diverseScore; }
    }
    if (selection || fallback) break;
  }
  // Un historique saturé ne doit jamais conduire à relâcher les règles de risque.
  selection ??= fallback;
  if (!selection) throw new Error(locked.length ? "Aucune composition compatible avec ces lignes conservées. Déverrouille une ligne pour élargir les choix." : "Aucune composition respectant le profil et le risque n’a été trouvée.");

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
  const perf = computeYearlyPerf(p.selection);
  const years = performanceYears(perf);
  const annualized = annualizedReturn(perf);
  const editorial = portfolioPostEditorial(p.selection);
  const holdings = p.selection.filter(s => s.pct > 0);
  const question = holdings.length === 1
    ? 'quel placement compose ce portefeuille ?'
    : holdings.every(s => s.isin && /\bETF\b/.test(getInstrumentName(s.isin)))
      ? 'quels ETF composent ce portefeuille ?'
      : 'quels placements composent ce portefeuille ?';
  const index = Number(p.hookId?.match(/-(\d+)$/)?.[1] ?? 0) % 3;
  const questions = [question, 'de quoi se compose ce portefeuille ?', 'comment est réparti ce portefeuille ?'];
  const hook = annualized === null
    ? '📈 Quelles performances pour ce portefeuille ? 👀'
    : `📈 ${formatPerformance(annualized)} par an sur la période ${years[0]}–${years.at(-1)} : ${questions[index]} 👀`;
  const blocks = [`${hook}\n\n${editorial.hooks[index].split('\n\n')[0]}\n\nRépartition et performances simulées 👇`, '💼 La répartition'];
  if (p.strategyLabel) blocks.splice(1, 0, `${p.strategyEmoji ?? '🌦️'} ${p.strategyLabel}`);
  // Sort a copy: recipe slots and replacements still rely on the stored order.
  const ordered = [...p.selection].filter(s => s.pct > 0).sort((a, b) => b.pct - a.pct);
  blocks.push(ordered.map(s => `${s.emoji} ${s.pct.toLocaleString('fr-FR')}% ${portfolioPostName(s)}`).join("\n"));
  blocks.push(performanceExcerpt(perf));
  const notes = performanceNotes(p.selection, { includeMethod: false });
  if (notes) blocks.push(notes);
  blocks.push('Pas un conseil.');
  blocks.push(`📌 ${p.strategyThesis ?? editorial.thesis}`);
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

