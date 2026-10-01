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
assert.match(crypto.hook, /58%.*10%/);
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
  assert.match(p.sousTitre, /La répartition/);
  assert.ok(p.logic.length > 50);
  assert.deepEqual(p.perf, computeYearlyPerf(p.selection));
}
console.log("OK : 92 supports manuels, tous les profils et paliers, poids, chevauchements et performances.");

