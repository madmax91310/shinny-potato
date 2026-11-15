// Optional scope format; legacy monitors do not load this decoder.
import {record,keys,inflate} from './checked-json.js'
const MAX_BYTES = 256 * 1024 * 1024
const MAX_RECEIPT_BYTES = 8 * 1024 * 1024
export async function expandScopeArchives(state) {
  if (!state || (!Object.hasOwn(state,'reportScopeStorage') && !Object.hasOwn(state,'reportScopeArchives'))) return state
  if (state.reportScopeStorage !== 'gzip-sha256-scopes-v1' || state.reportScopeSchemaVersion !== 1 || Object.hasOwn(state,'reportScopes') || !record(state.reportScopeArchives)) throw Error()
  const scopes = {}; let total = 0
  for (const [key,archive] of Object.entries(state.reportScopeArchives)) {
    if (!keys(archive,['decodedBytes','data'])) throw Error()
    total += archive.decodedBytes
    if (total > MAX_BYTES) throw Error()
    const scope = await inflate({...archive,sha256:key},MAX_RECEIPT_BYTES)
    if (!record(scope)) throw Error()
    scopes[key] = scope
  }
  const {reportScopeStorage,reportScopeArchives,...rest} = state
  return {...rest,reportScopes:scopes}
}
