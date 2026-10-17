import records from './qualified-listing-records.json' with {type:'json'}
export const REFRESHED_LISTINGS = records
export const REFRESHED_LISTING_EVIDENCE = Object.fromEntries(Object.entries(records).flatMap(([isin,rows])=>rows.map(row=>[row.evidenceId,{
 isin,identityEvidence:isin,sourceUrl:row.sourceUrl,checkedAt:row.checkedAt,excerpt:row.excerpt,pageSha256:row.sha256,
}])))
