// Historical issuer evidence remains archived, but a refreshed official listing
// set may legitimately retire an old exchange/ticker. New evidence is never filtered.
export function currentListingEvidence(archive,current,managedListings,listings){
 const active=new Set(Object.values(listings).flat().map(row=>row.evidenceId))
 const managed=new Set(Object.keys(managedListings))
 return {...Object.fromEntries(Object.entries(archive).filter(([id,proof])=>!managed.has(proof.isin)||active.has(id))),...current}
}
