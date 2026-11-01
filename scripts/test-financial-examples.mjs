// Hand-checkable examples supplement UI/engine parity checks; no live-data constants.
import assert from 'node:assert/strict'
import {computeAssetSeries,applyPriceOverride} from '../src/lib/investment-series.js'
import {annualizedReturn} from '../src/pages/portfolio-generator/performance.js'
import {convertCalendarReturn} from '../src/data/calendar-fx.js'
const close=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`)
const points=[{date:'2020-01',price:100},{date:'2020-02',price:200},{date:'2020-03',price:100}]
const original=structuredClone(points)
// Three deposits buy 1 + 1/2 + 1 units: 250 at the last price, for 300 deposited.
const dca=computeAssetSeries(points,'2020-01','2020-03',100,'dca')
assert.deepEqual(dca.series,[100,300,250]);assert.equal(dca.totalInvested,300)
assert.equal(computeAssetSeries(points,'2020-01','2020-03',100,'lump').finalValue,100)
assert.deepEqual(computeAssetSeries(points,'2020-01','2020-03',0,'dca').series,[0,0,0])
assert.equal(computeAssetSeries(points,'2020-02','2020-02',100,'dca').finalValue,100)
const overridden=applyPriceOverride(dca,points,'120','2020-03')
assert.equal(overridden.finalValue,300);assert.deepEqual(dca.series,[100,300,250]);assert.deepEqual(points,original)
// Doubling then losing half returns to the initial capital, annualized 0%, not 25%.
close(annualizedReturn({2020:100,2021:-50}),0)
close(annualizedReturn({2020:21,2021:21}),21)
assert.equal(annualizedReturn({2020:-100,2021:50}),-100)
assert.equal(annualizedReturn({2020:10,2022:10}),null)
// 100 USD initially cost 100 EUR; 110 USD finally buy 91 2/3 EUR at 1.2 USD/EUR.
const fx={months:{'2019-12':{asOf:'2019-12-31',rates:{USD:1}},'2020-12':{asOf:'2020-12-31',rates:{USD:1.2}}}}
close(convertCalendarReturn(10,2020,'USD','EUR',fx),-25/3)
close(convertCalendarReturn(0,2020,'EUR','USD',fx),20)
assert.equal(convertCalendarReturn(10,2021,'USD','EUR',fx),null)
console.log('Independent examples: dated DCA flows, zero/single month, immutable override, geometric annualization/loss/gap and two-boundary FX.')

const {derive}=await import('../src/pages/investment-calculator/lib.js')
const state={assetId:'apple',startYear:2020,startMonth:1,amountRaw:'100',mode:'lump',overridePriceRaw:''}
for(const raw of ['-1','0','1e309','NaN','100oops'])assert.throws(()=>derive({...state,amountRaw:raw}),/nombre fini/)
assert.throws(()=>derive({...state,amountRaw:'1e308'}),/capacité de calcul/)
assert.throws(()=>derive({...state,overridePriceRaw:'1e309'}),/nombre fini/)
assert.throws(()=>derive({...state,assetId:'custom',customStart:'1e309',customEnd:'100'}),/nombre fini/)
assert.equal(derive({...state,amountRaw:''}).result.finalValue,0,'empty amount remains the neutral form state')
assert(Number.isFinite(derive(state).result.finalValue),'ordinary input recovers')
