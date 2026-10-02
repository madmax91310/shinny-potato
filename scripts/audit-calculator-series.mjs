#!/usr/bin/env node
// Rejoue le recoupement des 140 points des six séries depuis les captures datées.
// Une capture ne garantit pas qu'un fournisseur ne corrigera jamais l'historique.
import { readFileSync } from 'node:fs';
import { ASSETS, LATEST_YM, SPARSE_MONTHLY_DATA_IDS, INCONSISTENT_MONTHLY_DATA_IDS } from '../src/data/market-history.js';

const snapshot = JSON.parse(readFileSync(new URL('./source-snapshots/calculator-yahoo-2026-09-29.json', import.meta.url)));
const gold = JSON.parse(readFileSync(new URL('./source-snapshots/calculator-worldbank-gold-2026-09-29.json', import.meta.url)));
let errors = 0;
if (!gold.url?.startsWith('https://thedocs.worldbank.org/') || gold.checkedAt !== '2026-09-29' ||
    gold.workbookUpdatedAt !== '2026-09-02' || !/^[a-f0-9]{64}$/.test(gold.workbookSha256) ||
    gold.sheet !== 'Monthly Prices' || gold.column !== 'Gold' || gold.unit !== 'USD per troy ounce' ||
    gold.points.length !== 140 || ASSETS.or.points.length !== 140) {
  console.error('Or : capture Banque mondiale ou provenance incomplète');
  errors++;
} else {
  for (const [index, [date, price]] of gold.points.entries()) {
    const actual = ASSETS.or.points[index];
    if (actual?.date !== date || actual.price !== price) {
      console.error(`Or ${date} : ${actual?.price} au lieu de ${price}`);
      errors++;
    }
  }
}
for (const [name, record] of Object.entries(snapshot)) {
  // Bitcoin a été remplacé intégralement par des clôtures, contrôlées ci-dessous.
  if (name === 'bitcoin') continue;
  const points = ASSETS[name]?.points;
  if (!points || points.length < 140 || record.points.length !== 140 || !record.url || record.checkedAt !== '2026-09-29') {
    console.error(`${name} : série ou provenance incomplète`);
    errors++;
    continue;
  }
  for (const [index, [date, sourcePrice]] of record.points.entries()) {
    const actual = points[index];
    // Les séries historiques MacroTrends et Yahoo ajustent parfois les
    // dividendes de quelques centimes différemment. L'écart admis est 0,1 %.
    const tolerance = name === 'broadcom' || date === '2026-08' ? 0.011 : Math.max(0.03, sourcePrice * 0.001);
    if (actual?.date !== date || Math.abs(actual.price - sourcePrice) > tolerance) {
      console.error(`${name} ${date} : ${actual?.price} au lieu de ${sourcePrice}`);
      errors++;
    }
  }
}
console.log(`${Object.keys(snapshot).length - 1} séries Yahoo historiques (Bitcoin contrôlé dans la nouvelle capture) et 1 série Banque mondiale × 140 points comparés aux captures ; ${errors} écart(s).`);
if (errors) process.exitCode = 1;

// Nouvelles séries certifiées : comparaison stricte des 233 points, sans tolérance héritée.
const certified = JSON.parse(readFileSync(new URL('./source-snapshots/calculator-certified-2026-09-30.json', import.meta.url)));
for (const [id, expectedCount] of [['ethereum', 105], ['soxx', 128]]) {
  const record = certified[id];
  const raw = record.monthlyResponse.chart.result[0];
  const source = raw.timestamp.map((t, i) => [new Date(t * 1000).toISOString().slice(0, 7), raw.indicators.quote[0].close[i]])
    .filter(([date]) => date >= record.points[0][0] && date <= '2026-08');
  if (record.checkedAt !== '2026-09-30' || raw.meta.symbol !== record.symbol || raw.meta.currency !== 'USD'
      || raw.meta.dataGranularity !== '1mo' || !record.url.includes('interval=1mo') || !record.dailyUrl.includes('interval=1d')
      || source.length !== expectedCount || ASSETS[id].points.length < expectedCount || record.lastDailyCloses.length !== expectedCount) {
    throw new Error(`${id}: capture ou couverture incomplète`);
  }
  for (let i = 0; i < expectedCount; i++) {
    const [date, close] = source[i];
    const daily = record.lastDailyCloses[i];
    const actual = ASSETS[id].points[i];
    if (actual.date !== date || actual.price !== Math.round(close * 100) / 100
        || record.points[i][0] !== date || record.points[i][1] !== actual.price
        || daily.date.slice(0, 7) !== date || Math.abs(daily.close - close) > 0.0001
        || new Date(daily.timestamp * 1000).toISOString().slice(0, 10) !== daily.date) {
      throw new Error(`${id} ${date}: clôtures mensuelle/quotidienne ou série différentes`);
    }
  }
}
if (ASSETS.soxx.points.find(p => p.date === '2026-08').price !== 511.04 || ASSETS.ethereum.points.find(p => p.date === '2026-08').price !== 2466.82) throw new Error('Dernière clôture incorrecte');
console.log('Ethereum : 105 mois complets ; SOXX : 128 mois ; 233 clôtures conformes aux exports Yahoo mensuel et quotidien.');

if (SPARSE_MONTHLY_DATA_IDS.has('ethereum')) throw new Error('Ethereum mensuel encore classé comme série éparse');

// Mise à jour d'octobre : septembre est le dernier mois complet.
// Les timestamps des actions européennes sont classés dans le fuseau de la place,
// sinon le 1er octobre à Paris (30 septembre UTC) serait pris pour septembre.
const current = JSON.parse(readFileSync(new URL('./source-snapshots/calculator-monthly-2026-10-02.json', import.meta.url)));
const expectedIds = ['bitcoin', 'ethereum', 'cac40', 'nasdaq100', 'soxx', 'silver', 'lvmh', 'apple', 'microsoft', 'broadcom', 'tesla', 'nvidia', 'amazon', 'google', 'meta', 'nestle', 'sap', 'visa', 'netflix', 'cocacola', 'sp500'];
if (current.checkedAt !== '2026-10-02' || current.lastCompleteMonth !== '2026-09' || LATEST_YM !== current.lastCompleteMonth
    || Object.keys(current.records).sort().join() !== expectedIds.sort().join()) throw new Error('Périmètre de la mise à jour mensuelle incorrect');
const monthAtExchange = (timestamp, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(timestamp * 1000));
  const get = name => parts.find(part => part.type === name).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
};
let verified = 0;
for (const [id, record] of Object.entries(current.records)) {
  const raw = record.monthlyResponse.chart.result[0];
  const all = ASSETS[id].points;
  const full = record.scope === 'full-series';
  const values = record.field === 'adjclose' ? raw.indicators.adjclose[0].adjclose : raw.indicators.quote[0].close;
  const source = raw.timestamp.map((timestamp, i) => ({ date: monthAtExchange(timestamp, raw.meta.exchangeTimezoneName).slice(0, 7), price: values[i] }))
    .filter(p => p.price != null && p.date >= (full ? '2015-01' : '2026-09') && p.date <= current.lastCompleteMonth);
  const wanted = full ? 141 : 1;
  if (record.checkedAt !== current.checkedAt || raw.meta.symbol !== record.symbol || raw.meta.currency !== record.currency
      || ASSETS[id].currency !== record.currency || raw.meta.dataGranularity !== '1mo'
      || !['close', 'adjclose'].includes(record.field) || !record.url.includes('interval=1mo') || !record.dailyUrl.includes('interval=1d')
      || source.length !== wanted || record.points.length !== wanted || record.lastDailyCloses.length !== wanted
      || all.at(-1).date !== '2026-09' || (full && all.length !== 141)) throw new Error(`${id}: capture ou couverture de septembre incorrecte`);
  for (const [i, observation] of source.entries()) {
    const daily = record.lastDailyCloses[i];
    const actual = all.find(p => p.date === observation.date);
    if (actual?.price !== Math.round(observation.price * 100) / 100 || record.points[i][0] !== observation.date || record.points[i][1] !== actual.price
        || !daily.date.startsWith(observation.date) || monthAtExchange(daily.timestamp, raw.meta.exchangeTimezoneName) !== daily.date
        || Math.abs(daily.price - observation.price) > .001 || !(actual.price > 0)) throw new Error(`${id} ${observation.date}: clôture ou date de séance incorrecte`);
    if (full && observation.date !== new Date(Date.UTC(2015, i, 1)).toISOString().slice(0, 7)) throw new Error(`${id}: mois manquant ou dupliqué`);
    verified++;
  }
}
if (INCONSISTENT_MONTHLY_DATA_IDS.has('sp500') || SPARSE_MONTHLY_DATA_IDS.has('sp500')) throw new Error('S&P 500 certifié encore bloqué en DCA');
const annualSp500 = [11.96, 21.83, -4.38, 31.49, 18.40, 28.71, -18.11, 26.29, 25.02, 17.88];
annualSp500.forEach((expected, i) => {
  const points = ASSETS.sp500.points;
  const previous = points.find(p => p.date === `${2015 + i}-12`).price;
  const next = points.find(p => p.date === `${2016 + i}-12`).price;
  if (Math.abs((next / previous - 1) * 100 - expected) > .006) throw new Error(`S&P 500 ${2016 + i}: rendement annuel non conforme`);
});
// STOXX : dernière séance mensuelle extraite du tableau quotidien de l’émetteur.
const stoxx = JSON.parse(readFileSync(new URL('./source-snapshots/calculator-stoxx600-2026-10-02.json', import.meta.url)));
if (stoxx.isin !== 'EU0009658210' || stoxx.currency !== 'EUR' || stoxx.symbol !== 'SXXR'
    || stoxx.checkedAt !== '2026-10-02' || !stoxx.url.startsWith('https://stoxx.com/')
    || stoxx.points.length !== 141 || ASSETS.stoxx600.points.length !== 141
    || INCONSISTENT_MONTHLY_DATA_IDS.has('stoxx600') || ASSETS.stoxx600.priceUnit !== 'points') throw new Error('STOXX : provenance ou couverture incorrecte');
const stoxxEnds = new Map();
let previousTimestamp = 0;
for (const [date, timestamp, price] of stoxx.dailyRows) {
  if (timestamp <= previousTimestamp || new Date(timestamp).toISOString().slice(0, 10) !== date || !(price > 0)) throw new Error('STOXX : séance source incorrecte');
  previousTimestamp = timestamp;
  if (date >= '2015-01' && date <= '2026-09-30') stoxxEnds.set(date.slice(0, 7), {date, timestamp, price});
}
[...stoxxEnds].forEach(([month, end], i) => {
  const actual = ASSETS.stoxx600.points[i];
  if (month !== new Date(Date.UTC(2015, i, 1)).toISOString().slice(0, 7)
      || actual.date !== month || actual.price !== Math.round(end.price * 100) / 100
      || stoxx.points[i][1] !== actual.price || stoxx.monthEnds[i].timestamp !== end.timestamp) throw new Error(`STOXX ${month}: clôture mensuelle incorrecte`);
});
const annualStoxx = [1.73, 10.58, -10.77, 26.82, -1.99, 24.91, -10.64, 15.81, 8.78, 19.80];
annualStoxx.forEach((expected, i) => {
  const get = year => ASSETS.stoxx600.points.find(p => p.date === `${year}-12`).price;
  if (Math.abs((get(2016 + i) / get(2015 + i) - 1) * 100 - expected) > .02) throw new Error(`STOXX ${2016 + i}: rendement différent du benchmark Franklin`);
});
console.log('STOXX : 141 fins de mois officielles et dix rendements annuels recoupés.');
// MSCI : données mensuelles officielles recoupées avec les dernières séances.
const world = JSON.parse(readFileSync(new URL('./source-snapshots/calculator-msci-world-2026-10-02.json', import.meta.url)));
const monthlyWorld = world.response.indexes.INDEX_LEVELS;
const dailyWorld = world.dailyResponse.indexes.INDEX_LEVELS;
if (world.indexCode !== '990100' || world.variant !== 'GRTR' || world.currency !== 'USD'
    || !world.url.startsWith('https://app2.msci.com/') || !world.url.includes('data_frequency=END_OF_MONTH')
    || world.checkedAt !== '2026-10-02' || ASSETS.msciWorld.points.length !== 141
    || INCONSISTENT_MONTHLY_DATA_IDS.has('msciWorld') || ASSETS.msciWorld.priceUnit !== 'points') throw new Error('MSCI : provenance incorrecte');
for (const response of [world.response, world.dailyResponse]) {
  if (response.msci_index_code !== '990100' || response.index_variant_type !== 'GRTR' || response.ISO_currency_symbol !== 'USD') throw new Error('MSCI : variante incompatible');
}
const worldEnds = new Map();
let worldPreviousDate = 0;
for (const row of dailyWorld) {
  if (row.calc_date <= worldPreviousDate || !(row.level_eod > 0)) throw new Error('MSCI : séance incorrecte');
  worldPreviousDate = row.calc_date;
  worldEnds.set(String(row.calc_date).slice(0, 6), row);
}
const worldObserved = monthlyWorld.filter(row => row.calc_date >= 20150101);
if (worldObserved.length !== 141 || world.points.length !== 141) throw new Error('MSCI : couverture incomplète');
for (const [i, row] of worldObserved.entries()) {
  const date = String(row.calc_date);
  const month = `${date.slice(0, 4)}-${date.slice(4, 6)}`;
  const end = worldEnds.get(date.slice(0, 6));
  const actual = ASSETS.msciWorld.points[i];
  if (month !== new Date(Date.UTC(2015, i, 1)).toISOString().slice(0, 7)
      || end.calc_date !== row.calc_date || Math.abs(end.level_eod - row.level_eod) > 1e-8
      || actual.date !== month || actual.price !== Math.round(row.level_eod * 100) / 100
      || world.points[i][0] !== month || world.points[i][1] !== actual.price) throw new Error(`MSCI ${month} : fin de mois incorrecte`);
}
for (const [year, expected] of Object.entries(world.annualGrossReturns)) {
  const get = y => ASSETS.msciWorld.points.find(p => p.date === `${y}-12`).price;
  if (Math.abs((get(year) / get(Number(year) - 1) - 1) * 100 - expected) > .006) throw new Error(`MSCI ${year} : rendement annuel non conforme`);
}
const worldGet = month => ASSETS.msciWorld.points.find(p => p.date === month).price;
if (Math.abs((worldGet('2026-08') / worldGet('2025-12') - 1) * 100 - 13.40) > .006
    || Math.abs((worldGet('2026-08') / worldGet('2026-07') - 1) * 100 - 2.60) > .006
    || ASSETS.msciWorld.points.at(-1).price !== world.septemberCrossCheck.level) throw new Error('MSCI : recoupement août/septembre incorrect');
console.log('MSCI : 141 fins de mois Gross USD officielles, séances quotidiennes concordantes et dix années recoupées.');
for (const id of ['or']) {
  if (ASSETS[id].points.at(-1).date !== '2026-08') throw new Error(`${id}: une date non confirmée a été ajoutée`);
}
for (const id of expectedIds.filter(id => id !== 'sp500' && snapshot[id] == null && !['bitcoin', 'ethereum', 'soxx', 'silver', 'nasdaq100'].includes(id))) {
  if (!SPARSE_MONTHLY_DATA_IDS.has(id)) throw new Error(`${id}: ajout du dernier mois ne certifiant pas l'historique DCA`);
}
console.log(`Septembre : ${verified} points contrôlés, dont 141 clôtures Bitcoin et 141 S&P 500 ; 23 actifs à jour, seul l’or reste en août.`);

// Contrôle des consommateurs : résultat terminal indépendant, dernière date réelle,
// nombre de versements, absence de prolongement au mois d'octobre et export vidéo.
const { derive, buildTweetText } = await import('../src/pages/investment-calculator/lib.js');
const { getAssetMaxDate, getSharedEndDate, getAnnualReturns } = await import('../src/pages/tweet-midi/data/marketHistory.js');
const { computeComparativeSeries, getComparativeAssetIssue } = await import('../src/pages/investment-calculator/videoExport.js');
for (const id of [...expectedIds, 'stoxx600', 'msciWorld']) {
  const state = { assetId: id, amountRaw: '1000', startYear: 2020, startMonth: 1, mode: 'lump', overridePriceRaw: '' };
  const result = derive(state);
  const points = ASSETS[id].points;
  const start = points.find(p => p.date === result.startYm);
  if (start && id !== 'lvmh') {
    const expected = 1000 * points.at(-1).price / start.price;
    if (Math.abs(result.result.finalValue - expected) > .0001) throw new Error(`${id}: résultat terminal différent de la quantité achetée`);
  }
  if (result.endYm !== '2026-09' || getAssetMaxDate(id) !== '2026-09' || result.result.months.at(-1) !== '2026-09'
      || !buildTweetText(state, result).includes('septembre 2026')) throw new Error(`${id}: date consommée incorrecte`);
}
for (const id of ['bitcoin', 'ethereum', 'sp500', 'soxx', 'apple', 'microsoft', 'broadcom', 'tesla', 'stoxx600', 'msciWorld']) {
  const state = { assetId: id, amountRaw: '100', startYear: 2020, startMonth: 1, mode: 'dca', overridePriceRaw: '' };
  const result = derive(state);
  const prices = ASSETS[id].points.filter(p => p.date >= '2020-01' && p.date <= '2026-09');
  const expected = prices.reduce((quantity, p) => quantity + 100 / p.price, 0) * prices.at(-1).price;
  const video = computeComparativeSeries(id, '2020-01', '2026-09', 100, 'dca');
  if (result.result.months.length !== 81 || result.result.totalInvested !== 8100 || Math.abs(result.result.finalValue - expected) > .0001
      || Math.abs(video.finalValue - expected) > .0001 || getComparativeAssetIssue(id, '2020-01', 'dca', '2026-09') !== null) throw new Error(`${id}: DCA ou vidéo incorrect`);
}
for (const id of ['or']) {
  const d = derive({ assetId: id, amountRaw: '1000', startYear: 2020, startMonth: id === 'or' ? 1 : 12, mode: 'lump', overridePriceRaw: '' });
  if (d.endYm !== '2026-08' || getSharedEndDate('bitcoin', id) !== '2026-08' || getComparativeAssetIssue(id, '2020-12', 'lump', '2026-09') === null) throw new Error(`${id}: fin ancienne extrapolée`);
}
if (getAnnualReturns('msciWorld', 2016).some(p => p.year >= 2026) || getAnnualReturns('sp500', 2016).some(p => p.year >= 2026) || getAnnualReturns('bitcoin', 2016).some(p => p.year >= 2026)) throw new Error('Année 2026 partielle publiée comme performance annuelle');
console.log('Consommateurs : simulations, quantités DCA, fins réelles, comparatifs vidéo et exclusion des années incomplètes OK.');
