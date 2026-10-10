#!/usr/bin/env node
// Vérification des générations Tweet Midi (src/pages/tweet-midi/) — exécution réelle sur
// l'ensemble du pool, pas un échantillon aléatoire. Committé le 14/09/2026 (audit "outils",
// documenté comme "à committer" dans scripts/README.md depuis le 14/09/2026 également).
//
// Usage : node scripts/verify-tweet-midi.mjs   (ou npm run verify:tweet-midi)
//
// Ce que ça vérifie, sur les ~2000 entrées de ALL_ITEMS (6 formats confondus) :
//   1. buildTweetText() ne lève jamais d'exception et ne renvoie jamais une chaîne vide/trop
//      courte pour être un vrai tweet.
//   2. Aucun placeholder de gabarit non résolu ne fuit dans le texte final (ex. "{yearsPhrase}",
//      "{pct}" laissés tels quels) — le bug exact corrigé lors de l'audit "pools de punchlines"
//      du 29/08/2026, ici transformé en vérification permanente plutôt qu'en correctif ponctuel.
//   3. Fiche lexique / Comparatif ETF (formats "façade", zéro donnée dupliquée) : le texte généré
//      n'est jamais vide — verrait immédiatement si l'appel à getFicheLexiqueText/
//      getComparatifEtfText casse silencieusement (ex. après un renommage d'id en amont).
//
// Sort avec le code 1 si un problème est trouvé (utilisable comme porte de CI) ; imprime un
// rapport par format sinon.
//
// N'exécute PAS le tirage "Aléatoire" lui-même (pickNext/pickForSelection, déjà couvert par la
// logique de poids égal documentée dans lib.js) — se concentre sur la génération de texte, le
// risque le plus direct d'un futur renommage/déplacement de données en amont.

import { ALL_ITEMS, FORMATS, FORMAT_LABELS, MODES, buildTweetText } from "../src/pages/tweet-midi/lib.js";
import { getAnnualReturns } from "../src/pages/tweet-midi/data/marketHistory.js";

import assert from 'node:assert/strict';
import './test-anniversary-editorial.mjs';
import './test-lexicon-editorial.mjs';
import { DEFAULT_THEMES } from '../src/data/etf-themes.js';
import { getComparatifEtfText } from '../src/pages/tweet-midi/data/comparatifEtf.js';
import { buildTweetText as buildEtfTweet } from '../src/pages/etf-tweets/lib/tweetFormat.js';

// Vérifie la sortie réellement copiée par Tweet Midi, y compris les cas où les
// caractéristiques/PEA ne sont pas documentés et les produits qui ne sont pas des ETF.
for (const theme of DEFAULT_THEMES) {
  const text = getComparatifEtfText(theme.id);
  assert.doesNotMatch(text, /^(?:⚖️ Comparatif|📋 Présentation) /u);
  assert.match(text.split('\n')[0], /ETF|ETC/u);
  assert.equal((text.match(/^🆔 ISIN : /gmu) ?? []).length, theme.etfs.length);
  for (const fund of theme.etfs) {
    assert.ok(text.includes(`ISIN : ${fund.isin}`));
    assert.ok(text.includes(`${fund.frais} %`));
  }
  assert.ok(text.endsWith(theme.ctaEngagement));
  assert.ok(!text.includes(theme.ctaPartage));
  assert.doesNotMatch(text, /🎯 À savoir|📌 Les différences/u);
}
assert.equal(new Set(DEFAULT_THEMES.map(theme => getComparatifEtfText(theme.id).split('\n')[0])).size, DEFAULT_THEMES.length);
const unknown = buildEtfTweet({ nom: 'Test', etfs: [{ nom: 'Part sans fiche', isin: 'IE00BD4TXV59', frais: '0,20' }] });
assert.doesNotMatch(unknown, /Éligible au PEA|Dividendes|Réplication|Création/u);
const metals = getComparatifEtfText('etc-metaux');
assert.match(metals, /Voici trois ETC à comparer/u);
assert.doesNotMatch(metals, /🏦 PEA/u);
assert.doesNotMatch(metals, /💶 Dividendes/u);
assert.match(metals, /Frais de gestion : 0,49 %/u);
assert.match(metals, /Taux de swap annuel : 0,45 %/u);
const space = getComparatifEtfText('spatial');
assert.match(space, /^🚀 Quel ETF/u);
assert.ok(space.includes('Voici un ETF à découvrir'));
assert.ok(!space.includes('📌 À retenir'));
assert.ok(!space.includes('📌 Les différences'));
assert.match(getComparatifEtfText('usa'), /Dow Jones/u);
assert.match(getComparatifEtfText('usa'), /Nasdaq/u);
const world = getComparatifEtfText('monde');
assert.match(world, /Voici trois ETF à comparer/u);
assert.doesNotMatch(world, /🏭|🏢|📊 Performances/u);
assert.equal((world.match(/^🏦 PEA : ✅ \| CTO : ✅/gmu) ?? []).length, 2);
const unknownStatus = buildEtfTweet({ nom: 'Test', etfs: [{ nom: 'Sans statut', isin: 'IE00BD4TXV59', frais: '0,20' }] });
assert.doesNotMatch(unknownStatus, /🏦 PEA|🏦 CTO/u);


// Extras génériques passés à toutes les générations : ignorés par les formats qui n'en ont pas
// besoin (cf. buildTweetText, destructuring avec valeurs par défaut) — une seule valeur de test
// suffit puisqu'on vérifie la ROBUSTESSE du gabarit, pas l'exactitude d'un prix réel.
const TEST_EXTRA = { niveauActuel: "100", niveauActuelB: "120", includeBenchmark: true };

// Un texte de tweet réel ne contient jamais de placeholder de gabarit brut : {motEnCamelCase} ou
// {mot_en_snake_case}. Ne matche pas les emojis/ponctuation, seulement un identifiant JS-like
// entre accolades — la même famille de bug que celle trouvée le 29/08/2026 sur {years}.
const LEAKED_PLACEHOLDER_RE = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/;

let totalChecked = 0;
const byFormat = new Map();
const failures = [];

function record(format, ok) {
  const entry = byFormat.get(format) ?? { count: 0, fail: 0 };
  entry.count++;
  if (!ok) entry.fail++;
  byFormat.set(format, entry);
}

for (const item of ALL_ITEMS) {
  totalChecked++;
  let text = "";
  let error = null;
  try {
    text = buildTweetText(item, TEST_EXTRA);
  } catch (e) {
    error = e;
  }

  const problems = [];
  if (error) problems.push(`exception : ${error.message}`);
  else {
    if (!text || text.trim().length < 15) problems.push(`texte vide ou trop court (${text.length} caractères)`);
    const leak = text.match(LEAKED_PLACEHOLDER_RE);
    if (leak) problems.push(`placeholder non résolu dans le texte : "${leak[0]}"`);
  }
  if (!error && item.format === FORMATS.PERFORMANCE_DEPUIS && item.mode === MODES.COMPARATIF) {
    const a = getAnnualReturns(item.assetIdA, item.year);
    const b = getAnnualReturns(item.assetIdB, item.year);
    const end = Math.min(a.at(-1).year, b.at(-1).year);
    const annualLines = [...text.matchAll(/^[🟢🔴] (\d{4}) :/gmu)].map((m) => Number(m[1]));
    const expected = [...a, ...b].filter((r) => r.year <= end).map((r) => r.year);
    if ((text.match(/^📈 Performance .* depuis \d{4} 👇$/gmu) ?? []).length !== 2 ||
        (text.match(/^Cumulé sur la période : /gmu) ?? []).length !== 2) {
      problems.push('structure du comparatif de performances non respectée');
    }
    if (annualLines.length !== expected.length || expected.some((y) => annualLines.filter((v) => v === y).length !== 2)) {
      problems.push(`comparaison d'années non communes (dernière année commune : ${end})`);
    }
  }

  if (!error && item.format === FORMATS.PERFORMANCE_DEPUIS) {
    const blocks = text.split(/\n\n(?=📈)/u);
    const blockPattern = /^📈 Performance [^\n]+ depuis \d{4} 👇\n[^\n]*(?:USD|EUR)[^\n]*\n\n(?:[🟢🔴] \d{4} : [+-]?[\d\s.,]+ %\n)+\nCumulé sur la période : [+-]?[\d\s.,]+ %$/u;
    if (!blocks.every((block) => blockPattern.test(block))) {
      problems.push('format minimal de performance non respecté');
    }
  }

  record(item.format, problems.length === 0);
  if (problems.length) failures.push({ id: item.id, format: item.format, problems });
}

console.log(`${totalChecked} entrées vérifiées (ALL_ITEMS, tous formats confondus).\n`);
for (const [format, entry] of byFormat) {
  const label = FORMAT_LABELS[format] ?? format;
  const status = entry.fail === 0 ? "OK" : "ÉCHEC";
  console.log(`  [${status}] ${label} — ${entry.count} entrées, ${entry.fail} échec(s)`);
}

if (failures.length) {
  console.log(`\n${failures.length} problème(s) trouvé(s), détail (20 premiers) :`);
  failures.slice(0, 20).forEach((f) => {
    console.log(`  · [${f.format}] ${f.id} : ${f.problems.join(" ; ")}`);
  });
  console.log("\nÉCHEC — voir le détail ci-dessus avant de déployer.");
  process.exitCode = 1;
} else {
  console.log("\nOK — aucun problème trouvé sur l'ensemble du pool.");
}
