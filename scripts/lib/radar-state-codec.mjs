import {createHash} from 'node:crypto'
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
// Storage only: every observation keeps its full proof when loaded. Intern the
// identical evidence repeated by category, anchors and migration review records.
export function unpackRadarState(input){
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
export function radarStateContent(input){return JSON.stringify(packRadarState(input))+'\n'}
