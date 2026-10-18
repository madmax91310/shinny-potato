import {INSTRUMENT_LISTINGS_BY_ISIN} from '../src/data/instrument-listings.js';
import {PEA_REVIEWS_BY_ISIN} from '../src/data/instrument-pea.js';
import {fieldDiagnostic,FIELD_TOOLS} from './lib/field-diagnostics.mjs';
import {ASSETS} from '../src/data/market-history.js';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {AUTOMATED_ETF} from '../src/data/automated-etf.js';
import {DATA_CATALOG} from '../src/data/catalog.js';
import {buildGapInventory,completeCalendarYears} from './automation-gap-inventory.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
import POLICY from '../src/data/freshness-policy.json' with {type:'json'}
// Thresholds come from the single freshness policy; never hard-code a number here.
export function freshness(key){const p=POLICY.fields[key];if(!p)throw new Error(`Unknown freshness policy: ${key}`);return {checkDays:p.checkDays,dataDays:p.dataDays}}
export function etfFreshnessKey(field){
 if(field==='monthly')return 'etf.monthly';if(field==='ter')return 'etf.ter';if(field==='performance')return 'etf.performance'
 for(const key of ['etf.staticCharacteristic','etf.characteristic'])if(POLICY.fields[key].fields.includes(field))return key
 return 'etf.default'
}
export function fieldState(value,now,{checkDays=7,dataDays=65}={}) {
 if(!value)return 'missing';
 const age=d=>(Date.parse(String(now).slice(0,10))-Date.parse(String(d).slice(0,10)))/86400000;
 if(!value.checkedAt||!Number.isFinite(age(value.checkedAt)))return 'undated-check';
 if(age(value.checkedAt)<0 || value.asOf && age(value.asOf)<0)return 'invalid-date';
 if(age(value.checkedAt)>checkDays)return 'check-overdue';
 if(value.asOf && age(value.asOf)>dataDays)return 'publication-old';
 return 'current';
}
export function buildAssetFieldReport(now=new Date().toISOString().slice(0,10)) {
 const gaps=buildGapInventory({now}), gapMap=new Map(gaps.gaps.map(r=>[`${r.id}:${r.field}`,r]));
 const monthly={...read('src/data/automated-monthly.json'),...read('src/data/automated-etf-monthly.json'),...read('src/data/non-bond-monthly-records.json')};
 for(const [id,r] of Object.entries(monthly))if(!r.isin&&ASSETS[id]?.isin)monthly[id]={...r,isin:ASSETS[id].isin};
 const completeHoldings=read('src/data/dca-complete-holdings.json'),holdingsStatus=read('src/data/dca-holdings-status.json'),metadataStatus=read('src/data/instrument-metadata-status.json');
 const holdingsSources={...read('scripts/dca-complete-holdings-sources.json'),...read('scripts/generated-holdings-sources.json')};
 const names={completeHoldings:'Positions intégrales',ter:'Frais',aum:'Encours',performance:'Performances annuelles',monthly:'Historique mensuel',countries:'Pays',sectors:'Secteurs',holdings:'Principales positions',distribution:'Distribution',domicile:'Domicile',replicationMethod:'Réplication',listings:'Cotations',pea:'Éligibilité PEA',currencyHedge:'Couverture de change'};
 const rows=[];
 const qualification=read('scripts/source-snapshots/monthly-qualification-status.json');
 for(const item of DATA_CATALOG.filter(r=>r.type==='instrument' && r.fields.find(f=>f.label==='Identité')?.value?.instrumentType!=='EQUITY')) {
  const record=AUTOMATED_ETF[item.id]??{};
  for(const field of Object.keys(names)) {
   const meta=['distribution','domicile','replicationMethod','listings','pea','currencyHedge'].includes(field);
   let value=field==='ter'||meta?record.characteristics:record[field];
   if((field==='ter'||meta)&&value)value={...value,...record.characteristicChecks?.[field==='ter'?'terPct':field]};
   if(field==='listings') {
    const listings=(INSTRUMENT_LISTINGS_BY_ISIN[item.id]??[]).filter(l=>l.evidenceId&&l.sourceUrl&&l.checkedAt);
    const oldest=[...listings].sort((a,b)=>a.checkedAt.localeCompare(b.checkedAt))[0];
    value=oldest?{...oldest,listings}:null;
   }
   if(field==='pea') {const p=PEA_REVIEWS_BY_ISIN[item.id];value=typeof p?.eligible==='boolean'&&p.sourceUrl?{...p,pea:p.eligible}:null;}
   if(field==='completeHoldings')value=completeHoldings[item.id]?.complete?{...completeHoldings[item.id],checkedAt:holdingsStatus[item.id]?.status==='validated'?holdingsStatus[item.id].checkedAt:null}:null;
   if(field==='monthly')value=Object.values(monthly).find(r=>r.isin===item.id);
   const present=field==='completeHoldings'?!!value?.rows?.length:field==='monthly'?!!value?.points?.length:field==='performance'?completeCalendarYears(item.id,value?.years,now).length>0:field==='ter'?Number.isFinite(value?.terPct):meta?(typeof value?.[field]==='boolean'||!!value?.[field]?.length):field==='aum'?Number.isFinite(value?.amount):!!value?.rows?.length;
   const gap=gapMap.get(`${item.id}:${field}`);
   const state=present?fieldState(value,now,freshness(etfFreshnessKey(field))):gap?.status??(meta?'manual':'missing');
   const observed=field==='monthly'?value?.periodEnd:field==='performance'?completeCalendarYears(item.id,value?.years,now).at(-1)?.toString():value?.asOf;
   const configured=field==='completeHoldings'?!!holdingsSources[item.id]:meta?true:field==='monthly'?!!value:true;
   const diagnostic=fieldDiagnostic({field,present,status:meta?metadataStatus[item.id]:null,gap,configured});
   rows.push({diagnostic,tools:FIELD_TOOLS[field]??['etf-sheets'],automationConfigured:configured,...(meta?{lastAttempt:metadataStatus[item.id]?.checkedAt??null}:{}),id:item.id,name:item.name,type:'instrument',field,label:names[field],state,present,checkedAt:present?value.checkedAt??null:null,asOf:observed??null,sourceUrl:present?(value.sourceUrl??value.sourceUrls?.[0]??record.sourceUrl):gap?.sourceUrl??null,reason:diagnostic.reason??gap?.reason??(field==='monthly'&&!present?(qualification[item.id]?.reason??'Cotation exacte et historique mensuel complet à qualifier automatiquement lorsqu’une cotation documentée est disponible.'):null),
     ...(field==='monthly'&&value?{currency:value.currency,periodStart:value.periodStart,periodEnd:value.periodEnd,method:value.method}:{}),
     ...(field==='performance'&&record.performance?.months?{archivedMonthlyReturns:Object.keys(record.performance.months).length}:{})});
  }
 }
 const indices=read('src/data/automated-indices.json');
 for(const [id,r] of Object.entries(indices))for(const field of ['facts','returns']) {
  const value=r[field];if(!value)continue;
  rows.push({id,type:'index',name:r.name??id,field,label:field==='facts'?'Composition indice':'Performances indice',present:true,state:fieldState({...value,checkedAt:value.checkedAt??value.source?.checkedAt??r.checkedAt},now,freshness(field==='returns'?'index.returns':'index.facts')),checkedAt:value.checkedAt??value.source?.checkedAt??r.checkedAt??null,asOf:value.asOf??null,sourceUrl:value.sourceUrl??value.source?.url??r.sourceUrl??null});
 }
 for(const [id,r] of Object.entries(monthly).filter(([,r])=>r.consumerScope!=='catalog'))rows.push({id,type:r.consumerScope==='equity'||ASSETS[id]?.instrumentType==='EQUITY'?'equity':'series',name:r.label??id,field:'monthly',label:'Historique mensuel',present:true,state:fieldState(r,now,freshness('series.monthly')),checkedAt:r.checkedAt,asOf:r.periodEnd,sourceUrl:r.sourceUrls?.[0],currency:r.currency});
 for(const type of ['scpi','insurance'])for(const r of read(`src/data/automated-${type}.json`).records)for(const field of (type==='scpi'?['annual','price','conditions','snapshot','portfolio']:['fees','access','euroFunds'])) {
  const value=r[field];rows.push({id:r.id,type,name:r.name,field,label:field,present:!!value,state:value?fieldState({...value,checkedAt:value.checkedAt??value.source?.checkedAt??r.checkedAt},now,freshness(POLICY.fields['product.annual'].fields.includes(field)?'product.annual':'product.default')):'missing',checkedAt:value?.checkedAt??r.checkedAt,asOf:value?.asOf??null,sourceUrl:value?.sourceUrl??r.sourceUrl});
 }
 const summary=Object.fromEntries(Object.keys(names).map(field=>{const values=rows.filter(r=>r.type==='instrument'&&r.field===field);return [field,{label:names[field],total:values.length,present:values.filter(r=>r.present).length,states:values.reduce((a,r)=>(a[r.state]=(a[r.state]??0)+1,a),{})}]}));
 return {checkedAt:now,summary,rows};
}
export function writeAssetFieldReport() {
 const r=buildAssetFieldReport();mkdirSync('public/data',{recursive:true});
 writeFileSync('public/data/asset-field-coverage.json',JSON.stringify(r)+'\n');
 const lines=[`# Couverture et fraîcheur des actifs — ${r.checkedAt}`,'',`Les états décrivent les observations enregistrées, pas une garantie réseau. Contrôle en retard : plus de ${POLICY.fields["etf.default"].checkDays} jours pour les champs ETF (${POLICY.fields["etf.staticCharacteristic"].checkDays} pour le domicile et la réplication, modifiés seulement par prospectus), ${POLICY.fields["series.monthly"].checkDays} pour les historiques mensuels. Seuils : src/data/freshness-policy.json. Publication ancienne : seuil distinct, adapté au champ. Les caractéristiques manuelles ne sont pas comptées comme automatiques. Les principales positions ne constituent pas un portefeuille complet.`,'', '| Champ ETF/ETP | Présent | Contrôle récent | Contrôle en retard | Publication ancienne |','|---|---:|---:|---:|---:|',...Object.values(r.summary).map(s=>`| ${s.label} | ${s.present}/${s.total} | ${s.states.current??0} | ${s.states['check-overdue']??0} | ${s.states['publication-old']??0} |`),'','Le rapport JSON détaillé est publié à `data/asset-field-coverage.json` et accessible depuis Données à revoir. Il contient chaque actif, champ, source, date de contrôle, date de publication et motif de lacune.',''];
 writeFileSync('docs/asset-field-coverage.md',lines.join('\n'));
 return r;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const r=process.argv.includes('--write')?writeAssetFieldReport():buildAssetFieldReport();console.log(JSON.stringify(r.summary,null,2));}
