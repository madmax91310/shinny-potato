import METADATA from './automated-instrument-metadata.json' with {type:'json'}
import previous from './qualified-listing-records.json' with {type:'json'}
const records=Object.fromEntries([...new Set([...Object.keys(previous),...Object.keys(METADATA)])].map(isin=>[isin,[...[...(previous[isin]??[]),...(METADATA[isin]?.listings?.value??[])].reduce((map,r)=>{const key=`${r.mic}/${r.ticker}/${r.currency}`;if(!map.has(key)||r.checkedAt>=map.get(key).checkedAt)map.set(key,r);return map},new Map()).values()]]).filter(([,rows])=>rows.length))
export const REFRESHED_LISTINGS = records
export const REFRESHED_LISTING_EVIDENCE = Object.fromEntries(Object.entries(records).flatMap(([isin,rows])=>rows.map(row=>[row.evidenceId,{
 isin,identityEvidence:isin,sourceUrl:row.sourceUrl,checkedAt:row.checkedAt,excerpt:row.excerpt,pageSha256:row.sha256,
}])))
