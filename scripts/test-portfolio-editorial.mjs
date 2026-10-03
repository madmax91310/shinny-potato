import assert from "node:assert/strict";
import { ASSETS } from "../src/data/portfolio-assets.js";
import { buildManualPortfolio, generatePortfolio, renderTweetText, PROFILES } from "../src/pages/portfolio-generator/engine.js";
import { ASSET_EDITORIAL, assetEditorial } from "../src/pages/portfolio-generator/asset-editorial.js";
import { buildEditorial } from "../src/pages/portfolio-generator/editorial.js";
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
assert.match(dominant.selection[0].pourquoi, /moitié de l’épargne/);
assert.match(satellite.selection[0].pourquoi, /10%.*davantage en fonds euros/);
const euro = manual([{id:"cac40",pct:30},{id:"eurostoxx50",pct:70}]);
assert.match(euro.logic, /entreprises en commun/);
const crypto = manual([{id:"fonds_euros",pct:58},{id:"bitcoin",pct:10},{id:"msci_world",pct:22},{id:"or",pct:10}]);
assert.match(crypto.hook, /^🧩 Portefeuille Monde \+ Bitcoin/);
assert.doesNotMatch(crypto.hook, /\d+(?:[,.]\d+)?\s*%/);
assert.match(crypto.logic, /petite ligne.*difficile à garder/);
const leverage = manual([{id:"lqq",pct:10},{id:"fonds_euros",pct:90}]);
assert.match(leverage.warning, /2x.*quotidien/);
const zero = manual([{id:"msci_world",pct:100},{id:"bitcoin",pct:0}]);
assert.equal(zero.selection.length, 1);
assert.doesNotMatch(zero.hook + zero.logic + zero.cta, /Bitcoin|crypto/);
for (const asset of ASSETS) {
  const p = manual([{id:asset.id,pct:100}]);
  assert.equal(p.selection[0].pct, 100);
  assert.doesNotMatch(p.hook, /\d+(?:[,.]\d+)?\s*%/);
  assert.match(p.selection[0].pourquoi, /toute l’épargne/);
  assert.ok(p.selection[0].pourquoi.startsWith(assetEditorial(asset).text));
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
  assert.doesNotMatch(p.hook, /\d+(?:[,.]\d+)?\s*%/);
  assert.match(p.selection.find(s => s.id === "bitcoin").pourquoi, new RegExp(`${pct}%`));
  hookHistory.push(p);
}
assert.equal(new Set(hookHistory.map(p => p.hookId)).size, 3);
const largerCrypto = manual([{id:"bitcoin",pct:70},{id:"or",pct:30}]);
assert.doesNotMatch(largerCrypto.hook, /petite place/i);
assert.match(largerCrypto.logic, /70%/);
const largeWithEuros = manual([{id:"bitcoin",pct:45},{id:"fonds_euros",pct:55}]);
assert.doesNotMatch(largeWithEuros.selection[0].pourquoi, /Cette petite poche/);
const majority = manual([{id:"fonds_euros",pct:60},{id:"msci_world",pct:40}]);
const minority = manual([{id:"fonds_euros",pct:20},{id:"msci_world",pct:80}]);
assert.match(majority.hookId, /euros-majority/);
assert.doesNotMatch(minority.hookId, /euros-majority/);
const inflation = manual([{id:"oblig_inflation",pct:20},{id:"or",pct:80}]);
assert.doesNotMatch(inflation.hook, /première place aux obligations|obligations indexées prennent la plus grosse/);
for (const rows of [
  [{id:"bitcoin",pct:60},{id:"ethereum",pct:40}],
  [{id:"msci_europe",pct:50},{id:"oblig_etat_eur_short",pct:50}],
]) {
  const history = [];
  for (let i = 0; i < 3; i++) {
    const p = buildManualPortfolio(rows, "generaliste", history);
    assert.doesNotMatch(p.hook, /\d+(?:[,.]\d+)?\s*%/);
    assert.doesNotMatch(p.logic, /0% restants/);
    history.push(p);
  }
}
assert.deepEqual(Object.keys(ASSET_EDITORIAL).sort(), ASSETS.map(a => a.id).sort());
assert.throws(() => assetEditorial({id:"nouveau_support"}), /Explication.*manquante/);
const checkedPairs = [
  ["msci_world", "msci_acwi", /pays développés/, /développés et émergents/],
  ["bitcoin", "ethereum", /Bitcoin/, /Ethereum.*staking/],
  ["or", "argent", /ne verse pas de revenu/, /industrie/],
  ["lqq", "cl2", /Nasdaq/, /MSCI USA/],
  ["smallcap_monde", "smallcap_europe", /pays développés/, /européennes/],
  ["world_quality_ishares", "world_momentum_ishares", /rentabilité.*endettement/, /tendance/],
  ["oblig_etat_eur_short", "oblig_hy", /échéances courtes/, /moins bien notées/],
  ["sect_sante", "sect_biotech_ishares", /santé du S&P 500/, /essais/],
  ["msci_em", "actions_india_ishares", /IMI/, /un pays/],
];
for (const [a,b,reA,reB] of checkedPairs) {
  const pa = manual([{id:a,pct:100}]).selection[0].pourquoi;
  const pb = manual([{id:b,pct:100}]).selection[0].pourquoi;
  assert.notEqual(pa,pb);
  assert.match(pa,reA); assert.match(pb,reB);
}
const worldEmerging = manual([{id:"msci_world",pct:70},{id:"msci_em",pct:30}]);
const acwiEmerging = manual([{id:"msci_acwi",pct:70},{id:"msci_em",pct:30}]);
assert.match(worldEmerging.selection[1].pourquoi, /ne couvre pas/);
assert.match(acwiEmerging.selection[1].pourquoi, /contient déjà.*au lieu de les ajouter/);
const btcHistory = [];
for (let i=0;i<6;i++) {
  const p = buildManualPortfolio([{id:"fonds_euros",pct:60},{id:"msci_world",pct:30},{id:"bitcoin",pct:10}], "generaliste", btcHistory);
  assert.notEqual(p.hookId, btcHistory.at(-1)?.hookId);
  assert.notEqual(p.ctaTemplate, btcHistory.at(-1)?.ctaTemplate);
  assert.doesNotMatch(p.hook, /\d+(?:[,.]\d+)?\s*%/);
  assert.doesNotMatch(p.cta, /à le |à les |de le |de les /);
  btcHistory.push(p);
}
assert.match(btcHistory[0].hook, /montagnes russes/);
assert.match(btcHistory[0].selection[1].pourquoi, /davantage en fonds euros/);
assert.match(btcHistory[0].cta, /fonds mondial/);
const stale = buildEditorial(minority.selection, [], "bouclier", "prudent", {description:"Fonds euros dominants : 90%."});
assert.doesNotMatch(stale.intro, /90%|Fonds euros dominants/);
for (const profile of PROFILES) for (const risk of Object.keys(profile.riskCombos)) {
  const history = [];
  for (let i=0;i<6;i++) {
    const p = generatePortfolio(history,risk,profile.id);
    assert.doesNotMatch(p.hook, /\d+(?:[,.]\d+)?\s*%|vous|votre/);
    assert.doesNotMatch(p.cta+p.intro+p.logic, /à le |à les |de le |de les |undefined/);
    for (const s of p.selection) assert.ok(s.pourquoi.startsWith(assetEditorial(s).text));
    history.push(p);
  }
}
console.log("OK : 92 supports manuels, tous les profils et paliers, poids, chevauchements et performances.");

// Régressions issues de la relecture : une famille de hook ne doit pas cacher
// une autre poche importante dans la logique de l’ensemble.
const optionsIncome = manual([{id:"qyld_ucits",pct:37},{id:"high_dividend_dist",pct:39},{id:"oblig_etat_us",pct:24}], "rentier");
assert.match(optionsIncome.hookId, /income-options/);
assert.match(optionsIncome.logic, /options.*hausse.*primes/);
assert.match(optionsIncome.logic, /dividendes/);
assert.match(optionsIncome.logic, /obligations/);
const indexMix = manual([{id:"msci_acwi",pct:50},{id:"msci_em",pct:30},{id:"oblig_etat_eur_short",pct:20}]);
assert.match(indexMix.logic, /émergente.*déjà présent/);
assert.match(indexMix.logic, /obligations courtes/);
const metalsCrypto = manual([{id:"bitcoin",pct:25},{id:"ethereum",pct:25},{id:"or",pct:25},{id:"argent",pct:25}]);
assert.match(metalsCrypto.logic, /crypto représente 50%/);
assert.match(metalsCrypto.logic, /L’or.*sans revenu/);
assert.match(metalsCrypto.logic, /L’argent.*industrie/);
const themeMoney = manual([{id:"sect_utilities",pct:35},{id:"msci_world",pct:7},{id:"msci_em",pct:10},{id:"monetaire_xeon",pct:38},{id:"or",pct:10}]);
assert.match(themeMoney.logic, /monétaire.*taux courts/);
assert.match(themeMoney.logic, /conviction.*services collectifs/);
assert.doesNotMatch(themeMoney.hook, /quelle place lui donner/);
const factors = manual([{id:"msci_world",pct:20},{id:"world_quality_ishares",pct:25},{id:"world_momentum_ishares",pct:25},{id:"world_minvol_ishares",pct:30}]);
assert.match(factors.hookId, /factors/);
assert.match(factors.logic, /facteurs.*marchés indépendants/);
assert.match(factors.logic, /se recouper/);
const globalHistory = [];
for (const [profile,risk] of [["generaliste","prudent"],["generaliste","defensif"],["generaliste","manuel"]]) {
  const p = buildEditorial(majority.selection,globalHistory,profile,risk);
  assert.notEqual(p.hookId,globalHistory.at(-1)?.hookId);
  assert.notEqual(p.ctaTemplate,globalHistory.at(-1)?.ctaTemplate);
  globalHistory.push({...p,profileId:profile,riskId:risk});
}
assert.equal(new Set(globalHistory.map(p=>p.hookId)).size,3);
const shield = buildEditorial(majority.selection, [globalHistory[0]], "bouclier", "prudent");
assert.notEqual(shield.cta,globalHistory[0].cta);
const mixedWorld = manual([{id:"msci_world",pct:30},{id:"msci_acwi",pct:40},{id:"msci_em",pct:30}]);
assert.match(mixedWorld.selection[2].pourquoi,/contient déjà.*au lieu de les ajouter/);
const reinvestedIncome = manual([{id:"high_dividend",pct:60},{id:"oblig_corp_ig",pct:40}]);
assert.doesNotMatch(reinvestedIncome.hook,/Recevoir des revenus/);
assert.match(reinvestedIncome.logic,/capitalisantes.*réinvestissent/);
const cautiousIncome = buildEditorial(manual([{id:"fonds_euros",pct:50},{id:"high_dividend_dist",pct:12},{id:"oblig_hy",pct:38}]).selection, [], "rentier", "prudent");
assert.match(cautiousIncome.hookId,/income/);
const europeanDebt = manual([{id:"oblig_etat_eur_short",pct:60},{id:"msci_europe",pct:13},{id:"fonds_euros",pct:27}]);
assert.match(europeanDebt.hookId,/europe-lending/);
assert.doesNotMatch(europeanDebt.cta,/indice mondial/);
for (const p of [optionsIncome,indexMix,metalsCrypto,themeMoney,factors,...globalHistory]) {
  assert.doesNotMatch(p.hook,/\d+(?:[,.]\d+)?\s*%/);
  assert.doesNotMatch(p.selection.map(s=>s.pourquoi).join(" "), /assez pour compter dans le résultat/);
  for (const s of p.selection) assert.ok(s.desc.split(/\s+/).length <= 22);
}
console.log("OK : logique complète, revenus/options, facteurs, descriptions courtes et rotation entre profils et modes.");
