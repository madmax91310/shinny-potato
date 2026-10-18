// Historical issuer evidence remains archived, but a refreshed official listing
// set may legitimately retire an old exchange/ticker. New evidence is never filtered.
export function currentListingEvidence(archive,current,managedListings,listings){
 const active=new Set(Object.values(listings).flat().map(row=>row.evidenceId))
 const managed=new Set(Object.keys(managedListings))
 const retained=Object.fromEntries(Object.entries(archive).filter(([id,proof])=>!managed.has(proof.isin)||active.has(id)))
 // Select evidence by the same observation date as the listing registry.
 // A slower collector must not replace a newer issuer proof with an older one.
 for(const source of [retained,...(Array.isArray(current)?current:[current])]){
  for(const [id,proof] of Object.entries(source)){
   if(!retained[id]||proof.checkedAt>=retained[id].checkedAt)retained[id]=proof
  }
 }
 return retained
}
