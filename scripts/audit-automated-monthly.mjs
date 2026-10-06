import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ASSETS } from '../src/data/market-history.js';
import { MARKET_HISTORY_REVIEW } from '../src/data/market-history-review.js';
import { HISTORY_FACTS, HISTORY_STATISTIC_IDS } from '../src/data/history-statistics.js';
import { derive } from '../src/pages/investment-calculator/lib.js';
import { computeComparativeSeries } from '../src/pages/investment-calculator/videoExport.js';
const read = path => JSON.parse(readFileSync(path));
const config = read('scripts/monthly-automation.json');
const records = read('src/data/automated-monthly.json');
const evidence = read('scripts/source-snapshots/monthly-automated.json');
for (const [id, record] of Object.entries(records)) {
  const source = config.series.find(s => s.id === id);
  assert(source, `Unknown series ${id}`);
  for (const key of Object.keys(source)) assert.deepEqual(record[key], source[key], `${id} ${key}`);
  assert.equal(record.responseSha256, evidence[id].responseSha256);
  assert.match(record.responseSha256, /^[a-f0-9]{64}$/);
  assert.match(record.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(record.periodEnd, record.points.at(-1)[0]);
  assert(record.periodEnd < record.checkedAt.slice(0, 7));
  assert.equal(record.points.length, evidence[id].proofRows.length);
  const start = Number(record.periodStart.slice(0,4))*12+Number(record.periodStart.slice(5))-1;
  for (const [i, [date, price]] of record.points.entries()) {
    const index = start+i;
    assert.equal(date, `${Math.floor(index/12)}-${String(index%12+1).padStart(2,'0')}`);
    assert(price > 0 && Number.isFinite(price));
    const row = evidence[id].proofRows[i];
    assert.equal(row.date.slice(0,7), date);
    assert.equal(price, Math.round(row.value*10**record.precision)/10**record.precision);
    if (record.parser === 'yahoo') {
      if (row.monthlyClose === null) { assert(record.allowMissingMonthly); assert(record.sourceUrls.includes(row.windowUrl)); }
      assert(Math.abs(row.close-(row.monthlyClose ?? row.windowClose))<=Math.max(.02,row.close*1e-7));
    }
    if (record.parser === 'msci') assert(Math.abs(row.value-row.monthlyValue)<=.0001);
    assert.deepEqual(ASSETS[id].points[i], { date, price });
    if (record.anniversaryPoints?.length) {
      assert.equal(record.anniversaryPoints[i][1], Math.round(row.close*10**record.precision)/10**record.precision);
      assert.deepEqual(ASSETS[id].anniversaryPoints[i], {date,price:record.anniversaryPoints[i][1]});
    }
  }
  assert.equal(MARKET_HISTORY_REVIEW[`history:${id}`].periodEnd, record.periodEnd);
  const prices=ASSETS[id].points.filter(p=>p.date>='2020-01');
  for (const mode of ['lump','dca']) {
    const expected=(mode==='lump'?100/prices[0].price:prices.reduce((n,p)=>n+100/p.price,0))*prices.at(-1).price;
    const d=derive({assetId:id,amountRaw:'100',startYear:2020,startMonth:1,mode,overridePriceRaw:''});
    assert(Math.abs(d.result.finalValue-expected)<1e-6, `${id} ${mode} calculator`);
    assert(Math.abs(computeComparativeSeries(id,'2020-01',record.periodEnd,100,mode).finalValue-expected)<1e-6);
  }
  if (HISTORY_STATISTIC_IDS.includes(id)) assert(HISTORY_FACTS.filter(f=>f.id.endsWith(`-${id}`)).every(f=>f.hook.includes(record.periodEnd)));
}
assert(Object.keys(records).length >= 44, 'Coverage must not regress');
console.log(`${Object.keys(records).length} active automated histories: proofs, exact conventions and shared consumers validated.`);
