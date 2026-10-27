// Stored observations only: this selection does not renew a source check.
export function newerCompatibleAum(preferred,candidate){
 if(!preferred)return candidate
 if(!candidate)return preferred
 if(preferred.scope===candidate.scope&&preferred.currency===candidate.currency&&
  ['fund','share-class'].includes(preferred.scope)&&/^\d{4}-\d{2}-\d{2}$/.test(candidate.asOf??'')&&(candidate.asOf>(preferred.asOf??'')||(candidate.asOf===preferred.asOf&&candidate.amount===preferred.amount&&(candidate.checkedAt??'')>(preferred.checkedAt??''))))return candidate
 return preferred
}
