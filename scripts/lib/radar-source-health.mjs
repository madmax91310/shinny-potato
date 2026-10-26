// One ordinary retry of the same public URL for transport/server failures only.
// Access denials and challenge pages never trigger alternate headers or routes.
export function sourceFailureKind(error) {
  const message=error?.message??String(error)
  if (/HTTP (?:401|403|429)\b|anti-robot|captcha|Access Denied|Accès refusé|vérification de sécurité/i.test(message)) return 'access-denied'
  if (/HTTP (?:408|425|500|502|503|504)\b|fetch failed|timeout|timed out|aborted|ECONNRESET|EAI_AGAIN|ENOTFOUND/i.test(message)) return 'temporary-unavailable'
  if (/format modifié|format de liste|contrat.*modifié|extraction vide|liste officielle vide|non extractible|absen[ct]|introuvable/i.test(message)) return 'structure-changed'
  return 'processing-error'
}
export async function requestRadarSource(request,url,options,onAttempt=()=>{}) {
  for(let attempt=0;attempt<2;attempt++) {
    onAttempt()
    try {
      const response=await request(url,options)
      if(attempt===0 && [408,425,500,502,503,504].includes(response.status)) {await response.body?.cancel();continue}
      return response
    } catch(error) {
      // An aborted signal cannot be reused. Leave timeouts to the next scheduled pass.
      if(attempt || options?.signal?.aborted || sourceFailureKind(error)!=='temporary-unavailable')throw error
    }
  }
}

export function assertRadarAccess(content) {
  if (content.length<100000 && /Request Rejected|Access Denied|Incapsula incident|Vérification de sécurité|Please enable JavaScript to view the page content|class=["']captcha-container/i.test(content)) throw Error('Accès refusé ou page anti-robot, même si HTTP 200')
}
