// Fetch only price shards needed by an explicit selection or decision.
export async function loadSeries(market,ids,fetcher=fetch,base=import.meta.env.BASE_URL){
 const wanted=new Set(ids),files=new Set(market.universe.filter(a=>wanted.has(a.id)&&!market.series[a.id]&&a.seriesFile).map(a=>a.seriesFile))
 const additions={}
 for(const file of files){
  if(!/^series\/[a-f0-9]{2}\.json$/.test(file))throw Error('Chemin de série non reconnu.')
  const response=await fetcher(base+'data/ai-portfolios/'+file,{cache:'no-store'})
  if(!response.ok)throw Error('Historique indisponible : '+file+'. Relancer le rattrapage.')
  const values=await response.json()
  for(const id of wanted)if(values[id]?.qualified)additions[id]=values[id]
 }
 return additions
}
