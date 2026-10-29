import candidates from '../native-index-source-candidates.json' with {type:'json'}
export function connectNativeIndexCandidates(connection){
 const candidate=candidates.shares[connection.id]
 if(!candidate||connection.field!=='completeHoldings'||connection.actionState!=='tracked-index-needed')return connection
 return {...connection,sourceUrl:connection.sourceUrl||candidate.sourceUrls[0],
  configuredSourceUrls:[...new Set([...(connection.configuredSourceUrls||[]),...candidate.sourceUrls])],
  nextAction:candidate.requirements}
}
