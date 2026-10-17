import records from './automated-instrument-metadata.json' with {type:'json'}
export function characteristicMetadata(source) {
 const fields=new Set(['distribution','domicile','replicationMethod','currencyHedge'])
 return Object.fromEntries(Object.entries(source).map(([isin,observations])=>[isin,Object.fromEntries(Object.entries(observations).filter(([field])=>fields.has(field)))]))
}
export default characteristicMetadata(records)
