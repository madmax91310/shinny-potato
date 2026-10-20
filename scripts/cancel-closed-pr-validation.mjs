import {readFileSync}from'node:fs'
import {fileURLToPath}from'node:url'
export function retiredRuns(runs,pr,repo,openPrs=null){
 if(pr.state!=='closed'||pr.head?.repo?.full_name!==repo)return []
 return runs.filter(r=>r.event==='pull_request'&&r.path==='.github/workflows/deploy-pages.yml'
  &&r.head_sha===pr.head.sha&&r.head_branch===pr.head.ref&&r.head_repository?.full_name===repo
  &&(r.pull_requests?.some(p=>p.number===pr.number)||(!r.pull_requests?.length&&Array.isArray(openPrs)&&!openPrs.some(p=>p.head?.sha===pr.head.sha&&p.head?.repo?.full_name===repo)))
  &&['queued','pending','in_progress','waiting','requested'].includes(r.status)).map(r=>r.id)
}
async function main(){
 const repo=process.env.GITHUB_REPOSITORY,event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH)),number=event.pull_request?.number
 if(!number||!/^[-\w.]+\/[-\w.]+$/.test(repo))throw Error('A closed repository PR is required')
 const api=async(path,method='GET')=>{const r=await fetch(`https://api.github.com/repos/${repo}${path}`,{method,headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(30000)});if(method==='POST'&&[409,422].includes(r.status))return null;if(!r.ok)throw Error(`GitHub ${r.status}`);return r.status===204||r.status===202?null:r.json()}
 const pr=await api(`/pulls/${number}`)
 if(pr.state!=='closed'||pr.head?.repo?.full_name!==repo)return
 // GitHub drops merged PR associations from historical workflow runs. Only
 // allow that fallback after confirming no open PR still uses the same head.
 const openPrs=await api(`/pulls?state=open&head=${encodeURIComponent(repo.split('/')[0]+':'+pr.head.ref)}&per_page=100`)
 for(let page=1;page<=5;page++){
  const result=await api(`/actions/runs?event=pull_request&branch=${encodeURIComponent(pr.head.ref)}&per_page=100&page=${page}`)
  for(const id of retiredRuns(result.workflow_runs,pr,repo,openPrs.length<100?openPrs:null)){await api(`/actions/runs/${id}/cancel`,'POST');console.log(`Retired closed PR validation ${id}`)}
  if(result.workflow_runs.length<100)break
 }
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main()
