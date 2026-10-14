import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { TOOLS } from '../src/tools.js';
import { DATA_CATALOG } from '../src/data/catalog.js';
import { buildGapInventory } from './automation-gap-inventory.mjs';
const app=readFileSync('src/App.jsx','utf8');
const elements=app.split('const TOOL_ELEMENTS = {')[1]?.split('\n}')[0]??'';
const formats=app.split('const FORMAT_COMPONENTS = {')[1]?.split('\n}')[0]??'';
const seen=new Set();
for(const tool of TOOLS){
  if(seen.has(tool.to)) throw Error(`Duplicate route: ${tool.to}`);
  seen.add(tool.to);
  if(tool.format ? !formats.includes(`'${tool.format}':`) : !elements.includes(`'${tool.to}':`)) throw Error(`Tool without implementation: ${tool.to}`);
}
for(const [,module] of app.matchAll(/import\('([^']+)'\)/g)){
  if(![module,module+'.jsx',module+'.js'].some(p=>existsSync('src/'+p)))throw Error(`Missing lazy module: ${module}`);
}
const counts={};for(const row of DATA_CATALOG) counts[row.type]=(counts[row.type]??0)+1;
const gaps=buildGapInventory();
const text=['# Inventaire automatique de l’application','',
'Généré depuis les routes, le catalogue et les observations actives. Régénéré à chaque build ; copie versionnée renouvelée par la collecte ETF quotidienne. Les effectifs ne certifient ni la fraîcheur ni la disponibilité de chaque champ.','',
'## Outils accessibles','', '| Outil | Route |','|---|---|',...TOOLS.map(t=>`| ${t.title} | ${t.to} |`),'',
'## Catalogue','', '| Type | Nombre |','|---|---:|',...Object.entries(counts).sort().map(([k,v])=>`| ${k} | ${v} |`),'',
'## Champs des instruments','', '| Champ | Présents / instruments |','|---|---:|',...Object.entries(gaps.covered).map(([k,v])=>`| ${k} | ${v}/${gaps.instruments} |`),'',
'Les raisons des absences figurent dans [l’inventaire des lacunes](automation-gaps.md).','',
'## Moteurs internes et compatibilité','',
'- Comparateur d’indices (`src/pages/index-comparator/`) : moteur et tests conservés, aucune route publique déclarée. Ne pas le présenter comme un outil accessible ; une réouverture exige une décision produit.',
'- `/tweet-midi` : route de compatibilité conservée ; les formats disposent des routes dédiées ci-dessus.',
'- `/presentation-assurance-vie` et `/presentation-scpi` : redirections vers Présentations.',''].join('\n');
const output='docs/app-inventory.md';
if(process.argv.includes('--check')){
 if(!existsSync(output)||readFileSync(output,'utf8')!==text)throw Error('Inventaire obsolète : npm run inventory');
}else writeFileSync(output,text);
console.log(`Inventory: ${TOOLS.length} routes, ${DATA_CATALOG.length} records; implementations verified.`);
