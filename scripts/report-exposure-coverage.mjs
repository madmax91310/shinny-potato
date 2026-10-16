// Recomputed after every exposure build, including scheduled issuer refreshes.
import {writeFileSync} from 'node:fs'
import {references} from '../src/pages/dca-profiles/engine.js'
import {ASSETS} from '../src/pages/dca-profiles/data.js'
import {publishedExposure,exposureView} from '../src/pages/dca-profiles/exposure.js'
const now=new Date(),seen=new Set(),rows=[]
for(const asset of Object.keys(ASSETS)){
 const r=references[asset],identity=r?.isin||asset
 if(seen.has(identity))continue
 seen.add(identity)
 const line={asset,isin:r?.isin,weight:100,label:r?.name||ASSETS[asset][1]}
 const fields=Object.fromEntries(['countries','sectors'].map(field=>{
  const e=publishedExposure([line],references,field,now),v=exposureView(e)
  return [field,{coverage:v.eligible?v.coverage/v.eligible*100:0,eligible:v.eligible,outside:e.neutralWeight===100,missing:v.portfolioMissing,reasons:v.omitted.map(o=>o.reason),asOf:v.group?.asOf||null}]
 }))
 rows.push({asset,isin:r?.isin||null,name:line.label,kind:r?.kind||null,provider:r?.provider||null,...fields})
}
const outside=rows.filter(r=>r.countries.outside&&r.sectors.outside)
const gaps=rows.filter(r=>!r.countries.outside&&(r.countries.coverage<99.5||r.sectors.coverage<99.5))
gaps.sort((a,b)=>(a.countries.coverage+a.sectors.coverage)-(b.countries.coverage+b.sectors.coverage)||a.name.localeCompare(b.name))
const report={checkedAt:now.toISOString(),total:rows.length,outside:outside.length,complete:rows.length-outside.length-gaps.length,gaps,outsideAssets:outside}
writeFileSync(new URL('../docs/exposure-coverage.json',import.meta.url),JSON.stringify(report,null,2)+'\n')
const safe=s=>String(s).replaceAll('|','/').replaceAll('\n',' ')
writeFileSync(new URL('../docs/exposure-coverage.md',import.meta.url),`# Couverture des expositions\n\nContrôle automatique : ${report.checkedAt}.\n\n${report.total} actifs distincts ; ${report.complete} avec au moins 99,5 % de pays et secteurs ; ${report.outside} hors classification ; ${gaps.length} à compléter. Les alias d’un même ISIN sont comptés une fois.\n\nLes actifs hors classification ne sont pas des lacunes. Une date expirée, une table partielle ou une source absente reste un manque ; aucun proxy n’est ajouté. Les collectes officielles existantes sont réutilisées à chaque actualisation.\n\n| Actif | ISIN | Pays | Secteurs | Motifs |\n|---|---|---:|---:|---|\n`+gaps.map(r=>`| ${safe(r.name)} | ${r.isin||'—'} | ${r.countries.coverage.toFixed(2)} % | ${r.sectors.coverage.toFixed(2)} % | ${safe([...new Set([...r.countries.reasons,...r.sectors.reasons])].join(', ')||'Table partielle')} |`).join('\n')+'\n')
console.log(`Exposure coverage: ${report.complete}/${report.total} complete, ${report.outside} outside classification, ${gaps.length} gaps (docs/exposure-coverage.md).`)
