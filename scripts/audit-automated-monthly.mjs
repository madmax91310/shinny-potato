import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {comparisonClose} from './lib/split-comparison-proof.mjs'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ASSETS } from '../src/data/market-history.js';
import { ETF_MONTHLY_HISTORIES } from '../src/data/etf-monthly-history.js';
import { INSTRUMENT_LISTINGS_BY_ISIN } from '../src/data/instrument-listings.js';
import { MARKET_HISTORY_REVIEW } from '../src/data/market-history-review.js';
import { HISTORY_FACTS, HISTORY_STATISTIC_IDS } from '../src/data/history-statistics.js';
import { derive } from '../src/pages/investment-calculator/lib.js';
import { computeComparativeSeries } from '../src/pages/investment-calculator/videoExport.js';
const read = path => JSON.parse(readFileSync(path));
const config = read('scripts/monthly-automation.json');
config.series.push(...read('scripts/non-bond-monthly-sources.json').series);
const records = { ...read('src/data/automated-monthly.json'), ...read('src/data/automated-etf-monthly.json'), ...read('src/data/non-bond-monthly-records.json') };
const evidence = { ...read('scripts/source-snapshots/monthly-lifestrategy.json'), ...read('scripts/source-snapshots/monthly-automated-round4.json'), ...read('scripts/source-snapshots/monthly-automated.json'), ...read('scripts/source-snapshots/non-bond-monthly-active.json') };
for (const source of config.series.filter(source => source.consumerScope === 'catalog')) {
  assert(records[source.id], `${source.id}: registered ETF must have a validated active history`);
}
for (const [id, record] of Object.entries(records)) {
  const source = config.series.find(s => s.id === id);
  assert(source, `Unknown series ${id}`);
  const catalog = record.consumerScope === 'catalog';
  const asset = catalog ? ETF_MONTHLY_HISTORIES[id] : ASSETS[id];
  assert(asset, `Missing active history ${id}`);
  if (catalog) {
    assert.equal(record.field,record.parser==='official-nav'?'nav-total-return':'adjclose');
    assert.equal(record.collectAnniversary, source.collectAnniversary);
    if (source.collectAnniversary) assert.equal(record.anniversaryPoints.length, record.points.length);
    else assert.equal(record.anniversaryPoints?.length ?? 0, 0);
    if(record.parser==='official-nav'){
      assert.equal(record.valuationBasis,'fund-nav-total-return');
      assert.equal(asset.historyConvention,record.valuationBasis);
      assert(record.label.endsWith(' · VL'));
      assert(record.calendarProof?.checks?.length);
      assert(record.rawSourceHashes&&Object.values(record.rawSourceHashes).every(h=>/^[a-f0-9]{64}$/.test(h)));
      assert(!record.ticker&&!record.mic&&!record.symbol,'NAV is never qualified as an exchange quote');
    }else{
    const suffix = { XPAR: '.PA', XAMS: '.AS', XSWX: '.SW', XETR: '.DE', XLON: '.L', ETFP: '.MI' }[record.mic];
    const listing=INSTRUMENT_LISTINGS_BY_ISIN[record.isin]?.find(l=>l.evidenceId===record.listingEvidenceId);
    assert([record.ticker+suffix,listing?.symbol].includes(record.symbol),`${id}: documented listing symbol`);
    assert(INSTRUMENT_LISTINGS_BY_ISIN[record.isin]?.some(listing =>
      listing.evidenceId === record.listingEvidenceId && listing.ticker === record.ticker &&
      listing.mic === record.mic && listing.currency === record.currency), `${id}: exact documented listing`);
    }
    assert(ASSETS[id], `${id}: shared tool connection`);
  }
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
      if (row.monthlyClose === null) {
        assert(record.allowMissingMonthly || record.dailyWindowMonths?.includes(date) || record.verifiedDailyWindowMonths?.includes(date) || record.verifiedSparseMonthEnds?.[date]);
        assert(record.sourceUrls.includes(row.windowUrl));
      }
      assert(Math.abs(row.close-comparisonClose(record,evidence[id],row))<=Math.max(.02,row.close*1e-7));
    }
    if (record.parser === 'msci') assert(Math.abs(row.value-row.monthlyValue)<=.0001);
    assert.deepEqual(asset.points[i], { date, price });
    if (record.anniversaryPoints?.length) {
      assert.equal(record.anniversaryPoints[i][1], Math.round((record.anniversaryValuationBasis==='fund-nav-price'?row.anniversaryValue:record.parser==='official-nav'?row.value:row.close)*10**record.precision)/10**record.precision);
      assert.deepEqual(ASSETS[id].anniversaryPoints[i], {date,price:record.anniversaryPoints[i][1]});
    }
  }
  assert.equal(MARKET_HISTORY_REVIEW[`history:${id}`].periodEnd, record.periodEnd);
  const startYm = record.periodStart > '2020-01' ? record.periodStart : '2020-01';
  const prices=ASSETS[id].points.filter(p=>p.date>=startYm);
  const qualification=qualifyHistoryWindow(ASSETS[id],startYm,record.periodEnd)
  if(!qualification.qualified){assert.throws(()=>derive({assetId:id,amountRaw:'100',startYear:Number(startYm.slice(0,4)),startMonth:Number(startYm.slice(5)),mode:'dca',overridePriceRaw:''}),{message:qualification.reason});continue}
  for (const mode of ['lump','dca']) {
    const expected=(mode==='lump'?100/prices[0].price:prices.reduce((n,p)=>n+100/p.price,0))*prices.at(-1).price;
    const d=derive({assetId:id,amountRaw:'100',startYear:Number(startYm.slice(0,4)),startMonth:Number(startYm.slice(5)),mode,overridePriceRaw:''});
    assert(Math.abs(d.result.finalValue-expected)<1e-6, `${id} ${mode} calculator`);
    assert(Math.abs(computeComparativeSeries(id,startYm,record.periodEnd,100,mode).finalValue-expected)<1e-6);
  }
  if (HISTORY_STATISTIC_IDS.includes(id)) {
      // La période reste vérifiée dans les précisions et dans le récit, sans imposer
      // une date technique à l'accroche éditoriale.
      const facts=HISTORY_FACTS.filter(f=>f.id.endsWith(`-${id}`));
      const endLabel=new Date(`${record.periodEnd}-01T00:00:00Z`).toLocaleDateString('fr-FR',{month:'long',year:'numeric',timeZone:'UTC'});
      assert.equal(facts.length,2);
      assert(facts.every(f=>f.fact.includes(record.periodEnd) && f.context.includes(endLabel)));
    }
}
assert(Object.keys(records).length >= 44, 'Coverage must not regress');
console.log(`${Object.keys(records).length} active automated histories: proofs, exact conventions and shared consumers validated.`);

const gold=read('src/data/worldbank-gold-monthly.json');
assert.equal(gold.unit,'USD per troy ounce');
assert.equal(gold.sheet,'Monthly Prices');
assert.equal(gold.column,'Gold');
assert.equal(gold.license,'CC BY 4.0');
assert.match(gold.workbookSha256,/^[a-f0-9]{64}$/);
assert(gold.workbookUpdatedAt<=gold.checkedAt);
for(const [i,[date,price]] of gold.points.entries()) {
  assert.equal(date,new Date(Date.UTC(2015,i,1)).toISOString().slice(0,7));
  assert(price>0&&Number.isFinite(price));
  assert.deepEqual(ASSETS.or.points[i],{date,price});
}
assert.equal(ASSETS.or.points.length,gold.points.length);
