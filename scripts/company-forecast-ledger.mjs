import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMPANIES } from '../src/data/companies.js'
import { buildPriceScenarios, TARGET_POLICY } from '../src/pages/company-analysis/priceTargets.js'
import { activeDecision, fresh } from '../src/pages/company-analysis/lib.js'
import { valuationInputs } from '../src/pages/company-analysis/valuation.js'
const day=86400000,hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex')
export function snapshot(companies,now,revision) {
  const issuedAt=now.toISOString().slice(0,10)
  const records=companies.map(c=>{
    const forecasts=[],excluded=[],inputs=valuationInputs(c,now),q=c.quote
    // Old forecasts still need market outcomes when fresh accounts are unavailable.
    const quoteQualified=q?.currency===c.currency&&Number.isFinite(q.price)&&q.price>0&&fresh(q.asOf,10,now)&&q.sourceUrl?.startsWith('https://')&&Array.isArray(q.splits)
    for(const years of TARGET_POLICY.horizons) {
      const m=buildPriceScenarios(c,{},now,years)
      for(const method of ['cash','earnings']) {
        const e=m.evidence[method]
        if(!e||!quoteQualified){excluded.push({method,years,reasons:[...m.inputs.reasons,...(!quoteQualified?['Clôture qualifiée requise pour archiver la prévision.']:[])]});continue}
        const period=e.periods.at(-1),annual=e.curve.find(p=>p.end===period)
        forecasts.push({method,years,targetDate:m.targetDate,fundamentalPeriod:period,fundamentalValue:annual.value,
          basis:e.basis,accountingDefinition:method==='cash'?m.inputs.history.at(-1).definition:'adjusted-non-gaap',sourceUrl:e.sourceUrl,sourceAsOf:e.asOf,calibration:e.calibration,trajectory:e.trajectory,rationale:e.rationale,
          scenarios:m.scenarios.map(s=>({name:s.name,assumptions:s[method+'Assumptions'],target:s[method+'Target']}))})
      }
    }
    const f=c.targetForecast,decision=activeDecision(c,now)
    return {id:c.id,symbol:c.symbol,currency:c.currency,quote:quoteQualified?{price:q.price,asOf:q.asOf,sourceUrl:q.sourceUrl,splits:q.splits,coverageFrom:q.history?.[0]?.asOf??q.asOf}:null,
      // Keep source inputs and both exclusions/eligible models; never recreate old forecasts with today's code.
      sources:{annual:c.annual,decision:c.decision,targetForecast:f,targetCashReference:c.targetCashReference,valuationShareBasis:c.valuationShareBasis},
      actuals:{earnings:f?.basis==='adjusted-non-gaap'&&f.currency===c.currency&&f.symbol===c.symbol&&f.sourceUrl?.startsWith('https://')&&f.asOf<=issuedAt?
        f.points.filter(p=>p.kind==='observed-adjusted'&&p.end<=f.asOf).map(p=>({end:p.end,value:p.eps,asOf:f.asOf,sourceUrl:f.sourceUrl})):[],
        cash:decision?inputs.history.filter(p=>p.definition&&p.end>=c.valuationShareBasis?.splitCheckFrom).map(p=>({...p,asOf:decision.observedAt})):[]},forecasts,excluded}
  })
  return {version:1,modelVersion:TARGET_POLICY.version,issuedAt,revision,records}
}
export function appendSnapshot(directory,value) {
  mkdirSync(directory,{recursive:true})
  const digest=hash(value),file=join(directory,`${value.issuedAt}-${digest}.json`)
  if(!existsSync(file))writeFileSync(file,JSON.stringify({hash:digest,snapshot:value},null,2)+'\n',{flag:'wx'})
  return file
}
export function readSnapshots(directory) {
  if(!existsSync(directory))return []
  return readdirSync(directory).filter(f=>f.endsWith('.json')).map(f=>{
    const item=JSON.parse(readFileSync(join(directory,f),'utf8'))
    if(item.hash!==hash(item.snapshot)||f!==`${item.snapshot.issuedAt}-${item.hash}.json`)throw Error('Archive modifiée ou corrompue : '+f)
    return item
  }).sort((a,b)=>a.snapshot.issuedAt.localeCompare(b.snapshot.issuedAt)||a.hash.localeCompare(b.hash))
}
// An observed split blocks comparisons: no unverified split factor is inferred.
function comparable(observations,start,end) {
  const quotes=observations.map(o=>o.record.quote).filter(q=>q&&q.asOf<=end).sort((a,b)=>a.asOf.localeCompare(b.asOf))
  let through=start
  for(const q of quotes) {
    if((q.splits??[]).some(s=>s>start&&s<=end))return false
    if(q.coverageFrom<=through&&q.asOf>=through)through=q.asOf
  }
  return through>=end
}
export function evaluate(archives,today) {
  const snapshots=archives.filter(a=>a.snapshot.issuedAt<=today),results=[]
  for(const a of snapshots)for(const r of a.snapshot.records)for(const f of r.forecasts) {
    const observations=snapshots.filter(b=>b.snapshot.issuedAt>=a.snapshot.issuedAt).flatMap(b=>b.snapshot.records.filter(x=>x.id===r.id&&x.symbol===r.symbol&&x.currency===r.currency).map(record=>({record,issuedAt:b.snapshot.issuedAt})))
    const key=`${a.hash}/${r.id}/${f.method}/${f.years}`,result={key,company:r.id,method:f.method,years:f.years,modelVersion:a.snapshot.modelVersion,issuedAt:a.snapshot.issuedAt,targetDate:f.targetDate,priceStatus:today<f.targetDate?'pending':'waiting',fundamentalStatus:'pending'}
    const candidates=observations.filter(o=>o.record.quote&&o.record.quote.asOf>=f.targetDate&&o.record.quote.asOf<=today&&o.record.quote.asOf<=o.issuedAt&&o.issuedAt<=new Date(Date.parse(f.targetDate)+7*day).toISOString().slice(0,10)&&Date.parse(o.record.quote.asOf)-Date.parse(f.targetDate)<=7*day)
      .sort((x,y)=>x.issuedAt.localeCompare(y.issuedAt)||x.record.quote.asOf.localeCompare(y.record.quote.asOf))
    const observed=candidates[0],q=observed?.record.quote
    if(q) {
      if(!comparable(observations,r.quote.asOf,q.asOf))result.priceStatus='basis-unqualified'
      else {
        const [low,central,high]=f.scenarios.map(s=>s.target.value)
        Object.assign(result,{priceStatus:'evaluated',actualPrice:q.price,observedAt:observed.issuedAt,actualDate:q.asOf,sourceUrl:q.sourceUrl,
          lagDays:(Date.parse(q.asOf)-Date.parse(f.targetDate))/day,error:central/q.price-1,absoluteError:Math.abs(central/q.price-1),
          baselineAbsoluteError:Math.abs(r.quote.price/q.price-1),insideRange:q.price>=low&&q.price<=high})
      }
    }else if(Date.parse(today)>Date.parse(f.targetDate)+7*day)result.priceStatus='missing-observation'
    // Cash projections use anniversary dates; 52/53-week issuer fiscal ends
    // move by a few days. Require one unambiguous annual match within 14 days.
    // Adjusted EPS stays on the exact fiscal dates used by its source.
    const actual=observations.flatMap(o=>{
      const matches=(o.record.actuals[f.method]??[]).filter(p=>
        (f.method==='cash'?Math.abs(Date.parse(p.end)-Date.parse(f.fundamentalPeriod))<=14*day:p.end===f.fundamentalPeriod)
        &&(f.method!=='cash'||p.definition===f.accountingDefinition)&&p.asOf<=o.issuedAt&&p.asOf>=p.end&&Number.isFinite(p.value))
      return matches.length===1?[{p:matches[0],o}]:[]
    }).sort((x,y)=>x.o.issuedAt.localeCompare(y.o.issuedAt))[0]
    if(actual) {
      if(!comparable(observations,r.quote.asOf,actual.o.record.quote?.asOf??actual.p.asOf))result.fundamentalStatus='basis-unqualified'
      else Object.assign(result,{fundamentalStatus:'evaluated',actualFundamental:actual.p.value,actualFundamentalPeriod:actual.p.end,fundamentalAsOf:actual.p.asOf,fundamentalSourceUrl:actual.p.sourceUrl,fundamentalError:actual.p.value===0?null:(f.fundamentalValue-actual.p.value)/Math.abs(actual.p.value),fundamentalAbsoluteError:Math.abs(f.fundamentalValue-actual.p.value)})
    } else if(today>f.fundamentalPeriod)result.fundamentalStatus='awaiting-comparable-accounts'
    results.push(result)
  }
  const groups={}
  for(const r of results) {
    const key=`${r.company}/${r.method}/${r.years}/v${r.modelVersion}`
    const g=groups[key]??={company:r.company,method:r.method,years:r.years,modelVersion:r.modelVersion,count:0,pending:0,missing:0,blocked:0,priceErrors:[],baselineErrors:[],fundamentalErrors:[],fundamentalObserved:0,inside:0}
    g.count++
    if(r.priceStatus==='evaluated'){g.priceErrors.push(r.absoluteError);g.baselineErrors.push(r.baselineAbsoluteError);g.inside+=Number(r.insideRange)}
    else if(['pending','waiting'].includes(r.priceStatus))g.pending++
    else if(r.priceStatus==='basis-unqualified')g.blocked++
    else g.missing++
    if(r.fundamentalStatus==='evaluated'){g.fundamentalObserved++;if(Number.isFinite(r.fundamentalError))g.fundamentalErrors.push(Math.abs(r.fundamentalError))}
  }
  const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null
  const summary={version:1,updatedAt:today,startedAt:snapshots[0]?.snapshot.issuedAt??null,snapshots:snapshots.length,
    archiveUrl:'https://github.com/madmax91310/shinny-potato/tree/company-forecast-history',
    convention:'Prévisions automatiques uniquement. Cours : première clôture observée dans les 7 jours suivant l’échéance, délai explicite, hors dividendes. Erreur absolue = |prévision / constat − 1|. Référence naïve : cours inchangé. Fondamentaux : même exercice et définition, pertes incluses ; erreur relative = (prévision − constat) / |constat|. Un constat nul reste enregistré avec une erreur absolue en unités, sans pourcentage. Comparaison suspendue si division d’actions ou couverture de contrôle insuffisante. Les prévisions quotidiennes se recouvrent et ne sont pas des observations indépendantes.',
    groups:Object.values(groups).map(g=>({company:g.company,method:g.method,years:g.years,modelVersion:g.modelVersion,count:g.count,pending:g.pending,missing:g.missing,blocked:g.blocked,evaluated:g.priceErrors.length,mae:mean(g.priceErrors),baselineMae:mean(g.baselineErrors),rangeCoverage:g.priceErrors.length?g.inside/g.priceErrors.length:null,fundamentalEvaluated:g.fundamentalObserved,fundamentalRelativeCount:g.fundamentalErrors.length,fundamentalMae:mean(g.fundamentalErrors)}))}
  return {summary,results}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [directory,summaryPath,revision]=process.argv.slice(2)
  if(!directory||!summaryPath||!revision)throw Error('Usage: ledger ARCHIVE_DIR SUMMARY_PATH GIT_SHA')
  const now=new Date(),dir=join(directory,'forecasts')
  appendSnapshot(dir,snapshot(COMPANIES,now,revision))
  const {summary,results}=evaluate(readSnapshots(dir),now.toISOString().slice(0,10))
  writeFileSync(summaryPath,JSON.stringify(summary,null,2)+'\n')
  // Evaluation outputs may be recomputed; originals under forecasts/ may only be appended.
  writeFileSync(join(directory,'evaluation.json'),JSON.stringify({updatedAt:summary.updatedAt,results},null,2)+'\n')
  console.log(JSON.stringify({snapshots:summary.snapshots,forecasts:results.length,evaluated:results.filter(r=>r.priceStatus==='evaluated').length}))
}
