// Offline, exhaustive audit of every qualified listing, using actual retained
// provider series and evidence. No network sweep and no arbitrary candidate cap.
import fs from 'node:fs'
import {hydrateMarketSeries} from './ai-series-store.mjs'
import {coverage} from '../src/pages/ai-portfolios/lib.js'
const market=JSON.parse(fs.readFileSync('data/ai-portfolios/market.json'))
const listings=market.universe.filter(a=>a.status==='qualified')
hydrateMarketSeries(market,process.cwd(),listings.map(a=>a.id))
const rows=[]
for(const a of listings){
 const s=market.series[a.id],one={...market,universe:[a]},date=a.coverageThrough
 let reason=null
 const test=(ok,message)=>{if(!ok&&!reason)reason=message}
 test(!!date,'Borne de couverture absente')
 const certified=coverage(a.id,one,date??market.asOf)
 test(certified.ok,certified.reason)
 test(a.evidenceId?s?.listingEvidenceId===a.evidenceId:s?.listingEvidenceId==null&&!!a.isin&&s.isin===a.isin&&s.responseSha256===a.responseSha256&&s.sourceUrl===a.dailySourceUrl,'Preuve de cotation différente de la série')
 test(!!s?.sourceUrl&&!!s.retrievedAt&&!!s.responseSha256,'Provenance quotidienne incomplète')
 test(s?.sourceCurrency===(a.observedSourceCurrency??a.sourceCurrency??a.currency),'Unité du fournisseur incohérente')
 test((s?.priceScale??1)===(a.priceScale??1),'Échelle de cotation incohérente')
 if(s?.points){const anchor=s.points[s.anchorDate]?.adjusted;for(const [d,p] of Object.entries(s.points)){test(p.close>0&&p.adjusted>0&&p.synthetic>0&&Number.isFinite(p.synthetic)&&Math.abs(p.synthetic-100*p.adjusted/anchor)<1e-7,'Base synthétique incohérente au '+d)}}
 const ready=coverage(a.id,one,market.asOf)
 rows.push({id:a.id,instrumentId:a.instrumentId??a.isin??a.id,family:a.family,certifiedThrough:date,technicalUsable:!reason,operationReadyAtCutoff:ready.ok&&!reason,reason:reason??(!ready.ok?ready.reason:null),source:s?.sourceUrl,sha256:s?.responseSha256})
}
const report={version:1,asOf:market.asOf,sourceGeneratedAt:market.generatedAt,method:'Contrôle exhaustif des séries réelles et certificats conservés, sans collecte intégrale.',legacyEvidenceWithoutId:listings.filter(a=>!a.evidenceId).length,listingCount:rows.length,instrumentCount:new Set(rows.map(r=>r.instrumentId)).size,technicalUsable:rows.filter(r=>r.technicalUsable).length,readyAtPublishedCutoff:rows.filter(r=>r.operationReadyAtCutoff).length,exceptions:rows.filter(r=>!r.technicalUsable),catchupRequired:rows.filter(r=>r.technicalUsable&&!r.operationReadyAtCutoff),byFamily:Object.fromEntries([...new Set(rows.map(r=>r.family))].map(f=>[f,{listings:rows.filter(r=>r.family===f).length,technicalUsable:rows.filter(r=>r.family===f&&r.technicalUsable).length,ready:rows.filter(r=>r.family===f&&r.operationReadyAtCutoff).length}]))}
fs.writeFileSync('data/ai-portfolios/runtime-audit.json',JSON.stringify(report,null,2)+'\n');fs.copyFileSync('data/ai-portfolios/runtime-audit.json','public/data/ai-portfolios/runtime-audit.json')
console.log(JSON.stringify({...report,exceptions:report.exceptions.slice(0,20),catchupRequired:report.catchupRequired.slice(0,10)},null,2))
if(report.exceptions.length)process.exitCode=1
