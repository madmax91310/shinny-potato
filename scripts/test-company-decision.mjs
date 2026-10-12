import assert from 'node:assert/strict'
import {activeDecision, decisionRatios, decisionIndicators, annualizedGrowth} from '../src/pages/company-analysis/lib.js'
const now=new Date('2026-10-12T12:00:00Z')
const previous={end:'2024-12-31',revenue:100,netIncome:10,operatingCashFlow:30,capitalExpenditure:10,freeCashFlow:20,freeCashFlowDefinition:'same',averageDilutedShares:10,sharesBasisSource:'same-filing',sourceUrl:'https://issuer.test/report'}
const latest={...previous,end:'2025-12-31',revenue:120,netIncome:12,operatingCashFlow:42,capitalExpenditure:12,freeCashFlow:30,interestExpense:2,operatingIncome:20,dividendsPaid:9,averageDilutedShares:11}
const c={id:'test',currency:'USD',accountsObservedAt:'2026-10-12',annual:{end:latest.end,revenue:120,netIncome:12,freeCashFlow:30},
  quote:{price:100,asOf:'2026-10-09',splits:[]},shares:{outstanding:10,asOf:'2026-09-30',observedAt:'2026-10-12'},
  decision:{observedAt:'2026-10-12',annualEnd:latest.end,years:[previous,latest]}}
let r=decisionRatios(c,now)
assert.equal(r.fcfMargin,25);assert.equal(r.cashConversion,250);assert.equal(r.fcfYield,3)
assert.equal(r.dividendFCF,30);assert.equal(r.interestCoverage,10);assert(Math.abs(r.shareChange-10)<1e-10)
assert.equal(r.fcfGrowth,50)
const changed=structuredClone(c);changed.quote.price=200
assert.equal(decisionRatios(changed,now).fcfYield,1.5)
changed.decision.years[1].sharesBasisSource='different-filing'
assert.equal(decisionRatios(changed,now).shareChange,undefined)
changed.quote.splits=['2026-10-01']
assert.equal(decisionRatios(changed,now).fcfYield,undefined)
changed.decision.observedAt='2026-08-01'
assert.equal(activeDecision(changed,now),null)
assert.equal(decisionRatios(changed,now).interestCoverage,undefined)
assert.equal(decisionRatios(changed,now).fcfMargin,25) // current independently verified annual FCF survives
changed.decision.observedAt='2026-10-12';changed.decision.years[1].netIncome=99
assert.equal(activeDecision(changed,now),null)
const negative=structuredClone(c)
negative.annual.freeCashFlow=-5;negative.decision.years[1].freeCashFlow=-5;negative.decision.years[1].capitalExpenditure=47
negative.decision.years[0].freeCashFlow=-10;negative.decision.years[0].capitalExpenditure=40
r=decisionRatios(negative,now)
assert.equal(r.fcfGrowth,undefined);assert.equal(r.fcfChange,5);assert.equal(r.dividendFCF,undefined)
assert.equal(r.fcfYield,undefined);assert.equal(r.cashConversion,-5/12*100)
negative.annual.netIncome=0;negative.decision.years[1].netIncome=0
assert.equal(decisionRatios(negative,now).cashConversion,undefined)
const debt={...c,balance:{asOf:'2026-09-30',observedAt:'2026-10-12',netDebt:5,definition:'same'},balanceHistory:[{asOf:'2026-06-30',netDebt:8,definition:'same',sourceUrl:'https://issuer.test/report'}]}
assert.equal(decisionRatios(debt,now).netDebtChange,-3)
for(const company of [c,changed,negative,debt])assert(!/NaN|undefined|Infinity/.test(JSON.stringify(decisionIndicators(company,now))))
console.log('Decision ratios: cash, losses, dividends, interest, dilution, price changes, split/freshness guards and comparable debt OK.')

const years=[2022,2023,2024,2025].map((y,i)=>({end:`${y}-12-31`,revenue:100*Math.pow(1.1,i)}))
assert(Math.abs(annualizedGrowth(years,'revenue',3).value-10)<0.02)
assert.equal(annualizedGrowth(years.slice(1),'revenue',3),null)
assert.equal(annualizedGrowth(years.map((r,i)=>i===1?{...r,revenue:-1}:r),'revenue',3),null)
assert.equal(annualizedGrowth(years.map((r,i)=>i===1?{...r,end:'2022-12-31'}:r),'revenue',3),null)
const extra=structuredClone(c)
Object.assign(extra.decision.years[1],{shareRepurchases:6,shareBasedCompensation:3,currentAssets:50,currentLiabilities:25,roeIncome:12,openingEquity:60,closingEquity:80})
Object.assign(extra,{balance:{asOf:'2026-09-30',observedAt:'2026-10-12',netDebt:60,definition:'same'}})
r=decisionRatios(extra,now)
assert.equal(r.capexRevenue,10);assert.equal(r.netDebtFCF,2)
assert.equal(r.shareBasedCompensationRevenue,2.5)
assert.equal(r.operatingMargin,20/120*100)
extra.decision.years[1].currentLiabilities=0;extra.decision.years[1].openingEquity=-1

extra.balance.netDebt=-5
assert.equal(decisionRatios(extra,now).netDebtFCF,undefined)
extra.decision.observedAt='2026-08-01'
assert.equal(decisionRatios(extra,now).shareRepurchases,undefined)
console.log('Extra indicators: CAGR gaps/losses, operating margin, investments, debt/FCF, stock compensation and stale-input guards OK.')

const balance = (asOf,equity) => ({asOf,equity,assets:100e6+equity,liabilities:100e6,currentAssets:50e6,currentLiabilities:25e6,liabilitiesAndEquity:100e6+equity,cash:10e6,sourceUrl:'https://issuer.test/balance'})
const solidityCompany=structuredClone(c)
solidityCompany.annual.previousEnd='2024-12-31'
solidityCompany.annual.netIncome=12e6
solidityCompany.solidity={componentVersion:1,observedAt:'2026-10-12',annualEnd:'2025-12-31',revenue:120,netIncome:12e6,accountsEndAtCollection:'2026-09-30',annualBalances:[balance('2024-12-31',60e6),balance('2025-12-31',80e6)],latestBalance:balance('2026-09-30',90e6)}
solidityCompany.quarter={end:'2026-09-30'}
r=decisionRatios(solidityCompany,now)
assert(Math.abs(r.roe-12/70*100)<1e-10);assert.equal(r.currentRatio,2);assert.equal(r.cashRatio,0.4);assert.equal(r.roic,undefined)
for(const mutate of [s=>s.observedAt='2026-08-01',s=>s.observedAt='2026-10-13',s=>s.netIncome=99,s=>s.accountsEndAtCollection='2026-06-30',s=>s.latestBalance.currentAssets=Infinity,s=>s.annualBalances[0].sourceUrl='https://other.test/balance',s=>s.annualBalances[0].asOf='2024-11-30',s=>s.latestBalance.equity=1]) {
 const changed=structuredClone(solidityCompany);mutate(changed.solidity)
 assert.equal(decisionRatios(changed,now).roe,undefined)
}
const missingCash=structuredClone(solidityCompany);delete missingCash.solidity.latestBalance.cash
assert.equal(decisionRatios(missingCash,now).currentRatio,2);assert.equal(decisionRatios(missingCash,now).cashRatio,undefined)
const zeroLiabilities=structuredClone(solidityCompany);zeroLiabilities.solidity.latestBalance.currentLiabilities=0
assert.equal(decisionRatios(zeroLiabilities,now).currentRatio,undefined)
const negativeEquity=structuredClone(solidityCompany);negativeEquity.solidity.annualBalances[0]=balance('2024-12-31',-10e6)
assert.equal(decisionRatios(negativeEquity,now).roe,undefined)
const lossROE=structuredClone(solidityCompany);lossROE.annual.netIncome=-12e6;lossROE.solidity.netIncome=-12e6
assert(decisionRatios(lossROE,now).roe<0)
const newAccounts=structuredClone(solidityCompany);newAccounts.quarter.end='2026-10-01'
assert.equal(decisionRatios(newAccounts,now).roe,undefined)
console.log('Issuer ROE/liquidity: reconciled comparative equity, losses, zero denominators, missing cash, stale/future dates, revisions and new publication guards OK.')
