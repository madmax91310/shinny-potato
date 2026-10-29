import assert from 'node:assert/strict'
export function comparisonClose(record,evidence,row){
 const value=row.monthlyClose??row.windowClose
 if(!row.splitComparison&&!row.windowSplitComparison)return value
 const p=record.splitComparisonEvidence
 assert.equal(record.isin,'IE00B3YLTY66');assert.equal(record.symbol,'IMIE.PA');assert.equal(record.mic,'XPAR');assert.equal(record.currency,'EUR');assert.equal(record.field,'adjclose')
 assert.deepEqual(p,evidence.splitComparisonEvidence)
 assert.equal(p.sourceUrl,record.splitComparisonNotice)
 assert.equal(p.sourceUrl,'https://www.ssga.com/library-content/announcement/etfs/emea/2025/en/en-spdr-i-shareholder-notice-stock-split.pdf')
 assert.equal(p.ratio,25);assert.equal(p.exDate,'2026-02-23');assert.equal(p.noticeDate,'2026-01-20');assert.match(p.sha256,/^[a-f0-9]{64}$/)
 assert.equal(p.checkedAt,record.checkedAt);assert(record.sourceUrls.includes(p.sourceUrl));assert(row.date<p.exDate)
 if(row.splitComparison){
  assert.equal(row.splitComparison.ratio,p.ratio);assert.equal(row.splitComparison.originalComparisonClose,value)
  assert.equal(row.splitComparison.sourceUrl,p.sourceUrl)
  const compared=value/p.ratio
  assert(Math.abs(compared-row.close)<=Math.max(1e-6,Math.abs(row.close)*1e-7))
  return compared
 }
 assert.equal(row.windowSplitComparison.ratio,p.ratio)
 const w=row.windowSplitComparison
 assert.equal(typeof w.normalisedClose,'boolean');assert.equal(typeof w.normalisedAdjustedClose,'boolean')
 assert(Math.abs(w.originalClose/(w.normalisedClose?p.ratio:1)-row.windowClose)<=Math.max(1e-6,Math.abs(row.windowClose)*1e-7))
 assert(Math.abs(w.originalAdjustedClose/(w.normalisedAdjustedClose?p.ratio:1)-row.value)<=Math.max(1e-6,Math.abs(row.value)*1e-6))
 return value
}
