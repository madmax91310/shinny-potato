import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DATA_CATALOG } from '../src/data/catalog.js';
const read = path => JSON.parse(readFileSync(new URL('../'+path, import.meta.url)));
const nonEquity = new Set(['LU0290358497','CH0454664001','DE000A27Z304','FR0013416716','GB00B15KXQ89','GB00BJYDH287','GB00BLD4ZL17','GB00BLD4ZM24','IE00B4NCWG09','IE00B4ND3602','IE00B579F325','IE00BD6FTQ80','IE00BDFL4P12','JE00B1VS3770']);
const calendarEvidence = read('scripts/recent-calendar-evidence.json');
export const recent = new Set(Object.keys(calendarEvidence.shares));
export function completeCalendarYears(id, years, now) {
  const {firstCompleteYear = 0} = calendarEligibility(id, now);
  return Object.entries(years??{}).filter(([year,value])=>/^20\d{2}$/.test(year) && Number.isFinite(value) && Number(year)>=firstCompleteYear && Number(year)<Number(now.slice(0,4))).map(([year])=>Number(year)).sort((a,b)=>a-b);
}
export function calendarEligibility(id, now) {
  const evidence = calendarEvidence.shares[id];
  if (!evidence) return {};
  const firstCompleteYear = Number(evidence.launchDate.slice(0,4)) + (evidence.launchDate.endsWith('-01-01') ? 0 : 1);
  const earliestPublicationDate = `${firstCompleteYear+1}-01-01`;
  return {launchDate:evidence.launchDate,launchSourceUrl:evidence.sourceUrl,evidenceCheckedAt:calendarEvidence.checkedAt,firstCompleteYear,earliestPublicationDate,status:now<earliestPublicationDate?'waiting-first-year':'waiting-publication'};
}
export function classifyInstrumentGap(id,field,now=new Date().toISOString().slice(0,10)) {
  if(['countries','sectors','holdings'].includes(field) && nonEquity.has(id)) return {status:'not-applicable',reason:'Pas de répartition ou de positions actions pertinente ; les allocations matières premières sont suivies séparément.'};
  if(field==='performance' && recent.has(id)) {
    const eligibility=calendarEligibility(id,now);
    return {...eligibility,reason:eligibility.status==='waiting-first-year'?`Première année civile complète : ${eligibility.firstCompleteYear}. Publication possible à partir du ${eligibility.earliestPublicationDate}, selon l’émetteur ; aucun calendrier complet ne peut encore être collecté.`:'Première année complète clôturée, mais aucun calendrier annuel qualifié dans les observations actives. Réessai par le collecteur ; aucun proxy assimilé à la part.'};
  }
  if(id==='IE00BM8R0J59') return {status:'source-conflict',reason:'Part QYLD distribuante : composition contradictoire et calendrier exact non qualifié. Fiche indisponible et historique de distributions tronqué ; voir qualification du 9 octobre.'};
  if(id==='IE000QDFFK00' && field==='countries') return {status:'unqualified',reason:'Pays de l’indice exact raccordés via la fiche Amundi ; le portefeuille BNP publie seulement des régions. Une absence indique que le complément d’indice reste à valider.'};
  return {status:'unqualified',reason:'Champ absent des observations actives ; source ou connecteur à qualifier.'};
}
export function buildGapInventory({etf=read('src/data/automated-etf.json'),indices=read('src/data/automated-indices.json'),insurance=read('src/data/automated-insurance.json').records,now=new Date().toISOString().slice(0,10)}={}) {
  const sources=['etf-pilot.json','amundi-etf.json','ssga-etf.json','additional-etf-sources.json'].flatMap(f=>read('scripts/'+f).instruments);
  const configured=new Map(sources.filter(s=>s.enabled!==false).map(s=>[s.isin,s]));
  const names={ter:'Frais',aum:'Encours',performance:'Calendrier annuel',countries:'Pays',sectors:'Secteurs',holdings:'Positions pondérées'};
  const counts=Object.fromEntries(Object.keys(names).map(k=>[k,0]));const gaps=[];const rows=DATA_CATALOG.filter(r=>r.type==='instrument');
  for(const row of rows) {
    const data=etf[row.id]??{};const source=configured.get(row.id);
    for(const field of Object.keys(names)) {
      const present=field==='ter'?Number.isFinite(data.characteristics?.terPct):field==='aum'?Number.isFinite(data.aum?.amount):field==='performance'?completeCalendarYears(row.id,data.performance?.years,now).length>0:(data[field]?.rows?.length??0)>0;
      if(present){counts[field]++;continue;}
      gaps.push({type:'instrument',id:row.id,name:row.name,field,label:names[field],configured:!!source,...classifyInstrumentGap(row.id,field,now),sourceUrl:source?.factsheetUrl??source?.sourceUrl??data.sourceUrl??null});
    }
  }
  const configs=read('scripts/index-automation.json').indices.filter(c=>c.enabled!==false);
  for(const config of configs) {
    const data=indices[config.id]??{};
    for(const field of ['constituents','countries','sectors','holdings','returns']) {
      const quarterlyCurrent=field==='holdings' && data.holdings?.rows?.length>0 && data.holdings.asOf>=data.facts?.asOf;
      const present=quarterlyCurrent || (field==='returns'?data.returns?.values?.length>0:field==='constituents'?Number.isInteger(data.facts?.constituents):data.facts?.[field]?.length>0);
      if(present)continue;
      const nonStock=['bitcoin','ethereum','gold-physical','silver-physical'].includes(config.id)&&field!=='returns';
      if (field==='holdings' && data.holdings?.rows?.length && data.holdings.asOf < data.facts?.asOf) {
        gaps.push({type:'index',id:config.id,name:config.name,field,label:'holdings · photographie mensuelle',status:'waiting-publication',reason:`Poids trimestriels officiels intégrés au ${data.holdings.asOf}, avec leur propre date. Poids individuels absents de la fiche mensuelle au ${data.facts.asOf} ; les deux photographies restent séparées.`,configured:true,sourceUrl:config.holdingsSourceUrl});
        continue;
      }
      gaps.push({type:'index',id:config.id,name:config.name,field,label:field,status:nonStock?'not-applicable':field==='holdings'&&config.id==='russell-1000'?'not-published':field==='holdings'&&config.compositionDataUrl?'access-blocked':'unqualified',reason:nonStock?'Sous-jacent sans composition actions.':field==='holdings'&&config.compositionDataUrl?'Le JSON S&P publie les poids individuels, mais les accès GitHub testés renvoient 403 ; dernier relevé conservé.':field==='holdings'?'La fiche Russell ne publie pas les poids individuels ; aucun portefeuille ETF substitué.':'Bloc absent des observations actives.',configured:true,sourceUrl:config.compositionDataUrl??config.sourceUrl??config.returnSourceUrl??null});
    }
  }
  const summary={};for(const gap of gaps)summary[`${gap.type}:${gap.status}`]=(summary[`${gap.type}:${gap.status}`]??0)+1;
  const recentCalendars=[...recent].map(id=>{
    const data=etf[id]??{};const source=configured.get(id);
    const years=completeCalendarYears(id,data.performance?.years,now);
    const eligibility=calendarEligibility(id,now);
    return {id,name:rows.find(r=>r.id===id)?.name??id,configured:!!source,...eligibility,status:years.length?'integrated':eligibility.status,firstYear:years[0]??null,years,sourceUrl:data.performance?.sourceUrl??source?.factsheetUrl??source?.sourceUrl??data.sourceUrl??null};
  });
  const insuranceGaps=insurance.flatMap(record=>record.euroFunds.flatMap(fund=>['maxAllocation','ceiling'].filter(field=>fund[field]==null && !(field==='ceiling' && fund.ceilingEvidence?.status==='unlimited')).map(field=>({id:record.id,name:record.name,fund:fund.name,field,status:field==='maxAllocation'?(fund.allocationEvidence?.status??'unqualified'):'unqualified',checkedAt:record.checkedAt,sourceUrls:fund.sourceUrls??[fund.sourceUrl],reason:field==='maxAllocation'?(fund.allocationEvidence?.reason??'Quote-part maximale absente des observations actives.'):'Plafond unique en euros non qualifié ; les bornes ou clauses conditionnelles restent dans les conditions du fonds.'}))));
  return {recentCalendars,insuranceGaps,checkedAt:now,method:'Inventaire des champs réellement présents dans les observations actives. Couverture distincte de disponibilité réseau et de fraîcheur. Les catégories sont issues des qualifications de sources ; elles ne certifient pas un téléchargement réussi aujourd’hui.',instruments:rows.length,covered:counts,summary,gaps};
}
export function writeGapInventory(report=buildGapInventory()) {
  const names={'not-applicable':'Non applicable','waiting-first-year':'Première année complète en cours ou à venir','waiting-publication':'Attente de publication','source-conflict':'Source contradictoire','not-published':'Non publié','unqualified':'À qualifier','access-blocked':'Accès bloqué'};
  const lines=[`# Champs restant à automatiser — ${report.checkedAt}`,'',report.method,'','| Champ ETF/ETP | Couverture |','|---|---:|',...Object.entries(report.covered).map(([k,v])=>`| ${k} | ${v}/${report.instruments} |`),'',`## Premiers calendriers des ${report.recentCalendars.length} parts récentes`,'', 'Contrôle quotidien par le workflow existant. Une première année complète validée est intégrée au registre actif ; le proxy de simulation reste soumis à sa propre fenêtre minimale. Une erreur de transport ou de validation conserve les observations précédentes et déclenche le signal de collecte.','', 'Les échéances ci-dessous sont des dates minimales de disponibilité, pas des promesses de publication. Les dates de lancement qualifient ce suivi opérationnel ; elles ne sont pas ajoutées aux caractéristiques statiques des produits.','', '| Part | Collecteur configuré | État | Première année complète | Publication au plus tôt | Première année intégrée |','|---|---|---|---|---|---|', ...report.recentCalendars.map(r=>`| ${r.name} (${r.id}) | ${r.configured?'Oui':'Non'} | ${r.status==='integrated'?'Intégré':names[r.status]} | ${r.firstCompleteYear} | ${r.earliestPublicationDate} | ${r.firstYear??'—'} |`),'', 'Les caractéristiques statiques et cotations sont exclues de ce chantier conformément au périmètre demandé.','', '| Type | Instrument / indice | Champ absent | Motif | Action |','|---|---|---|---|---|',...report.gaps.map(g=>`| ${g.type} | ${g.name} (${g.id}) | ${g.label} | ${names[g.status]} | ${g.reason} |`),'','Couverture : une donnée active peut être conservée malgré un accès désormais en échec. Les alertes opérationnelles restent suivies dans « Données à revoir ».',''];
  writeFileSync(new URL('../docs/automation-gaps.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  lines.push('## Conditions AV restant à qualifier','', 'Une valeur absente ne signifie pas absence de plafond. Les offres bonus, les conditions d’un autre contrat et les conditions propres à un client ne comblent pas ces champs. Les bornes publiées et clauses conditionnelles existantes sont conservées dans la présentation.','', '| Contrat | Fonds | Champ | Dernier contrôle des sources | Motif |','|---|---|---|---|---|',...report.insuranceGaps.map(g=>`| ${g.name} | ${g.fund} | ${g.field==='ceiling'?'Plafond en euros':'Quote-part maximale'} | ${g.checkedAt} | ${g.reason} |`),'');
  writeFileSync(new URL('../docs/automation-gaps.md',import.meta.url),lines.join('\n'));
  return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const report=process.argv.includes('--write')?writeGapInventory():buildGapInventory();console.log(JSON.stringify({checkedAt:report.checkedAt,instruments:report.instruments,covered:report.covered,summary:report.summary},null,2));}
