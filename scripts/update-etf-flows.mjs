import {readFileSync, writeFileSync, renameSync, mkdirSync} from 'node:fs'
import {dirname} from 'node:path'
import {collectEdition} from './collect-etf-flows.mjs'
import {lastWeekMonday} from './etf-flows-calendar.mjs'
import {renderPost} from '../src/pages/etf-flows/weekly.js'
import {addObservation, latestObservation, publicationGate, validateObservation} from '../src/lib/etf-flows.js'
const path = 'src/data/etf-flows.json'
const data = JSON.parse(readFileSync(path, 'utf8'))
if (data.schemaVersion !== 1 || !Array.isArray(data.observations)) throw Error('Registre invalide ; aucune écriture.')
data.observations.reduce((all, o) => addObservation(all, o), [])
const args = process.argv.slice(2)
const registryPath = 'src/data/etf-flows-weekly.json'

function save(file, value) {
  mkdirSync(dirname(file), {recursive: true})
  const temp = file + '.tmp'
  writeFileSync(temp, JSON.stringify(value, null, 2) + '\n')
  renameSync(temp, file)
}

function readWeeklyRegistry() {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  if (registry.schemaVersion !== 1 || !Array.isArray(registry.editions)) throw Error('Registre automatique invalide.')
  return registry
}

async function updateWeekly(mode, reportPath, monday = lastWeekMonday()) {
  const registry = readWeeklyRegistry()
  let report
  try {
    const existing = mode !== '--preview' && registry.editions.find(edition => edition.monday === monday)
    if (mode === '--retained' && !existing) throw Error(`Édition validée introuvable pour le ${monday}.`)
    const edition = existing || {...await collectEdition(monday), validatedAt: new Date().toISOString()}
    if (!existing) edition.post = renderPost(edition)
    if (mode === '--collect' && !existing) {
      registry.editions.push(edition)
      registry.editions.sort((a, b) => a.monday > b.monday ? -1 : 1)
      save(registryPath, registry)
    }
    report = {status: existing ? 'already-validated' : 'validated', edition}
    console.log(JSON.stringify(report, null, 2))
  } catch (error) {
    report = {status: 'unavailable', monday, reason: error.message, code: error.cause?.code}
    throw error
  } finally {
    save(reportPath, report)
  }
}

if (args[0] === '--plan' && [1, 2].includes(args.length)) {
  const monday = args[1] ?? lastWeekMonday()
  const collect = !readWeeklyRegistry().editions.some(edition => edition.monday === monday)
  console.log(JSON.stringify({monday, collect}))
} else if (['--collect', '--preview', '--retained'].includes(args[0]) && [2, 3].includes(args.length)) {
  await updateWeekly(...args)
} else if (args.length && !(['--import','--report'].includes(args[0]) && args.length === 2)) {
  throw Error('Usage: node scripts/update-etf-flows.mjs [--plan [lundi] | --collect|--preview|--retained rapport.json [lundi] | --import fichier.json | --report rapport.json]')
} else if (args[0] === '--import') {
  // No inferred dates, zero filling, destructive correction or automatic revalidation.
  const observation = JSON.parse(readFileSync(args[1], 'utf8'))
  data.observations = addObservation(data.observations, observation)
  const tmp = `${path}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n'); renameSync(tmp, path)
  console.log(`Observation importée : ${observation.start} / ${observation.end}. Ouvrir une PR pour la partager.`)
} else {
  const latest = latestObservation(data.observations)
  const report = {checkedAt: new Date().toISOString(), mode: 'blocked', newEditionAvailable: false,
    reason: data.collection.reason, networkRequests: 0, attempts: 0,
    lastValidatedPeriod: latest ? {start:latest.start,end:latest.end,validatedAt:latest.validatedAt} : null,
    publicationIssues: publicationGate(latest), retainedObservations: data.observations.length,
    invalidObservations: data.observations.flatMap(o => validateObservation(o))}
  if (args[0] === '--report') {mkdirSync(dirname(args[1]), {recursive:true}); writeFileSync(args[1],JSON.stringify(report,null,2)+'\n')}
  console.log(JSON.stringify(report,null,2))
  // A blocked source isn't a successful collection. No source fetch or data commit.
}
