import assert from "node:assert/strict";
import { ASSETS, YEARS } from "../src/data/portfolio-assets.js";
import { buildManualPortfolio, generatePortfolio, renderTweetText, PROFILES } from "../src/pages/portfolio-generator/engine.js";
import { ASSET_EDITORIAL, assetEditorial } from "../src/pages/portfolio-generator/asset-editorial.js";
import { buildEditorial } from "../src/pages/portfolio-generator/editorial.js";
import { computeYearlyPerf, annualizedReturn, formatPerformance } from "../src/pages/portfolio-generator/performance.js";
const manual = (rows, profile = "generaliste") => buildManualPortfolio(rows, profile, []);
const base = [{id:"msci_world",pct:60},{id:"sp500",pct:40}];
for (const profile of PROFILES) {
  const p = manual(base, profile.id);
  assert.match(p.logic, /entreprises en commun/);
  assert.deepEqual(p.perf, computeYearlyPerf(p.selection));
  assert.doesNotMatch(renderTweetText(p), /🔍 La logique de l’ensemble|💡/);
  assert.doesNotMatch(p.warning + p.cta, /Ethereum|Bitcoin|absence d.actions américaines/i);
}
const dominant = manual([{id:"msci_world",pct:90},{id:"or",pct:10}]);
const satellite = manual([{id:"msci_world",pct:10},{id:"fonds_euros",pct:90}]);
assert.match(dominant.selection[0].pourquoi, /moitié de l’épargne/);
assert.match(satellite.selection[0].pourquoi, /10%.*davantage en fonds euros/);
const euro = manual([{id:"cac40",pct:30},{id:"eurostoxx50",pct:70}]);
assert.match(euro.logic, /entreprises en commun/);
const crypto = manual([{id:"fonds_euros",pct:58},{id:"bitcoin",pct:10},{id:"msci_world",pct:22},{id:"or",pct:10}]);
assert.match(crypto.hook, /^🧩 .*Bitcoin.*exemple de portefeuille/i);
assert.match(crypto.hook, /\d+(?:[,.]\d+)?\s*%/);
assert.match(crypto.logic, /petite ligne.*difficile à garder/);
const leverage = manual([{id:"lqq",pct:10},{id:"fonds_euros",pct:90}]);
assert.match(leverage.warning, /2x.*quotidien/);
const zero = manual([{id:"msci_world",pct:100},{id:"bitcoin",pct:0}]);
assert.equal(zero.selection.length, 1);
assert.doesNotMatch(zero.hook + zero.logic + zero.cta, /Bitcoin|crypto/);
for (const asset of ASSETS) {
  const p = manual([{id:asset.id,pct:100}]);
  assert.equal(p.selection[0].pct, 100);
  assert.match(p.hook, /\d+(?:[,.]\d+)?\s*%/);
  assert.match(p.selection[0].pourquoi, /toute l’épargne/);
  assert.ok(p.selection[0].pourquoi.startsWith(assetEditorial(asset).text));
  assert.doesNotMatch(renderTweetText(p), /undefined|NaN|\{pct\}/);
}
for (const profile of PROFILES) for (const risk of Object.keys(profile.riskCombos)) {
  const p = generatePortfolio([], risk, profile.id);
  assert.ok(/^🧩 .*exemple de portefeuille/i.test(p.hook));
  assert.match(p.sousTitre, /La répartition/);
  assert.ok(p.logic.length > 50);
  assert.deepEqual(p.perf, computeYearlyPerf(p.selection));
}
// La sélection manuelle n’hérite pas du profil choisi dans le formulaire.
for (const profile of PROFILES) {
  const p = manual([{id:"fonds_euros",pct:100}], profile.id);
  assert.match(p.hook, /^🧩 .*fonds euros/i);
  assert.doesNotMatch(p.hook, /Crypto-Curieux|Bitcoin|Thématique|à la carte/i);
}
const headingCases = [
  [[{id:"sect_tech",pct:60},{id:"or",pct:40}], "tech et or"],
  [[{id:"high_dividend_dist",pct:60},{id:"oblig_etat_us",pct:40}], "dividendes et obligations"],
  [[{id:"msci_europe",pct:75},{id:"or",pct:25}], "à dominante européenne"],
  [[{id:"ethereum",pct:40},{id:"argent",pct:30},{id:"scpi",pct:30}], ""],
];
for (const [rows] of headingCases) {
  assert.match(manual(rows).hook, /^🧩 .*exemple de portefeuille/i);
}
// Les familles d’accroches tournent même si les poids changent entre deux générations.
const hookHistory = [];
for (const pct of [10, 11, 12, 13, 14, 15]) {
  const p = buildManualPortfolio([{id:"bitcoin",pct},{id:"msci_world",pct:100-pct}], "generaliste", hookHistory);
  assert.notEqual(p.hookId, hookHistory.at(-1)?.hookId);
  assert.match(p.hook, /\d+(?:[,.]\d+)?\s*%/);
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
    assert.match(p.hook, /\d+(?:[,.]\d+)?\s*%/);
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
  assert.match(p.hook, /\d+(?:[,.]\d+)?\s*%/);
  assert.doesNotMatch(p.cta, /à le |à les |de le |de les /);
  btcHistory.push(p);
}
assert.match(btcHistory[0].hook, /Bitcoin.*fonds euros|fonds euros.*Bitcoin/);
assert.match(btcHistory[0].selection[1].pourquoi, /davantage en fonds euros/);
assert.match(btcHistory[0].cta, /fonds mondial/);
const stale = buildEditorial(minority.selection, [], "bouclier", "prudent", {description:"Fonds euros dominants : 90%."});
assert.doesNotMatch(stale.intro, /90%|Fonds euros dominants/);
for (const profile of PROFILES) for (const risk of Object.keys(profile.riskCombos)) {
  const history = [];
  for (let i=0;i<6;i++) {
    const p = generatePortfolio(history,risk,profile.id);
    assert.match(p.hook, /\d+(?:[,.]\d+)?\s*%|vous|votre/);
    assert.doesNotMatch(p.cta+p.intro+p.logic, /à le |à les |de le |de les |undefined/);
    for (const s of p.selection) assert.ok(s.pourquoi.startsWith(assetEditorial(s).text));
    history.push(p);
  }
}
console.log(`OK : ${ASSETS.length} supports manuels, tous les profils et paliers, poids, chevauchements et performances.`);

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
  assert.match(p.hook,/\d+(?:[,.]\d+)?\s*%/);
  assert.doesNotMatch(p.selection.map(s=>s.pourquoi).join(" "), /assez pour compter dans le résultat/);
  for (const s of p.selection) assert.ok(s.desc.split(/\s+/).length <= 22);
}
console.log("OK : logique complète, revenus/options, facteurs, descriptions courtes et rotation entre profils et modes.");

// Les nouvelles expositions doivent expliquer toute la construction, même sans World classique.
const newExposures = manual([{id:'sp500_equal_weight',pct:40},{id:'russell2000_spdr',pct:25},{id:'world_ex_usa',pct:35}]);
for (const role of [/équipondéré/, /Russell 2000/, /hors États-Unis/]) assert.match(newExposures.logic, role);
const longBonds = manual([{id:'msci_world_ishares',pct:70},{id:'oblig_eur_long_ishares',pct:30}]);
assert.match(longBonds.logic,/obligations longues.*sensibilité aux taux/s);
for (const isin of ['IE0006WW1TQ4','FR0014017NX3']) {
  const asset = ASSETS.find(a => a.isin === isin);
  assert.match(asset.confidenceNote,/2020–2025/);
}

// Compact publication stays identifiable and keeps instrument-specific roles.
const example = manual([{id:'msci_world_amundi_pea',pct:24},{id:'nasdaq100_ishares',pct:9},{id:'actions_value',pct:28},{id:'cl2',pct:4},{id:'msci_em_spdr',pct:20},{id:'or_wisdomtree',pct:15}]);
const compactText = renderTweetText(example);
assert.match(example.hook, /4 % d’ETF à levier.*24 %.*World/);
assert.ok(compactText.length < 2200);
assert.doesNotMatch(compactText, /La logique|💡|→|Pire année|Base historique/);
assert.match(compactText, /levier 2x est quotidien/);
assert.equal(compactText.split('\n').filter(line => /^\S+ \d+% /.test(line)).length, 6);
assert.match(example.selection.find(s=>s.id==='actions_value').shortRole,/moins chères/);
assert.match(acwiEmerging.selection[1].shortRole, /émergents déjà présents/);
assert.match(worldEmerging.selection[1].shortRole, /ne couvre pas.*petites entreprises/);
const { dataLabels, portfolioAssetLabel } = await import('../src/pages/portfolio-generator/compact.js');
assert.deepEqual(dataLabels({confidenceNote:'Rendements NAV de la part en euros ; arrondis publiés par l’émetteur.'}), []);
assert.deepEqual(dataLabels({confidenceNote:'Rendements de la part en dollars.'}), ['Données en USD']);
assert.ok(dataLabels(ASSETS.find(a=>a.isin==='FR0014017NX3')).includes('Historique reconstitué'));
assert.equal(portfolioAssetLabel(example.selection[3]), 'MSCI USA ×2 · Amundi');
for (const asset of ASSETS) {
  const p = manual([{id:asset.id,pct:100}]);
  assert.ok(p.selection[0].shortRole.split(/\s+/).length <= 45, asset.id);
  assert.ok(p.hook.length <= 200, asset.id);
  assert.match(renderTweetText(p), /pas un conseil en investissement/);
}
// Saved portfolios from the previous generator also receive compact export copy.
assert.doesNotMatch(renderTweetText({...example, hook:'🧩 Portefeuille Généraliste\nLongue accroche', selection:example.selection.map(s=>({id:s.id,isin:s.isin,name:s.name,pct:s.pct,emoji:s.emoji,cat:s.cat}))}), /Longue accroche|La logique/);
console.log('OK : publication compacte, chevauchements, titres courts et précision des données.');

// Une note qui mentionne une simulation ne transforme pas une série officielle en proxy.
const nasdaqOfficial = ASSETS.find(a=>a.id==='nasdaq100_ishares');
assert.deepEqual(dataLabels(nasdaqOfficial), ['Données en USD']);
const silverOfficial = ASSETS.find(a=>a.id==='argent');
assert.deepEqual(dataLabels(silverOfficial), ['Données en USD']);
assert.deepEqual(silverOfficial.r, [46.2, -13, 3.5, -0.8, 21.3, 148.6]);
const { getInstrumentAnnualPerformance } = await import('../src/data/instrument-returns.js');
const { getInstrumentComparatorReturns } = await import('../src/data/instrument-comparator-returns.js');
assert.equal(getInstrumentAnnualPerformance(silverOfficial.isin).currency,'USD');
assert.deepEqual(getInstrumentComparatorReturns(silverOfficial.isin),{y2023:-0.8,y2024:21.3,y2025:148.6});
assert.ok(dataLabels(ASSETS.find(a=>a.id==='bitcoin')).includes('Historique reconstitué'));
assert.ok(dataLabels(ASSETS.find(a=>a.id==='quality_dividend')).includes('Historique reconstitué'));
assert.ok(dataLabels(ASSETS.find(a=>a.id==='quality_dividend')).includes('Indice modifié'));
console.log('OK : séries officielles USD distinguées des proxies, argent sans conversion.');

// Les quatre exemples validés décrivent des poids de la composition, pas des rendements.
for (const [rows, hook, logic, question] of [
 [[{id:'fonds_euros',pct:40},{id:'monetaire_xeon',pct:38},{id:'msci_acwi_ishares',pct:22}], /22 % en actions, 78 % en fonds euros et monétaire/, /ne répondent pas aux mêmes conditions de garantie/, /actions à 22 %/],
 [[{id:'sp500_ishares',pct:36},{id:'world_ex_usa',pct:18},{id:'oblig_corp_ig',pct:46}], /36 % en actions américaines, 18 % dans les autres pays développés/, /marchés émergents ne sont pas inclus/, /poids des États-Unis/],
 [[{id:'msci_world_ishares',pct:46},{id:'bitcoin_wisdomtree',pct:18},{id:'nasdaq100_ishares',pct:16},{id:'cl2',pct:10},{id:'or_ishares',pct:10}], /18 % de Bitcoin et 10 % d’ETF à levier/, /renforce cette exposition/, /à la fois la crypto et le levier/],
 [[{id:'sp500_equal_weight',pct:32},{id:'russell2000_spdr',pct:49},{id:'world_ex_usa',pct:19}], /49 % en petites entreprises américaines, 81 % en actions américaines/, /Toute l’allocation est exposée aux actions/, /petites entreprises américaines/],
]) {
 const p=manual(rows);const text=renderTweetText(p);
 assert.match(p.hook,hook);assert.match(text,logic);assert.match(text,question);
 assert.match(text,/💼 La répartition/);assert.match(text,/🔎 Le choix derrière cette allocation/);
 assert.doesNotMatch(text,/\nPour /);
 assert.deepEqual(p.perf,computeYearlyPerf(p.selection));
 const stale=renderTweetText({...p,hook:'🧩 Exemple de portefeuille : ancien texte',cta:'💬 Ancienne question',hookId:'ancien-0'});
 assert.match(stale,hook);assert.doesNotMatch(stale,/ancien texte|Ancienne question/);
}
const moneyOnly=manual([{id:'monetaire_xeon',pct:80},{id:'msci_world',pct:20}]);
assert.match(moneyOnly.hook,/80 % en monétaire/);
assert.doesNotMatch(renderTweetText(moneyOnly),/fonds euros/);
const cryptoOnly=manual([{id:'bitcoin',pct:60},{id:'ethereum',pct:40}]);
assert.match(cryptoOnly.hook,/100 % en crypto/);
assert.doesNotMatch(renderTweetText(cryptoOnly),/fonds euros|hors crypto/);
console.log('OK : accroches chiffrées, agrégats, questions adaptées et anciens portefeuilles reconstruits.');
assert.match(renderTweetText(optionsIncome), /obligations financent l’État américain/);
assert.match(renderTweetText(optionsIncome), /options.*hausse.*primes/s);
assert.match(renderTweetText(indexMix), /échéances courtes pour limiter/);
for (const asset of ASSETS) assert.doesNotMatch(manual([{id:asset.id,pct:100}]).selection[0].shortRole,/ et limiter|ligne réunit.*une seule ligne/);

// Le tweet reprend exactement les rendements de la composition, comme l’image.
for (const p of [example, ...PROFILES.map(profile => manual(base, profile.id))]) {
  const text = renderTweetText(p);
  for (const year of YEARS) assert(text.includes(`${year} : ${formatPerformance(p.perf[year])}`));
  assert(text.includes(`Performance annualisée (2020 à 2025) : ${formatPerformance(annualizedReturn(p.perf))} par an`));
  assert(text.includes('rééquilibrage annuel, sans conversion des devises'));
}
const alternating = Object.fromEntries(YEARS.map((year, index) => [year, index % 2 ? -10 : 10]));
assert(Math.abs(annualizedReturn(alternating) - (Math.sqrt(.99) - 1) * 100) < 1e-10, 'Capitalisation géométrique, pas moyenne arithmétique');
const incomplete = { ...alternating, 2021: null, 2020: 0 };
const incompleteTweet = renderTweetText({ ...example, perf: incomplete });
assert(incompleteTweet.includes('2020 : +0,0 %'));
assert(incompleteTweet.includes('2021 : non disponible'));
assert(incompleteTweet.includes('Performance annualisée (2020 à 2025) : non disponible'));
assert(!/NaN|undefined/.test(incompleteTweet));
console.log('OK : performances annuelles et annualisée dans le tweet, capitalisation géométrique, zéro et historique incomplet.');
