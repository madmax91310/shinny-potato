#!/usr/bin/env node
// Reproducible comparisons of current canonical inputs. Never repairs an output.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { ASSETS as histories } from '../src/data/calculator-history.js'
import { getInstrumentFacts } from '../src/data/instrument-facts.js'
import { getInstrumentAnnualPerformance } from '../src/data/instrument-returns.js'
import { ETFS } from '../src/data/etf-cards.js'
import { getAnnualPerformance } from '../src/pages/etf-sheets/annualPerformance.js'
import { getComparisonPerformance } from '../src/pages/tweet-midi/comparisonPerformance.js'
import { getAnnualReturnStartYears, getAnnualReturns, performanceBasis } from '../src/pages/tweet-midi/data/performanceHistory.js'
import { ANNIVERSAIRE_ELIGIBLE_ASSETS, getHistoricalPrice } from '../src/pages/tweet-midi/data/marketHistory.js'
import { derive, computeAssetSeries } from '../src/pages/investment-calculator/lib.js'
import { computeComparison } from '../src/pages/investment-calculator/comparison.js'
import { monthlyCurrencyFactor } from '../src/data/history-currency.js'
import { convertCalendarReturn } from '../src/data/calendar-fx.js'
import { qualifyHistoryWindow } from '../src/data/history-window-quality.js'
import { ASSETS as portfolios } from '../src/data/portfolio-assets.js'
import { CATALOG, euroReturn } from '../src/data/duel-assets.js'
import { computeYearlyPerf, assetReturn } from '../src/pages/portfolio-generator/performance.js'
import { buildCustomDuel } from '../src/pages/portfolio-duels/lib.js'
import { latestCommonYears } from '../src/data/annual-window.js'
import { isNavTotalReturn, monthlyHistoryMethod } from '../src/lib/performance-conventions.js'
import performanceEngine from '../src/pages/tweet-midi/engines/performance.js'
import { buildPortfolio } from '../src/pages/performance-rankings/series.js'
import { periodReturn } from '../src/pages/performance-rankings/engine.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}

const selected = [
 ['IE00B4L5Y983','ETF physique capitalisant, historique long'],
 ['IE00BYYHSQ67','ETF physique distribuant, revenus réinvestis'],
 ['FR0011871128','ETF synthétique capitalisant, NAV EUR'],
 ['IE0002XZSHO1','Part récente, aucune extension par son indice'],
 ['LU2196470426','NAV annuelle JPY et historique NAV converti EUR'],
 ['IE00BK5BQT80','ETF physique All-World, distinct de son indice'],
 ['IE00B4ND3602','ETC adossé à l’or physique, sans revenu'],
 ['CH0454664001','ETP Bitcoin, NAV distincte de la cotation'],
 ['GB00B15KXQ89','ETC cuivre synthétique, NAV en unités de performance'],
 ['IE00BDBRDM35','Obligations mondiales couvertes EUR'],
]
const rows=[], coverage=[]
const close=(a,b,context)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8,`${context}: ${a} != ${b}`)
const add=(kind,identity,period,currency,left,right,convention,classification='compatible')=>rows.push({kind,identity,period,currency,left,right,gap:left==null||right==null?null:left-right,convention,classification})
const mapOf=s=>s?.years??Object.fromEntries((s?.values??[]).map((v,i)=>[s.calendarYears?.[i]??2020+i,v]))
for(const [isin,reason] of selected){
 const facts=getInstrumentFacts(isin),sheet=ETFS.find(a=>a.isin===isin),annual=getInstrumentAnnualPerformance(isin)
 const available=Object.entries(mapOf(annual)).filter(([,v])=>Number.isFinite(v))
 const history=Object.entries(histories).filter(([,a])=>a.isin===isin)
 coverage.push({isin,reason,name:sheet?.name,income:facts.incomePolicy,replication:facts.replicationMethod,hedge:facts.currencyHedge,
   characteristicsEvidence:facts.characteristicsSource,annual:{currency:annual?.currency,source:annual?.source,checkedAt:annual?.checkedAt,years:mapOf(annual)},
   histories:history.map(([id,a])=>({id,currency:a.currency,basis:a.historyConvention??a.valuationBasis??a.priceMethod,start:a.points[0].date,end:a.points.at(-1).date,sourceUrls:a.sourceUrls,checkedAt:a.checkedAt,method:a.method,allowPriceOverride:a.allowPriceOverride??true}))})
 for(const currency of ['EUR','USD']){
  const presentation=getAnnualPerformance({...sheet,performanceCurrency:currency}),compare=getComparisonPerformance(isin,available.map(([y])=>Number(y)),currency)
  for(const r of compare?.rows??[]){const value=mapOf(presentation)[r.year];if(!Number.isFinite(value))continue;close(value,r.pct,`${isin} presentation/comparison`);add('Présentation ETF / Comparatif ETF',isin,String(r.year),currency,value,r.pct,`Même calendrier de la part ; ${annual?.sourceKind??annual?.basis??'voir preuve'} ; conversion de décembre à décembre ; frais du fonds inclus`)}
 }
 for(const [id,a] of history){
  const start=a.points[0].date>'2023-12'?a.points[0].date:'2023-12',end=a.points.at(-1).date
  const q=qualifyHistoryWindow(a,start,end)
  if(!q.qualified){add('Fenêtre refusée',isin,`${start}/${end}`,a.currency,null,null,q.reason,'non résolu — restriction conservée');continue}
  for(const currency of ['EUR','USD']) for(const mode of ['lump','dca']){
   const d=derive({assetId:id,startYear:Number(start.slice(0,4)),startMonth:Number(start.slice(5)),amountRaw:'100',mode,currency,overridePriceRaw:''})
   const points=a.points.filter(p=>p.date>=d.startYm&&p.date<=d.endYm),price=p=>p.price*monthlyCurrencyFactor(p.date,a.currency,currency)
   const units=mode==='dca'?points.reduce((s,p)=>s+100/price(p),0):100/price(points[0])
   const expected=units*price(points.at(-1));close(d.result.finalValue,expected,`${id} ${mode} independent units`)
   const c=computeComparison({amount:100,startYm:d.startYm,endYm:d.endYm,mode,currency},id,id,mode,mode)
   for(const side of c.sides)close(side.result.finalValue,expected,`${id} comparison`)
   add(`Calculateur / comparatif vidéo / somme indépendante (${mode})`,id,`${d.startYm}/${d.endYm}`,currency,d.result.finalValue,expected,`${monthlyHistoryMethod(a)} Achats aux clôtures mensuelles, bornes incluses ; ${d.result.totalInvested} versés ; aucun rééquilibrage`)
  }
  const years=getAnnualReturnStartYears(id)
  for(const y of years.filter(y=>y>=2020)){
   const r=getAnnualReturns(id,y)[0],start=`${y-1}-12`,end=`${y}-12`
   const result=computeAssetSeries(a.points,start,end,100,'lump')
   close(result.finalValue-100,r.pct,`${id} monthly/annual`)
   add('Calculateur / Performance depuis',id,`${start}/${end}`,a.currency,result.finalValue-100,r.pct,performanceBasis(id)+' ; année entière ; investissement initial, sans versement')
   const p=portfolios.find(p=>p.isin===isin)
   if(p){const x=convertCalendarReturn(r.pct,y,a.currency,'EUR'),v=assetReturn(p,y);if(Number.isFinite(x)&&Number.isFinite(v)&&Math.abs(x-v)>1e-8)add('Historique mensuel / Générateur',isin,String(y),'EUR',x,v,`${a.historyConvention??a.priceMethod} (${a.currency}) / ${p.automatedManual?'cours ajustés':p.basis??'calendrier de part'} (${p.returnCurrency??annual?.currency}) ; sources et fixings distincts possibles`,'mesures différentes — écart non certifié par la seule différence de convention')}
  }
  if(ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===id)){
   const raw=a.anniversaryPoints??a.points,p=raw.at(-1)
   try{const value=getHistoricalPrice(id,p.date);close(value,p.price,`${id} anniversary raw`);add('Il y a X ans / source de niveau',id,p.date,a.currency,value,p.price,'Niveau brut ou NAV hors distributions qualifié, sans réinvestissement ; distinct du rendement total')}catch(error){add('Il y a X ans / source de niveau',id,p.date,a.currency,null,null,error.message,'non résolu — restriction conservée')}
  }
 }
}
// Extend the equality check to EVERY shared ISIN, not just the chosen examples.
let shared=0
for(const a of portfolios.filter(a=>a.isin))for(const b of CATALOG.filter(b=>b.isin===a.isin)){
 const years=latestCommonYears([a.calendarReturns,b.calendarReturns],{minimum:3})
 for(const year of years){const x=assetReturn(a,year),y=euroReturn(b,year);close(x,y,`${a.id}/${b.id}/${year}`);shared++;add('Générateur / Duels — une ligne',a.isin,String(year),'EUR',x,y,`Même calendrier sélectionné, conversion historique aux deux bornes, 100 % de la ligne ; ${a.id}/${b.id}`)}
}
const lines=[['msci_world_ishares',60],['sp500_ishares',40]],selection=lines.map(([id,pct])=>({...portfolios.find(a=>a.id===id),pct}))
const perf=computeYearlyPerf(selection),duel=buildCustomDuel({left:lines.map(([id,pct])=>({id,pct})),right:[{id:'msci_world_ishares',pct:100}]})
for(const y of duel.years){close(perf[y],duel.a.annual[y],'multi-line yearly');add('Générateur / Duels — plusieurs lignes','60 % World / 40 % S&P 500',String(y),'EUR',perf[y],duel.a.annual[y],'Poids rétablis au début de chaque année ; mêmes années communes ; hors courtage/fiscalité')}
// Indices retain their exact income variant and never acquire a fund ISIN.
for(const id of ['msciWorld','msciAcwi'])for(const currency of ['USD','EUR']){
 const [entry]=performanceEngine.getPerformanceEntries({assetId:id,year:2020,currency})
 assert(!entry.asset.isin)
 for(const row of entry.returns)add('Indice distinct du fonds',id,String(row.year),currency,row.pct,null,performanceBasis(id)+' ; '+(entry.asset.currencyMethod==='official'?'série officielle dans la devise cible':'conversion historique si demandée'),'différence légitime — indice, pas rendement du fonds')
}
assert.throws(()=>performanceEngine.getPerformanceEntries({mode:'comparatif',assetIdA:'msciWorld',assetIdB:'msciAcwi',year:2020,currency:'EUR'}),/convention/)
assert(Object.entries(mapOf(getInstrumentAnnualPerformance('IE0002XZSHO1'))).filter(([,v])=>Number.isFinite(v)).every(([year])=>Number(year)>=2025),'No full calendar year before the recent share’s launch')
// The ranking consumer shares monthly prices, but rebalancing is an explicit
// strategy. Compare identical strategies, then retain the buy-and-hold variant.
const universe=Object.fromEntries(['etfVwce','etfFR0011871128'].map(id=>[id,{...histories[id],id,basis:histories[id].historyConvention??'adjusted'}]))
for(const ids of [['etfVwce'],['etfVwce','etfFR0011871128']])for(const rebalance of ['annual','none']){
 const lines=ids.map((id,i)=>({id,pct:ids.length===1?100:i===0?60:40}))
 const p=buildPortfolio({id:'audit',label:'Audit',lines,rebalance},universe,'EUR',FX,{start:'2023-12',end:'2025-12'})
 let capital=100,holdings=lines.map(l=>100*l.pct/100/universe[l.id].points.find(p=>p.date==='2023-12').price)
 for(const year of [2024,2025]){
  const price=l=>universe[l.id].points.find(p=>p.date===`${year}-12`).price
  capital=holdings.reduce((sum,u,i)=>sum+u*price(lines[i]),0)
  if(rebalance==='annual')holdings=lines.map(l=>capital*l.pct/100/price(l))
 }
 const actual=periodReturn(p,'2023-12','2025-12');close(actual,capital-100,'ranking portfolio independent holdings')
 add('Classement — portefeuille à '+lines.length+' ligne(s)',lines.map(l=>`${l.pct}% ${l.id}`).join(' / '),'2023-12/2025-12','EUR',actual,capital-100,`Investissement initial ; ${rebalance==='annual'?'rééquilibrage annuel en décembre':'conservation des unités sans rééquilibrage'} ; rendements mensuels et NAV/cours restent identifiés`)
}
// Snapshot the demonstrated numerical defect without importing the old engine.
for(const currency of ['USD','EUR']){
 const settings={amount:100,startYm:'2020-12',endYm:'2025-12',mode:'dca',currency,overrideAssetId:'bitcoin',overridePriceRaw:'100000'}
 const before=computeComparison({...settings,overridePriceRaw:''},'bitcoin','bitcoin','lump','dca').sides[1].result.finalValue
 const after=computeComparison(settings,'bitcoin','bitcoin','lump','dca').sides[1].result.finalValue
 add('Correction prix final commun','bitcoin',`${settings.startYm}/${settings.endYm}`,currency,before,after,'Même actif : 61 versements de 100, valorisation des unités au prix saisi 100 000 USD converti au fixing final ; ancien côté B ignorait la saisie','erreur de calcul corrigée')
}
const inputs=['src/data/automated-etf.json','src/data/automated-etf-monthly.json','src/data/monthly-duel-returns.json','src/data/monthly-fx.json','src/data/financial-history-restrictions.json','src/data/history-window-restrictions.json']
const result={schema:1,generatedAt:new Date().toISOString(),base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),inputs:Object.fromEntries(inputs.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')])),coverage,sharedAnnualComparisons:shared,navMethodCount:Object.values(histories).filter(isNavTotalReturn).length,rows,
 limits:['Calculs depuis les registres courants : aucune recollecte ni certification indépendante des observations sources.','Une différence NAV/cotation ne prouve pas à elle seule la validité de son amplitude. Les fenêtres déjà refusées restent refusées.','Les calendriers annuels ne créent aucun historique mensuel ni niveau brut ; les proxies admis restent des simulations distinctes.']}
if(process.argv.includes('--write')){
 const dir='reports/financial-consistency-2026-11-02';mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/matrix.json`,JSON.stringify(result,null,2)+'\n')
 const fields=['kind','identity','period','currency','left','right','gap','convention','classification'];writeFileSync(`${dir}/matrix.csv`,[fields.join(','),...rows.map(r=>fields.map(k=>'"'+String(r[k]??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n')
}
console.log(JSON.stringify({rows:rows.length,sharedAnnualComparisons:shared,navMethodCount:result.navMethodCount,classifications:Object.fromEntries([...new Set(rows.map(r=>r.classification))].map(k=>[k,rows.filter(r=>r.classification===k).length]))},null,2))
