// Common identity proof, independent from any deleted competition or daily price catalogue.
import RECORDS from '../src/data/shared-listing-identities.json' with {type:'json'}
export const sharedListingIdentities=RECORDS.listings
const byId=new Map(sharedListingIdentities.map(row=>[row.id,row]))
export function ordinaryListing(id,expected){
 const row=byId.get(id)
 return matchesOrdinaryListing(row,expected)?row:null
}
export function matchesOrdinaryListing(row,expected){
 // Used to check changed source rows before they could enter the common registry.
 return !!row&&row.instrumentType==='EQUITY'&&row.shareType==='ordinary'&&!!row.sourceUrl&&!!row.sourceAsOf
  &&row.symbol===expected.symbol&&row.currency===expected.currency&&(!row.isin||row.isin===expected.isin)
  &&(!expected.shareClass||row.shareClass===expected.shareClass)&&(!expected.companyId||row.companyId===expected.companyId)
}
