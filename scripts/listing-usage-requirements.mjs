// Required consumers are declared before inspecting the available observations.
// Other retained venues are aliases/references, never a freshness certificate.
export function listingUsageRequirements(preferredByIsin, sources) {
 const out={};
 const add=(isin,id,use)=>{if(!isin||!id)return;const uses=(out[isin]??={})[id]??=[];if(!uses.includes(use))uses.push(use)};
 for(const [isin,row]of Object.entries(preferredByIsin))if(row)add(isin,row.evidenceId??`${isin}-${row.mic}-${row.ticker}-${row.currency}`,'preferred-display');
 for(const {registry,series}of sources)for(const row of series??[])if(row.disabled!==true&&row.enabled!==false)add(row.isin,row.listingEvidenceId,`${registry}:${row.id}`);
 return out;
}
export function requiredListingEvidence(listings, uses, classify) {
 const requiredListingIds=Object.keys(uses??{}), ids=new Set(requiredListingIds);
 const required=listings.filter(row=>ids.has(row.evidenceId));
 const missingListingIds=requiredListingIds.filter(id=>!required.some(row=>row.evidenceId===id&&row.sourceUrl&&row.checkedAt));
 // No newer venue can hide a stale, undated or invalid required quotation.
 const qualified=required.filter(row=>row.sourceUrl&&row.checkedAt);
 const ordered=[...qualified].sort((a,b)=>(classify(a)==='current')-(classify(b)==='current')||String(a.checkedAt).localeCompare(String(b.checkedAt)));
 const governing=ordered[0]??null;
 return {value:governing?{...governing,listings:required}:null,
  state:missingListingIds.length?'unqualified':governing?classify(governing):'not-applicable',
  requiredListingIds,requiredListingUses:uses??{},missingListingIds,
  retainedListingReferences:listings.filter(row=>!ids.has(row.evidenceId)).map(({evidenceId,checkedAt,sourceUrl})=>({evidenceId,checkedAt,sourceUrl}))};
}
