import assert from'node:assert/strict';import FX from'../src/data/monthly-fx.json'with{type:'json'};import{qualifyHistoryWindow}from'../src/data/history-window-quality.js';import{convertAsset}from'../src/pages/performance-rankings/series.js';
const points=[];for(let y=2020;y<=2024;y++)for(let m=1;m<=12;m++)points.push({date:`${y}-${String(m).padStart(2,'0')}`,price:100+points.length});const a={currency:'USD',basis:'fund-nav-total-return',points,historyUnqualifiedReturnWindows:[{start:'2021-12',end:'2022-12',reason:'Official 2022 NAV/calendar disagreement'}]};
for(const [start,end]of[['2021-12','2022-12'],['2022-06','2023-01'],['2021-01','2023-12']]){assert.equal(qualifyHistoryWindow(a,start,end).code,'issuer-return-window-unconfirmed');assert.equal(qualifyHistoryWindow(convertAsset(a,'EUR',FX),start,end).qualified,false)}
for(const [start,end]of[['2020-12','2021-12'],['2022-12','2023-12'],['2023-01','2024-12']])assert(qualifyHistoryWindow(a,start,end).qualified,'A shared boundary is not an unqualified return');assert(!qualifyHistoryWindow({...a,historyUnqualifiedReturnWindows:[{start:'x',end:'y'}]},'2023-12','2024-12').qualified);assert(qualifyHistoryWindow({...a,historyUnqualifiedReturnWindows:[]},'2021-12','2022-12').qualified);assert(!qualifyHistoryWindow({currency:'USD',basis:'fund-nav-total-return',points:[{date:'2023-12',price:1},{date:'2024-02',price:2}]},'2023-12','2024-02').qualified);console.log('Strict return windows: shared endpoints, independent years, cross-window refusal, malformed contracts and missing months preserved.');

// The same Bitwise share has a separately documented EUR venue. Its shorter
// Paris history does not change the unqualified original Xetra windows.
const {ASSETS}=await import('../src/data/market-history.js');
const {periodReturn}=await import('../src/pages/performance-rankings/engine.js');
const {RANKING_ASSETS}=await import('../src/pages/performance-rankings/data.js');
const {derive}=await import('../src/pages/investment-calculator/lib.js');
const paris=ASSETS.etfDE000A27Z304Paris;
assert.equal(paris.isin,ASSETS.etfDE000A27Z304.isin);
assert.equal(paris.mic,'XPAR');assert.equal(paris.currency,'EUR');
assert(paris.label.endsWith(' · Paris'));
assert.equal(paris.periodStart,'2021-06');
assert.equal(qualifyHistoryWindow(paris,'2020-12','2021-12').qualified,false);
for(const year of [2023,2024]){
 const start=`${year-1}-12`,end=`${year}-12`;
 assert(qualifyHistoryWindow(paris,start,end).qualified);
 assert.equal(qualifyHistoryWindow(ASSETS.etfDE000A27Z304,start,end).code,'financial-window-unconfirmed');
 const prices=paris.points.filter(p=>p.date>=start&&p.date<=end);
 const expected=100*(prices.at(-1).price/prices[0].price-1);
 assert(Math.abs(periodReturn(RANKING_ASSETS[paris.id],start,end)-expected)<1e-8);
}
const investment=derive({assetId:paris.id,amountRaw:'100',startYear:2023,startMonth:1,mode:'lump',overridePriceRaw:''});
const prices=paris.points.filter(p=>p.date>='2023-01');
assert(Math.abs(investment.result.finalValue-100*prices.at(-1).price/prices[0].price)<1e-8);
console.log('Bitwise Paris: exact EUR venue, independent coverage, unchanged Xetra refusals, calculator and ranking consumers.');

// Exact existing palladium share: market and NAV windows remain distinct.
await import("./test-palladium-market-consumers.mjs")
