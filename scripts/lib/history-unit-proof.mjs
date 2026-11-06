import assert from 'node:assert/strict'
const bnke='https://www.webdisclosure.fr/press-release/lyxor-sp-500-ucits-etf-acc-etr-multi-units-luxembourg-notice-to-the-shareholders-Oftu9lO8NCy'
const six='https://www.six-group.com/fqs/charts.json?select=ValorId&where=ValorId=IE00B27YCF74USD4&netting=1440&fromdate=20260220&todate=20260331'
const near=(a,b,t=1e-10)=>assert(Math.abs(a-b)<=Math.max(1e-8,Math.abs(b)*t),`${a} != ${b}`)
export function validateHistoryUnitEvidence(record,evidence){
 if(record.splitAdjustmentNotice){
  assert.deepEqual([record.isin,record.symbol,record.mic,record.currency,record.field],['LU1829219390','BNKE.PA','XPAR','EUR','adjclose'])
  const p=record.splitAdjustmentEvidence;assert.deepEqual(p,evidence.splitAdjustmentEvidence)
  assert.deepEqual([p.isin,p.symbol,p.mic,p.currency],[record.isin,record.symbol,record.mic,record.currency]);assert.equal(p.navSourceUrl,'https://www.amundietf.fr/mapi/ProductAPI/getProductsData');assert.equal(record.splitAdjustmentNotice,bnke);assert.equal(p.sourceUrl,bnke);assert.equal(p.ratio,80);assert.equal(p.exDate,'2026-10-27');assert.equal(p.noticeDate,'2026-09-25')
  assert.match(p.sha256,/^[a-f0-9]{64}$/);assert.match(p.navSha256,/^[a-f0-9]{64}$/);assert.equal(p.checkedAt,record.checkedAt);near(p.scaleFactor,1/80)
  assert.equal(p.checks.length+p.unverifiedMonths.length,record.points.length)
  for(const c of p.checks){
   assert([1,80].includes(c.divisor));assert([1,80].includes(c.historicalMultiplier))
   if(c.date>=p.exDate)assert.equal(c.divisor,1)
   near(c.normalisedValue,c.providerValue/c.divisor);near(c.historicalClose,c.providerClose*c.historicalMultiplier)
   assert(Math.abs(c.normalisedValue/c.officialAdjustedNav-1)<=.02)
   assert(Math.abs(c.historicalClose/c.officialRawNav-1)<=.02)
   const row=evidence.proofRows.find(r=>r.date===c.date);near(row.value,c.normalisedValue);near(row.anniversaryValue,c.historicalClose);near(row.providerValue,c.providerValue)
   const point=record.points.find(([m])=>m===c.date.slice(0,7));near(point[1],c.normalisedValue,1e-6)
  }
  assert.deepEqual(record.anniversaryPriceUnitExclusions,p.checks.filter(c=>c.date<p.exDate).map(c=>c.date.slice(0,7)))
  for(const m of record.anniversaryPriceUnitExclusions)assert(record.anniversaryExcludedMonths.includes(m),'Older published consumers must also refuse cross-split anniversaries')
  for(const m of p.unverifiedMonths)assert(record.historyExcludedMonths.includes(m))
 }
 if(record.historicalQuoteRepairSource){
  assert.deepEqual([record.isin,record.symbol,record.mic,record.currency,record.field],['IE00B27YCF74','WOOD.SW','XSWX','USD','adjclose'])
  assert.equal(record.historicalQuoteRepairSource,six)
  const p=record.historicalQuoteRepairEvidence;assert.deepEqual(p,evidence.historicalQuoteRepairEvidence);assert.equal(p.checkedAt,record.checkedAt)
  assert(p.sourceUrls.includes(six));for(const h of [p.identitySha256,p.pricesSha256])assert.match(h,/^[a-f0-9]{64}$/)
  assert(['repaired','already-correct'].includes(p.status));assert.equal(p.status==='repaired',p.checks.length>0||p.monthlyChecks.some(c=>c.changed))
  assert.equal(p.monthlyChecks.length,1)
  for(const c of p.monthlyChecks){assert.equal(c.sourceSession,'2026-02-27');near(c.officialClose,c.providerClose/(c.changed?100:1),1e-7)}
  for(const c of p.checks){
   assert(['2026-02-25','2026-02-26','2026-02-27'].includes(c.date));near(c.providerClose/100,c.officialClose,1e-7)
   near(c.factor,c.providerAdjusted/c.providerClose);near(c.value,c.officialClose*c.factor)
   const row=evidence.proofRows.find(r=>r.date===c.date)
   if(row){near(row.close,c.officialClose);near(row.value,c.value)}
  }
 }
}
