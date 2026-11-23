import { record, keys, inflate } from './checked-json.js'

const MAX_RECORD = 8 * 1024 * 1024
const MAX_HISTORY = 128 * 1024 * 1024

export async function expandIncidentHistory(state) {
  const { incidentHistoryStorage, incidentHistoryArchives, monitoring, ...rest } = state
  if (incidentHistoryStorage !== 'gzip-sha256-incidents-v1' ||
      !record(incidentHistoryArchives) || !record(monitoring) || !record(monitoring.active)) throw Error()
  const records = new Map()
  let total = 0
  for (const [sha256, archive] of Object.entries(incidentHistoryArchives)) {
    if (!keys(archive, ['decodedBytes', 'data'])) throw Error()
    total += archive.decodedBytes
    if (total > MAX_HISTORY) throw Error()
    const observations = await inflate({ ...archive, sha256 }, MAX_RECORD)
    if (!Array.isArray(observations) || !observations.every(record)) throw Error()
    records.set(sha256, observations)
  }
  const used = new Set()
  const active = Object.fromEntries(Object.entries(monitoring.active).map(([key, incident]) => {
    if (!record(incident)) throw Error()
    if (!Object.hasOwn(incident, 'observationHistoryRef')) return [key, incident]
    const { observationHistoryRef, ...row } = incident
    if (!records.has(observationHistoryRef) || Object.hasOwn(row, 'observations')) throw Error()
    used.add(observationHistoryRef)
    return [key, { ...row, observations: records.get(observationHistoryRef) }]
  }))
  if (used.size !== records.size) throw Error()
  return { ...rest, monitoring: { ...monitoring, active } }
}
