import {readFileSync, writeFileSync, renameSync, mkdirSync} from 'node:fs'
import {dirname} from 'node:path'
import {addObservation, latestObservation, publicationGate, validateObservation} from '../src/lib/etf-flows.js'
const path = 'src/data/etf-flows.json'
const data = JSON.parse(readFileSync(path, 'utf8'))
if (data.schemaVersion !== 1 || !Array.isArray(data.observations)) throw Error('Registre invalide ; aucune écriture.')
data.observations.reduce((all, o) => addObservation(all, o), [])
const args = process.argv.slice(2)
if (args.length && !(['--import','--report'].includes(args[0]) && args.length === 2)) throw Error('Usage: node scripts/update-etf-flows.mjs [--import fichier.json | --report rapport.json]')
if (args[0] === '--import') {
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
