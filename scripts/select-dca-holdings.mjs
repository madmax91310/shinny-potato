import {EXPOSURE_MAX_AGE_DAYS} from '../src/pages/dca-profiles/exposure.js'

// Complete compositions and editorial top tens have different scopes. A newer
// top ten must not erase a complete, still-current observation or re-date it.
export function selectDcaHoldings(complete, partial, now = new Date()) {
 const date=Date.parse(complete?.asOf), age=(Date.parse(now.toISOString().slice(0,10))-date)/86400000
 const current=complete?.complete===true && Number.isFinite(age) && age>=0 && age<=EXPOSURE_MAX_AGE_DAYS
 if(current && !(partial?.complete===true && partial.asOf>complete.asOf))return complete
 return partial && (!complete || partial.asOf>complete.asOf) ? partial : complete || partial
}
