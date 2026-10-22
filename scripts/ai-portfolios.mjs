#!/usr/bin/env node
import {hydrateMarketSeries,requiredSeries,publicMarket} from './ai-series-store.mjs'
// The sole durable writer for manual requests. Browser exports are proposals, not saved decisions.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateConfig,validateDecision,executionAssets,nextExecution,coverage,sourceFreshness,clone,assert,runCompetition,snapshot,periodReport,weeklyDates,addDays,day } from '../src/pages/ai-portfolios/lib.js'
import { defaultConfig } from '../src/pages/ai-portfolios/data.js'
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
export function register(book,proposal,market,now=new Date().toISOString()) {
  assert(proposal?.version===1&&proposal.expectedRevision===book.revision,'Export périmé ou format invalide. Recharger le dossier avant de réexporter.')
  assert(typeof proposal.requestId==='string'&&/^[a-zA-Z0-9-]{8,80}$/.test(proposal.requestId),'Identifiant de demande invalide.')
  assert(!book.audit.some(e=>e.requestId===proposal.requestId),'Demande déjà enregistrée, aucune double exécution.')
  const next=clone(book),op=proposal.operation
  assert(op&&typeof op==='object','Opération absente.')
  if(['decision','launch'].includes(op.type)){const fresh=sourceFreshness(market,now);assert(fresh.ok,fresh.reason)}
  let comp=next.competitions.find(c=>c.id===proposal.competitionId)
  const event={requestId:proposal.requestId,at:now,operation:op.type,competitionId:comp?.id??proposal.requestId,reason:op.reason??null}
  if(op.type==='create') {
    validateConfig(op.config,market)
    assert(op.config.launchDate>=day(now),'Le lancement ne peut pas être rétroactif.')
    comp={id:proposal.requestId,config:clone(op.config),status:'draft',decisions:[],createdAt:now,ruleHistory:[]}
    next.competitions.push(comp)
  } else {
    assert(comp,'Compétition inconnue.')
    if(op.type==='configure') {
      validateConfig(op.config,market)
      if(comp.status==='launched') {
        assert(typeof op.reason==='string'&&op.reason.trim(),'Motif du changement de règles requis.')
        const allowed=['minLines','maxLines','maxWeight','frequency','feeBps','universe','assetTypes','requireUcits']
        const archivedIds=new Set([comp.config.benchmark,...comp.decisions.flatMap(d=>[...Object.keys(d.weights??{}),...Object.keys(d.amounts??{}),...(d.execution?.trades??[]).map(t=>t.id)])])
        for(const id of archivedIds)assert(op.config.universe.includes(id),'Une cotation référencée dans l’historique ne peut pas être remplacée ou retirée : '+id)
        for(const key of Object.keys(comp.config)) if(!allowed.includes(key)) assert(JSON.stringify(op.config[key])===JSON.stringify(comp.config[key]),`Après lancement, ${key} est figé.`)
      } else {
        assert(!comp.decisions.some(d=>d.status!=='cancelled'),'Annuler les décisions préparées avant de changer les participants ou le capital.')
      }
      comp.ruleHistory.push({at:now,before:comp.config,after:clone(op.config),reason:op.reason??'Configuration avant lancement'})
      comp.config=clone(op.config)
    } else if(op.type==='decision') {
      const supplied=op.decision??{}
      const d={...Object.fromEntries(['participant','kind','model','reason','original','decisionDate','weights','amounts'].filter(k=>supplied[k]!==undefined).map(k=>[k,clone(supplied[k])])),id:proposal.requestId,status:'recorded',registeredAt:now,rules:clone(comp.config)}
      if(d.kind!=='target')delete d.weights
      if(d.kind!=='trades')delete d.amounts
      // Registration time and executable date can never be supplied by the browser.
      d.registeredAt=now;d.executionDate=nextExecution(now,comp.config.launchDate,market,executionAssets(comp,d,market.asOf))
      assert(!d.correctionOf,'Corriger par une nouvelle décision justifiée ; pas de contournement de fréquence.')
      validateDecision(d,comp,market,market.asOf,now)
      comp.decisions.push(d)
    } else if(op.type==='cancel') {
      const d=comp.decisions.find(d=>d.id===op.decisionId)
      assert(d&&d.participant!=='world'&&['recorded','pending','failed'].includes(d.status),'Seule une opération non exécutée peut être annulée.')
      assert(typeof op.reason==='string'&&op.reason.trim(),'Motif d’annulation requis.')
      d.status='cancelled';d.cancelledAt=now;d.cancellationReason=op.reason
    } else if(op.type==='launch') {
      assert(comp.status==='draft','Compétition déjà lancée.')
      const initialAssets=comp.config.executionPolicy==='affected-markets-v2'?[...new Set([comp.config.benchmark,...comp.decisions.filter(d=>d.status==='recorded').flatMap(d=>executionAssets(comp,d,market.asOf))])]:comp.config.universe
      for(const a of market.universe.filter(a=>initialAssets.includes(a.id))) assert(coverage(a.id,market,market.asOf).ok,coverage(a.id,market,market.asOf).reason)
      assert(market.status.ECB?.ok,'Changes BCE non validés.')
      assert(comp.config.participants.every(p=>p.model!=='À renseigner'),'Renseigner manuellement les modèles avant le lancement.')
      assert(comp.config.participants.every(p=>comp.decisions.some(d=>d.participant===p.id&&d.status==='recorded')),'Enregistrer une décision initiale pour chaque participant (conservation = liquidités).')
      const date=nextExecution(now,comp.config.launchDate,market,initialAssets)
      comp.status='launched';comp.launchedAt=now;comp.startDate=date
      event.initialExecutionSchedule=comp.decisions.filter(d=>d.status==='recorded').map(d=>({decisionId:d.id,provisionalDate:d.executionDate,finalDate:date}))
      for(const d of comp.decisions.filter(d=>d.status==='recorded')) d.executionDate=date
      comp.decisions.push({id:comp.id+'-world',participant:'world',kind:'target',weights:{[comp.config.benchmark]:100},
        model:'Référence mécanique',reason:'Même capital, même clôture commune de lancement.',decisionDate:day(now),
        registeredAt:now,executionDate:date,status:'recorded',rules:clone(comp.config)})
    } else throw Error('Opération inconnue.')
  }
  next.audit.push(event);next.revision++
  return next
}
export function refresh(book,market,previous={}) {
  const competitions=book.competitions.map(c=>runCompetition(c,market,market.asOf))
  const daily={},weekly={},effects=[]
  for(const comp of competitions.filter(c=>c.status==='launched')) {
    daily[comp.id]=[]
    for(let date=comp.startDate;date<=market.asOf;date=addDays(date,1)) {
      const s=snapshot(comp,date,market);daily[comp.id].push(s)
      const old=previous.daily?.[comp.id]?.find(x=>x.date===date)
      if(old&&JSON.stringify(old)!==JSON.stringify(s)) effects.push({competitionId:comp.id,date,before:old,after:s})
    }
    weekly[comp.id]=weeklyDates(comp,market.asOf).map(date=>periodReport(comp,date,market))
  }
  const state={version:1,revision:book.revision,generatedAt:market.generatedAt,asOf:market.asOf,
    competitions,daily,weekly,valuationRevisions:[...(previous.valuationRevisions??[]),...(effects.length?[{at:market.generatedAt,sourceRevisionCount:market.revisions.length,effects}]:[])]}
  return {book:{...book,competitions},state}
}
function read(file,fallback) {return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):fallback}
function write(file,value) {fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(value,null,file.endsWith('snapshot.json')?undefined:2)+'\n');fs.renameSync(file+'.tmp',file)}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),cmd=args[0]??'refresh',root=args.includes('--root')?path.resolve(args[args.indexOf('--root')+1]):ROOT
  const folder=path.join(root,'data/ai-portfolios'),bookFile=path.join(folder,'book.json'),marketFile=path.join(folder,'market.json')
  const market=read(marketFile,null)
  assert(market,'Lancer d’abord python3 scripts/collect_ai_portfolios.py.')
  let book=read(bookFile,{version:1,revision:0,competitions:[],audit:[]})
  hydrateMarketSeries(market,root,requiredSeries(book,cmd==='import'?read(path.resolve(args[1]),null):null))
  if(cmd==='import') book=register(book,read(path.resolve(args[1]),null),market)
  else assert(cmd==='refresh','Usage : node scripts/ai-portfolios.mjs [refresh | import demande.json]')
  const certified=read(path.join(folder,'qualification.json'),{candidates:[]}).candidates
  const runtimeIds=new Set(market.universe.map(a=>a.id));const runtimeMarket={...market,universe:[...market.universe,...certified.filter(a=>a.permanentExclusion&&!runtimeIds.has(a.id))]}
  const stateFile=path.join(folder,'state.json'),result=refresh(book,market,read(stateFile,{}))
  write(bookFile,result.book);write(stateFile,result.state)
  write(path.join(root,'public/data/ai-portfolios/snapshot.json'),{book:result.book,market:publicMarket(runtimeMarket,result.book.competitions.flatMap(c=>c.config.universe)),state:result.state,defaults:defaultConfig(undefined,market)})
  for(const name of ['qualification.json','qualification.csv','qualification.md','equity-catalogue.json','equity-catalogue.csv','selectable-equities.json','selectable-equities.csv','selectable-assets.json','selectable-assets.csv','equity-coverage.json','equity-coverage.md']){const file=path.join(folder,name);if(fs.existsSync(file))fs.copyFileSync(file,path.join(root,'public/data/ai-portfolios',name))}
  const seriesFolder=path.join(folder,'series');if(fs.existsSync(seriesFolder))fs.cpSync(seriesFolder,path.join(root,'public/data/ai-portfolios/series'),{recursive:true})
  console.log(`Portefeuilles IA : révision ${result.book.revision}, ${result.book.competitions.length} compétitions ; arrêté ${market.asOf}.`)
}
