import {decodeProposal,expandProposal} from '../src/pages/ai-portfolios/request-transport.js'
export const REQUEST_TITLE='Portefeuilles IA · '
export const MARKER='AI_PORTFOLIO_REQUEST_V1'
export const isRehearsalBranch=branch=>typeof branch==='string'&&/^ai-rehearsal\/[a-z0-9-]{8,80}$/.test(branch)
export function authorizedIssue(event){
 return event?.repository?.full_name==='madmax91310/shinny-potato'
  &&String(event.issue?.user?.id)===String(event.repository?.owner?.id)
  &&String(event.sender?.id)===String(event.repository?.owner?.id)
  &&!event.issue?.pull_request
}
export async function decodeIssue(event){
 if(!authorizedIssue(event))throw Error('Seul le propriétaire authentifié peut confirmer une demande.')
 const matches=[...(event.issue.body??'').matchAll(/AI_PORTFOLIO_REQUEST_V1\n([A-Za-z0-9_-]+)\nEND_AI_PORTFOLIO_REQUEST/g)]
 if(matches.length!==1)throw Error('Une demande complète et unique est requise.')
 const p=await decodeProposal(matches[0][1])
 if(p?.version!==1||!Number.isSafeInteger(p.expectedRevision)||p.expectedRevision<0
  ||typeof p.requestId!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(p.requestId)
  ||event.issue.title!==REQUEST_TITLE+p.requestId
  ||!['create','configure','decision','launch','cancel'].includes(p.operation?.type))throw Error('Demande invalide ou identifiant incohérent.')
 if(p.operation.type!=='create'&&(typeof p.competitionId!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(p.competitionId)))throw Error('Compétition invalide.')
 if(p.testBranch!==undefined&&!isRehearsalBranch(p.testBranch))throw Error('Branche de recette invalide : production interdite.')
 return p
}
export async function proposalFromIssue(event,market){return expandProposal(await decodeIssue(event),market)}
