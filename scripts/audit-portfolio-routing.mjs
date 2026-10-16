import {readFileSync,writeFileSync} from 'node:fs'
import {references} from '../src/pages/dca-profiles/engine.js'
import {catalogCoverage} from '../src/pages/dca-profiles/verification.js'
import {ASSETS,ASSET_ORDER} from '../src/data/market-history.js'
import {MARKET_ASSETS,ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {equityUniverse} from './dca-equity-universe.mjs'
const read=p=>JSON.parse(readFileSync(p))
const catalog=read('src/pages/dca-profiles/catalog.json'),complete=read('src/data/dca-complete-holdings.json')
const configured={...read('scripts/dca-complete-holdings-sources.json')}
const monthly=[...read('scripts/monthly-automation.json').series,...read('scripts/non-bond-monthly-sources.json').series]
const monthlyRecords={...read('src/data/automated-monthly.json'),...read('src/data/automated-etf-monthly.json'),...read('src/data/non-bond-monthly-records.json')}
const scopes={calculator:new Set(ASSET_ORDER),performance:new Set(MARKET_ASSETS.map(a=>a.id)),anniversary:new Set(ANNIVERSAIRE_ELIGIBLE_ASSETS.map(a=>a.id))}
const coverage=catalogCoverage(references),missingEquities=Object.keys(equityUniverse()).filter(id=>!references[id])
const historical=monthly.filter(s=>['equity','catalog'].includes(s.consumerScope)).map(s=>({id:s.id,name:s.label,kind:s.consumerScope,first:ASSETS[s.id]?.points?.[0]?.date,last:ASSETS[s.id]?.points?.at(-1)?.date,sourceLast:monthlyRecords[s.id]?.periodEnd,automatic:!!monthlyRecords[s.id],tools:Object.fromEntries(Object.entries(scopes).map(([tool,ids])=>[tool,tool==='anniversary'&&s.collectAnniversary===false?null:ids.has(s.id)]))}))
const notApplicable=coverage.filter(r=>r.countries.outside>=99.5&&r.sectors.outside>=99.5)
const gaps=coverage.filter(r=>r.countries.coverage+r.countries.outside<99.5||r.sectors.coverage+r.sectors.outside<99.5)
const report={checkedAt:new Date().toISOString(),catalog:Object.keys(catalog).length,completeCompositions:Object.keys(complete).length,completeConfigured:Object.keys(configured).length,missingEquities,exposureCoverage:coverage.filter(r=>r.countries.coverage>=99.5&&r.sectors.coverage>=99.5).length,
 notApplicable:notApplicable.map(r=>({id:r.asset,name:r.name,reason:'Hors classification pays/secteurs actions'})),
 incomplete:gaps.map(r=>({id:r.asset,name:r.name,countries:r.countries,sectors:r.sectors})),historical}
if(process.argv.includes('--write'))writeFileSync('docs/portfolio-routing-status.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({catalog:report.catalog,complete:report.completeCompositions,completeConfigured:report.completeConfigured,exposureCoverage:report.exposureCoverage,historical:historical.length,notApplicable:notApplicable.length,incomplete:gaps.length,missingEquities,missingHistoryTools:historical.filter(r=>Object.values(r.tools).some(v=>v===false)).map(r=>r.id)}))
if(missingEquities.length||historical.some(r=>!r.first||!r.automatic||r.last!==r.sourceLast||Object.values(r.tools).some(v=>v===false)))process.exitCode=1
