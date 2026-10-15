import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {buildGapInventory} from './automation-gap-inventory.mjs';
import {AUTOMATED_ETF} from '../src/data/automated-etf.js';
import {DATA_CATALOG} from '../src/data/catalog.js';
export function annualListingReturns(record, now=new Date().toISOString().slice(0,10)) {
  if(record.field!=='adjclose'||!record.isin||!record.currency||!record.listingEvidenceId||!record.method||!record.sourceUrls?.length)return null;
  const points=record.points??[];
  if(points.some(([month,value])=>!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!Number.isFinite(value)||value<=0)||new Set(points.map(p=>p[0])).size!==points.length)return null;
  const map=new Map(points),years={};
  for(let year=Number(points[0]?.[0]?.slice(0,4))+1;year<Number(now.slice(0,4));year++) {
    if(!map.has(`${year-1}-12`)||!Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`).every(m=>map.has(m)))continue;
    const value=(map.get(`${year}-12`)/map.get(`${year-1}-12`)-1)*100;
    if(Number.isFinite(value))years[year]=value;
  }
  if(!Object.keys(years).length)return null;
  return {currency:record.currency,symbol:record.symbol,years,method:record.method,sourceUrls:record.sourceUrls,checkedAt:record.checkedAt??null,listingEvidenceId:record.listingEvidenceId};
}
export function buildCompleteness() {
  const read=p=>JSON.parse(readFileSync(new URL('../src/data/'+p,import.meta.url)));
  const monthly={...read('automated-etf-monthly.json'),...read('non-bond-monthly-records.json')};
  const report=buildGapInventory();
  return {checkedAt:report.checkedAt,fieldCoverage:report.fieldCoverage,instruments:report.instruments,
    rows:DATA_CATALOG.filter(r=>r.type==='instrument').map(row=>{
      const r=AUTOMATED_ETF[row.id]??{},p=r.performance??{};
      const gaps=report.gaps.filter(g=>g.type==='instrument'&&g.id===row.id).map(({field,status,reason,sourceUrl})=>({field,status,reason,sourceUrl}));
      return {isin:row.id,name:row.name,gaps,
        annual:{currency:p.currency??null,years:Object.fromEntries(Object.entries(p.years??{}).filter(([y,v])=>Number.isFinite(v)&&Number(y)<Number(report.checkedAt.slice(0,4))&&!gaps.some(g=>g.field==='performance'))),method:p.method??null,sourceUrl:p.sourceUrl??r.sourceUrl??null},
        observations:(p.observations??[]).filter(o=>Number.isFinite(o.value)),
        listings:Object.values(monthly).filter(m=>m.isin===row.id).map(m=>annualListingReturns(m,report.checkedAt)).filter(Boolean)};
    })};
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const report=buildCompleteness();
 writeFileSync(new URL('../src/data/etf-completeness.json',import.meta.url),JSON.stringify(report)+'\n');
 console.log(`ETF completeness: ${report.instruments} instruments; ${report.rows.filter(r=>r.listings.length).length} with calculated listing calendars.`);
}
