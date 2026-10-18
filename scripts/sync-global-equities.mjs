// Moves curated equity candidates into src/data/global-equities.json once their exact
// listing has been classified by the issuer holdings and their monthly history has been
// qualified for real. Configuration alone never publishes a stock; a candidate that did
// not qualify stays in the candidates file with the recorded reason.
import {readFileSync, writeFileSync} from 'node:fs'
const path=p=>new URL('../'+p,import.meta.url)
const read=p=>JSON.parse(readFileSync(path(p)))
const write=(p,data,indent=2)=>writeFileSync(path(p),JSON.stringify(data,null,indent)+'\n')
const candidatesFile=read('scripts/global-equity-candidates.json')
const global=read('src/data/global-equities.json')
const records=read('src/data/automated-monthly.json')
const classifications=read('src/data/dca-security-classifications.json')
const status=read('scripts/source-snapshots/monthly-qualification-status.json')
const known=new Set(global.map(r=>r.isin))
const remaining=[], promoted=[]
for(const c of candidatesFile.candidates){
 const record=records[c.id], security=classifications[c.isin]
 if(known.has(c.isin)){continue}
 if(!record||record.isin!==c.isin||!security){
  const attempt=status[c.isin]
  remaining.push({...c,...(attempt?{lastAttempt:{checkedAt:attempt.checkedAt,status:attempt.status,error:attempt.error??attempt.reason??null}}:{})})
  continue
 }
 if(c.symbol&&c.symbol!==record.symbol)throw new Error(`${c.id}: qualified symbol ${record.symbol} differs from the curated listing ${c.symbol}`)
 const {lastAttempt,...identity}=c
 promoted.push({...identity,symbol:record.symbol,currency:record.currency,country:security.country,sector:security.sector,
  periodStart:record.periodStart,identitySourceUrl:security.sourceUrl,checkedAt:record.checkedAt?.slice(0,10)??security.checkedAt.slice(0,10)})
}
if(promoted.length){
 write('src/data/global-equities.json',[...global,...promoted])
}
write('scripts/global-equity-candidates.json',{...candidatesFile,candidates:remaining},1)
console.log(`Global equities: ${promoted.length} promoted, ${remaining.length} still pending.`)
for(const r of remaining)console.log(` - ${r.id} (${r.isin}): ${r.lastAttempt?.error??'not attempted yet'}`)
