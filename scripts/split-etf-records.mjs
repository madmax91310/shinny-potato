import { readFileSync } from 'node:fs';
import { compactLiteral } from './project-tool-data.mjs';

// Build-only partitioning: one source JSON stays authoritative for collection/QA.
// The modules reconstruct the same object; each data chunk has a bounded payload.
function splitRecords(filename, name, sourceRecords) {
  const records=sourceRecords??JSON.parse(readFileSync(new URL(`../src/data/${filename}`,import.meta.url),'utf8'));
  const parts=[];let part={},size=0;
  for(const [isin,record]of Object.entries(records)){
    const bytes=Buffer.byteLength(JSON.stringify({[isin]:record}));
    if(size&&size+bytes>180_000){parts.push(part);part={};size=0;}
    if(bytes>450_000)throw new Error(`${filename} record exceeds the data budget: ${isin}`);
    part[isin]=record;size+=bytes;
  }
  if(size)parts.push(part);
  const prefix=`\0${name}:`;
  return {
    groups:parts.map((_,i)=>({name:`${name}-${i}`,test:new RegExp(`${name}:${i}$`)})),
    plugin:{
      name:`partition-${name}`,apply:'build',enforce:'post',
      resolveId(id){if(id.startsWith(`virtual:${name}:`))return prefix+id.split(':').at(-1);},
      load(id){if(id.startsWith(prefix))return compactLiteral(parts[Number(id.slice(prefix.length))]);},
      transform(code,id){
        if(!id.replaceAll('\\','/').endsWith(`/src/data/${filename}`))return;
        return {code:parts.map((_,i)=>`import p${i} from 'virtual:${name}:${i}';`).join('\n')+`\nexport default Object.assign({},${parts.map((_,i)=>`p${i}`).join(',')});`,map:null};
      },
    },
  };
}
export function splitEtfRecords() { return splitRecords('automated-etf.json','etf-issuer-part') }
export function splitInstrumentMetadataRecords(records) { return splitRecords('automated-instrument-metadata.json','instrument-metadata-part',records) }
