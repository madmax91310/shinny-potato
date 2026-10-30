import './test-portfolio-support-evidence.mjs'
import { spawnSync } from 'node:child_process';
// A later month must reach every shared consumer without a code change.
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const directory=mkdtempSync(join(tmpdir(),'monthly-consumers-'));
try {
  cpSync('src',join(directory,'src'),{recursive:true});
  mkdirSync(join(directory,'scripts'));
  cpSync('scripts/non-bond-expansion-sources.json',join(directory,'scripts/non-bond-expansion-sources.json'));
  cpSync('scripts/non-bond-qualified-sources.json',join(directory,'scripts/non-bond-qualified-sources.json'));
  cpSync('scripts/qualified-exposure-sources.json',join(directory,'scripts/qualified-exposure-sources.json'));
  writeFileSync(join(directory,'package.json'),'{"type":"module"}');
  const path=join(directory,'src/data/automated-monthly.json');
  const etfPath=join(directory,'src/data/automated-etf-monthly.json');
  const nonBondPath=join(directory,'src/data/non-bond-monthly-records.json');
  const nonBondRecords=JSON.parse(readFileSync(nonBondPath));
  const records={...JSON.parse(readFileSync(path)),...JSON.parse(readFileSync(etfPath)),...nonBondRecords};
  for(const record of Object.values(records)) {
    const [year,month]=record.periodEnd.split('-').map(Number);
    const next=new Date(Date.UTC(year,month,1)).toISOString().slice(0,7);
    record.points.push([next,record.points.at(-1)[1]*1.01]);
    if(record.anniversaryPoints?.length)record.anniversaryPoints.push([next,record.anniversaryPoints.at(-1)[1]*1.01]);
    record.periodEnd=next;record.checkedAt=new Date(Date.UTC(year,month+1,4)).toISOString().slice(0,10);
  }
  writeFileSync(nonBondPath,JSON.stringify(Object.fromEntries(Object.entries(records).filter(([id])=>Object.hasOwn(nonBondRecords,id)))));
  writeFileSync(path,JSON.stringify(Object.fromEntries(Object.entries(records).filter(([,record])=>record.consumerScope!=='catalog'))));
  writeFileSync(etfPath,JSON.stringify(Object.fromEntries(Object.entries(records).filter(([,record])=>record.consumerScope==='catalog'))));
  for(const file of ['bitcoin-yahoo-monthly.json','worldbank-gold-monthly.json']) {
    const filePath=join(directory,'src/data',file);const data=JSON.parse(readFileSync(filePath));
    const [year,month]=data.points.at(-1)[0].split('-').map(Number);
    data.points.push([new Date(Date.UTC(year,month,1)).toISOString().slice(0,7),data.points.at(-1)[1]*1.01]);
    writeFileSync(filePath,JSON.stringify(data));
  }
  const archivalBitcoin=JSON.parse(readFileSync('scripts/source-snapshots/calculator-monthly-2026-10-02.json')).records.bitcoin.points;
  const archivalGold=JSON.parse(readFileSync('scripts/source-snapshots/calculator-worldbank-gold-2026-10-03.json')).points;
  const archive=spawnSync(process.execPath,['--input-type=module','-e',"import assert from 'node:assert/strict'; import { ASSETS } from './src/data/market-history.js'; for(const asset of Object.values(ASSETS)) assert.equal(asset.points.at(-1).date,'2026-09');"], {cwd:directory,encoding:'utf8',env:{...process.env,MONTHLY_ARCHIVE_AUDIT:'1',MONTHLY_ARCHIVE_SERIES:JSON.stringify({bitcoin:archivalBitcoin,or:archivalGold})}});
  assert.equal(archive.status,0,archive.stderr);
  const load=path=>import(pathToFileURL(join(directory,path)));
  const { ASSETS }=await load('src/data/market-history.js');
  const { ETF_MONTHLY_HISTORIES }=await load('src/data/etf-monthly-history.js');
  const { MARKET_HISTORY_REVIEW }=await load('src/data/market-history-review.js');
  const { HISTORY_FACTS,HISTORY_STATISTIC_IDS }=await load('src/data/history-statistics.js');
  const { derive }=await load('src/pages/investment-calculator/lib.js');
  const { qualifyHistoryWindow }=await load('src/data/history-window-quality.js');
  const { computeComparativeSeries }=await load('src/pages/investment-calculator/videoExport.js');
  for(const [id,record] of Object.entries(records)) {
    if (record.consumerScope === 'catalog') {
      assert.equal(ETF_MONTHLY_HISTORIES[id].points.at(-1).date, record.periodEnd);
      assert.equal(ETF_MONTHLY_HISTORIES[id].checkedAt, record.checkedAt);
      assert(ASSETS[id], 'New month must reach the connected ETF tools');
    }
    assert.equal(ASSETS[id].points.at(-1).date,record.periodEnd);
    assert.equal(MARKET_HISTORY_REVIEW[`history:${id}`].periodEnd,record.periodEnd);
    assert.equal(MARKET_HISTORY_REVIEW[`history:${id}`].checkedAt,record.checkedAt);
    if(record.anniversaryPoints?.length)assert.equal(ASSETS[id].anniversaryPoints.at(-1).date,record.periodEnd);
    const startYm = record.periodStart > '2020-01' ? record.periodStart : '2020-01';
    const points=ASSETS[id].points.filter(p=>p.date>=startYm);
    const expected=points.reduce((n,p)=>n+100/p.price,0)*points.at(-1).price;
    const qualification=qualifyHistoryWindow(ASSETS[id],startYm,record.periodEnd)
    if (!qualification.qualified) {
      assert.throws(()=>derive({assetId:id,amountRaw:'100',startYear:Number(startYm.slice(0,4)),startMonth:Number(startYm.slice(5)),mode:'dca',overridePriceRaw:''}), {message:qualification.reason});
      continue;
    }
    const result=derive({assetId:id,amountRaw:'100',startYear:Number(startYm.slice(0,4)),startMonth:Number(startYm.slice(5)),mode:'dca',overridePriceRaw:''});
    assert.equal(result.endYm,record.periodEnd);
    if(ASSETS[id].currency==='EUR') { assert.equal(result.inflation,null,'Do not invent missing future INSEE inflation'); assert(result.livretA); }
    assert(Math.abs(result.result.finalValue-expected)<1e-6);
    assert(Math.abs(computeComparativeSeries(id,startYm,record.periodEnd,100,'dca').finalValue-expected)<1e-6);
    if(HISTORY_STATISTIC_IDS.includes(id)){
      // La période reste vérifiée dans les précisions et dans le récit, sans imposer
      // une date technique à l'accroche éditoriale.
      const facts=HISTORY_FACTS.filter(f=>f.id.endsWith(`-${id}`));
      const endLabel=new Date(`${record.periodEnd}-01T00:00:00Z`).toLocaleDateString('fr-FR',{month:'long',year:'numeric',timeZone:'UTC'});
      assert.equal(facts.length,2);
      assert(facts.every(f=>f.fact.includes(record.periodEnd) && f.context.includes(endLabel)));
    }
  }
  console.log(`${Object.keys(records).length} histories: next month propagates to simulations, video, raw anniversaries, statistics and provenance.`);
} finally { rmSync(directory,{recursive:true,force:true}); }
