import {radarStateContent,unpackRadarState} from './lib/radar-state-codec.mjs'
import {qualifyCompositionCandidates} from './lib/radar-composition-verification.mjs'
import { radarToolActions } from './lib/radar-tool-actions.mjs'
import { publicationSelection } from '../src/lib/radar-editorial.js'
import { makeRadarOverview } from '../src/lib/radar-overview.js'
import { documentDelays } from './lib/radar-queue.mjs'
import { recordRadarRun } from './lib/radar-run-metrics.mjs'
import {producerContract,sourceResults} from './producer-result-contract.mjs'
import {PUBLICATION_SOURCES} from './lib/radar-publications.mjs'
import {PURCHASING_SOURCES} from './lib/purchasing-power-news.mjs'
import {SOURCE_ACCESS_GAPS} from './lib/radar-source-access.mjs'
import { checkSourceAccess } from './lib/radar-source-access.mjs'
import { collectPublications } from './lib/radar-publications.mjs'
import { scheduledRadar } from './lib/radar-schedule.mjs'
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { collectObservations } from './update-editorial-radar.mjs'
import { advanceRadar, shouldRefreshRadar } from './lib/editorial-radar.mjs'
import { collectPurchasingNews } from './lib/purchasing-power-news.mjs'
import { collectRadarNews, enrichEtfLaunches } from './lib/radar-news.mjs'
import { notificationState, notifyRadar, migrateNotificationPolicy, planNotifications } from './lib/radar-notifications.mjs'
import { editorialState } from '../src/lib/radar-editorial.js'

// Data publication is one atomic commit on a dedicated branch. It does not
// rewrite master or depend on an application rebuild for each observation.
const schedule = scheduledRadar()
const outsideHours=process.env.GITHUB_EVENT_NAME==='schedule'&&!schedule.enabled
const contractOutput=resolve(process.env.RUNNER_TEMP??'/tmp','editorial-radar')
await mkdir(contractOutput,{recursive:true})
const expectedSources=[...PUBLICATION_SOURCES,...PURCHASING_SOURCES,...SOURCE_ACCESS_GAPS,
 {id:'Communiqués Vanguard',url:'https://www.vanguard.co.uk/professional/contact-us/press-releases'},
 {id:'Communiqués Global X Europe',url:'https://globalxetfs.eu/news'}]
const contract=producerContract('editorial-radar-sources','feed',expectedSources.map(r=>({id:'radar-source:'+r.id,instrument:r.id,fields:[SOURCE_ACCESS_GAPS.some(a=>a.id===r.id)?'official HTTP access only':'official publication listing'],sourceUrl:r.url,selected:!outsideHours,...(outsideHours?{reason:'Normal wait outside Radar operating hours'}:{})})),{mode:outsideHours?'conditional':'full',retainNativeFailuresOnly:true})
contract.start(resolve(contractOutput,'feed.json'))
if(outsideHours){console.log('Hors de la plage 08–20 h Europe/Paris.');process.exit(0)}
const sourceHttp=[]
const sourceFetch=async (...args)=>{const attempt={url:String(args[0]),status:null,attemptedAt:new Date().toISOString()};sourceHttp.push(attempt);try{const response=await fetch(...args);attempt.status=response.status;return response}catch(error){attempt.status='network-error';throw error}}

const light = process.env.GITHUB_EVENT_NAME === 'schedule' || process.argv.includes('--news-only')
const repo = process.env.GITHUB_REPOSITORY, token = process.env.GH_TOKEN
if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '') || !token) throw new Error('Connexion GitHub du workflow manquante.')
async function api(path, method = 'GET', body, allow404 = false) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`https://api.github.com/repos/${repo}${path ? `/${path}` : ''}`, { method, signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' }, ...(body ? { body: JSON.stringify(body) } : {}) })
    if (allow404 && response.status === 404) return null
    if (response.ok) return response.status === 204 ? null : response.json()
    if (method === 'GET' && response.status >= 500 && attempt < 2) { await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); continue }
    const detail=await response.json().catch(()=>null)
    throw new Error(`Publication radar refusée (${response.status}) : ${method} ${path}${typeof detail?.message==='string'?' · '+detail.message.slice(0,300):''}`)
  }
}
const branch = 'radar-data'
let ref = await api(`git/ref/heads/${branch}`, 'GET', undefined, true)
let previous = null
let ledger = null
let previousFeed = null
if (ref) {
  const files = await api(`git/trees/${ref.object.sha}`)
  const stateFile = files.tree.find(file => file.path === 'state.json')
  if (!stateFile) throw new Error('La branche radar existe sans historique : initialisation silencieuse refusée.')
  const blob = await api(`git/blobs/${stateFile.sha}`)
  previous = unpackRadarState(JSON.parse(Buffer.from(blob.content, 'base64').toString('utf8')))
  const feedFile = files.tree.find(file => file.path === 'feed.json')
  if (feedFile) {
    const feedBlob = await api(`git/blobs/${feedFile.sha}`)
    previousFeed = JSON.parse(Buffer.from(feedBlob.content, 'base64').toString('utf8'))
  }
  const notificationFile = files.tree.find(file => file.path === 'notifications.json')
  if (notificationFile) {
    const notificationBlob = await api(`git/blobs/${notificationFile.sha}`)
    ledger = JSON.parse(Buffer.from(notificationBlob.content, 'base64').toString('utf8'))
  }
}
const policyRollout=ledger?.editorialVersion!==3
ledger = migrateNotificationPolicy(previous, notificationState(previous, ledger))
const refresh = !previousFeed || shouldRefreshRadar(previous, { eventName: process.env.GITHUB_EVENT_NAME, sourceRevision: process.env.RADAR_SOURCE_SHA })
let result, nextTree, nextCommit
if (refresh) {
  const { observations, errors } = light && previous ? { observations: Object.values(previous.current), errors: [] } : await collectObservations()
  if (!observations.length && !previous) throw new Error('Aucune source locale initiale ; historique conservé.')
  const [news, purchasing, publications, access] = await Promise.all([collectRadarNews(new Date(),sourceFetch), collectPurchasingNews(new Date(), sourceFetch, previous), collectPublications(new Date(), sourceFetch, previous?.publications), checkSourceAccess(new Date(), sourceFetch, previous?.sourceAccess)])
  const launches = await enrichEtfLaunches(news.observations, new Date(), fetch, undefined, previous?.documentQueue)
  errors.push(...launches.errors)
  // Replace re-observed keys, never duplicate a cached observation on a light pass.
  for (const row of [...launches.observations, ...purchasing.observations, ...publications.observations]) {
    const index = observations.findIndex(o => o.family === row.family && o.entity === row.entity && o.field === row.field && o.scope === row.scope)
    if (index >= 0) observations[index] = row; else observations.push(row)
  }
  errors.push(...news.errors, ...purchasing.errors, ...publications.errors)
  let verification = { verified: [], errors: [], deferred: [] }
  if (!light) {
    try {
      const { stdout } = await promisify(execFile)('python', ['scripts/verify_dws_compositions.py'], { maxBuffer: 16 * 1024 * 1024, timeout: 300000 })
      verification = JSON.parse(stdout)
    } catch (error) { verification.errors.push({ family: 'etf', entity: 'DWS', reason: `Vérification lourde en échec : ${error.message}` }) }
  }
  errors.push(...verification.errors)
  const compositionVerification=await qualifyCompositionCandidates(observations,previous,{fetchImpl:sourceFetch})
  errors.push(...compositionVerification.errors)
  result = advanceRadar(previous, observations, { sourceRevision: process.env.RADAR_SOURCE_SHA ?? '', errors, purchasingSources: purchasing.sources,
    verifiedCompositions: verification.verified.map(({ canonicalBody: _canonicalBody, ...proof }) => proof),
    compositionVerificationFailures: verification.errors.map(error => error.entity) })
  if(policyRollout) {
    // Existing history was acknowledged above; source/parser backfills keep their own silent flags.
    result.state.editorialRolloutAt=new Date().toISOString()
  }
  for(const event of result.state.events)event.toolActions=radarToolActions(event)
  for(const event of result.feed.events)event.toolActions=radarToolActions(event)
  result.state.compositionVerification=compositionVerification
  result.state.publications = publications.state
  result.state.purchasingCache = purchasing.cache
  result.state.documentQueue = launches.queue
  result.state.sourceAccess = access
  result.feed.sources = [...publications.sources, ...news.sources, ...purchasing.sources, ...Object.values(access)]
  result.feed.documentQueue = Object.fromEntries(['pending','error','done'].map(status => [status, Object.values(launches.queue).filter(item => item.status === status).length]))
  result.feed.metrics = { collection: publications.metrics, publicationDelays: Object.values(publications.state.documents).filter(item => item.observation).map(item => ({ url: item.url, ...documentDelays(item) })), classification: Object.fromEntries(['ready','watch','secondary'].map(status => [status, result.state.events.filter(event => editorialState(event) === status).length])) }
  const runMetadata=process.env.GITHUB_RUN_ID ? await api(`actions/runs/${process.env.GITHUB_RUN_ID}`).catch(()=>null) : null
  const runJobs=process.env.GITHUB_RUN_ID ? await api(`actions/runs/${process.env.GITHUB_RUN_ID}/jobs?per_page=100`).catch(()=>null) : null
  const productionJob=runJobs?.jobs?.find(job=>job.name==='update')
  result.state.runMetrics=recordRadarRun(previous?.runMetrics,{eventName:process.env.GITHUB_EVENT_NAME,runId:process.env.GITHUB_RUN_ID,createdAt:runMetadata?.created_at,startedAt:runMetadata?.run_started_at,jobStartedAt:productionJob?.started_at,sourceRevision:process.env.RADAR_SOURCE_SHA})
  result.feed.metrics.scheduler=result.state.runMetrics
  result.feed.metrics.queueHistory=result.state.publications.queueHistory
  result.feed.compositionPublicationLags = verification.deferred ?? []
  const previousSourceRows=new Map((previousFeed?.sources??[]).map(row=>[row.id,row]))
  for(const row of result.feed.sources){
    const attempt=sourceHttp.find(r=>r.url===row.url)
    if(attempt)row.attemptedAt=attempt.attemptedAt
    else if(previousSourceRows.get(row.id)?.attemptedAt)row.attemptedAt=previousSourceRows.get(row.id).attemptedAt
    else delete row.attemptedAt
  }
  const individual=sourceResults(contract.plan,result.feed.sources,sourceHttp)
  result.feed=contract.finish({...result.feed,contractDiagnosticsAttempted:true,contractResults:{successes:individual.successes,errors:individual.errors},contractSkipped:individual.skipped})
  // Create only after successful extraction and validation.
  const parent = ref ? ref.object.sha : (await api('git/ref/heads/master')).object.sha
  const commit = await api(`git/commits/${parent}`)
  const tree = []
  // Content-addressed raw portfolios are retained on radar-data with the
  // conflict ledger. A reconciliation is not published without its evidence.
  for (const proof of verification.verified) {
    if (createHash('sha256').update(proof.canonicalBody).digest('hex') !== proof.sourceHash) throw new Error('Empreinte DWS incohérente : publication annulée.')
    const blob = await api('git/blobs', 'POST', { content: `${proof.canonicalBody}\n`, encoding: 'utf-8' })
    tree.push({ path: `dws-snapshots/${proof.sourceHash}.json`, mode: '100644', type: 'blob', sha: blob.sha })
  }
  for (const [path, content] of [['state.json', result.state], ['feed.json', result.feed], ['summary.json', makeRadarOverview(result.feed,publicationSelection(result.feed.events))], ['notifications.json', ledger]]) {
    const stored=path==='state.json'?radarStateContent(content,metrics=>console.log('Radar state transport:',JSON.stringify(metrics))):`${JSON.stringify(content, null, 2)}\n`
    const blob = await api('git/blobs', 'POST', { content: stored, encoding: 'utf-8' })
    tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha })
  }
  nextTree = await api('git/trees', 'POST', { base_tree: commit.tree.sha, tree })
  nextCommit = await api('git/commits', 'POST', { message: `Radar: ${result.newEvents.length} new signals, validated daily observations`, tree: nextTree.sha, parents: [parent] })
  if (ref) await api(`git/refs/heads/${branch}`, 'PATCH', { sha: nextCommit.sha, force: false })
  else await api('git/refs', 'POST', { ref: `refs/heads/${branch}`, sha: nextCommit.sha })
  console.log(`Radar publié : ${result.feed.observationCount} observations, ${result.newEvents.length} nouveautés, ${result.feed.errors.length} réserves.`)
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `## Radar éditorial\n\n${result.feed.observationCount} observations analysées ; ${result.newEvents.length} nouveaux signaux ; ${result.feed.errors.length} observations non exploitables.\n\nLe premier relevé est silencieux. Les signaux suivants conservent leurs deux observations et leurs sources.\n`)

} else {
  const skipped=contract.plan.items.map(r=>({id:r.id,status:'cached',sourceAttempted:false,reason:'Recent identical Radar control; no new source request'}))
  result = {state:previous,feed:contract.finish({...previousFeed,contractDiagnosticsAttempted:false,contractResults:{successes:[],errors:[]},contractSkipped:skipped}),newEvents:[]}
  nextCommit = { sha: ref.object.sha }
  nextTree = { sha: (await api(`git/commits/${ref.object.sha}`)).tree.sha }
  console.log('Contrôle identique récent : collecte évitée ; notifications en attente retentées.')
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, 'Contrôle identique récent : collecte évitée ; notifications en attente retentées.\n')
}
const output = resolve(process.env.RUNNER_TEMP ?? '/tmp', 'editorial-radar')
await mkdir(output, { recursive: true })
await writeFile(resolve(output, 'feed.json'), `${JSON.stringify(result.feed, null, 2)}\n`)

// Data has already been committed. A notification failure leaves the daily
// feed working and the unacknowledged events available for tomorrow's retry.
let notification, notificationError
try {
  notification = await notifyRadar({ events: result.state.events, mode: schedule.digest && ledger.lastDigest !== schedule.date ? 'digest' : 'major', archiveEvents: result.state.events, ledger, api, repo, evidenceRevision: nextCommit.sha, maintain: true })
  notification.ledger.delivery = { ...notification.ledger.delivery, status: 'ok', checkedAt: new Date().toISOString(), sent: notification.sent, recovered: notification.recovered, pending: planNotifications(result.state.events, notification.ledger, new Date(), 'digest').pending }
} catch (error) {
  notificationError = error
  notification = { ledger: { ...ledger, delivery: { status: 'error', checkedAt: new Date().toISOString(), reason: error.message, pending: planNotifications(result.state.events, ledger, new Date(), 'digest').pending } }, issues: [], sent: 0, recovered: 0 }
}
result.feed.notifications = notification.ledger.delivery
if (JSON.stringify(notification.ledger) !== JSON.stringify(ledger)) {
  const blob = await api('git/blobs', 'POST', { content: `${JSON.stringify(notification.ledger, null, 2)}\n`, encoding: 'utf-8' })
  const feedBlob = await api('git/blobs', 'POST', { content: `${JSON.stringify(result.feed, null, 2)}\n`, encoding: 'utf-8' })
  const receiptTree = await api('git/trees', 'POST', { base_tree: nextTree.sha, tree: [{ path: 'notifications.json', mode: '100644', type: 'blob', sha: blob.sha }, { path: 'feed.json', mode: '100644', type: 'blob', sha: feedBlob.sha }] })
  const receiptCommit = await api('git/commits', 'POST', { message: `Radar: acknowledge ${notification.sent} notified and ${notification.recovered} recovered signals`, tree: receiptTree.sha, parents: [nextCommit.sha] })
  await api(`git/refs/heads/${branch}`, 'PATCH', { sha: receiptCommit.sha, force: false })
}
console.log(`Notifications radar : ${notification.sent} signaux envoyés, ${notification.recovered} déjà présents dans les issues.`)
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `\n## Notifications GitHub\n\n${notification.sent} signaux notifiés ; ${notification.recovered} reçus retrouvés.\n${notification.issues.map(url => `- ${url}`).join('\n')}\n`, { flag: 'a' })

await writeFile(resolve(output, 'feed.json'), `${JSON.stringify(result.feed, null, 2)}\n`)
if (notificationError) throw notificationError
