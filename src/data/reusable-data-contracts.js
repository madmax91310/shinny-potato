// Only explicit fee slots in reusable product guides are live. Historical posts,
// personal figures and hypothetical examples retain their authored numbers.
export function resolveGuideFees(tweet, records) {
  if (!String(tweet.id).startsWith('guide:')) return tweet
  const fields=[]
  const text=tweet.text.replace(/\b([A-Z]{2}[A-Z0-9]{9}\d)\b([\s\S]*?)(?=\b[A-Z]{2}[A-Z0-9]{9}\d\b|$)/g,(segment,isin,tail)=>{
    const r=records[isin],fee=r?.characteristics?.terPct
    if(!Number.isFinite(fee))return segment
    const checkedAt=r.characteristicChecks?.terPct?.checkedAt??r.characteristics?.checkedAt
    const sourceUrl=r.characteristicChecks?.terPct?.sourceUrl??r.characteristics?.sourceUrl??r.sourceUrl
    if(!checkedAt||!sourceUrl)return segment
    const pattern=/(💸\s*(?:(?:Frais annuels|TER|Gestion)\s*:\s*)?)(\d+(?:[,.]\d+)?)\s*%/
    if(!pattern.test(tail))return segment
    fields.push({isin,field:'terPct',checkedAt,sourceUrl})
    let updated=tail.replace(pattern,(_match,prefix)=>prefix+fee.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' %')
    const swap=r.characteristics?.annualSwapRatePct,swapProof=r.characteristicChecks?.annualSwapRatePct
    const swapSlot=/(💸[^\n]*?\+\s*swap\s*:\s*)(\d+(?:[,.]\d+)?)\s*%/
    if(Number.isFinite(swap)&&swapProof?.checkedAt&&swapProof?.sourceUrl&&swapSlot.test(updated)){
      updated=updated.replace(swapSlot,(_match,prefix)=>prefix+swap.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' %')
      fields.push({isin,field:'annualSwapRatePct',checkedAt:swapProof.checkedAt,sourceUrl:swapProof.sourceUrl})
    }
    return isin+updated
  })
  return {...tweet,text,dataContract:{kind:'live-guide',fields,remaining:'Autres chiffres et rédaction soumis à la revue éditoriale existante.'}}
}
export function reusableContract(item,{derived=false}={}) {
  if(item.dataContract)return item.dataContract
  if(derived)return {kind:'derived-history',fields:['monthly-history','currency','period'],remaining:null}
  if(String(item.id).startsWith('simulation:'))return {kind:'hypothesis',fields:[],remaining:'Hypothèses et résultat arithmétique à conserver avec leur scénario.'}
  return {kind:'archive-or-editorial',fields:[],remaining:'Chiffres historiques, personnels et assertions générales conservés ; vérification éditoriale avant réemploi.'}
}
