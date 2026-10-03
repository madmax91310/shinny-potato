import assert from "node:assert/strict";
import { ASSETS } from "../src/data/portfolio-assets.js";
import { buildManualPortfolio, generatePortfolio, renderTweetText, PROFILES } from "../src/pages/portfolio-generator/engine.js";
import { computeYearlyPerf } from "../src/pages/portfolio-generator/performance.js";
const manual = (rows, profile = "generaliste") => buildManualPortfolio(rows, profile, []);
const base = [{id:"msci_world",pct:60},{id:"sp500",pct:40}];
for (const profile of PROFILES) {
  const p = manual(base, profile.id);
  assert.match(p.logic, /entreprises en commun/);
  assert.deepEqual(p.perf, computeYearlyPerf(p.selection));
  assert.match(renderTweetText(p), /🔍 La logique de l’ensemble/);
  assert.doesNotMatch(p.warning + p.cta, /Ethereum|Bitcoin|absence d.actions américaines/i);
}
const dominant = manual([{id:"msci_world",pct:90},{id:"or",pct:10}]);
const satellite = manual([{id:"msci_world",pct:10},{id:"fonds_euros",pct:90}]);
assert.match(dominant.selection[0].pourquoi, /moitié du capital/);
assert.match(satellite.selection[0].pourquoi, /complémentaire/);
const euro = manual([{id:"cac40",pct:30},{id:"eurostoxx50",pct:70}]);
assert.match(euro.logic, /entreprises en commun/);
const crypto = manual([{id:"fonds_euros",pct:58},{id:"bitcoin",pct:10},{id:"msci_world",pct:22},{id:"or",pct:10}]);
assert.match(crypto.hook, /^🧩 Portefeuille Monde \+ Bitcoin\n\n10% de crypto/);
assert.match(crypto.logic, /poids investi ne suffit pas/);
const leverage = manual([{id:"lqq",pct:10},{id:"fonds_euros",pct:90}]);
assert.match(leverage.warning, /2x.*quotidien/);
const zero = manual([{id:"msci_world",pct:100},{id:"bitcoin",pct:0}]);
assert.equal(zero.selection.length, 1);
assert.doesNotMatch(zero.hook + zero.logic + zero.cta, /Bitcoin|crypto/);
for (const asset of ASSETS) {
  const p = manual([{id:asset.id,pct:100}]);
  assert.equal(p.selection[0].pct, 100);
  assert.match(p.hook, /100%/);
  assert.doesNotMatch(renderTweetText(p), /undefined|NaN|\{pct\}/);
}
for (const profile of PROFILES) for (const risk of Object.keys(profile.riskCombos)) {
  const p = generatePortfolio([], risk, profile.id);
  assert.ok(p.hook.startsWith(`🧩 Portefeuille ${profile.label.replace(/^(?:Le |L['’])/, "")}\n\n`));
  assert.match(p.sousTitre, /La répartition/);
  assert.ok(p.logic.length > 50);
  assert.deepEqual(p.perf, computeYearlyPerf(p.selection));
}
// La sélection manuelle n’hérite pas du profil choisi dans le formulaire.
for (const profile of PROFILES) {
  const p = manual([{id:"fonds_euros",pct:100}], profile.id);
  assert.match(p.hook, /^🧩 Portefeuille à dominante fonds euros\n/);
  assert.doesNotMatch(p.hook, /Crypto-Curieux|Bitcoin|Thématique|à la carte/i);
}
const headingCases = [
  [[{id:"sect_tech",pct:60},{id:"or",pct:40}], "tech et or"],
  [[{id:"high_dividend_dist",pct:60},{id:"oblig_etat_us",pct:40}], "dividendes et obligations"],
  [[{id:"msci_europe",pct:75},{id:"or",pct:25}], "à dominante européenne"],
  [[{id:"ethereum",pct:40},{id:"argent",pct:30},{id:"scpi",pct:30}], ""],
];
for (const [rows, label] of headingCases) {
  assert.equal(manual(rows).hook.split("\n")[0], "🧩 Portefeuille" + (label ? ` ${label}` : ""));
}
// Les familles d’accroches tournent même si les poids changent entre deux générations.
const hookHistory = [];
for (const pct of [10, 11, 12, 13, 14, 15]) {
  const p = buildManualPortfolio([{id:"bitcoin",pct},{id:"msci_world",pct:100-pct}], "generaliste", hookHistory);
  assert.notEqual(p.hookId, hookHistory.at(-1)?.hookId);
  assert.match(p.hook, new RegExp(`${pct}% de crypto`));
  hookHistory.push(p);
}
assert.equal(new Set(hookHistory.map(p => p.hookId)).size, 3);
const largerCrypto = manual([{id:"bitcoin",pct:70},{id:"or",pct:30}]);
assert.doesNotMatch(largerCrypto.hook, /petite place/i);
assert.match(largerCrypto.hook, /70% de crypto/);
const majority = manual([{id:"fonds_euros",pct:60},{id:"msci_world",pct:40}]);
const minority = manual([{id:"fonds_euros",pct:20},{id:"msci_world",pct:80}]);
assert.match(majority.hookId, /euros-majority/);
assert.doesNotMatch(minority.hookId, /euros-majority/);
const inflation = manual([{id:"oblig_inflation",pct:20},{id:"or",pct:80}]);
assert.doesNotMatch(inflation.hook, /première place aux obligations|obligations indexées prennent la plus grosse/);
console.log("OK : 92 supports manuels, tous les profils et paliers, poids, chevauchements et performances.");

