import manifest from './holdings-manifest.json' with {type:'json'}
const chunks=import.meta.glob(['./holdings-*.json','!./holdings-manifest.json'],{import:'default'})
export async function loadHoldings(assets){
 const buckets=[...new Set(assets.map(asset=>manifest[asset]).filter(n=>n!==undefined))]
 const loaded=await Promise.all(buckets.map(n=>chunks[`./holdings-${n}.json`]()))
 return Object.assign({},...loaded)
}
