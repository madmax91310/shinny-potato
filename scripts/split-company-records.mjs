import { readFileSync } from 'node:fs'

// Keep collection evidence intact on disk; do not ship unqualified candidates
// to the browser. Partition the active observations without changing values.
export function splitCompanyRecords() {
  const data=JSON.parse(readFileSync(new URL('../src/data/company-analysis.json',import.meta.url),'utf8'))
  const profiles=JSON.parse(readFileSync(new URL('../src/data/company-profiles.json',import.meta.url),'utf8'))
  const active=new Set(profiles.filter(p=>!p.candidateOnly).map(p=>p.id))
  const parts=[];let part={},size=0
  for(const [id,record] of Object.entries(data.companies)) {
    if(!active.has(id))continue
    const bytes=Buffer.byteLength(JSON.stringify(record))
    if(bytes>450_000)throw Error(`Company observation too large: ${id}`)
    if(size&&size+bytes>160_000){parts.push(part);part={};size=0}
    part[id]=record;size+=bytes
  }
  if(size)parts.push(part)
  const prefix='\0company-observation-part:'
  return {groups:parts.map((_,i)=>({name:`company-observation-part-${i}`,test:new RegExp(`company-observation-part:${i}$`),priority:120})),plugin:{
    name:'partition-company-observations',apply:'build',enforce:'post',
    resolveId(id){if(id.startsWith('virtual:company-observation-part:'))return prefix+id.split(':').at(-1)},
    load(id){if(id.startsWith(prefix))return `export default ${JSON.stringify(parts[Number(id.slice(prefix.length))])}`},
    transform(code,id){
      if(!id.replaceAll('\\','/').endsWith('/src/data/company-analysis.json'))return
      return {code:parts.map((_,i)=>`import p${i} from 'virtual:company-observation-part:${i}';`).join('\n')+`\nexport default {schemaVersion:${JSON.stringify(data.schemaVersion)},companies:Object.assign({},${parts.map((_,i)=>`p${i}`).join(',')})};`,map:null}
    },
  }}
}
