import { readFileSync } from 'node:fs';
import { ASSETS } from '../src/data/market-history.js';
const r = JSON.parse(readFileSync(new URL('../src/data/bitcoin-yahoo-monthly.json', import.meta.url)));
const evidence = JSON.parse(readFileSync(new URL('./source-snapshots/bitcoin-automated.json', import.meta.url)));
if (JSON.stringify(evidence.points) !== JSON.stringify(r.points) || evidence.checkedAt !== r.checkedAt) throw new Error('Bitcoin active data/evidence mismatch');
const raw = evidence.rawResponse['1mo'].chart.result[0];
if (r.provider !== 'Yahoo Finance' || r.symbol !== 'BTC-USD' || r.currency !== 'USD' || raw.meta.symbol !== r.symbol || raw.meta.currency !== r.currency || raw.meta.dataGranularity !== '1mo' || !r.sourceUrls.every(u => u.startsWith('https://query2.finance.yahoo.com/v8/finance/chart/BTC-USD?'))) throw new Error('Bitcoin provenance incorrect');
const daily = evidence.rawResponse['1d']?.chart.result[0];
const dayCloses = daily ? new Map(daily.timestamp.map((t, i) => [new Date(t * 1000).toISOString().slice(0, 10), daily.indicators.quote[0].close[i]])) : new Map(evidence.lastDailyCloses.map(p => [p.date, p.price]));
if (r.points.length !== ASSETS.bitcoin.points.length || r.periodEnd !== r.points.at(-1)[0]) throw new Error('Bitcoin coverage incorrect');
for (const [i, [date, price]] of r.points.entries()) {
  const expectedDate = new Date(Date.UTC(2015, i, 1)).toISOString().slice(0, 7);
  const rawDate = new Date(raw.timestamp[i] * 1000).toISOString().slice(0, 7);
  const lastDay = new Date(Date.UTC(2015, i + 1, 0)).toISOString().slice(0, 10);
  const close = raw.indicators.quote[0].close[i];
  if (date !== expectedDate || date !== rawDate || !(price > 0) || price !== Math.round(close * 100) / 100 || Math.abs(dayCloses.get(lastDay) - close) > .001 || !Number.isFinite(dayCloses.get(lastDay)) || ASSETS.bitcoin.points[i].price !== price || date >= new Date().toISOString().slice(0, 7)) throw new Error(`Bitcoin ${date}: invalid monthly/daily close`);
}
console.log(`Bitcoin automatique : ${r.points.length} clôtures mensuelles/quotidiennes vérifiées.`);
