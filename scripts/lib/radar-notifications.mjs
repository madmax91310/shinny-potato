import {publicationTime} from '../../src/lib/radar-qualification.js'
import { editorialExclusion } from '../../src/lib/radar-policy.js'
import { replicationWordingEvent } from '../../src/lib/replication-method.js'
import { createHash } from 'node:crypto'
import { datedEtfSnapshot } from './editorial-radar.mjs'
import { groupSignals, selectEditorial, editorialAssessment, publicationKey } from '../../src/lib/radar-editorial.js'
import { parisClock } from './radar-schedule.mjs'
import { investorFilingType } from '../../src/lib/radar-editorial.js'

const EVENT_ID = /^[a-f0-9]{24}$/
export const TRACKER_MARKER = '<!-- editorial-radar-tracker:v1 -->'
export const RECENT_DAYS = 14
const MAX_LISTED = 40
const MAX_RECEIPTS = 400
const BODY_LIMIT = 55000
const marker = id => `<!-- editorial-radar-event:${id} -->`
const text = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/@/g, '&#64;').replace(/[\r\n]+/g, ' ').replace(/([\\`*_[\]|])/g, '\\$1')
const link = value => { const url = new URL(value); if (url.protocol !== 'https:') throw new Error('Source de notification non HTTPS.'); return url.href.replace(/[()]/g, c => encodeURIComponent(c)) }
const isBotIssue = issue => !issue.pull_request && issue.user?.login === 'github-actions[bot]'
const signals = count => `${count} ${count > 1 ? 'signaux' : 'signal'}`

// On rollout, acknowledge the existing history silently. Store this baseline
// alongside the published data BEFORE contacting Issues, so a failed send can
// retry from the entire event history on the next scheduled run.
export function notificationState(previous, ledger, now = new Date()) {
  if (ledger !== null && ledger !== undefined) {
    if (ledger.schemaVersion !== 1 || !Array.isArray(ledger.acknowledged) || !ledger.acknowledged.every(id => EVENT_ID.test(id))) throw new Error('Historique des notifications invalide : envoi refusé.')
    return structuredClone(ledger)
  }
  return { schemaVersion: 1, initializedAt: now.toISOString(), acknowledged: [...new Set((previous?.events ?? []).map(event => event.id))] }
}

// Signals worth a notification: thresholds applied, contradictions and harmless
// revalidations of a dated snapshot excluded, duplicates collapsed.
export function notifiableEvents(events) {
  const seen = new Set()
  return events.filter(event => {
    if (editorialExclusion(event) || event.editorialExcluded || event.supersededBy) return false
    if (!EVENT_ID.test(event.id)) throw new Error('Identifiant de signal invalide.')
    if (replicationWordingEvent(event) || event.status === 'wording-only') return false
    if (event.status === 'source-conflict' || datedEtfSnapshot(event) && event.kind === 'change' && event.beforePeriod === event.period) return false
    const filing = investorFilingType(event)
    if (filing && filing !== 'publication') return false
    if (seen.has(event.id)) return false
    seen.add(event.id)
    return true
  })
}

export function migrateNotificationPolicy(previous, ledger, now=new Date()) {
  if (ledger.editorialVersion === 3) return ledger
  // Preserve already eligible surplus. Newly promoted historical items stay quiet.
  const retained=(previous?.events??[]).filter(e=>e.editorial?.state==='ready'&&e.editorial?.reliability?.usable)
  const retainedIds=new Set(retained.map(e=>e.id)),silent=(previous?.events??[]).filter(e=>!retainedIds.has(e.id)).map(e=>e.id)
  return {...ledger,editorialVersion:3,acknowledged:[...new Set([...ledger.acknowledged,...silent])],policyMigration:{at:now.toISOString(),retainedPending:retained.filter(e=>!ledger.acknowledged.includes(e.id)).length,silentHistorical:silent.length}}
}
export function planNotifications(events, ledger, now = new Date(), mode = 'digest') {
  const acknowledgedIds=new Set(ledger.acknowledged)
  const knownKeys=new Set([...(ledger.acknowledgedPublications??[]),...events.filter(e=>acknowledgedIds.has(e.id)).map(publicationKey)])
  const pending = pendingNotifications(events, ledger).filter(event => {const a=editorialAssessment(event,+now);return !knownKeys.has(publicationKey(event))&&a.reliability.usable&&a.material.status==='sufficient'})
  const groups = groupSignals(pending, +now, {notification:true}).filter(group => {
    const assessment = editorialAssessment(group.event, +now)
    const date = publicationTime(group.event)
    const age = (+now-Date.parse(date))/86400000
    return assessment.priority && assessment.material.status==='sufficient' && group.state === 'ready' && age >= 0 && age <= RECENT_DAYS && !group.event.migratedEditorial && !group.event.backfill && (mode !== 'major' || assessment.major)
  })
  // Two groups per run, no daily loss of a fourth major announcement.
  // Unsent IDs stay in state; the next run retries them, then the daily digest.
  if (mode === 'digest' && ledger.lastDigest === parisClock(now).date) return { events: [], pending: groups.length, deferred: groups.length, reason: 'Récapitulatif déjà envoyé ; attente du prochain passage admissible' }
  const { selected } = selectEditorial(groups, mode === 'major' ? 2 : 5)
  return { events: selected.flatMap(group => group.events), pending: groups.length, deferred: groups.length-selected.length, reason: groups.length>selected.length ? 'Regroupement et limite par passage ; surplus conservé pour reprise' : null }

}

export function pendingNotifications(events, ledger) {
  const seen = new Set(ledger.acknowledged)
  return notifiableEvents(events).filter(event => !seen.has(event.id)).sort((a, b) => a.detectedAt.localeCompare(b.detectedAt) || a.id.localeCompare(b.id))
}

// Signals still worth a look: detected within the recent window, newest first.
export function recentSignals(events, now = new Date()) {
  const floor = new Date(now.getTime() - RECENT_DAYS * 86400000).toISOString()
  return notifiableEvents(events).filter(event => event.detectedAt >= floor).sort((a, b) => b.detectedAt.localeCompare(a.detectedAt) || a.id.localeCompare(b.id))
}

function eventBody(event, repo, revision, compact = false, now = new Date()) {
  const assessment=editorialAssessment(event,+now),material=assessment.material
  const radarUrl=`https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/radar-editorial?subject=${event.id}`
  const facts=material.facts.slice(0,compact?1:3).map(f=>`- ${text(f.text)}`).join('\n')
  return `\n### ${text(event.title)}\n\n${marker(event.id)}\n\n${text(material.mainFact)}\n\n**Pourquoi maintenant :** ${text(material.nowReason)}\n\n**Matière pour le tweet :**\n${facts}\n\n${text(assessment.qualification.label)} · Publication originale : ${text(event.originalPublishedAt??event.publishedAt??'date inconnue')}${event.effectiveAt?` · Application : ${text(event.effectiveAt)}`:''}.\n${material.population?`Public : ${text(material.population)}.\n`:''}${material.missing.length?`À préciser : ${material.missing.map(text).join(' ; ')}.\n`:''}\n[Ouvrir ce sujet dans le Radar](${link(radarUrl)}) · [Source](${link(event.sourceUrl)})\n`
}

// Sections for a list of events, split into bodies that respect GitHub's limit.
function batches(events, repo, revision, header, now) {
  const result = []; let batch = [], body = header
  for (const group of groupSignals(events,+now,{notification:true})) {
    const event=group.event
    let section = eventBody(event, repo, revision, false, now)
    section+='\n'+group.events.filter(e=>e.id!==event.id).map(e=>marker(e.id)).join('\n')
    if (Buffer.byteLength(header + section) > BODY_LIMIT) section = eventBody(event, repo, revision, true, now)
    if (Buffer.byteLength(header + section) > BODY_LIMIT) throw new Error('Signal trop volumineux pour une issue GitHub ; historique conservé.')
    if (Buffer.byteLength(body + section) > BODY_LIMIT) { result.push({ events: batch, body }); batch = []; body = header }
    batch.push(...group.events); body += section
  }
  if (batch.length) result.push({ events: batch, body })
  return result
}

// One tracked issue: its body always shows the recent signals and carries the
// durable receipts of every notified signal; signals older than the window drop
// out, and the issue closes itself when nothing recent remains.
export function trackerBody({ recent, receipts, repo, revision, now }) {
  const header = `${TRACKER_MARKER}\n# Radar éditorial\n\n${signals(recent.length)} sourcé${recent.length > 1 ? 's' : ''} détecté${recent.length > 1 ? 's' : ''} au cours des ${RECENT_DAYS} derniers jours (contrôle du ${text(now.toISOString().slice(0, 10))} UTC). Les seuils du radar sont appliqués avant notification. Une nouvelle donnée suivie ne prouve pas un lancement ; ces signaux restent à interpréter avant publication.\n\nLes nouveaux signaux sont annoncés en commentaire ; cette description est mise à jour à chaque passage et les signaux sortis de la fenêtre disparaissent d’eux-mêmes. [Historique complet du radar](${link(`https://github.com/${repo}/blob/radar-data/state.json`)}).\n`
  const listed = recent.slice(0, MAX_LISTED)
  let body = header
  for (const event of listed) {
    let section = eventBody(event, repo, revision, true, now).replaceAll('editorial-radar-event:', 'editorial-radar-listed:')
    if (Buffer.byteLength(body + section) > BODY_LIMIT - MAX_RECEIPTS * 50) break
    body += section
  }
  const shown = (body.match(/<!-- editorial-radar-listed:/g) ?? []).length
  if (recent.length > shown) body += `\n${recent.length - shown} autre(s) signal(aux) récent(s) dans l’historique complet.\n`
  if (!recent.length) body += '\nAucun signal récent : cette issue se rouvrira au prochain signal validé.\n'
  const extra = [...receipts].slice(-MAX_RECEIPTS)
  if (extra.length) body += `\n<!-- Accusés de notification -->\n${extra.map(marker).join('\n')}\n`
  return body
}

// Issues carry durable per-event receipts. They also protect against a crash
// after POST succeeds but before notifications.json is committed. Include
// closed issues and every page; PRs and non-bot issues are never receipts.
export function correctReplicationNotification(body, events) {
  const ignored = new Set(events.filter(replicationWordingEvent).map(e => e.id))
  return body.replace(/\n### [\s\S]*?(?=\n### |\n<!-- radar-batch:|$)/g, section => {
    const id = section.match(/<!-- editorial-radar-event:([a-f0-9]{24}) -->/)?.[1]
    if (!ignored.has(id) || section.includes('radar-wording-corrected:v1')) return section
    return `\n### Correction : variation de libellé de réplication\n\n<!-- radar-wording-corrected:v1 -->\nCes formulations sont équivalentes. Ce signal est retiré des événements financiers ; les observations originales restent archivées ci-dessous.\n\n<details><summary>Notification originale — variation technique sans changement financier établi</summary>\n${section.replace(/\n### /g, '\n#### ')}\n</details>\n`
  })
}

export async function notifyRadar({ events, archiveEvents = events, ledger, api, repo, assignee = 'madmax91310', evidenceRevision = 'radar-data', now = new Date(), maintain = false, mode = 'all' }) {
  if (!/^(?:[a-f0-9]{40}|radar-data)$/.test(evidenceRevision)) throw new Error('Révision de preuve invalide.')
  mode=mode==='all'?'digest':mode
  const allEvents = events
  const plan = planNotifications(events, ledger, now, mode)
  if (plan) events = plan.events
  const pending = pendingNotifications(events, ledger)
  if (!pending.length && !maintain) return { ledger, issues: [], sent: 0, recovered: 0 }
  const receipts = new Set()
  const pendingIds = new Set(pending.map(event => event.id))
  const unassignedReceipts = new Set()
  const legacy = []
  let tracker = null
  for (let page = 1; ; page++) {
    const issues = await api(`issues?state=all&creator=github-actions%5Bbot%5D&per_page=100&page=${page}`)
    for (const issue of issues) {
      if (!isBotIssue(issue)) continue
      const body = issue.body ?? ''
      if (body.includes(TRACKER_MARKER)) { if (!tracker || issue.number > tracker.number) tracker = issue; continue }
      let receipt = false
      for (const match of body.matchAll(/<!-- editorial-radar-event:([a-f0-9]{24}) -->/g)) {
        receipt = true
        receipts.add(match[1])
        if (pendingIds.has(match[1]) && !issue.assignees?.some(user => user.login.toLowerCase() === assignee.toLowerCase())) unassignedReceipts.add(issue.number)
      }
      if (receipt && issue.state === 'open') legacy.push(issue)
    }
    if (issues.length < 100) break
  }
  if (tracker) {
    if (!tracker.assignees?.some(user => user.login.toLowerCase() === assignee.toLowerCase())) unassignedReceipts.add(tracker.number)
    for (const match of (tracker.body ?? '').split('<!-- Accusés de notification -->')[1]?.matchAll(/<!-- editorial-radar-event:([a-f0-9]{24}) -->/g) ?? []) receipts.add(match[1])
    for (let page = 1; ; page++) {
      const comments = await api(`issues/${tracker.number}/comments?per_page=100&page=${page}`)
      for (const comment of comments) {
        if (comment.user?.login !== 'github-actions[bot]') continue
        const corrected = correctReplicationNotification(comment.body ?? '', archiveEvents)
        if (corrected !== (comment.body ?? '')) await api(`issues/comments/${comment.id}`, 'PATCH', { body: corrected })
        for (const match of (comment.body ?? '').matchAll(/<!-- editorial-radar-event:([a-f0-9]{24}) -->/g)) receipts.add(match[1])
      }
      if (comments.length < 100) break
    }
  }
  const unsent = pending.filter(event => !receipts.has(event.id))
  const recent = recentSignals(mode === 'all' ? events : allEvents.filter(event => { const a = editorialAssessment(event,+now); return a.reliability.usable && a.state === 'ready' }), now)
  // Render every body before any side effect to reject invalid content early.
  const header = `@${assignee}, ${mode === 'major' ? 'événement majeur' : mode === 'digest' ? 'récap quotidien des meilleurs nouveaux sujets' : 'de nouveaux signaux sourcés ont été validés par le radar éditorial'}.\n`
  const comments = batches(unsent, repo, evidenceRevision, header, now)
  const acknowledged = [...new Set([...ledger.acknowledged, ...pending.map(event => event.id)])]
  const body = trackerBody({ recent, receipts: new Set([...receipts, ...ledger.acknowledged]), repo, revision: evidenceRevision, now })
  const state = recent.length ? 'open' : 'closed'
  const title = recent.length ? `Radar éditorial : ${signals(recent.length)} récent${recent.length > 1 ? 's' : ''} à traiter` : 'Radar éditorial : aucun signal récent'
  const issues = []
  if (!tracker && !recent.length && !unsent.length) return { ledger, issues, sent: 0, recovered: pending.length }
  if (comments.length || unassignedReceipts.size || !tracker) {
    const repository = await api('')
    if (!repository.has_issues) throw new Error('Les issues GitHub doivent être activées pour notifier le radar.')
    await api(`assignees/${assignee}`)
    // GET /assignees/{login} returns 204. api must accept empty responses.
  }
  for (const number of unassignedReceipts) {
    const issue = await api(`issues/${number}/assignees`, 'POST', { assignees: [assignee] })
    if (!issue.assignees?.some(user => user.login.toLowerCase() === assignee.toLowerCase())) throw new Error(`Attribution de l’issue #${number} refusée.`)
  }
  if (!tracker) {
    tracker = await api('issues', 'POST', { title, body, assignees: [assignee] })
    if (!tracker.assignees?.some(user => user.login.toLowerCase() === assignee.toLowerCase())) throw new Error(`Issue #${tracker.number} créée sans attribution à ${assignee}.`)
  } else if (tracker.body !== body || tracker.title !== title || tracker.state !== state) {
    await api(`issues/${tracker.number}`, 'PATCH', { title, body, state })
  }
  issues.push(tracker.html_url)
  for (const batch of comments) {
    const digest = createHash('sha256').update(batch.events.map(event => event.id).sort().join(':')).digest('hex').slice(0, 12)
    await api(`issues/${tracker.number}/comments`, 'POST', { body: `${batch.body}\n<!-- radar-batch:${digest} -->\n` })
  }
  // Only successful comments/legacy receipts acknowledge delivery. A crash here
  // is recovered from the bot comments before the next POST.
  const deliveredBody = trackerBody({ recent, receipts: new Set([...receipts, ...acknowledged]), repo, revision: evidenceRevision, now })
  if (deliveredBody !== body) await api(`issues/${tracker.number}`, 'PATCH', { body: deliveredBody })
  // Earlier one-issue-per-batch notifications stay readable as receipts; once
  // their signals are acknowledged they are closed in favour of the tracked issue.
  for (const issue of legacy) {
    await api(`issues/${issue.number}/comments`, 'POST', { body: `Signaux regroupés dans l’issue suivie #${tracker.number} ; cette issue est fermée automatiquement.` })
    await api(`issues/${issue.number}`, 'PATCH', { state: 'closed' })
  }
  return { ledger: { ...ledger, acknowledged, ...(mode !== 'all' ? { acknowledgedPublications: [...new Set([...(ledger.acknowledgedPublications ?? []), ...pending.map(publicationKey)])] } : {}), ...(mode === 'major' && unsent.length ? { majorDay: parisClock(now).date, majorGroups: (ledger.majorDay === parisClock(now).date ? ledger.majorGroups ?? 0 : 0)+groupSignals(unsent,+now).length } : {}), ...(mode === 'digest' ? { lastDigest: parisClock(now).date } : {}), delivery: { checkedAt: now.toISOString(), mode, sent: unsent.length, pending: plan?.pending ?? 0 } }, issues, sent: unsent.length, recovered: pending.length - unsent.length, closedLegacy: legacy.length }
}
