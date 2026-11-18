import {EXPOSURE_MAX_AGE_DAYS} from '../src/pages/dca-profiles/exposure.js'

// Complete books and qualified partial books can cover more positions than an
// editorial top ten. Keep a current, wider snapshot with its original date.
export function selectDcaHoldings(complete, partial, now = new Date()) {
 const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value&&value<=now.toISOString().slice(0,10)
 // A malformed or future publication must not displace the last usable snapshot.
 if(complete&&!validDate(complete.asOf))complete=null
 if(partial&&!validDate(partial.asOf))partial=null
 const date=Date.parse(complete?.asOf), age=(Date.parse(now.toISOString().slice(0,10))-date)/86400000
 const current=Number.isFinite(age) && age>=0 && age<=EXPOSURE_MAX_AGE_DAYS
 if(current && complete.complete===true && !(partial?.complete===true && partial.asOf>complete.asOf))return complete
 // A qualified partial issuer file carries valued positions and explicit proof
 // of missing valuations. Its known positions survive a shorter editorial list.
 const widerPartial=complete?.complete===false && complete.sourcePartial===true &&
  complete.basis==='fund' && complete.scope==='known-published-security-nav-weights' &&
  complete.partialSourceProof?.kind==='partial-unvalued-source-positions' &&
  Array.isArray(complete.unvaluedPositions) && complete.unvaluedPositions.length>0 &&
  complete.unvaluedPositions.every(row=>row?.weightPct===null&&row.marketValue===null) &&
  Array.isArray(complete.rows) && Array.isArray(partial?.rows) && complete.rows.length>partial.rows.length
 if(current && widerPartial && partial.complete!==true)return complete
 return partial && (!complete || partial.asOf>complete.asOf) ? partial : complete || partial
}
