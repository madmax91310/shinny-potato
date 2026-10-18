import METADATA from './automated-instrument-metadata.json' with {type:'json'}
import previous from './qualified-listing-records.json' with {type:'json'}
import LISTING_HOSTS from '../../scripts/listing-source-hosts.json' with {type:'json'}
// A listing read in a third-party mirror is never registry evidence, even if a collector recorded it.
const ACCEPTED_HOSTS=new Set(LISTING_HOSTS.hosts)
const officialListingSource=row=>{try{const url=new URL(row.sourceUrl);return url.protocol==='https:'&&ACCEPTED_HOSTS.has(url.hostname)}catch{return false}}
const records=Object.fromEntries([...new Set([...Object.keys(previous),...Object.keys(METADATA)])].map(isin=>[isin,[...[...(previous[isin]??[]),...(METADATA[isin]?.listings?.value??[]).filter(officialListingSource)].reduce((map,r)=>{const key=`${r.mic}/${r.ticker}/${r.currency}`;if(!map.has(key)||r.checkedAt>=map.get(key).checkedAt)map.set(key,r);return map},new Map()).values()]]).filter(([,rows])=>rows.length))
export const REFRESHED_LISTINGS = records
export const REFRESHED_LISTING_EVIDENCE = Object.fromEntries(Object.entries(records).flatMap(([isin,rows])=>rows.map(row=>[row.evidenceId,{
 isin,identityEvidence:isin,sourceUrl:row.sourceUrl,checkedAt:row.checkedAt,excerpt:row.excerpt,pageSha256:row.sha256,
}])))
