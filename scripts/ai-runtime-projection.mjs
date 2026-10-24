import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {requiredSeries,publicMarket} from './ai-series-store.mjs'
import {defaultConfig} from '../src/pages/ai-portfolios/data.js'
// Search contains every technical candidate, including explicit failures. Source
// certificates and histories are separate resources, never bootstrap payloads.
const FIELDS=['id','instrumentId','isin','name','company','shareType','family','ticker','symbol','mic','currency','sourceCurrency','priceScale','timezone','calendar','instrumentType','ucits','leveraged','region','exposure','status','reason','selectionBlock','discoveryBlock','permanentExclusion','lastAttempt','lastSuccess','coverageFrom','coverageThrough','seriesFile','country','listingCountry','earliestQualificationDate']
const write=(folder,name,value)=>{const file=path.join(folder,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(value)+'\n');fs.renameSync(file+'.tmp',file)}
export function publishRuntime(root,book,market,state){
 const folder=path.join(root,'public/data/ai-portfolios'),all=publicMarket(market,book.competitions.flatMap(c=>c.config.universe)),defaults=defaultConfig(),retained=new Set([...requiredSeries(book),defaults.benchmark])
 const catalogueFingerprint=createHash('sha256').update(JSON.stringify([...new Set(all.universe.map(a=>a.id))].sort())).digest('hex')
 // Archived rule universes are redundant at opening, especially after months
 // of weekly replies. The exact durable book remains available on explicit export.
 write(folder,'book.json',book)
 const compactRules=rules=>{if(!rules)return rules;const {universe,...rest}=rules;return {...rest,universeCount:universe?.length??0,archive:'book.json'}}
 const compactBook={...book,competitions:book.competitions.map(c=>({...c,decisions:c.decisions.map(d=>({...d,rules:compactRules(d.rules)})),ruleHistory:(c.ruleHistory??[]).map(r=>({...r,before:compactRules(r.before),after:compactRules(r.after)}))}))}
 const {competitions:unusedCompetitions,...compactState}=state
 void unusedCompetitions
 const groups=new Map()
 for(const asset of all.universe){const bucket=createHash('sha256').update(asset.id).digest('hex').slice(0,2);if(!groups.has(bucket))groups.set(bucket,{});groups.get(bucket)[asset.id]={asset,status:market.status[asset.id]}}
 for(const [key,values] of groups)write(folder,'details/'+key+'.json',values)
 write(folder,'catalogue.json',{version:1,asOf:market.asOf,revision:market.generatedAt,fingerprint:catalogueFingerprint,columns:FIELDS,rows:all.universe.map(a=>FIELDS.map(k=>a[k]??null))})
 // Only archived identities, the reference, compact calendars/FX and calculated
 // statements are needed to read the competition. No full history at opening.
 const bootstrap={...all,universe:all.universe.filter(a=>retained.has(a.id)),series:{},status:Object.fromEntries(Object.entries(all.status).filter(([id])=>retained.has(id)||['ECB','CBC'].includes(id))),revisions:[]}
 const revisionFiles='source-revisions.json';write(folder,revisionFiles,all.revisions)
 return {version:2,book:compactBook,market:bootstrap,state:compactState,defaults,catalogue:{url:'catalogue.json',count:all.universe.length,revision:market.generatedAt,fingerprint:catalogueFingerprint},sourceRevisionCount:all.revisions.length}
}
