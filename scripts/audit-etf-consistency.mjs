#!/usr/bin/env node
// Audit croisé ISIN/TER entre les 3 bibliothèques ETF de l'app : Fiches ETF, Générateur de tweets
// ETF (qui alimente le format Comparatif ETF de Tweet Midi — zéro donnée dupliquée, cf.
// tweet-midi/data/comparatifEtf.js) et Comparateur d'indices. Committé le 14/09/2026 (audit
// "outils", documenté comme "à committer" dans scripts/README.md) — reproduit la méthode d'un
// audit ad hoc du 13/09/2026 qui avait trouvé et corrigé une vraie erreur de TER (Quality Factor,
// 0,30% publié à tort au lieu de 0,25%, détectée par exactement cette comparaison).
//
// Usage : node scripts/audit-etf-consistency.mjs   (ou npm run audit:etf-consistency)
//
// Ce que ça fait : regroupe toutes les lignes de fonds des 3 sources par ISIN (le seul identifiant
// vraiment stable — les noms varient légèrement d'un outil à l'autre), et signale tout ISIN dont le
// TER diverge d'une source à l'autre de plus de 0,01 point (tolérance pour l'arrondi d'affichage,
// ex. "0,20%" vs "0,20 %"). Un ISIN qui n'apparaît que dans une seule source n'est PAS un problème
// (couverture différente par design, cf. CLAUDE.md — chaque outil n'a que les fonds dont il a
// besoin) ; seule une VRAIE divergence de valeur sur un même ISIN est signalée.
//
// Sort avec le code 1 si une divergence est trouvée (utilisable comme porte de CI).

import { ETFS } from "../src/pages/etf-sheets/data.js";
import { DEFAULT_THEMES } from "../src/pages/etf-tweets/data/themes.js";
import { FAMILIES } from "../src/pages/index-comparator/data.js";

// Normalise "0,20%", "0,20 %", "0,06" (etf-tweets, pas de signe %) vers un nombre — la seule
// différence entre les 3 sources est le formatage d'affichage, jamais la précision de la donnée
// elle-même (toutes à 2 décimales).
function parseTer(raw) {
  const m = String(raw).match(/(\d+[,.]\d+)/);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

const entries = []; // { isin, source, name, terRaw, terNum }

ETFS.forEach((etf) => {
  entries.push({ isin: etf.isin, source: "Fiches ETF", name: etf.name, terRaw: etf.ter, terNum: parseTer(etf.ter) });
});

DEFAULT_THEMES.forEach((theme) => {
  (theme.etfs ?? []).forEach((etf) => {
    if (!etf.isin) return; // certains fonds placeholder ont un isin vide (cf. createEtf)
    entries.push({ isin: etf.isin, source: "Tweets ETF", name: etf.nom, terRaw: etf.frais, terNum: parseTer(etf.frais) });
  });
});

FAMILIES.forEach((family) => {
  (family.etfGroups ?? []).forEach((group) => {
    (group.funds ?? []).forEach((fund) => {
      if (!fund.isin) return;
      entries.push({ isin: fund.isin, source: "Comparateur d'indices", name: fund.name, terRaw: fund.ter, terNum: parseTer(fund.ter) });
    });
  });
});

const byIsin = new Map();
entries.forEach((e) => {
  if (!byIsin.has(e.isin)) byIsin.set(e.isin, []);
  byIsin.get(e.isin).push(e);
});

console.log(`${entries.length} lignes de fonds collectées (Fiches ETF: ${ETFS.length}, Tweets ETF: ${entries.filter((e) => e.source === "Tweets ETF").length}, Comparateur d'indices: ${entries.filter((e) => e.source === "Comparateur d'indices").length}).`);
console.log(`${byIsin.size} ISIN distincts, dont ${[...byIsin.values()].filter((v) => v.length > 1).length} présents dans plusieurs sources.\n`);

const TOLERANCE = 0.01;
let divergences = 0;

for (const [isin, list] of byIsin) {
  if (list.length < 2) continue;
  const withTer = list.filter((e) => e.terNum !== null);
  if (withTer.length < 2) continue;
  const values = withTer.map((e) => e.terNum);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max - min > TOLERANCE) {
    divergences++;
    console.log(`ÉCART TER — ISIN ${isin} (${list[0].name}) :`);
    withTer.forEach((e) => console.log(`  · ${e.source} : ${e.terRaw} (${e.terNum})`));
    console.log("");
  }
}

if (divergences) {
  console.log(`ÉCHEC — ${divergences} divergence(s) de TER trouvée(s) sur un même ISIN. À trancher avant de déployer`);
  console.log("(cf. méthode de l'audit du 13/09/2026 : recouper via 2 requêtes indépendantes, jamais choisir arbitrairement).");
  process.exitCode = 1;
} else {
  console.log("OK — aucune divergence de TER trouvée sur les ISIN partagés entre les 3 sources.");
}
