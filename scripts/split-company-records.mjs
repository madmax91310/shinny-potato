import { readFileSync } from 'node:fs'
import { peerRecord } from '../src/data/company-peers.js'

// Immutable chunks per company keep full dossiers out of the initial route.
export function splitCompanyRecords() {
  const data=JSON.parse(readFileSync(new URL('../src/data/company-analysis.json',import.meta.url),'utf8'))
  const profiles=JSON.parse(readFileSync(new URL('../src/data/company-profiles.json',import.meta.url),'utf8')).filter(p=>!p.candidateOnly)
  const records=Object.fromEntries(profiles.map(p=>[p.id,{...p,...data.companies[p.id]}]))
  const prefix='\0company-dossier:',registry='virtual:company-dossiers'
  return {groups:[],plugin:{
    name:'company-dossiers',enforce:'post',
    resolveId(id){if(id===registry)return '\0'+registry;if(id.startsWith('virtual:company-dossier:'))return prefix+id.split(':').at(-1)},
    load(id){
      if(id==='\0'+registry)return `export const profiles=${JSON.stringify(profiles.map(({id,name,symbol})=>({id,name,symbol})))};\nconst loaders={${profiles.map(p=>`${JSON.stringify(p.id)}:()=>import(${JSON.stringify('virtual:company-dossier:'+p.id)})`).join(',')}};\nexport async function loadCompany(id){if(!loaders[id])throw Error('Unknown company');return (await loaders[id]()).default}`
      if(id.startsWith(prefix)){
        const record=records[id.slice(prefix.length)];if(!record)throw Error('Unknown dossier')
        const json=JSON.stringify(record);if(Buffer.byteLength(json)>450_000)throw Error('Company observation too large')
        return `export default ${json}`
      }
    },
    transform(code,id){
      if(!id.replaceAll('\\','/').endsWith('/src/data/company-peers.js'))return
      return {code:`export const COMPANY_PEERS=${JSON.stringify(Object.values(records).map(peerRecord))};`,map:null}
    },
  }}
}
