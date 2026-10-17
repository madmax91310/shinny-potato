import METADATA from './automated-instrument-metadata.json' with {type:'json'}
// Per-field evidence prevents a successful TER check from redating a PEA or domicile value.
export function withInstrumentMetadata(isin,record) {
 const fields=METADATA[isin]
 if(!fields || !Object.keys(fields).length)return record
 const characteristics={...record.characteristics},checks={...record.characteristicChecks}
 for(const key of Object.keys(characteristics))if(!['checkedAt','asOf','sourceUrl','sha256'].includes(key)&&!checks[key])checks[key]={checkedAt:record.characteristics.checkedAt,asOf:record.characteristics.asOf,sourceUrl:record.characteristics.sourceUrl??record.sourceUrl}
 for(const [field,observation] of Object.entries(fields)) {
  if(!observation.checkedAt||!observation.sourceUrl||!observation.sha256)continue
  if(observation.checkedAt<(checks[field]?.checkedAt??''))continue
  characteristics[field]=observation.value
  checks[field]={checkedAt:observation.checkedAt,sourceUrl:observation.sourceUrl,sha256:observation.sha256}
  if(observation.checkedAt>(characteristics.checkedAt??''))characteristics.checkedAt=observation.checkedAt
  characteristics.sourceUrl??=observation.sourceUrl
 }
 return {...record,characteristics,characteristicChecks:checks}
}
