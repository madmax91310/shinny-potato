import {compactProposal,encodeProposal} from './request-transport.js'
export const REPOSITORY='madmax91310/shinny-potato'
export const rehearsalBranch=typeof window==='undefined'?'':new URLSearchParams(window.location.search).get('ai-rehearsal')??''
if(rehearsalBranch&&!/^ai-rehearsal\/[a-z0-9-]{8,80}$/.test(rehearsalBranch))throw Error('Branche de recette invalide.')
export const LIVE_BASE='https://raw.githubusercontent.com/'+REPOSITORY+'/'+(rehearsalBranch||'master')+'/public/'
let useLive=Boolean(rehearsalBranch)
export function liveRuntime(active=true){useLive=Boolean(rehearsalBranch)||active}
export async function ownerRuntimeFetch(input,options){const base=import.meta.env.BASE_URL;if(useLive&&typeof input==='string'&&input.startsWith(base+'data/ai-portfolios/'))input=LIVE_BASE+input.slice(base.length);return fetch(input,options)}
export async function currentOverview(){const r=await fetch(LIVE_BASE+'data/ai-portfolios/overview.json?read='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('Livre distant indisponible. Le brouillon reste sur cet appareil.');const data=await r.json();if(data.version!==2)throw Error('Version distante incompatible. Recharger l’application.');return data}
export async function confirmationLink(request,market){const encoded=await encodeProposal(await compactProposal(request,market)),body=`${rehearsalBranch?'RECETTE ISOLÉE · '+rehearsalBranch+'\n':''}Confirmation propriétaire depuis Portefeuilles IA.\nCette demande sera contrôlée par le moteur avant tout enregistrement.\n\nAI_PORTFOLIO_REQUEST_V1\n${encoded}\nEND_AI_PORTFOLIO_REQUEST\n\nAucun ordre réel. Aucun appel aux IA.`,url=new URL('https://github.com/'+REPOSITORY+'/issues/new');url.searchParams.set('title','Portefeuilles IA · '+request.requestId);url.searchParams.set('body',body);if(url.href.length>8000)throw Error('La réponse originale est trop longue pour la confirmation GitHub. Retirez ce texte facultatif, conservez la justification, puis préparez à nouveau. Aucun actif à retirer.');return url.href}
export async function requestStatus(request){
 const overview=await currentOverview(),event=overview.book.audit.find(e=>e.requestId===request.requestId)
 if(event)return {state:'recorded',overview,event,decision:overview.book.competitions.flatMap(c=>c.decisions).find(d=>d.id===request.requestId)}
 const r=await fetch('https://api.github.com/search/issues?q='+encodeURIComponent('repo:'+REPOSITORY+' is:issue author:madmax91310 in:title '+request.requestId),{cache:'no-store',headers:{Accept:'application/vnd.github+json'}})
 if(!r.ok)throw Error(r.status===403?'GitHub limite temporairement la lecture des états. Réessayer plus tard ; aucune demande perdue.':'État GitHub indisponible. Réessayer.')
 const issue=(await r.json()).items.find(i=>i.title==='Portefeuilles IA · '+request.requestId)
 if(!issue)return {state:'awaiting-confirmation'}
 const result=await fetch(`https://api.github.com/repos/${REPOSITORY}/issues/${issue.number}/comments?per_page=100`,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}})
 if(!result.ok)throw Error('Détail du traitement indisponible. Réessayer.')
 let comments=await result.json();const last=result.headers.get('Link')?.match(/<([^>]+)>; rel="last"/)?.[1];if(last){const page=await fetch(last,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});if(!page.ok)throw Error('Dernier état indisponible. Réessayer.');comments=await page.json()}const status=comments.filter(c=>c.user?.login==='github-actions[bot]'&&c.body?.startsWith('AI_PORTFOLIO_STATUS\n')).at(-1)
 if(status){try{const data=JSON.parse(status.body.slice('AI_PORTFOLIO_STATUS\n'.length));if(data.state==='recorded'){if((data.branch??'master')!==(rehearsalBranch||'master'))return {state:'isolated',issue:issue.html_url};return {...data,state:'recorded-awaiting-data',issue:issue.html_url}}return {...data,issue:issue.html_url}}catch{throw Error('État du traitement illisible. Consulter la demande GitHub.')}}
 return {state:'queued',issue:issue.html_url}
}
export async function ownerRequests(query='',page=1){const term=query.replace(/[^a-zA-Z0-9-]/g,''),q=`repo:${REPOSITORY} is:issue author:madmax91310 in:title ${term||'"Portefeuilles IA"'}`,r=await fetch('https://api.github.com/search/issues?'+new URLSearchParams({q,sort:'created',order:'desc',per_page:'20',page:String(page)}),{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});if(!r.ok)throw Error('Liste des demandes indisponible ou quota GitHub atteint. Réessayer plus tard.');const data=await r.json();return {total:data.total_count,items:data.items.filter(i=>/^Portefeuilles IA · [a-zA-Z0-9-]{8,80}$/.test(i.title))}}
