// Read-only inventory of actual prepared profiles and exact selector references.
import {readFileSync,writeFileSync} from 'node:fs'
import {ALL_PROFILES} from '../src/pages/dca-profiles/data.js'
import {execFileSync} from 'node:child_process'
import {sharedPositions} from '../src/pages/dca-profiles/verification.js'
import {EXPOSURE_MAX_AGE_DAYS} from '../src/pages/dca-profiles/exposure.js'
const refAt=process.argv.indexOf('--ref'),ref=refAt>=0?process.argv[refAt+1]:null
const read=p=>JSON.parse(ref?execFileSync('git',['show',`${ref}:${p}`],{encoding:'utf8',maxBuffer:128*1024*1024}):readFileSync(p,'utf8'))
const references=Object.assign({},...['exposures.json','exposures-extra-0.json','exposures-extra-1.json','exposures-extra-2.json'].map(f=>read('src/pages/dca-profiles/'+f)))
const raw=read('src/data/dca-complete-holdings.json'),statuses=read('src/data/dca-holdings-status.json')
const catalogue=read('src/pages/dca-profiles/catalog.json'),manifest=read('src/pages/dca-profiles/holdings-manifest.json')
const projected=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>read(`src/pages/dca-profiles/holdings-${n}.json`)))
const uses=new Map()
for(const p of ALL_PROFILES)for(const line of p.lines)uses.set(line.asset,(uses.get(line.asset)||0)+1)
const now=new Date(),today=Date.parse(now.toISOString().slice(0,10))
const supports=Object.entries(catalogue).map(([asset,c])=>{
 const ref=references[asset],source=raw[c.isin],h=projected[asset],status=statuses[c.isin]
 const outside=ref.outsideClassification|| (c.kind==='equity'?'Action en direct : pas de composition de fonds':null)
 const age=h?(today-Date.parse(h.asOf))/86400000:null
 const line={asset,isin:c.isin,label:c.name,weight:100}
 const analysis=outside?null:sharedPositions([line],references,now,projected)
 const identified=analysis?.totals.reduce((s,g)=>s+g.coverage,0)||0
 const state=outside?'not-applicable':age!==null&&age>EXPOSURE_MAX_AGE_DAYS?'stale'
  :source?.complete&&!h?'misconnected':!h?(status?.status==='failed'?'failed':'unavailable')
  :h.complete&&identified>=99.5&&h.rows.every(row=>row.isin)?'complete':'partial'
 return {asset,isin:c.isin,name:c.name,preparedProfileUses:uses.get(asset)||0,kind:c.kind,state,
  applicableTo:outside||'Equity companies',synthetic:ref.synthetic===true,
  sourceFileComplete:source?.complete===true,projectedComplete:h?.complete===true,
  asOf:h?.asOf||null,checkedAt:h?.checkedAt||source?.checkedAt||null,identifiedWeightPct:identified,
  uncoveredWeightPct:outside?null:Math.max(0,100-identified),rows:h?.rows.length||0,
  publishedWeightPct:h?.rows.reduce((s,r)=>s+r.weightPct,0)||0,
  unidentifiedWeightPct:h?.rows.filter(r=>!r.isin).reduce((s,r)=>s+r.weightPct,0)||0,
  weightExcessPct:Math.max(0,(h?.rows.reduce((s,r)=>s+r.weightPct,0)||0)-100),
  basis:h?.basis||null,scope:h?.scope||null,method:h?.method||null,sourceUrl:h?.sourceUrl||null,sha256:h?.sha256||source?.sha256||null,
  lastAttempt:status||null,
  usableAfterCollectionFailure:status?.status==='failed'&&analysis?.totals.length>0,
  fullOverlapEligible:analysis?.totals[0]?.complete===true&&identified>=99.5&&identified<=100.00001}
}).sort((a,b)=>b.preparedProfileUses-a.preparedProfileUses||a.isin.localeCompare(b.isin))
const report={schemaVersion:1,gitRef:ref||'working-tree',generatedAt:now.toISOString(),preparedProfiles:ALL_PROFILES.length,
 selectorSupports:supports.length,preparedSupports:uses.size,
 classification:'Source completeness, identifiable coverage and last collection outcome are separate facts; counts are profile occurrences, not user popularity.',
 states:Object.fromEntries([...new Set(supports.map(s=>s.state))].map(state=>[state,supports.filter(s=>s.state===state).length])),supports}
const at=process.argv.indexOf('--output')
if(at>=0)writeFileSync(process.argv[at+1],JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({profiles:report.preparedProfiles,selector:report.selectorSupports,states:report.states,usedGaps:supports.filter(s=>s.preparedProfileUses&&!['complete','not-applicable'].includes(s.state)).map(s=>({isin:s.isin,profiles:s.preparedProfileUses,state:s.state,identified:s.identifiedWeightPct}))},null,2))
