import manifest from './holdings-manifest.json' with {type:'json'}
// Fetch data assets rather than dynamic JS modules: browsers cache failed module
// imports, making a second import fail even after connectivity returns.
const urls=import.meta.glob(['./holdings-*.json','!./holdings-manifest.json'],{query:'?url',import:'default',eager:true})
const cache=new Map()
export async function loadHoldings(assets){
 const buckets=[...new Set(assets.map(asset=>manifest[asset]).filter(n=>n!==undefined))]
 const loaded=await Promise.all(buckets.map(n=>{
  if(!cache.has(n))cache.set(n,fetch(urls[`./holdings-${n}.json`]).then(response=>{
   if(!response.ok)throw Error('Composition indisponible')
   return response.json()
  }).catch(error=>{cache.delete(n);throw error}))
  return cache.get(n)
 }))
 return Object.assign({},...loaded)
}
