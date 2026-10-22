export function decodeCatalogue(payload){
 if(payload.version!==1||!Array.isArray(payload.columns)||!Array.isArray(payload.rows))throw Error('Catalogue incompatible. Recharger la version publiée.')
 return payload.rows.map(row=>Object.fromEntries(payload.columns.flatMap((key,i)=>row[i]==null?[]:[[key,row[i]]])))
}
export async function loadCatalogue(bundle,fetcher=fetch,base=import.meta.env.BASE_URL){
 const response=await fetcher(base+'data/ai-portfolios/'+(bundle.catalogue?.url??'catalogue.json'),{cache:'no-store'})
 if(!response.ok)throw Error('Catalogue indisponible. Réessayer ; les portefeuilles publiés restent consultables.')
 const payload=await response.json()
 if(payload.asOf!==bundle.market.asOf)throw Error('Publication en cours : dates du catalogue et du tableau différentes. Recharger le dépôt.')
 const assets=decodeCatalogue(payload),retained=new Map(bundle.market.universe.map(a=>[a.id,a]))
 const ids=new Set(assets.map(a=>a.id))
 return {...bundle,market:{...bundle.market,universe:[...assets.map(a=>({...a,...retained.get(a.id)})),...bundle.market.universe.filter(a=>!ids.has(a.id))]},catalogueLoaded:true}
}
export async function loadDetails(market,ids,fetcher=fetch,base=import.meta.env.BASE_URL){
 const files=new Map()
 for(const id of ids){const bytes=new TextEncoder().encode(id),hash=await crypto.subtle.digest('SHA-256',bytes),bucket=[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('').slice(0,2);files.set(bucket,true)}
 const additions={}
 for(const bucket of files.keys()){const r=await fetcher(base+'data/ai-portfolios/details/'+bucket+'.json',{cache:'no-store'});if(!r.ok)throw Error('Preuves indisponibles. Réessayer.');const data=await r.json();for(const id of ids)if(data[id])additions[id]=data[id]}
 return additions
}
