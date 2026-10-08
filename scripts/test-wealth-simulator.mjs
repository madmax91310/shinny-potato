import assert from 'node:assert/strict'
import { emptyPlan, examplePlan } from '../src/pages/wealth-simulator/data.js'
import { validatePlan, project, annualNetRate, envelopeAllocation, buildTweet } from '../src/pages/wealth-simulator/lib.js'
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-7, `${a} != ${b}`)
const base = () => {const plan=emptyPlan();plan.years=1;plan.inflation=0;const p=plan.portfolios.a.pockets[2];p.initial=1000;p.monthly=100;return {plan,p,portfolio:plan.portfolios.a}}
const simulate = (portfolio,plan) => project(portfolio,{...plan,scenario:'central'})
{
 const {plan,portfolio}=base(), r=simulate(portfolio,plan).final
 close(r.capital,2200);close(r.paid,2200);close(r.gains,0)
}
{
 const {plan,p,portfolio}=base();p.monthly=0;p.rates={low:12,central:12,high:12};const r=simulate(portfolio,plan).final
 close(r.capital,1120);close(r.gains,120)
}
{
 const {plan,p,portfolio}=base();p.rates={low:12,central:12,high:12}
 const rate=Math.pow(1.12,1/12)-1
 const expected=1000*1.12+100*(1.12-1)/rate
 close(simulate(portfolio,plan).final.capital,expected)
}
{
 const {plan,p,portfolio}=base();p.monthly=0;p.rates={low:-20,central:-20,high:-20};plan.inflation=10
 const r=simulate(portfolio,plan).final;close(r.capital,800);close(r.real,800/1.1);close(r.gains,-200)
}
{
 const {p}=base();p.rates={low:10,central:10,high:10};p.fee=1
 close(annualNetRate(p,'central'),.1);p.rateMode='gross';close(annualNetRate(p,'central'),1.1*.99-1)
}
{
 const {plan,p,portfolio}=base();portfolio.events=[{pocketId:p.id,type:'pause',month:1,endMonth:6,amount:0},{pocketId:p.id,type:'monthly',month:7,endMonth:7,amount:200},{pocketId:p.id,type:'withdrawal',month:12,endMonth:12,amount:500}]
 const r=simulate(portfolio,plan).final;close(r.capital,1700);close(r.withdrawn,500);close(r.paid,2200);close(r.gains,0)
}
{
 const {plan,p,portfolio}=base();p.monthly=0;portfolio.events=[{pocketId:p.id,type:'withdrawal',month:1,endMonth:1,amount:5000}]
 const r=simulate(portfolio,plan);close(r.final.capital,0);close(r.final.withdrawn,1000);close(r.final.unmet,4000);close(r.final.gains,0);assert.ok(r.warnings.some(w=>w.includes('disponible')))
}
{
 const {plan,p,portfolio}=base();p.envelope='livret-a';p.initial=950;p.monthly=100
 const r=project(portfolio,{...plan,ceilings:{'livret-a':1000}}).final
 close(r.pockets[2].capital,1000);close(r.cash,1150);close(r.capital,2150);close(r.gains,0)
}
{
 const {plan,p,portfolio}=base();plan.years=2;p.initial=0;p.contributionGrowth=10
 close(simulate(portfolio,plan).final.capital,2520)
}
{
 const {plan,p,portfolio}=base();p.monthly=0;p.tax=30;p.rates={low:10,central:10,high:10}
 const r=simulate(portfolio,plan).final;close(r.tax,30);close(r.afterTax,1070)
}
{
 const {plan,p,portfolio}=base();p.monthly=0;p.tax=30;p.rates={low:-10,central:-10,high:-10}
 close(simulate(portfolio,plan).final.tax,0)
}
{
 const plan=examplePlan();validatePlan(plan)
 const original=structuredClone(plan), results=Object.fromEntries(['a','b'].map(k=>[k,simulate(plan.portfolios[k],plan)]));assert.deepEqual(plan,original)
 assert.ok(results.a.final.capital>results.b.final.capital)
 const allocation=envelopeAllocation(plan.portfolios.a,results.a)
 close(allocation.reduce((s,r)=>s+r.currentWeight,0),100);close(allocation.reduce((s,r)=>s+r.futureWeight,0),100)
 plan.mode='compare';const text=buildTweet(plan,results);assert.match(text,/Patrimoine A/);assert.match(text,/Patrimoine B/);assert.match(text,/fin de mois/);assert.match(text,/avant fiscalité/)
}
{
 const plan=emptyPlan();assert.equal(simulate(plan.portfolios.a,plan).final.capital,0)
 for(const invalid of [NaN,-1,Infinity]) {const p=emptyPlan();p.portfolios.a.pockets[0].initial=invalid;assert.throws(()=>validatePlan(p))}
 const unordered=emptyPlan();unordered.portfolios.a.pockets[0].rates.low=50;assert.throws(()=>validatePlan(unordered))
 const duplicate=emptyPlan();duplicate.portfolios.a.pockets[1].id=duplicate.portfolios.a.pockets[0].id;assert.throws(()=>validatePlan(duplicate))
 assert.throws(()=>validatePlan({version:2}));const fractional=emptyPlan();fractional.years=1.5;assert.throws(()=>validatePlan(fractional))
 const malicious=emptyPlan();malicious.portfolios.a.events=[{pocketId:'missing',type:'withdrawal',month:1,endMonth:1,amount:10}];assert.throws(()=>validatePlan(malicious))
}
{
 const {plan,p,portfolio}=base();portfolio.pockets=portfolio.pockets.filter(x=>x.id===p.id)
 p.envelope='livret-a';p.initial=490;p.monthly=100;p.rates={low:12,central:12,high:12}
 const twin=structuredClone(p);twin.id='twin';portfolio.pockets.push(twin)
 const result=project(portfolio,{...plan,ceilings:{'livret-a':1000}})
 const firstMonthGrowth=980*(Math.pow(1.12,1/12)-1)
 const deposited=1000-980-firstMonthGrowth
 close(result.final.pockets.reduce((s,x)=>s+x.paid,0),980+deposited)
 close(result.final.paid,3380)
 close(result.final.cash,2400-deposited)
}
console.log('Simulateur : 15 groupes de vérification validés (capitalisation, flux, frais, plafonds, inflation, fiscalité simplifiée, comparaison et import).')
