#!/usr/bin/env node
// Aucun calcul de calendrier ici : le rappel consomme celui de l'interface.
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { buildReview, dayNumber, parisToday } from '../src/pages/data-review/lib.js'

export const WINDOW_DAYS = 7 // Un passage hebdomadaire ; pas d'alerte un mois en avance.
const MARKER = /<!-- data-review-entry:([^\s]+) -->/g
const keyOf = item => `${encodeURIComponent(item.id)}@${item.nextReviewAt}`

export function reminderCandidates(review) {
  const today = dayNumber(review.today)
  if (today === null) throw new Error('Date de rappel invalide')
  const unique = new Map()
  // Les offres sont dans items, les contrôles récurrents et les 13F dans schedule.
  for (const item of [...review.schedule, ...review.items.filter(item => item.until)]) {
    const due = dayNumber(item.nextReviewAt)
    if (due === null || due - today > WINDOW_DAYS || ['undated', 'future-date', 'reserve'].includes(item.category)) continue
    unique.set(keyOf(item), item)
  }
  return [...unique.values()].sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt) || a.id.localeCompare(b.id))
}

const plain = value => String(value ?? '').replace(/[\r\n]/g, ' ').replace(/[<>]/g, '').slice(0, 180)
export function planReminders(review, issues = []) {
  // Les issues fermées comptent aussi : fermer un rappel ne redéclenche pas
  // chaque lundi la même échéance. Une nouvelle date reste un nouveau travail.
  const known = new Set(issues.filter(issue => !issue.pull_request).flatMap(issue =>
    [...(issue.body ?? '').matchAll(MARKER)].map(match => match[1])))
  const groups = new Map()
  for (const item of reminderCandidates(review)) {
    if (known.has(keyOf(item))) continue
    const group = groups.get(item.nextReviewAt) ?? []
    group.push(item)
    groups.set(item.nextReviewAt, group)
  }
  const plans = []
  for (const [date, items] of groups) {
    // Garder les corps sous la limite GitHub, même pour un gros lot trimestriel.
    for (let start = 0; start < items.length; start += 50) {
      const batch = items.slice(start, start + 50)
      const body = [
        '<!-- data-review-reminder:v2 -->',
        `Calendrier calculé par buildReview au ${review.today}. Fenêtre du rappel : ${WINDOW_DAYS} jours, plus les échéances échues.`,
        '',
        'Revoir uniquement les données ci-dessous auprès des sources avant de modifier leurs dates. Une photographie ancienne ou une réserve déjà auditée ne signifie pas que la donnée est erronée. Ce rappel ne bloque ni le build ni les publications.',
        '',
        ...batch.flatMap(item => [
          `<!-- data-review-entry:${keyOf(item)} -->`,
          `* ${plain(item.name)} · ${plain(item.field)} · ${plain(item.dataType)} · ${date}${dayNumber(date) <= dayNumber(review.today) ? ' (échue)' : ''}`,
          `  Contrôle : ${plain(item.checkedAt) || 'non daté'} ; outils : ${plain(item.tools.join(', '))}.`,
        ]),
        '',
        'Les réserves, archives et champs sans échéance restent consultables dans « Données à revoir ». Une issue fermée ne sera pas recréée pour les mêmes données et la même échéance.',
      ].join('\n')
      plans.push({ title: `Revue des données · échéance ${date}`, body, keys: batch.map(keyOf) })
    }
  }
  return plans
}

function gh(args, input) {
  const result = spawnSync('gh', args, { input, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr.trim())
  return JSON.parse(result.stdout)
}
export function syncReminders(review, repository, api = gh) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '')) throw new Error('Dépôt GitHub invalide')
  // Pas d'appel GitHub s'il n'y a rien à rappeler. Pagination complète, sans
  // recherche indexée ni limite arbitraire aux 100 dernières issues.
  if (!reminderCandidates(review).length) return []
  const pages = api(['api', '--method', 'GET', `repos/${repository}/issues?state=all&per_page=100`, '--paginate', '--slurp'])
  const plans = planReminders(review, pages.flat())
  for (const plan of plans) api(['api', '--method', 'POST', `repos/${repository}/issues`, '--input', '-'], JSON.stringify({ title: plan.title, body: plan.body }))
  return plans
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const mode = args[0]?.startsWith('--') ? args.shift() : '--json'
  if (!['--json', '--report', '--sync'].includes(mode) || args.length > 1 || (args[0] && !/^\d{4}-\d{2}-\d{2}$/.test(args[0]))) throw new Error('Usage : node scripts/data-review-reminder.mjs [--json|--report|--sync] [AAAA-MM-JJ]')
  const review = buildReview(args[0] ?? parisToday())
  if (mode === '--sync') console.log(`${syncReminders(review, process.env.GITHUB_REPOSITORY).length} rappel(s) créé(s).`)
  else if (mode === '--report') {
    const candidates = reminderCandidates(review)
    console.log(`Revue au ${review.today} : ${candidates.length} échéance(s) à ${WINDOW_DAYS} jours ou échue(s).`)
    for (const item of candidates) console.log(`${item.nextReviewAt} · ${item.name} · ${item.field} · ${item.dataType}`)
    console.log(`Rapport interne : ${review.items.filter(item => ['reserve', 'undated', 'future-date'].includes(item.category)).length} réserve(s) ou contrôle(s) sans échéance exploitable ; ${review.archives} archives. Ces éléments ne déclenchent pas seuls un rappel.`)
  } else console.log(JSON.stringify(planReminders(review), null, 2))
}
