#!/usr/bin/env node
// Stress-test du Générateur de portefeuilles (src/pages/portfolio-generator/).
//
// Committé le 14/09/2026 (retour utilisateur, audit "outils") : jusqu'ici, chaque vérification de
// borne de perte (ex. l'ajustement Crypto-Curieux Dynamique du 14/09/2026, ou les audits "variété
// insuffisante"/"post-audit v2" mentionnés dans theses.js) était un script ad hoc recréé en session,
// jamais committé. Ce fichier remplace ces scripts jetables par un outil réutilisable, pour que toute
// future modification de riskCombo puisse être revérifiée avec la même méthode plutôt que de repartir
// de zéro.
//
// Usage :
//   node scripts/stress-test-portfolios.mjs                          → mode "regression" (défaut)
//   node scripts/stress-test-portfolios.mjs --mode=combo --profile=crypto_curieux --risk=dynamique
//
// Mode "regression" (à relancer après TOUTE modification de theses.js ou engine.js) :
//   Génère un grand nombre de portefeuilles réels via generatePortfolio() (la même fonction que
//   l'app), pour chaque paire profil × risque valide, et vérifie que rien ne casse jamais :
//     - la borne de perte du palier de risque (RISK_BOUNDS[riskId])
//     - l'invariante Pro-Européen (≥70% Europe)
//     - les invariantes Crypto-Curieux (plancher/plafond Bitcoin par palier, levier ≥10% si présent)
//   Sort avec le code 1 si une violation est trouvée (utilisable comme porte de CI), 0 sinon.
//
// Mode "combo" (à lancer AVANT de committer un nouveau poids sur une ligne à risque d'un riskCombo,
// ex. relever un ETF à levier ou une ligne Bitcoin) :
//   Prend les poids ACTUELS de theses.js pour le combo demandé et teste EXHAUSTIVEMENT toutes les
//   combinaisons possibles des idOptions du combo (pas un tirage aléatoire) contre la borne de perte
//   du palier — c'est la méthode utilisée pour valider le passage du levier Crypto-Curieux Dynamique
//   de 4% à 10% le 14/09/2026 (cf. commentaire de ce combo dans theses.js). Affiche le pire cas exact
//   (quelle combinaison, quelle année) et si ça reste dans les clous.
//
// Si le mode "combo" échoue : ne PAS committer le nouveau poids tel quel. Soit financer le
// changement en réduisant une ligne dont le rendement est proche de celui de la ligne qu'on
// augmente (cf. le raisonnement documenté sur le combo Crypto-Curieux Dynamique dans theses.js —
// réduire une ligne défensive pour financer une ligne agressive aggrave presque toujours le pire
// cas plus qu'il ne le déplace), soit revoir le poids à la baisse.

import { generatePortfolio, renderTweetText } from "../src/pages/portfolio-generator/engine.js";
import {
  PROFILES, RISK_BOUNDS, RISK_ORDER,
} from "../src/pages/portfolio-generator/theses.js";
import { getAsset, YEARS } from "../src/pages/portfolio-generator/data.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ""), true];
  })
);
const mode = args.mode ?? "regression";

const PRO_EUROPE_CORE_IDS = ["eurostoxx50", "eurostoxx50_ishares", "cac40", "tech_europe", "smallcap_europe", "oblig_etat_eur_short", "msci_europe"];
const CRYPTO_CURIEUX_BITCOIN_BOUNDS = {
  defensif: { min: null, max: 10 },
  equilibre: { min: 10, max: 20 },
  dynamique: { min: 15, max: 30 },
};
const LEVERAGE_IDS = ["lqq", "cl2"];

function checkInvariants(p) {
  const problems = [];
  const tweet = renderTweetText(p);
  if (/\b(?:undefined|NaN)\b/.test(tweet)) problems.push("tweet contenant une valeur indéfinie");
  if (/Méthode\s*:|Historique incomplet|non disponible|n\.d\./i.test(tweet)) problems.push("note de méthode ou année vide dans le tweet");
  for (const y of YEARS) if (!Number.isFinite(p.perf[y])) problems.push(`performance absente en ${y}`);
  if (!tweet.includes(`⚠️ ${p.warning}`)) problems.push("avertissement absent du tweet");
  const weights = p.selection.map((s) => s.pct);
  const expected = new Set([...weights, Math.abs(p.worst.value)]);
  for (let i = 0; i < weights.length; i++) {
    for (let j = i + 1; j < weights.length; j++) {
      expected.add(weights[i] + weights[j]);
      for (let k = j + 1; k < weights.length; k++) expected.add(weights[i] + weights[j] + weights[k]);
    }
  }
  for (const number of `${p.hook} ${p.intro}`.matchAll(/([+-]?\d+(?:[,.]\d+)?)\s*%/g)) {
    const value = Math.abs(Number(number[1].replace(',', '.')));
    if (![...expected].some((v) => Math.abs(v - value) < 0.11)) {
      problems.push(`chiffre d'accroche ${number[0]} absent de la composition et du résultat`);
    }
  }
  if (p.bound.min !== null && p.worst.value < p.bound.min - 1e-9) {
    problems.push(`borne de perte dépassée : ${p.worst.value.toFixed(2)}% en ${p.worst.year} < plancher ${p.bound.min}%`);
  }
  if (p.profileId === "pro_europe") {
    const europePct = p.selection.filter((s) => PRO_EUROPE_CORE_IDS.includes(s.id)).reduce((sum, s) => sum + s.pct, 0);
    if (europePct < 70) problems.push(`invariante Pro-Européen violée : ${europePct}% Europe < 70%`);
  }
  if (p.profileId === "crypto_curieux") {
    const bounds = CRYPTO_CURIEUX_BITCOIN_BOUNDS[p.riskId];
    if (bounds) {
      const btc = p.selection.find((s) => s.id.startsWith("bitcoin"));
      const btcPct = btc ? btc.pct : 0;
      if (bounds.min !== null && btcPct < bounds.min) problems.push(`Bitcoin sous le plancher : ${btcPct}% < ${bounds.min}%`);
      if (bounds.max !== null && btcPct > bounds.max) problems.push(`Bitcoin au-dessus du plafond : ${btcPct}% > ${bounds.max}%`);
    }
    const lev = p.selection.find((s) => LEVERAGE_IDS.includes(s.id));
    if (lev && lev.pct < 10) problems.push(`ETF à levier sous le plancher : ${lev.pct}% < 10%`);
  }
  const hasEth = p.selection.some((s) => s.id === "ethereum");
  if (/\bEthereum\b/.test(p.cta) && !hasEth) problems.push(`CTA mentionne Ethereum sans ligne Ethereum dans le tirage : "${p.cta}"`);
  return problems;
}

function runRegression() {
  const N_PER_COMBO = 300;
  let history = [];
  let totalChecked = 0;
  let totalViolations = 0;
  const perCombo = new Map();

  PROFILES.forEach((profile) => {
    Object.keys(profile.riskCombos).forEach((riskId) => {
      const key = `${profile.label} / ${riskId}`;
      perCombo.set(key, { count: 0, violations: [] });
    });
  });

  for (let i = 0; i < N_PER_COMBO * perCombo.size; i++) {
    const p = generatePortfolio(history, "auto", "auto");
    history.push(p);
    if (history.length > 40) history.shift(); // borne mémoire, comme en usage réel dans l'app
    totalChecked++;
    const key = `${p.profileName} / ${p.riskId}`;
    const entry = perCombo.get(key);
    entry.count++;
    const problems = checkInvariants(p);
    if (problems.length) {
      totalViolations += problems.length;
      entry.violations.push({ id: p.id, problems });
    }
  }

  console.log(`Mode regression — ${totalChecked} portefeuilles générés (${perCombo.size} combos profil×risque, ~${N_PER_COMBO} chacun)\n`);
  let anyFail = false;
  for (const [key, entry] of perCombo) {
    const status = entry.violations.length === 0 ? "OK" : "ÉCHEC";
    if (entry.violations.length) anyFail = true;
    console.log(`  [${status}] ${key} — ${entry.count} générations, ${entry.violations.length} violation(s)`);
    entry.violations.slice(0, 3).forEach((v) => {
      v.problems.forEach((pb) => console.log(`      · ${pb}`));
    });
  }
  console.log(`\nTotal : ${totalViolations} violation(s) sur ${totalChecked} portefeuilles.`);
  if (anyFail) {
    console.log("\nÉCHEC — une ou plusieurs invariantes ont été violées. Ne pas déployer tel quel :");
    console.log("revoir la dernière modification de theses.js/engine.js avant de recommiter.");
    process.exitCode = 1;
  } else {
    console.log("\nOK — aucune violation sur l'échantillon testé.");
  }
}

function cartesian(...arrays) {
  return arrays.reduce((acc, arr) => acc.flatMap((a) => arr.map((b) => [...a, b])), [[]]);
}

function worstYearFor(lines) {
  let worst = Infinity;
  let worstYear = null;
  YEARS.forEach((y, idx) => {
    // Même règle que computeYearlyPerf : une année manquante pour une ligne
    // rend le résultat du portefeuille indisponible, et non égal à zéro.
    if (lines.some((l) => !Number.isFinite(getAsset(l.id).r[idx]))) return;
    let perf = 0;
    lines.forEach((l) => { perf += (getAsset(l.id).r[idx] * l.pct) / 100; });
    if (perf < worst) { worst = perf; worstYear = y; }
  });
  return { worst, worstYear };
}

function runCombo() {
  const profileId = args.profile;
  const riskId = args.risk;
  if (!profileId || !riskId) {
    console.error("Mode combo requiert --profile=<id> --risk=<prudent|defensif|equilibre|dynamique|offensif>");
    console.error("Profils disponibles : " + PROFILES.map((p) => p.id).join(", "));
    process.exitCode = 1;
    return;
  }
  const profile = PROFILES.find((p) => p.id === profileId);
  if (!profile) { console.error(`Profil inconnu : ${profileId}`); process.exitCode = 1; return; }
  const combo = profile.riskCombos[riskId];
  if (!combo) { console.error(`Pas de combo ${riskId} pour ${profileId}`); process.exitCode = 1; return; }
  const bound = RISK_BOUNDS[riskId];

  const optionLists = combo.assets.map((a) => a.idOptions ?? [a.id]);
  const combos = cartesian(...optionLists);
  let worstOverall = Infinity;
  let worstYear = null;
  let worstCombo = null;

  combos.forEach((ids) => {
    const lines = ids.map((id, i) => ({ id, pct: combo.assets[i].pct }));
    const { worst, worstYear: wy } = worstYearFor(lines);
    if (worst < worstOverall) { worstOverall = worst; worstYear = wy; worstCombo = ids; }
  });

  console.log(`Mode combo — ${profile.label} / ${riskId}`);
  console.log(`Poids actuels : ${combo.assets.map((a) => `${a.pct}%`).join(" + ")} = ${combo.assets.reduce((s, a) => s + a.pct, 0)}%`);
  console.log(`${combos.length} combinaisons de idOptions testées exhaustivement.\n`);
  console.log(`Pire cas : ${worstOverall.toFixed(2)}% en ${worstYear}`);
  console.log(`  combinaison : ${worstCombo.map((id, i) => `${id} (${combo.assets[i].pct}%)`).join(", ")}`);
  console.log(`Plancher du palier : ${bound.min === null ? "aucun" : bound.min + "%"}`);

  if (bound.min !== null && worstOverall < bound.min) {
    console.log(`\nÉCHEC — le pire cas (${worstOverall.toFixed(2)}%) dépasse le plancher de ${bound.min}%.`);
    console.log("Ne pas committer ce poids tel quel — réduire une ligne dont le rendement est proche");
    console.log("de celui de la ligne qu'on augmente plutôt qu'une ligne défensive (cf. theses.js,");
    console.log("combo Crypto-Curieux Dynamique, pour un exemple de ce raisonnement appliqué).");
    process.exitCode = 1;
  } else {
    console.log("\nOK — le pire cas reste dans le plancher du palier sur toutes les combinaisons testées.");
  }
}

if (mode === "regression") runRegression();
else if (mode === "combo") runCombo();
else {
  console.error(`Mode inconnu : ${mode} (attendu : regression | combo)`);
  process.exitCode = 1;
}
