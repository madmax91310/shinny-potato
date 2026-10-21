import {TOOLS} from '../../src/tools.js'

const ROUTES={
 'etf-sheets':'/fiches-etf','practical-sheets':'/fiches-pratiques','investment-calculator':'/calculateur-investissement',
 'performance-rankings':'/classements-performances','portfolio-generator':'/generateur-portefeuilles','portfolio-duels':'/duels-portefeuilles',
 'dca-profiles':'/le-dca-de',
}
const OPTIONAL=new Set(['excluded','reference','not-required'])
export function consumerUsage(assets){
 const tools=new Map(),unmapped=[]
 for(const asset of assets)for(const field of asset.fields){
  const paths=new Set((field.consumers??[]).map(c=>typeof c==='string'?(ROUTES[c]??c):c.path))
  for(const path of paths){
   const tool=TOOLS.find(t=>t.to===path?.split('?')[0])
   if(!tool){unmapped.push({asset:asset.id,field:field.label,consumer:path??null});continue}
   if(!tools.has(tool.to))tools.set(tool.to,{path:tool.to,name:tool.title,rows:[]})
   tools.get(tool.to).rows.push({id:asset.id,key:field.key,state:field.state,required:!OPTIONAL.has(field.state)})
  }
 }
 const rows=[...tools.values()].map(tool=>{
  const required=tool.rows.filter(r=>r.required)
  return {...tool,assets:new Set(tool.rows.map(r=>r.id)).size,required:required.length,
   connected:required.filter(r=>r.state==='connected').length,
   blocked:required.filter(r=>r.state==='blocked').length,
   unconfirmed:required.filter(r=>['qualification-needed','scheduled-evidence'].includes(r.state)).length}
 }).sort((a,b)=>a.name.localeCompare(b.name,'fr'))
 return {schemaVersion:1,method:'Usages déclarés par champ dans les registres et contrats de couverture. Une collecte programmée reste à confirmer par ses observations et son résultat de publication ; aucune date de génération ne renouvelle les preuves.',tools:rows,unmapped,
  summary:{tools:rows.length,usages:rows.reduce((n,t)=>n+t.rows.length,0),required:rows.reduce((n,t)=>n+t.required,0),connected:rows.reduce((n,t)=>n+t.connected,0),blocked:rows.reduce((n,t)=>n+t.blocked,0),unconfirmed:rows.reduce((n,t)=>n+t.unconfirmed,0),unmapped:unmapped.length}}
}
