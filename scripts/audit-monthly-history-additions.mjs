import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MONTHLY_HISTORY_ADDITIONS, MONTHLY_HISTORY_ADDITIONS_REVIEW } from '../src/data/monthly-history-additions.js';
import { ASSETS, BASELINE_ASSETS, ASSET_ORDER, getAssetMinDate, SPARSE_MONTHLY_DATA_IDS } from '../src/data/market-history.js';
import { derive, buildTweetText } from '../src/pages/investment-calculator/lib.js';
import { computeComparativeSeries } from '../src/pages/investment-calculator/videoExport.js';
import { getAnnualReturns, MARKET_ASSETS, ANNIVERSAIRE_ELIGIBLE_ASSETS } from '../src/pages/tweet-midi/data/marketHistory.js';
// The parent calculator audit runs active proof checks in its own process.
// Do not compare live observations to its deliberately archived consumer graph.
if (process.env.MONTHLY_ARCHIVE_AUDIT !== '1') await import('./audit-automated-monthly.mjs');
import { HISTORY_FACTS } from '../src/data/history-statistics.js';
const capture = JSON.parse(readFileSync(new URL('./source-snapshots/monthly-history-additions-2026-10-03.json', import.meta.url)));
const localDate = (t, timeZone) => new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t * 1000));
assert.deepEqual(Object.keys(capture.records).sort(), Object.keys(MONTHLY_HISTORY_ADDITIONS).sort());
assert.equal(Object.keys(capture.records).length, 18);
for (const [id, asset] of Object.entries(MONTHLY_HISTORY_ADDITIONS)) {
  const record = capture.records[id], raw = record.monthlyResponse.chart.result[0];
  const review = MONTHLY_HISTORY_ADDITIONS_REVIEW[`history:${id}`];
  assert.equal(BASELINE_ASSETS[id], asset);
  assert.equal(ASSETS[id].currency, asset.currency);
  assert.equal(ASSETS[id].priceUnit, asset.priceUnit);
  assert.equal(raw.meta.symbol, record.symbol); assert.equal(raw.meta.currency, asset.currency);
  assert.equal(getAssetMinDate(id), record.periodStart); assert.equal(asset.points.at(-1).date, '2026-09');
  assert(!SPARSE_MONTHLY_DATA_IDS.has(id)); assert(ASSET_ORDER.includes(id)); assert(MARKET_ASSETS.some(a => a.id === id));
  const anniversary = ANNIVERSAIRE_ELIGIBLE_ASSETS.find(a => a.id === id);
  if (asset.priceUnit === 'points') {
    assert(anniversary?.anniversaryVariant, 'Indice accessible avec variante explicite');
    assert.equal(anniversary.priceUnit, 'points');
  } else assert(!anniversary, 'Prix ajusté exclu de la saisie de cours brut');
  assert.equal(review.checkedAt, capture.checkedAt); assert(review.sourceUrls.includes(record.dailyUrl));
  const months = new Map(raw.timestamp.map((t, i) => [localDate(t, raw.meta.exchangeTimezoneName).slice(0, 7), raw.indicators.quote[0].close[i]]));
  assert.equal(asset.points.length, record.points.length); assert.equal(asset.points.length, record.lastDailyCloses.length);
  const start = Number(record.periodStart.slice(0, 4)) * 12 + Number(record.periodStart.slice(5)) - 1;
  for (const [i, point] of asset.points.entries()) {
    const index = start + i, date = `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}`, daily = record.lastDailyCloses[i];
    assert.equal(point.date, date); assert.equal(point.date, daily.date.slice(0, 7));
    assert.equal(localDate(daily.timestamp, raw.meta.exchangeTimezoneName), daily.date);
    assert(point.price > 0 && Number.isFinite(point.price));
    // Python uses ties-to-even; JS rounds a half upwards. One unit at the sixth
    // decimal is the sole permitted difference in the captured conversion.
    assert(Math.abs(point.price - Math.round(daily.adjclose * 1e6) / 1e6) <= 1.0001e-6); assert.equal(point.price, record.points[i][1]);
    assert(Math.abs(months.get(date) - daily.close) < .011, `${id} ${date} : export mensuel divergent`);
  }
  for (const mode of ['lump', 'dca']) {
    const state = { assetId: id, amountRaw: '100', startYear: 2020, startMonth: 1, mode, overridePriceRaw: '' };
    const prices = ASSETS[id].points.filter(p => p.date >= '2020-01');
    const expected = (mode === 'lump' ? 100 / prices[0].price : prices.reduce((units, p) => units + 100 / p.price, 0)) * prices.at(-1).price;
    const d = derive(state);
    assert.equal(d.effectiveMode, mode); assert(Math.abs(d.result.finalValue - expected) < 1e-7);
    assert(Math.abs(computeComparativeSeries(id, '2020-01', prices.at(-1).date, 100, mode).finalValue - expected) < 1e-7);
    const tweet = buildTweetText(state, d); assert(!/NaN|undefined/.test(tweet));
    assert(tweet.includes(asset.isin ? 'frais du fonds déjà inclus' : id === 'cac40' ? 'dividendes non réinvestis' : 'Cours ajustés'));
  }
  assert.equal(getAnnualReturns(id, 2020).length, Number(ASSETS[id].points.at(-1).date.slice(0, 4)) - 2020);
  assert.equal(HISTORY_FACTS.filter(f => f.id.endsWith(`-${id}`)).length, 2);
}
console.log('18 séries : 2 436 observations, recoupement quotidien/mensuel, DCA, vidéo, Tweet Midi et faits historiques contrôlés.');
