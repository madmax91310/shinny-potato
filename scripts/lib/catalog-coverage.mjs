import {coverageKey} from './data-qualification.mjs'
import {monthlyFingerprint} from './monthly-certificate.mjs'

// Bind a catalogue facade to the qualified observation it actually exposes.
// Labels, file schedules and an ISIN alone cannot certify another convention.
export function catalogCoverage(field,record,coverageMap,etfs){
 const key=coverageKey(field,record)
 let candidate=key?coverageMap.get(`${record.id.replace(/^(history|insurance|scpi|index):/,'')}:${key}`):null
 if(record.type==='series'&&record.id.startsWith('history:')){
  const value=field.value,evidence=field.metadata??{}
  if(field.registry!=='src/data/market-history.js'||field.label!=='Série historique'||!value?.points?.length)return null
  candidate=candidate??(value.isin?coverageMap.get(`${value.isin}:monthly`):null)
  const sources=new Set(evidence.sourceUrls??[])
  const method=value.method??evidence.method,periodStart=value.periodStart??evidence.periodStart,periodEnd=value.periodEnd??evidence.periodEnd
  if(!candidate||candidate.currency!==value.currency||candidate.method!==method
      ||candidate.periodStart!==periodStart||candidate.periodEnd!==periodEnd
      ||![candidate.sourceUrl,...(candidate.sourceUrls??[])].some(url=>sources.has(url))
      ||Object.hasOwn(candidate,'seriesFingerprint')&&(!candidate.seriesFingerprint||candidate.seriesFingerprint!==monthlyFingerprint({...value,method})))return null
  return candidate
 }
 if(candidate)return candidate
 const years=/^Rendements (\d{4})–(\d{4})$/.exec(field.label)
 if(record.type!=='instrument'||!years||!['src/data/instrument-returns.js','src/data/automated-etf.js'].includes(field.registry))return null
 const start=Number(years[1]),end=Number(years[2]),values=field.value,source=etfs[record.id]?.performance
 if(!source?.years||!Array.isArray(values)||end<start||values.length!==end-start+1
     ||!source.currency||field.metadata?.currency!==source.currency||!values.some(Number.isFinite))return null
 // Catalogue returns may be rounded to two decimals. Every displayed finite
 // year must match the same exact share's qualified NAV calendar observation.
 if(values.some((value,i)=>value!=null&&(!Number.isFinite(value)
      ||!Number.isFinite(source.years[start+i])||Math.abs(value-source.years[start+i])>.005000001)))return null
 return coverageMap.get(`${record.id}:performance`)??null
}
