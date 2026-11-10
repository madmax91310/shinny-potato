// GitHub's Pages deployment API, using the actual recorded data commit as its
// build version. A reusable workflow's GITHUB_SHA belongs to its older caller.
// No financial value, receipt, publication-order guard or public verifier changes.
import assert from 'node:assert/strict'
import {readFileSync,appendFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {setTimeout as wait} from 'node:timers/promises'

export async function deploySnapshot(config,{fetcher=fetch,sleep=wait,clock=Date.now,timeout=600000,signal,log=()=>{}}={}){
 const {repo,artifactId,codeSha,dataSha,headSha,eventSha,build,token,oidcUrl,oidcToken,ref,event}=config
 assert.equal(ref,'refs/heads/master');assert(['push','schedule','workflow_dispatch','workflow_run','repository_dispatch','workflow_call'].includes(event),'Unsupported publication trigger')
 assert.match(repo??'',/^[\w.-]+\/[\w.-]+$/)
 for(const sha of [codeSha,dataSha,headSha,eventSha])assert.match(sha??'',/^[a-f0-9]{40}$/)
 assert.equal(headSha,dataSha,'Checkout is not the recorded data snapshot')
 assert.equal(build?.sha,codeSha);assert.equal(build?.dataSha,dataSha,'Artifact data identity differs from its recorded snapshot')
 assert(/^[1-9]\d*$/.test(String(artifactId))&&Number.isSafeInteger(Number(artifactId)),'Missing exact uploaded artifact ID')
 assert(token&&oidcToken,'Missing GitHub runtime authorization')
 const identityUrl=new URL(oidcUrl)
 assert(identityUrl.protocol==='https:'&&!identityUrl.username&&!identityUrl.password&&!identityUrl.port&&identityUrl.hostname.endsWith('.actions.githubusercontent.com'),'Unexpected GitHub OIDC endpoint')
 const api=`https://api.github.com/repos/${repo}/pages/deployments`
 const started=clock();let created=null,complete=false,errors=0
 async function request(url,authorization,method='GET',body,ignoreAbort=false){
  let response
  try{response=await fetcher(url,{method,headers:{Authorization:`Bearer ${authorization}`,...(String(url)===identityUrl.href?{Accept:'application/json'}:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'shinny-potato-validated-pages'}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:ignoreAbort||!signal?AbortSignal.timeout(15000):AbortSignal.any([signal,AbortSignal.timeout(15000)])})}
  catch{throw Error('Pages request interrupted or unavailable')}
  if(!response.ok){const error=Error(`Pages request HTTP ${response.status}`);error.status=response.status;error.retryAfter=Number(response.headers.get('retry-after'))||0;throw error}
  if(response.status===204)return null
  try{return await response.json()}catch{throw Error('Invalid JSON from GitHub deployment service')}
 }
 try{
  const identity=await request(identityUrl.href,oidcToken)
  assert(typeof identity.value==='string'&&identity.value&&!/[\r\n]/.test(identity.value),'Missing GitHub OIDC assertion')
  const result=await request(api,token,'POST',{artifact_id:Number(artifactId),pages_build_version:dataSha,oidc_token:identity.value})
  assert(result&&/^[\w-]{1,128}$/.test(String(result.id??'')),'Missing Pages deployment identity')
  created=String(result.id)
  // The real Pages create response uses the singular deployment/status route;
  // the REST resource route is also documented. Bind both to this exact repo/ID.
  // Never forward runtime authorization to an arbitrary response-supplied URL.
  const resourceUrl=api+'/'+encodeURIComponent(created)
  const responseStatusUrl=`https://api.github.com/repos/${repo}/pages/deployment/status/${encodeURIComponent(created)}`
  const statusUrl=result.status_url??resourceUrl
  assert([resourceUrl,responseStatusUrl].includes(statusUrl),'Unexpected Pages status endpoint')
  const pageUrl=new URL(result.page_url)
  assert(pageUrl.protocol==='https:'&&!pageUrl.username&&!pageUrl.password,'Invalid public Pages URL')
  log(`Pages artifact ${artifactId}: recorded build ${dataSha}; caller ${eventSha}; deployment ${created}`)
  let delay=5000
  while(clock()-started<timeout){
   if(signal?.aborted)throw Error('Pages deployment interrupted')
   let status
   try{status=await request(statusUrl,token)}catch(error){
    if(![429,500,502,503,504].includes(error.status)||++errors>=10)throw error
    delay=Math.max(delay,error.retryAfter*1000)
    if(delay>=timeout-(clock()-started))throw Error('Pages retry exceeds bounded deployment deadline')
   }
   if(status?.status==='succeed'){
    complete=true
    return {page_url:pageUrl.href,deployment_id:created,pages_build_version:dataSha,artifact_id:String(artifactId)}
   }
   if(['deployment_failed','deployment_content_failed','deployment_cancelled','deployment_lost'].includes(status?.status))throw Error('Pages deployment failed: '+status.status)
   if(status)assert(typeof status.status==='string'&&/^[a-z_]*$/.test(status.status),'Invalid Pages status response')
   await sleep(Math.min(delay,timeout-(clock()-started)),undefined,signal?{signal}:undefined)
   delay=Math.min(Math.round(delay*1.5),30000)
  }
  throw Error('Pages deployment deadline exceeded')
 }finally{
  if(created&&!complete){
   try{await request(api+'/'+encodeURIComponent(created)+'/cancel',token,'POST',undefined,true);log('Cancelled this incomplete Pages deployment')}
   catch{log('Cancellation unavailable for this incomplete Pages deployment')}
  }
 }
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const signal=new AbortController()
 for(const name of ['SIGTERM','SIGINT'])process.once(name,()=>signal.abort())
 try{
  const result=await deploySnapshot({repo:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,event:process.env.GITHUB_EVENT_NAME,
   artifactId:process.env.PAGES_ARTIFACT_ID,codeSha:process.env.PAGES_CODE_SHA,dataSha:process.env.PAGES_DATA_SHA,
   headSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),eventSha:process.env.GITHUB_SHA,
   build:JSON.parse(readFileSync('dist/build-info.json')),token:process.env.GITHUB_TOKEN,
   oidcUrl:process.env.ACTIONS_ID_TOKEN_REQUEST_URL,oidcToken:process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},
   {signal:signal.signal,log:console.log})
  for(const[key,value]of Object.entries(result))appendFileSync(process.env.GITHUB_OUTPUT,`${key}=${value}\n`)
 }catch(error){console.error(error.message);process.exitCode=1}
}
