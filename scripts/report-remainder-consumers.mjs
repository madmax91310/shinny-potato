// Inspect actual consumer registries, independently of the old anomaly snapshot.
import fs from 'node:fs'
import {ASSETS,ASSET_ORDER} from '../src/data/market-history.js'
import {RANKING_ASSETS,ANNUAL_ASSETS} from '../src/pages/performance-rankings/data.js'
import {ASSETS as PORTFOLIO} from '../src/data/portfolio-assets.js'
import {CATALOG} from '../src/data/duel-assets.js'
import {MARKET_ASSETS,ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
const input=process.argv[2]??'reports/reliquat-2026-10-23/reconciliation-90-ecarts.json'
const rows=JSON.parse(fs.readFileSync(input)).cases.filter(r=>r.status==='anomalie encore inexpliquée')
const reports=rows.map(r=>{
 const start=`${Number(r.year)-1}-12`,end=`${r.year}-12`
 const summarize=a=>a?{id:a.id??r.id,isin:a.isin,currency:a.currency??a.returnCurrency,basis:a.historyConvention??a.valuationBasis??a.basis??a.historyBasis??null,sourceUrls:a.sourceUrls??a.source??a.sourceUrl??null,start:a.points?.[0]?.date,end:a.points?.at(-1)?.date,window:a.points?qualifyHistoryWindow(a,start,end):null,windowReturn:a.points?(()=>{const p=a.points.find(p=>p.date===start),q=a.points.find(p=>p.date===end);return p&&q?(q.price/p.price-1)*100:null})():a.years?.[r.year]??a.calendarReturns?.[r.year]??null}:null
 const a=ASSETS[r.id]
 return {isin:r.isin,year:Number(r.year),id:r.id,originalSymbol:r.marketSymbol,originalWindow:[start,end],oldQuoteActive:Boolean(a&&!a.valuationBasis&&a.isin===r.isin),active:summarize(a),consumers:{calculator:ASSET_ORDER.includes(r.id),performance:MARKET_ASSETS.some(a=>a.id===r.id),anniversary:ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===r.id),rankings:summarize(RANKING_ASSETS[r.id]),annualCalendars:Object.values(ANNUAL_ASSETS).filter(a=>a.isin===r.isin).map(summarize),manualPortfolio:PORTFOLIO.filter(a=>a.isin===r.isin).map(summarize),duels:CATALOG.filter(a=>a.isin===r.isin).map(summarize)}}
})
console.log(JSON.stringify(reports,null,2))
