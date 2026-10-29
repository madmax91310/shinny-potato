import assert from 'node:assert/strict'
import {comparisonClose}from './lib/split-comparison-proof.mjs'
const url='https://www.ssga.com/library-content/announcement/etfs/emea/2025/en/en-spdr-i-shareholder-notice-stock-split.pdf'
const notice={sourceUrl:url,ratio:25,exDate:'2026-02-23',noticeDate:'2026-01-20',checkedAt:'2026-10-29',sha256:'a'.repeat(64)}
const record={isin:'IE00B3YLTY66',symbol:'IMIE.PA',mic:'XPAR',currency:'EUR',field:'adjclose',checkedAt:'2026-10-29',sourceUrls:[url],splitComparisonNotice:url,splitComparisonEvidence:notice}
const evidence={splitComparisonEvidence:notice},row={date:'2014-12-31',close:3.3276,value:3.3276,monthlyClose:83.19,splitComparison:{originalComparisonClose:83.19,ratio:25,sourceUrl:url}}
assert.equal(comparisonClose(record,evidence,row),3.3276)
assert.equal(comparisonClose(record,evidence,{date:'2026-03-31',close:9.771,monthlyClose:9.771}),9.771)
for(const [key,value]of [['isin','IE000OTHER00'],['symbol','IMIE.MI'],['mic','ETFP'],['currency','USD'],['field','close'],['checkedAt','2026-10-30']])assert.throws(()=>comparisonClose({...record,[key]:value},evidence,row))
for(const changed of [{...row,date:'2026-02-23'},{...row,monthlyClose:3.3276},{...row,close:3.32},{...row,splitComparison:{...row.splitComparison,ratio:24}}])assert.throws(()=>comparisonClose(record,evidence,changed))
for(const changed of [{...notice,exDate:'2026-02-24'},{...notice,ratio:24},{...notice,sourceUrl:'https://other.example/notice'}])assert.throws(()=>comparisonClose({...record,splitComparisonEvidence:changed},{splitComparisonEvidence:changed},row))
console.log('Split comparison: exact identity, official bounds, raw evidence, no double adjustment and unrelated periods preserved.')
