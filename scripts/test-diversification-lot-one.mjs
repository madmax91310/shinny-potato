import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MARKET_HISTORY_REVIEW } from '../src/data/market-history-review.js';
import { DIVERSIFICATION_HISTORY } from '../src/data/diversification-history.js';
import { ASSETS, BASELINE_ASSETS, ASSET_ORDER } from '../src/data/market-history.js';
import { DATA_CATALOG } from '../src/data/catalog.js';
import { derive, buildTweetText } from '../src/pages/investment-calculator/lib.js';
import { getAnnualReturns, ANNIVERSAIRE_ELIGIBLE_ASSETS } from '../src/pages/tweet-midi/data/marketHistory.js';
import { ETFS } from '../src/data/etf-cards.js';
import { getAnnualPerformance } from '../src/pages/etf-sheets/annualPerformance.js';
import { ETF_ART } from '../src/pages/etf-sheets/visualIdentity.js';
import { getInstrumentPeaStatus } from '../src/data/instruments.js';
import { getInstrumentReturnValues } from '../src/data/instrument-returns.js';
import { FAMILIES } from '../src/data/index-comparisons.js';
import { SHEETS } from '../src/data/index-factsheets.js';
import { buildFactsheetTweet } from '../src/pages/factsheet-tweets/lib.js';
import { getIndexComparisonPerformance } from '../src/data/index-comparison-performance.js';
import { HISTORY_FACTS } from '../src/data/history-statistics.js';
import { ALLOCATION_CASES } from '../src/data/allocation-cases.js';
import { DEFAULT_THEMES } from '../src/data/etf-themes.js';
import { getRecipes } from '../src/pages/portfolio-generator/recipes.js';
import { assetEditorial } from '../src/pages/portfolio-generator/asset-editorial.js';
import { CATALOG as DUEL_ASSETS } from '../src/data/duel-assets.js';
import { getDuelArt } from '../src/pages/portfolio-duels/visualIdentity.js';
import { allocationAngle } from '../src/pages/portfolio-generator/allocationEditorial.js';
const snapshot = JSON.parse(readFileSync(new URL('./source-snapshots/diversification-history-2026-10-05.json', import.meta.url)));
const expectedAnnual = {
 msciAcwiImi: [16.25,18.22,-18.40,21.58,16.37,22.06],
 msciWorldExUsa: [7.59,12.62,-14.29,17.94,4.70,31.85],
 msciAcwi: [16.25,18.54,-18.36,22.20,17.49,22.34],
};
for (const [id, asset] of Object.entries(DIVERSIFICATION_HISTORY)) {
 const capture = snapshot.records[id];
 assert.equal(BASELINE_ASSETS[id], asset); assert(ASSET_ORDER.includes(id));
 assert.equal(asset.points.length, 141); assert.match(asset.methodNote, /Net Return.*dividendes nets réinvestis/);
 assert.match(capture.factsheetSha256, /^[a-f0-9]{64}$/); assert(capture.factsheetEvidence);
 for (const response of [capture.response,capture.dailyResponse]) {
  assert.equal(response.msci_index_code,capture.indexCode);assert.equal(response.index_variant_type,'NETR');assert.equal(response.ISO_currency_symbol,'USD');
 }
 const dailyEnds = new Map(capture.dailyResponse.indexes.INDEX_LEVELS.map(row=>[String(row.calc_date).slice(0,6),row]));
 const monthly = capture.response.indexes.INDEX_LEVELS;
 for (const row of monthly) assert.deepEqual(row,dailyEnds.get(String(row.calc_date).slice(0,6)));
 asset.points.forEach((point,i)=> {
  assert.equal(point.date,new Date(Date.UTC(2015,i,1)).toISOString().slice(0,7));
  const source = monthly[i+1];assert.equal(point.price,Math.round(source.level_eod*1e6)/1e6);
 });
 for(const [year,expected] of Object.entries(capture.annualNetReturns)) {
  const value = y=>monthly.find(row=>String(row.calc_date).startsWith(`${y}12`)).level_eod;
  assert(Math.abs((value(year)/value(Number(year)-1)-1)*100-expected)<.006);
 }
 assert.deepEqual(Array.from({length:6},(_,i)=>capture.annualNetReturns[2020+i]),expectedAnnual[id]);
 for(const mode of ['lump','dca']) {
  const state={assetId:id,amountRaw:'100',startYear:2020,startMonth:1,mode,overridePriceRaw:''};
  const points=ASSETS[id].points.filter(p=>p.date>='2020-01');
  const units=mode==='lump'?100/points[0].price:points.reduce((n,p)=>n+100/p.price,0);
  const result=derive(state);assert.equal(result.effectiveMode,mode);assert(Math.abs(result.result.finalValue-units*points.at(-1).price)<1e-7);
  assert(!/undefined|NaN|Infinity/.test(buildTweetText(state,result)));
 }
 const annual=getAnnualReturns(id,2020);assert.equal(annual.length,ASSETS[id].points.filter(p=>p.date>='2020-01'&&p.date.endsWith('-12')).length);
 assert(ANNIVERSAIRE_ELIGIBLE_ASSETS.find(a=>a.id===id)?.anniversaryVariant.includes('Net Return'));
 assert.equal(HISTORY_FACTS.filter(f=>f.id.endsWith(`-${id}`)).length,2);
 const record=DATA_CATALOG.find(r=>r.id===`history:${id}`);assert(record.fields[0].metadata.sourceUrls.some(url=>new URL(url).searchParams.get('index_codes')===capture.indexCode));
 assert.equal(record.fields[0].metadata.checkedAt,MARKET_HISTORY_REVIEW[`history:${id}`].checkedAt);
}
// Le rendement du fonds ne doit jamais être remplacé par celui de l’indice.
const card=ETFS.find(e=>e.isin==='IE00B3YLTY66');assert(card&&ETF_ART[card.id]);
assert.equal(getDuelArt(DUEL_ASSETS.find(a=>a.id==='acwi_imi_spdr')).scene,ETF_ART[card.id].scene);
assert.equal(card.listing.ticker,'IMIE');assert.equal(card.listing.currency,'EUR');assert.equal(getInstrumentPeaStatus(card.isin),false);
assert.deepEqual(getAnnualPerformance(card).values,[15.35,18.25,-17.52,21.10,16.13,22.20]);
assert.deepEqual(getInstrumentReturnValues(card.isin),getAnnualPerformance(card).values);
assert.equal(assetEditorial({id:'acwi_imi_spdr'}).kind,'world-imi');
assert.match(allocationAngle([{id:'acwi_imi_spdr',pct:40},{id:'fonds_euros',pct:60}]).logic,/actions représentent 40 %/);
const family=FAMILIES.find(f=>f.id==='monde-toutes-tailles');const rows=getIndexComparisonPerformance(family);
assert(rows.every(row=>row.currency==='USD'&&row.method==='dividendes nets réinvestis'));
assert.equal(rows[2].y2025,22.06);assert.notEqual(rows[2].y2025,getAnnualPerformance(card).values[5]);
const sheet=SHEETS.find(s=>s.id==='acwi-imi');assert.equal(sheet.constituents,8036);
assert.equal(sheet.countries.reduce((s,[,v])=>s+v,0),100);assert(!/undefined|NaN/.test(buildFactsheetTweet(sheet)));
assert.equal(DEFAULT_THEMES.filter(t=>['monde-toutes-tailles','world-avec-sans-usa','grandes-petites-monde'].includes(t.id)).length,3);
assert.equal(ALLOCATION_CASES.filter(c=>['world-ex-usa-chiffre','world-small-chiffre','world-acwi-imi-chiffre'].includes(c.id)).length,3);
assert.equal(['equilibre','dynamique','offensif'].flatMap(r=>getRecipes('generaliste',r)).filter(r=>r.assets.some(a=>a.id==='acwi_imi_spdr')).length,3);
console.log('Lot 1 : 423 mois officiels recoupés, 33 rendements annuels PDF, simulations, anniversaires, fiche exacte, comparatifs, portefeuilles et cas concrets OK.');
