import { inflate, keys, record } from './checked-json.js'

export const MONITOR_SEGMENT_FORMAT = 'sha256-segments-v1'
const MAX_RAW = 8 * 1024 * 1024
const MAX_FILE = 4 * 1024 * 1024
const PAGE = 256
const digestPattern = /^[0-9a-f]{64}$/

export function monitorSegmentPath(digest) {
  if (typeof digest !== 'string' || !digestPattern.test(digest)) throw new Error('Empreinte de segment invalide')
  return `monitor-segments/${digest.slice(0, 2)}/${digest}.json`
}

export async function fetchMonitorSegment(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok || !response.body) throw new Error('Segment du moniteur indisponible')
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_FILE) throw new Error('Segment du moniteur trop volumineux')
      chunks.push(value)
    }
  } finally {
    await reader.cancel()
  }
  return JSON.parse(await new Blob(chunks).text())
}

export async function readMonitorProjection(manifest, load) {
  if (!keys(manifest, ['schemaVersion', 'monitorStorage', 'records', 'workflows', 'incidentLists', 'base', 'current']) ||
      manifest.schemaVersion !== 3 || manifest.monitorStorage !== MONITOR_SEGMENT_FORMAT ||
      !record(manifest.incidentLists) || typeof load !== 'function') throw new Error('Manifeste du moniteur invalide')

  const read = async digest => {
    const envelope = await load(monitorSegmentPath(digest))
    if (!keys(envelope, ['decodedBytes', 'data'])) throw new Error('Enveloppe de segment invalide')
    const page = await inflate({ ...envelope, sha256: digest }, MAX_RAW)
    if (!Array.isArray(page) || page.length > PAGE) throw new Error('Page de segments invalide')
    return page
  }
  async function visit(pages, depth, accept) {
    if (!Array.isArray(pages) || pages.length > PAGE) throw new Error('Index de segments invalide')
    for (let index = 0; index < pages.length; index += 8) {
      const batch = await Promise.all(pages.slice(index, index + 8).map(read))
      for (const page of batch) {
        if (depth) await visit(page, depth - 1, accept)
        else for (const row of page) accept(row)
      }
    }
  }
  async function table(descriptor, kind) {
    if (!keys(descriptor, ['kind', 'depth', 'pages']) || descriptor.kind !== kind ||
        !Number.isInteger(descriptor.depth) || descriptor.depth < 0 || descriptor.depth > 8) {
      throw new Error('Descripteur de segments invalide')
    }
    if (kind === 'list') {
      const rows = []
      await visit(descriptor.pages, descriptor.depth, row => rows.push(row))
      return rows
    }
    const rows = new Map()
    await visit(descriptor.pages, descriptor.depth, pair => {
      if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' || rows.has(pair[0])) {
        throw new Error('Clé de segment invalide ou répétée')
      }
      rows.set(...pair)
    })
    return Object.fromEntries(rows)
  }
  const descriptors = manifest.incidentLists
  const [current, lists, active, resolved, retired] = await Promise.all([
    table(manifest.current, 'map'),
    table(descriptors.attemptedDataIds, 'map'),
    table(descriptors.active, 'map'),
    table(descriptors.resolved, 'list'),
    descriptors.retired ? table(descriptors.retired, 'list') : [],
  ])
  if (current.schemaVersion !== 1 || !record(current.workflows) || !record(current.monitoring)) {
    throw new Error('État courant du moniteur invalide')
  }
  const restore = (row, isActive = false) => {
    if (!record(row)) throw new Error('Incident invalide')
    if (Object.hasOwn(row, 'attemptedDataIdsRef')) {
      const { attemptedDataIdsRef, ...rest } = row
      if (Object.hasOwn(row, 'attemptedDataIds') || !Object.hasOwn(lists, attemptedDataIdsRef) ||
          !Array.isArray(lists[attemptedDataIdsRef])) throw new Error('Périmètre d’incident introuvable')
      row = { ...rest, attemptedDataIds: lists[attemptedDataIdsRef] }
    }
    if (isActive && Object.hasOwn(row, 'seenAtMonitorCheck')) {
      const { seenAtMonitorCheck, ...rest } = row
      if (seenAtMonitorCheck !== true || Object.hasOwn(row, 'lastSeenAt') || typeof current.monitoring.checkedAt !== 'string') {
        throw new Error('Date du contrôle de l’incident invalide')
      }
      row = { ...rest, lastSeenAt: current.monitoring.checkedAt }
    }
    return row
  }
  return { ...current, monitoring: { ...current.monitoring,
    active: Object.fromEntries(Object.entries(active).map(([key, row]) => [key, restore(row, true)])),
    resolved: resolved.reverse().map(row => restore(row)), ...(descriptors.retired ? { retired: retired.reverse().map(row => restore(row)) } : {}),
  } }
}
