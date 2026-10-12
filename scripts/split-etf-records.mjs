import { readFileSync } from 'node:fs';

// Build-only partitioning: one source JSON stays authoritative for collection/QA.
// The modules reconstruct the same object; each data chunk has a bounded payload.
export function splitEtfRecords() {
  const records=JSON.parse(readFileSync(new URL('../src/data/automated-etf.json',import.meta.url),'utf8'));
  const parts=[];let part={},size=0;
  for(const [isin,record]of Object.entries(records)){
    const bytes=Buffer.byteLength(JSON.stringify({[isin]:record}));
    if(size&&size+bytes>180_000){parts.push(part);part={};size=0;}
    if(bytes>450_000)throw new Error(`ETF record exceeds the data budget: ${isin}`);
    part[isin]=record;size+=bytes;
  }
  if(size)parts.push(part);
  const prefix='\0etf-issuer-part:';
  return {
    groups:parts.map((_,i)=>({name:`etf-issuer-part-${i}`,test:new RegExp(`etf-issuer-part:${i}$`)})),
    plugin:{
      name:'partition-issuer-records',apply:'build',enforce:'post',
      resolveId(id){if(id.startsWith('virtual:etf-issuer-part:'))return prefix+id.split(':').at(-1);},
      load(id){if(id.startsWith(prefix))return `export default ${JSON.stringify(parts[Number(id.slice(prefix.length))])}`;},
      transform(code,id){
        if(!id.replaceAll('\\','/').endsWith('/src/data/automated-etf.json'))return;
        return {code:parts.map((_,i)=>`import p${i} from 'virtual:etf-issuer-part:${i}';`).join('\n')+`\nexport default Object.assign({},${parts.map((_,i)=>`p${i}`).join(',')});`,map:null};
      },
    },
  };
}
