import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIVRET_A, INFLATION, ASSETS } from '../src/data/market-history.js';
import { INFLATION_MONTHLY } from '../src/data/inflation-monthly.js';
import { computeBenchmarkSeries } from '../src/pages/investment-calculator/lib.js';
import { computeBrut, computePoste, buildTweetText, fmtEUR } from '../src/pages/purchasing-power/lib.js';
import { getBenchmarkPerformance } from '../src/pages/tweet-midi/data/marketHistory.js';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
// Base 2025=100 : les indices d’août, et non les glissements annuels, déterminent le résultat.
close(computeBrut(1000, 2025).newAmount, 1033.5);
assert.ok(fmtEUR(computeBrut(1000, 2025).newAmount).includes('1\u202f034'));
close(computeBrut(1000, 2025).inflationCumPct, 3.35);
close(computePoste(1000, 2025, 'alimentation').newAmount, 1016.9);
close(computePoste(1000, 2025, 'carburant').newAmount, 1156);
close(computeBrut(1000, 2024).newAmount, 1000 * 1.009 * 1.0335);
// Taux effectivement applicables et dépôt de fin de mois, sans intérêt sur les intérêts avant décembre.
close(computeBenchmarkSeries(LIVRET_A, '2026-01', '2026-02', 1000, 'lump').finalValue, 1001.25);
close(computeBenchmarkSeries(LIVRET_A, '2026-07', '2026-08', 1000, 'lump').finalValue, 1000 + 17 / 12);
close(computeBenchmarkSeries(LIVRET_A, '2026-01', '2026-02', 1000, 'dca').finalValue, 2001.25);
close(computeBenchmarkSeries(LIVRET_A, '2024-12', '2025-12', 1000, 'lump').finalValue, 1000 + (30 + 24 * 6 + 17 * 5) / 12);
const acrossYear = computeBenchmarkSeries(LIVRET_A, '2024-11', '2025-01', 1000, 'lump');
close(acrossYear.series[1], 1002.5);
close(acrossYear.finalValue, 1002.5 * 1.0025);
// Le recul de septembre reste un recul ; aucune moyenne annuelle positive n’est substituée.
close(computeBenchmarkSeries(INFLATION, '2026-08', '2026-09', 1000, 'lump').finalValue, 997);
close(getBenchmarkPerformance('2026-08', '2026-09').inflationPct, -0.3);
const lastInflationMonth=Object.keys(INFLATION_MONTHLY).sort().at(-1);
const [lastYear,lastMonth]=lastInflationMonth.split('-').map(Number);
const unpublishedMonth=new Date(Date.UTC(lastYear,lastMonth,1)).toISOString().slice(0,7);
assert.throws(() => computeBenchmarkSeries(INFLATION,lastInflationMonth,unpublishedMonth,1000,'lump'), /absente/);
const snapshot = JSON.parse(readFileSync(new URL('./source-snapshots/household-benchmarks-2026-10-03.json', import.meta.url)));
assert.deepEqual(Object.fromEntries(Object.keys(snapshot.monthlyRates).map(month=>[month,INFLATION_MONTHLY[month]])), snapshot.monthlyRates);
assert.deepEqual(snapshot.provisionalMonths, ['2026-09']);
assert.equal(INFLATION[2026], undefined); // aucune moyenne annuelle fictive pour une année inachevée.
for (let year = 2010; year <= 2025; year++) for (const posteId of [null, 'loyer', 'alimentation', 'carburant']) {
  const text = buildTweetText({ amount: 1000, startYear: year, mode: posteId ? 'par-poste' : 'brut', posteId });
  assert.ok(!/NaN|undefined|provisoire|12 mois glissants/.test(text));
  assert.ok(text.includes('août 2026'));
}
const gold=JSON.parse(readFileSync(new URL('../src/data/worldbank-gold-monthly.json',import.meta.url)));
assert.deepEqual(ASSETS.or.points.at(-1),{date:gold.points.at(-1)[0],price:gold.points.at(-1)[1]});
console.log('Repères ménages : raccord base 2025, taux Livret A, capitalisation, DCA, 64 tweets et observations mensuelles validés.');
