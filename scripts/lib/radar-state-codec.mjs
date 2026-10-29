import {createHash} from 'node:crypto'
import {gzipSync,gunzipSync} from 'node:zlib'
// Transport/resource bounds only; no financial or source-freshness threshold.
const REST_BUDGET=32*1024*1024, MAX_STATE_BYTES=256*1024*1024
const PREVIEW_KEYS=['conflicts','runMetrics']
const BASE_KEYS=['radarStateTransport','encoding','originalBytes','sha256','data']
const requestBytes=content=>Buffer.byteLength(JSON.stringify({content,encoding:'utf-8'}))
function restoreTransport(input){
 if(!input||!Object.hasOwn(input,'radarStateTransport'))return input
 if(input.radarStateTransport!==1||input.encoding!=='gzip-base64'||Object.keys(input).some(key=>!BASE_KEYS.includes(key)&&!PREVIEW_KEYS.includes(key))||!Number.isSafeInteger(input.originalBytes)||input.originalBytes<=0||input.originalBytes>MAX_STATE_BYTES||!(/^[a-f0-9]{64}$/).test(input.sha256)||typeof input.data!=='string'||!input.data)throw Error('Transport de l’état Radar non reconnu ; historique conservé.')
 try{
  const compressed=Buffer.from(input.data,'base64')
  if(compressed.toString('base64')!==input.data)throw Error('Base64 non canonique')
  const raw=gunzipSync(compressed,{maxOutputLength:input.originalBytes})
  if(raw.length!==input.originalBytes||createHash('sha256').update(raw).digest('hex')!==input.sha256)throw Error('Empreinte ou taille incohérente')
  const text=raw.toString('utf8')
  if(!Buffer.from(text).equals(raw))throw Error('UTF-8 invalide')
  const state=JSON.parse(text)
  if(!state||typeof state!=='object'||Array.isArray(state)||Object.hasOwn(state,'radarStateTransport'))throw Error('État imbriqué ou invalide')
  for(const key of PREVIEW_KEYS){
   if(Object.hasOwn(state,key)!==Object.hasOwn(input,key)||Object.hasOwn(state,key)&&JSON.stringify(state[key])!==JSON.stringify(input[key]))throw Error('Projection de supervision incohérente')
  }
  return state
 }catch{throw Error('État Radar compressé altéré ; historique conservé.')}
}
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
// Storage only: every observation keeps its full proof when loaded. Intern the
// identical evidence repeated by category, anchors and migration review records.
export function unpackRadarState(input){
 input=restoreTransport(input)
 if(input==null||input.compositionEvidenceEncoding===undefined&&input.compositionEvidencePool===undefined)return input
 if(input.compositionEvidenceEncoding!==1||!input.compositionEvidencePool||Array.isArray(input.compositionEvidencePool)||typeof input.compositionEvidencePool!=='object')throw Error('Encodage des preuves Radar non reconnu ; historique conservé.')
 const state=structuredClone(input),pool=state.compositionEvidencePool
 for(const [id,proof]of Object.entries(pool))if(!/^[a-f0-9]{64}$/.test(id)||proof?.version!==1||digest(proof)!==id)throw Error('Preuve Radar altérée ; historique conservé.')
 delete state.compositionEvidencePool;delete state.compositionEvidenceEncoding
 function visit(value){
  if(!value||typeof value!=='object')return
  if(Object.hasOwn(value,'compositionEvidenceRef')){
   const id=value.compositionEvidenceRef
   if(value.compositionEvidence!==undefined||typeof id!=='string'||!Object.hasOwn(pool,id))throw Error('Référence de preuve Radar absente ou ambiguë ; historique conservé.')
   value.compositionEvidence=pool[id];delete value.compositionEvidenceRef
  }
  for(const child of Object.values(value))visit(child)
 }
 visit(state)
 return state
}
export function packRadarState(input){
 const state=structuredClone(unpackRadarState(input)),pool={}
 if(!state)return state
 function visit(value){
  if(!value||typeof value!=='object')return
  if(value.compositionEvidence?.version===1){
   const proof=value.compositionEvidence,id=digest(proof)
   pool[id]=proof;value.compositionEvidenceRef=id;delete value.compositionEvidence
  }
  for(const child of Object.values(value))visit(child)
 }
 visit(state)
 state.compositionEvidenceEncoding=1;state.compositionEvidencePool=pool
 return state
}

// The REST request escapes JSON a second time. Persist machine state compactly
// so whitespace cannot exceed GitHub's request-body limit; values stay exact.
export function radarStateContent(input,onMetrics){
 const packed=packRadarState(input),text=JSON.stringify(packed)+'\n',originalRequestBytes=requestBytes(text)
 if(originalRequestBytes<=REST_BUDGET){onMetrics?.({encoding:'compact',logicalBytes:Buffer.byteLength(text),storedBytes:Buffer.byteLength(text),originalRequestBytes,requestBytes:originalRequestBytes});return text}
 const raw=Buffer.from(text)
 if(raw.length>MAX_STATE_BYTES)throw Error('État Radar trop volumineux pour le transport borné ; historique conservé.')
 const encoded=JSON.stringify({radarStateTransport:1,encoding:'gzip-base64',originalBytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex'),data:gzipSync(raw).toString('base64'),...Object.fromEntries(PREVIEW_KEYS.filter(key=>Object.hasOwn(packed,key)).map(key=>[key,packed[key]]))})+'\n'
 const encodedRequestBytes=requestBytes(encoded)
 if(encodedRequestBytes>REST_BUDGET)throw Error('État Radar encodé trop volumineux ; historique conservé.')
 onMetrics?.({encoding:'lossless-gzip',logicalBytes:raw.length,storedBytes:Buffer.byteLength(encoded),originalRequestBytes,requestBytes:encodedRequestBytes})
 return encoded
}
