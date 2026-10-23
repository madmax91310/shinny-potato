#!/usr/bin/env node
// Dedicated trusted runner. Input issue text never becomes shell code.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {spawnSync} from 'node:child_process'
import {proposalHash} from './ai-portfolios.mjs'
import {authorizedIssue,proposalFromIssue} from './ai-owner-issue.mjs'
const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),token=process.env.GITHUB_TOKEN,repository=process.env.GITHUB_REPOSITORY,temp=fs.mkdtempSync(path.join(os.tmpdir(),'ai-owner-issue-'))
if(!authorizedIssue(event)||repository!=='madmax91310/shinny-potato'||!token||process.env.GITHUB_ACTIONS!=='true')throw Error('Confirmation propriétaire requise.')
function command(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:8*1024*1024});if(r.status!==0)throw Error(((r.stdout??'')+'\n'+(r.stderr??'')||'Traitement interrompu.').slice(-6000));return r.stdout}
async function api(route,method,body){const r=await fetch(`https://api.github.com/repos/${repository}${route}`,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('Journal GitHub indisponible ('+r.status+').');return r.json()}
async function status(value){await api(`/issues/${event.issue.number}/comments`,'POST',{body:'AI_PORTFOLIO_STATUS\n'+JSON.stringify({...value,updatedAt:new Date().toISOString()})})}
try{
 await status({state:'processing'})
 let proposal,committed=false,lastError
 for(let attempt=0;attempt<3;attempt++){
  command('git',['fetch','origin','master']);command('git',['reset','--hard','origin/master'])
  const data=JSON.parse(fs.readFileSync('public/data/ai-portfolios/catalogue.json','utf8')),index=data.columns.indexOf('id'),market={universe:data.rows.map(row=>({id:row[index]}))}
  proposal=await proposalFromIssue(event,market)
  const book=JSON.parse(fs.readFileSync('data/ai-portfolios/book.json','utf8'))
  const existing=book.audit.find(e=>e.requestId===proposal.requestId);if(existing){if(existing.proposalHash&&existing.proposalHash!==proposalHash(proposal))throw Error('Identifiant déjà enregistré avec un autre contenu.');committed=true;break}
  if(book.revision!==proposal.expectedRevision)throw Error('Une modification plus récente a été enregistrée. Rechargez, vérifiez votre brouillon puis préparez une nouvelle demande.')
  const file=path.join(temp,'request.json');fs.writeFileSync(file,JSON.stringify(proposal))
  command('node',['scripts/ai-portfolios.mjs','import',file])
  // A global incomplete report must not reject a valid decision for another
  // participant. register() already checks this operation's own full coverage.
  command('git',['add','--','data/ai-portfolios','public/data/ai-portfolios'])
  command('git',['commit','-m','Record AI portfolio request '+proposal.requestId])
  try{command('git',['push','origin','HEAD:master']);committed=true;break}catch(e){lastError=e}
  // Recompute on the fresh book; never rebase a stale financial calculation.
 }
 if(!committed)throw lastError??Error('Modification concurrente : relancer le traitement.')
 const sha=command('git',['rev-parse','HEAD']).trim();if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`commit_sha=${sha}\n`)
 await status({state:'recorded',requestId:proposal.requestId,commit:sha,message:'Décision enregistrée durablement. Publication en cours ; exécution selon la clôture future prévue.'})
 await api(`/issues/${event.issue.number}`,'PATCH',{state:'closed',state_reason:'completed'})
}catch(e){await status({state:'failed',error:e.message});process.exitCode=1}finally{fs.rmSync(temp,{recursive:true,force:true})}
