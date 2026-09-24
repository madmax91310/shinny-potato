#!/usr/bin/env node
// Vérification des générations Tweet Midi (src/pages/tweet-midi/) — exécution réelle sur
// l'ensemble du pool, pas un échantillon aléatoire. Committé le 14/09/2026 (audit "outils",
// documenté comme "à committer" dans scripts/README.md depuis le 14/09/2026 également).
//
// Usage : node scripts/verify-tweet-midi.mjs   (ou npm run verify:tweet-midi)
//
// Ce que ça vérifie, sur les ~2000 entrées de ALL_ITEMS (7 formats confondus) :
//   1. buildTweetText() ne lève jamais d'exception et ne renvoie jamais une chaîne vide/trop
//      courte pour être un vrai tweet.
//   2. Aucun placeholder de gabarit non résolu ne fuit dans le texte final (ex. "{yearsPhrase}",
//      "{pct}" laissés tels quels) — le bug exact corrigé lors de l'audit "pools de punchlines"
//      du 29/08/2026, ici transformé en vérification permanente plutôt qu'en correctif ponctuel.
//   3. Vrai/Faux : chaque sourceTermeId pointe vers un terme qui existe RÉELLEMENT dans le
//      Lexique financier (traçabilité, cf. commentaire de tweet-midi/data/vraiFaux.js) — si le
//      Lexique perd un terme un jour, ce script le détecte immédiatement plutôt que de laisser
//      un tweet Vrai/Faux orphelin.
//   4. Fiche lexique / Comparatif ETF (formats "façade", zéro donnée dupliquée) : le texte généré
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
import { TERMES } from "../src/pages/lexique-financier/data.js";
import { getAnnualReturns, MARKET_ASSETS } from "../src/pages/tweet-midi/data/marketHistory.js";

const termeIds = new Set(TERMES.map((t) => t.id));

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
  if (item.format === FORMATS.VRAI_FAUX && item.sourceTermeId && !termeIds.has(item.sourceTermeId)) {
    problems.push(`sourceTermeId "${item.sourceTermeId}" introuvable dans le Lexique financier`);
  }
  if (!error && item.format === FORMATS.PERFORMANCE_DEPUIS && item.mode === MODES.COMPARATIF) {
    const a = getAnnualReturns(item.assetIdA, item.year);
    const b = getAnnualReturns(item.assetIdB, item.year);
    const end = Math.min(a.at(-1).year, b.at(-1).year);
    const annualLines = [...text.matchAll(/^[🟢🔴] (\d{4}) :/gmu)].map((m) => Number(m[1]));
    const expected = [...a, ...b].filter((r) => r.year <= end).map((r) => r.year);
    if (!/^📈 Performance /u.test(text) || (text.match(/^Cumulé : /gmu) ?? []).length !== 2 ||
        !/Cumulé : [^\n]+\n\n💬 Tu as un des deux dans ton portefeuille \?$/u.test(text)) {
      problems.push('structure du comparatif de performances non respectée');
    }
    if (annualLines.length !== expected.length || expected.some((y) => annualLines.filter((v) => v === y).length !== 2)) {
      problems.push(`comparaison d'années non communes (dernière année commune : ${end})`);
    }
    if ((item.assetIdA === 'silver' || item.assetIdB === 'silver') && !text.includes('futures COMEX')) {
      problems.push('nature des données argent absente du comparatif');
    }
    const currencies = [item.assetIdA, item.assetIdB].map((id) => MARKET_ASSETS.find((asset) => asset.id === id)?.currency);
    if (currencies.includes('USD') && !text.includes('non convertis en euros') && !text.includes('sans conversion')) {
      problems.push('rendements en dollars affichés sans mention de devise');
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
