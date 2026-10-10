import { createHash } from 'node:crypto'
import { datedEtfSnapshot } from './editorial-radar.mjs'

const EVENT_ID = /^[a-f0-9]{24}$/
const marker = id => `<!-- editorial-radar-event:${id} -->`
const text = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/@/g, '&#64;').replace(/[\r\n]+/g, ' ').replace(/([\\`*_[\]|])/g, '\\$1')
const link = value => { const url = new URL(value); if (url.protocol !== 'https:') throw new Error('Source de notification non HTTPS.'); return url.href.replace(/[()]/g, c => encodeURIComponent(c)) }

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

export function pendingNotifications(events, ledger) {
  const seen = new Set(ledger.acknowledged)
  return events.filter(event => {
    if (!EVENT_ID.test(event.id)) throw new Error('Identifiant de signal invalide.')
    if (event.status === 'source-conflict' || datedEtfSnapshot(event) && event.kind === 'change' && event.beforePeriod === event.period) return false
    if (seen.has(event.id)) return false
    seen.add(event.id)
    return true
  }).sort((a, b) => a.detectedAt.localeCompare(b.detectedAt) || a.id.localeCompare(b.id))
}

function eventBody(event, repo) {
  const tool = typeof event.tool === 'string' && event.tool.startsWith('/') && !event.tool.startsWith('//') ? event.tool : null
  const toolUrl = tool ? `https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}${tool}` : null
  const details = typeof event.before === 'object' && event.before !== null || typeof event.after === 'object'
    ? `\n<details><summary>Valeurs complètes publiées</summary>\n\n<pre>${JSON.stringify({ before: event.before, after: event.after }, null, 2).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/@/g, '&#64;')}</pre>\n\n</details>\n` : ''
  return `\n### ${text(event.title)}\n\n${marker(event.id)}\n\n| Élément | Avant | Après |\n| --- | --- | --- |\n| ${text(event.fieldLabel)} | ${text(event.beforeText)} | ${text(event.afterText)} |\n| Période de référence | ${text(event.beforePeriod ?? 'Première donnée suivie')} | ${text(event.period)} |\n| Source officielle | ${event.previousSourceUrl ? `[Source précédente](${link(event.previousSourceUrl)})` : 'Sans observation précédente'} | [Source actuelle](${link(event.sourceUrl)}) |\n\n- Détecté : ${text(event.detectedAt)} ; observation vérifiée : ${text(event.checkedAt)}.\n- Périmètre : ${text(event.scope)}.\n- Validation : ${text(event.reason)}.\n- Outil concerné : ${toolUrl ? `[${text(tool)}](${link(toolUrl)})` : 'Non renseigné'}.\n- Angle à explorer : ${text(event.angle)}.\n${details}`
}

function issueBatches(events, repo, assignee) {
  const header = `@${assignee}, de nouveaux signaux sourcés ont été validés par le radar éditorial.\n\nLes seuils du radar sont appliqués avant notification. Une nouvelle donnée suivie ne prouve pas un lancement ; ces signaux restent à interpréter avant publication.\n`
  const batches = []; let batch = [], body = header
  for (const event of events) {
    const section = eventBody(event, repo)
    if (Buffer.byteLength(header + section) > 55000) throw new Error('Signal trop volumineux pour une issue GitHub ; historique conservé.')
    if (Buffer.byteLength(body + section) > 55000) { batches.push({ events: batch, body }); batch = []; body = header }
    batch.push(event); body += section
  }
  if (batch.length) batches.push({ events: batch, body })
  return batches
}

// Issues carry durable per-event receipts. They also protect against a crash
// after POST succeeds but before notifications.json is committed. Include
// closed issues and every page; PRs and non-bot issues are never receipts.
export async function notifyRadar({ events, ledger, api, repo, assignee = 'madmax91310' }) {
  const pending = pendingNotifications(events, ledger)
  if (!pending.length) return { ledger, issues: [], sent: 0, recovered: 0 }
  const receipts = new Set()
  const pendingIds = new Set(pending.map(event => event.id))
  const unassignedReceipts = new Set()
  for (let page = 1; ; page++) {
    const issues = await api(`issues?state=all&creator=github-actions%5Bbot%5D&per_page=100&page=${page}`)
    for (const issue of issues) {
      if (issue.pull_request || issue.user?.login !== 'github-actions[bot]') continue
      for (const match of (issue.body ?? '').matchAll(/<!-- editorial-radar-event:([a-f0-9]{24}) -->/g)) {
        receipts.add(match[1])
        if (pendingIds.has(match[1]) && !issue.assignees?.some(user => user.login.toLowerCase() === assignee.toLowerCase())) unassignedReceipts.add(issue.number)
      }
    }
    if (issues.length < 100) break
  }
  const unsent = pending.filter(event => !receipts.has(event.id))
  // Render all batches before any side effect to reject invalid content early.
  const batches = issueBatches(unsent, repo, assignee)
  if (batches.length || unassignedReceipts.size) {
    const repository = await api('')
    if (!repository.has_issues) throw new Error('Les issues GitHub doivent être activées pour notifier le radar.')
    await api(`assignees/${assignee}`)
    // GET /assignees/{login} returns 204. api must accept empty responses.
  }
  for (const number of unassignedReceipts) {
    const issue = await api(`issues/${number}/assignees`, 'POST', { assignees: [assignee] })
    if (!issue.assignees?.some(user => user.login.toLowerCase() === assignee.toLowerCase())) throw new Error(`Attribution de l’issue #${number} refusée.`)
  }
  const issues = []
  for (const batch of batches) {
    const digest = createHash('sha256').update(batch.events.map(event => event.id).sort().join(':')).digest('hex').slice(0, 12)
    const issue = await api('issues', 'POST', {
      title: `Radar éditorial : ${batch.events.length} nouveau${batch.events.length > 1 ? 'x' : ''} signal${batch.events.length > 1 ? 's' : ''} · ${batch.events.at(-1).detectedAt.slice(0, 10)} · ${digest}`,
      body: batch.body, assignees: [assignee],
    })
    if (!issue.assignees?.some(user => user.login.toLowerCase() === assignee.toLowerCase())) throw new Error(`Issue #${issue.number} créée sans attribution à ${assignee}.`)
    issues.push(issue.html_url)
  }
  return { ledger: { ...ledger, acknowledged: [...new Set([...ledger.acknowledged, ...pending.map(event => event.id)])] }, issues, sent: unsent.length, recovered: pending.length - unsent.length }
}
