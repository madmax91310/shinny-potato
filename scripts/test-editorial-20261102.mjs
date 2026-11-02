import assert from 'node:assert/strict'
import { buildFactsheetTweet } from '../src/pages/factsheet-tweets/lib.js'
import { SHEETS } from '../src/pages/factsheet-tweets/data.js'
import { buildTweetText as dca } from '../src/pages/dca-profiles/lib.js'
import { ALL_PROFILES } from '../src/pages/dca-profiles/data.js'
import { buildTweetText as calculator, derive } from '../src/pages/investment-calculator/lib.js'
import { buildRanking, buildTweet } from '../src/pages/performance-rankings/engine.js'
import { buildTweet as investor } from '../src/pages/investor-portfolio/data.js'
const acwi=SHEETS.find(s=>s.id==='acwi')
const partial=buildFactsheetTweet({...acwi,countries:[['Japon',60],['États-Unis',40]],holdings:[]})
assert(!partial.includes('aussi présents'))
assert(!partial.includes('Regardons les principales entreprises'))
assert(partial.includes(`Composition : ${acwi.snapshot}.`))
assert(partial.includes(acwi.performance.detail.replace(/\.$/,'')+'.'))
for(const id of ['world','eurostoxx50','stoxx600','acwi']) {
  const text=buildFactsheetTweet({...SHEETS.find(s=>s.id===id),holdings:[]})
  assert(text.includes('Regardons la répartition publiée'))
  assert(!text.includes('Regardons les principales entreprises'))
}
for(const emoji of ['👩‍💻','🧑‍💻','👨‍💻','']) {
  const text=dca({...ALL_PROFILES[0],emoji})
  assert(text.includes('Chaque mois, les versements sont répartis ainsi :'))
  assert(!/Chaque mois, (il|elle) investit/.test(text))
  assert(text.endsWith('Pas un conseil financier'))
}
for(const name of ['Hugo','Hélène'])assert(dca({...ALL_PROFILES[0],name}).includes(`du DCA d’${name} ?`))
for(const mode of ['lump','dca']) for(const price of ['50','100000']) {
  const s={assetId:'bitcoin',amountRaw:'1000',mode,startYear:2025,startMonth:1,overridePriceRaw:price,currency:'native'}
  const result=derive(s),text=calculator(s,result)
  assert(!text.includes('€'))
  assert(text.includes('Au prix final saisi'))
  assert(text.includes('📉 Capital final') === (result.result.finalValue<result.result.totalInvested))
  if(mode==='dca')assert(text.includes(`${result.result.months.length} versements en fin de mois`))
  else assert(text.includes('Versement unique à la clôture de janvier 2025.'))
}
const s={assetId:'custom',amountRaw:'1000',mode:'lump',startYear:2025,startMonth:1,customStart:'100',customEnd:'50',customLabel:'un support de test'}
assert(calculator(s,derive(s)).includes('sans historique de marché'))
assert(!calculator(s,derive(s)).includes('Tu aurais gardé ce placement'))
const base=derive({assetId:'bitcoin',amountRaw:'1000',mode:'dca',startYear:2025,startMonth:1,overridePriceRaw:''})
assert(calculator({assetId:'bitcoin'}, {...base,result:{...base.result,months:undefined}}).includes('Versements mensuels en fin de mois'))
assert(calculator({assetId:'bitcoin'}, {...base,result:{...base.result,months:['2025-01']}}).includes('1 versement en fin de mois'))
for(const mode of ['lump','dca']) {
  const state={assetId:'or',amountRaw:'1000',mode,startYear:2020,startMonth:1,overridePriceRaw:''}
  const text=calculator(state,derive(state))
  assert(text.includes('moyennes mensuelles de prix'))
  assert(!text.includes('clôture'))
  assert(!text.includes('en fin de mois'))
}
for(const instrumentType of ['EQUITY','ETF'])for(const value of [-20,-0.001,0,0.001,20]) {
  const assets=[0,1].map(i=>({id:String(i),isin:String(i),label:`Support ${i}`,shortLabel:`Support ${i}`,instrumentType,frequency:'annual',basis:'fund-nav',currency:'USD',years:{2025:value}}))
  const text=buildTweet(buildRanking(assets,{mode:'period',start:'2024-12',end:'2025-12'}),'Manuel')
  assert(text.includes(instrumentType==='EQUITY'?'laquelle':'lequel'))
  assert(text.includes('revenus réinvestis'))
  assert(!/NaN|undefined/.test(text))
  if(value !== 0 && Math.abs(value)<0.01)assert(text.includes(`${value<0?'baisse':'hausse'} de moins de 0,01 %`))
}
const holdings=[.4,.2,.15,.1,.1,.05].map((weight,i)=>({weight,issuerName:`Entreprise ${i}`,ticker:`TEST${i}`}))
const text=investor({identity:{slug:'test',displayName:'Gestionnaire de test'},snapshot:{periodEnd:'2026-06-30',holdings},holdings})
assert(text.includes('L’autre entreprise hors du top 5 représente 5,0 %'))
assert(!text.includes('Les 1 autres'))
console.log('Textes complets : accords, égalité/perte/gain, DCA neutre, prix saisis, dates, données partielles et BTC en USD validés.')
