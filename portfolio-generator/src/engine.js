import { YEARS, getAsset } from "./data.js";
import { THESES, TIER_ORDER, TIER_LABELS, TIER_WORST_BOUNDS } from "./theses.js";
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

// Pas d'espace avant le %, virgule décimale française — format compact voulu pour le tweet.
function fmtPct(val) {
  const sign = val >= 0 ? "+" : "-";
  return `${sign}${Math.abs(val).toFixed(1).replace(".", ",")}%`;
}
function fmtAbsPct(val) {
  return `${Math.abs(val).toFixed(1).replace(".", ",")}%`;
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

function withinBound(value, bound) {
  if (bound.min !== null && value < bound.min) return false;
  if (bound.max !== null && value > bound.max) return false;
  return true;
}

function buildSelection(thesis, combo) {
  return combo.assets.map((a) => {
    const asset = getAsset(a.id);
    return {
      ...asset,
      pct: a.pct,
      desc: pick(asset.desc),
      pourquoi: pick(a.pourquoi),
    };
  });
}

// Léger jitter (±5 points entre deux lignes) pour varier les combos d'une génération à l'autre,
// toujours revalidé contre la borne de pire année du palier — jamais de portefeuille hors-charte.
function jitterSelection(selection, bound) {
  const attempts = randInt(0, 2);
  for (let i = 0; i < attempts; i++) {
    if (selection.length < 2) break;
    const [ia, ib] = shuffle(selection.map((_, idx) => idx)).slice(0, 2);
    if (selection[ia].pct - 5 < 5) continue;
    selection[ia].pct -= 5;
    selection[ib].pct += 5;
    const perf = computeYearlyPerf(selection);
    const worst = worstYearOf(perf);
    if (!withinBound(worst.value, bound)) {
      selection[ia].pct += 5;
      selection[ib].pct -= 5;
    }
  }
  return selection;
}

function signature(selection) {
  return selection
    .map((s) => `${s.id}:${s.pct}`)
    .sort()
    .join(",");
}

// Règle #6 : si la meilleure année est écrasée par un seul actif extrême (crypto typiquement),
// on le signale comme non représentatif plutôt que de laisser croire que c'est la norme.
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
  if (selection.some((s) => s.id === "msci_world")) return null;
  const world = getAsset("msci_world");
  const worst = worstYearOf(perf);
  const idx = YEARS.indexOf(worst.year);
  const worldVal = world.r[idx];
  const diff = Math.abs(worldVal - worst.value);
  if (diff < 5) return null;
  const worldVerb = worldVal >= 0 ? "gagnait" : "perdait";
  const portVerb = worst.value >= 0 ? "gagnait" : "perdait";
  return `→ En ${worst.year}, quand le MSCI World ${worldVerb} ${fmtAbsPct(worldVal)}, ce portefeuille ${portVerb} ${fmtAbsPct(worst.value)}.`;
}

function contextLine(thesis, selection, perf) {
  return boostedYearLine(selection, perf) || msciComparisonLine(selection, perf) || `→ ${thesis.contextFallback}`;
}

function pickThesis(targetTierKey) {
  const pool =
    !targetTierKey || targetTierKey === "auto"
      ? THESES
      : THESES.filter((t) => t.tierKey === targetTierKey);
  return pick(pool);
}

export function generatePortfolio(history, targetTierKey) {
  let thesis, combo, selection;
  let tries = 0;
  do {
    thesis = pickThesis(targetTierKey);
    combo = pick(thesis.combos);
    selection = jitterSelection(buildSelection(thesis, combo), TIER_WORST_BOUNDS[thesis.tierKey]);
    tries++;
  } while (history.some((h) => h.sig === signature(selection)) && tries < 60);

  const perf = computeYearlyPerf(selection);
  const worst = worstYearOf(perf);
  const bound = TIER_WORST_BOUNDS[thesis.tierKey];

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sig: signature(selection),
    thesisId: thesis.id,
    profileName: thesis.label,
    tierKey: thesis.tierKey,
    tierLabel: TIER_LABELS[thesis.tierKey],
    bound,
    accroche: pick(thesis.accroches),
    sousTitre: pick(thesis.sousTitres),
    cta: pick(thesis.ctas),
    warning: pick(thesis.warnings),
    selection,
    perf,
    worst,
    context: contextLine(thesis, selection, perf),
  };
}

export function renderTweetText(p) {
  const blocks = [];
  blocks.push(`📊 Exemple de répartition de patrimoine · ${p.profileName}`);
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

export { fmtPct, TIER_ORDER, TIER_LABELS, TIER_WORST_BOUNDS };
