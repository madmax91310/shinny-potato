import { ASSETS, CATEGORIES, YEARS, getAsset } from "./data.js";
import {
  INTROS,
  RISK_TIERS,
  THEMES,
  FACT_ASSET_TEMPLATES,
  FACT_MSCI_TEMPLATES,
  CLOSING_LINES,
  DISCLAIMER,
  SEPARATOR,
} from "./copy.js";

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
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function fmtPct(val, withSign = true) {
  const sign = val > 0 && withSign ? "+" : "";
  return `${sign}${val.toFixed(1).replace(".", ",")} %`;
}

function generatePercentages(n) {
  const totalUnits = 20; // 100% en unités de 5%
  const minUnits = 1;
  const maxUnits = Math.min(12, totalUnits - (n - 1) * minUnits);
  const units = Array(n).fill(minUnits);
  let remaining = totalUnits - n * minUnits;
  let guard = 0;
  while (remaining > 0 && guard < 500) {
    const idx = randInt(0, n - 1);
    if (units[idx] < maxUnits) {
      units[idx]++;
      remaining--;
    }
    guard++;
  }
  return units.map((u) => u * 5);
}

function pickSelection() {
  const catKeys = shuffle(Object.keys(CATEGORIES));
  const n = randInt(3, 5);
  const chosenCats = catKeys.slice(0, n);
  const selection = chosenCats.map((cat) => {
    const options = ASSETS.filter((a) => a.cat === cat);
    const asset = pick(options);
    const descIdx = randInt(0, asset.desc.length - 1);
    return { ...asset, descIdx };
  });
  const pcts = generatePercentages(n);
  selection.forEach((s, i) => (s.pct = pcts[i]));
  return shuffle(selection);
}

function signature(selection) {
  return selection
    .map((s) => s.id)
    .sort()
    .join(",");
}

function weightedRisk(selection) {
  return selection.reduce((sum, s) => sum + (s.risk * s.pct) / 100, 0);
}

function riskTierKey(score) {
  if (score <= 1.7) return "prudent";
  if (score <= 2.3) return "defensif";
  if (score <= 3.1) return "equilibre";
  if (score <= 3.9) return "dynamique";
  return "offensif";
}

function tagWeight(selection, tag) {
  return selection
    .filter((s) => (s.tags || []).includes(tag))
    .reduce((sum, s) => sum + s.pct, 0);
}

function detectTheme(selection) {
  const techW = tagWeight(selection, "tech");
  const usW = tagWeight(selection, "us");
  const europeW = tagWeight(selection, "europe");
  const antiInflW =
    tagWeight(selection, "antiinflation") +
    selection
      .filter((s) => s.cat === "matieres_premieres" && !(s.tags || []).includes("antiinflation"))
      .reduce((sum, s) => sum + s.pct, 0);
  const cryptoW = selection.filter((s) => s.cat === "crypto").reduce((sum, s) => sum + s.pct, 0);

  if (techW >= 55) return "tech100";
  if (cryptoW >= 25) return "cryptoCurieux";
  if (antiInflW >= 40) return "antiInflation";
  if (europeW >= 55) return "proEuropeen";
  if (usW >= 55) return "proAmericain";
  if (selection.length === 5) {
    const pcts = selection.map((s) => s.pct);
    const spread = Math.max(...pcts) - Math.min(...pcts);
    if (spread <= 15) return "everything";
  }
  return null;
}

function computeYearlyPerf(selection) {
  const perf = {};
  YEARS.forEach((y, idx) => {
    perf[y] = selection.reduce((sum, s) => sum + (s.r[idx] * s.pct) / 100, 0);
  });
  return perf;
}

function worstYear(perf) {
  let worst = null;
  YEARS.forEach((y) => {
    if (!worst || perf[y] < perf[worst]) worst = y;
  });
  return { year: worst, value: perf[worst] };
}

function assetFact(selection) {
  const top = selection.reduce((a, b) => (b.pct > a.pct ? b : a));
  let bestIdx = 0;
  YEARS.forEach((y, idx) => {
    if (Math.abs(top.r[idx]) > Math.abs(top.r[bestIdx])) bestIdx = idx;
  });
  return pick(FACT_ASSET_TEMPLATES)(top.name, YEARS[bestIdx], top.r[bestIdx]);
}

function msciFact(selection, perf) {
  const world = getAsset("msci_world");
  let best = null;
  YEARS.forEach((y, idx) => {
    const wv = world.r[idx];
    const pv = perf[y];
    const diff = Math.abs(wv - pv);
    if (!best || diff > best.diff) best = { year: y, wv, pv, diff };
  });
  if (best.diff < 6) return assetFact(selection);
  return pick(FACT_MSCI_TEMPLATES)(best.year, best.wv, best.pv);
}

function maybeFact(selection, perf) {
  if (Math.random() < 0.5) return null;
  const hasWorld = selection.some((s) => s.id === "msci_world");
  const useMsci = !hasWorld && Math.random() < 0.5;
  return useMsci ? msciFact(selection, perf) : assetFact(selection);
}

export function generatePortfolio(history) {
  let selection;
  let tries = 0;
  do {
    selection = pickSelection();
    tries++;
  } while (history.some((h) => h.sig === signature(selection)) && tries < 100);

  const score = weightedRisk(selection);
  const tierKey = riskTierKey(score);
  const tier = RISK_TIERS[tierKey];
  const themeKey = detectTheme(selection);
  const theme = themeKey ? THEMES[themeKey] : null;

  const profileName = theme ? theme.name : tier.label;
  const tagline = capitalize(pick(theme ? theme.taglines : tier.taglines));
  const intro = pick(INTROS);
  const warning = pick(tier.warnings);
  const engagement = pick(tier.engagements);
  const closingLines = shuffle(CLOSING_LINES);

  const perf = computeYearlyPerf(selection);
  const worst = worstYear(perf);
  const fact = maybeFact(selection, perf);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sig: signature(selection),
    selection,
    riskScore: score,
    tierKey,
    tierLabel: tier.label,
    profileName,
    tagline,
    intro,
    warning,
    engagement,
    closingLines,
    perf,
    worst,
    fact,
  };
}

export function renderTweetText(p) {
  const lines = [];
  lines.push(`📊 Exemple de répartition de patrimoine · ${p.profileName}`);
  lines.push(`${p.selection.length} classes d'actifs. ${p.tagline}`);
  lines.push(p.intro);
  lines.push(SEPARATOR);
  lines.push(
    p.selection
      .map((s) => `${CATEGORIES[s.cat].emoji} ${s.pct}% ${s.name} → ${s.desc[s.descIdx]}`)
      .join("\n")
  );
  lines.push(SEPARATOR);
  const perfBlock = [];
  perfBlock.push("📈 Performances simulées :");
  perfBlock.push(YEARS.map((y) => `${y} : ${fmtPct(p.perf[y])}`).join(" · "));
  perfBlock.push(`→ Pire année : ${fmtPct(p.worst.value)} en ${p.worst.year}.`);
  if (p.fact) perfBlock.push(p.fact);
  lines.push(perfBlock.join("\n"));
  lines.push(p.warning);
  lines.push(p.closingLines.join("\n"));
  lines.push(SEPARATOR);
  lines.push(`${DISCLAIMER}\n${p.engagement}`);
  return lines.join("\n\n");
}

export { fmtPct };
