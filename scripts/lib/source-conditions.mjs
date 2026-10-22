import CONDITIONS from '../../src/data/data-source-conditions.json' with {type:'json'}
export function sourceConditions(url) {
  let host
  try { host=new URL(url).hostname } catch { return {host:null,reuseStatus:'unverified',license:null,reviewStatus:'URL invalide ou absente'} }
  const dataset=CONDITIONS.datasets.find(source=>source.urls.includes(url))
  if(dataset)return {...dataset,host}
  return CONDITIONS.sources.find(source=>source.host===host)??{host,reuseStatus:'unverified',license:null,reviewStatus:'Source non encore documentée dans le registre des conditions'}
}
