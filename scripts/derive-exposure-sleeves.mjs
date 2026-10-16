// Chart-only look-through. The shared fund-NAV observations retain their original scope.
export function deriveExposureSleeves(records,indexRecords,supplementary,now=new Date()){
 const out=structuredClone(supplementary),fresh=o=>o?.asOf&&o.sourceUrl&&(now-Date.parse(o.asOf))/86400000>=0&&(now-Date.parse(o.asOf))/86400000<=93
 for(const [isin,r]of Object.entries(records)){
  if(!r.assetAllocation||!r.holdings)continue
  const allocation=r.assetAllocation,share=allocation.rows.find(x=>x.name==='Actions')?.weightPct
  if(!fresh(allocation)||!fresh(r.holdings)||!Number.isFinite(share)||share<0||share>100)continue
  const equities=r.holdings.rows.filter(h=>/Vanguard (?:FTSE |S&P 500 UCITS ETF)/.test(h.name))
  const total=equities.reduce((s,h)=>s+h.weightPct,0)
  if(!total||Math.abs(total-share)>1)continue // only published rounding tolerances
  const sleeve={weightPct:share,asOf:allocation.asOf,sourceUrl:allocation.sourceUrl,method:'Published equity asset allocation; underlying equity funds weighted from the dated Vanguard holdings table'}
  out[isin]={equitySleeve:sleeve}
  for(const field of ['countries','sectors']){
   const weights=new Map(),dates=[allocation.asOf,r.holdings.asOf],sources=new Set([allocation.sourceUrl,r.holdings.sourceUrl])
   for(const h of equities){
    // Match exact published fund name, including accumulation class. Never a benchmark proxy.
    const match=Object.values(records).find(x=>x.name===h.name||x.characteristics?.name===h.name)
       ||Object.entries(records).find(([key])=>({'Vanguard FTSE North America UCITS ETF':'IE00BKX55R35','Vanguard FTSE Japan UCITS ETF (USD) Accumulating':'IE00BFMXYX26','Vanguard FTSE Developed Asia Pacific ex Japan UCITS ETF (USD) Accumulating':'IE00BK5BQZ41','Vanguard FTSE Developed Europe UCITS ETF (EUR) Accumulating':'IE00BK5BQX27','Vanguard S&P 500 UCITS ETF (USD) Accumulating':'IE00BFMXXD54','Vanguard FTSE All-World UCITS ETF (USD) Accumulating':'IE00BK5BQT80','Vanguard FTSE Developed World UCITS ETF (USD) Accumulating':'IE00BK5BQV03','Vanguard FTSE Emerging Markets UCITS ETF (USD) Accumulating':'IE00BK5BR733'})[h.name]===key)?.[1]
    const o=match?.[field]
    if(!fresh({...o,sourceUrl:o?.sourceUrl||match?.sourceUrl})||o.rows.some(x=>x.weightPct<0))continue
    const sum=o.rows.reduce((s,x)=>s+x.weightPct,0)
    if(sum>100.5)continue
    dates.push(o.asOf);sources.add(o.sourceUrl||match.sourceUrl)
    for(const row of o.rows){const label=row.name||row.label;weights.set(label,(weights.get(label)||0)+h.weightPct/total*row.weightPct*(sum>100?100/sum:1))}
   }
   if(!weights.size||(Date.parse(dates.sort().at(-1))-Date.parse(dates[0]))/86400000>45)continue
   out[isin][field]={asOf:dates[0],basis:'fund',sourceUrl:r.holdings.sourceUrl,sourceUrls:[...sources],compatibility:'vanguard-equity-lookthrough-'+field,
    method:'Equity sleeve only, exact underlying Vanguard fund classes; published holdings rounded by issuer; bond sleeve excluded; unqualified subfund weights retained as missing',
    rows:[...weights].map(([name,weightPct])=>({name,weightPct}))}
  }
 }
 // The issuer contract identifies Nasdaq-100 as the equity underlier of QYLD.
 // This is its equity exposure, not the buy-write index performance or substitute basket.
 const proof=supplementary['IE00BM8R0J59']?.underlierEvidence,ndx=indexRecords['nasdaq-pea']?.facts
 if(proof&&fresh({asOf:proof.checkedAt,sourceUrl:proof.sourceUrl})&&fresh({asOf:ndx?.asOf,sourceUrl:ndx?.source?.url})){
  out['IE00BM8R0J59']={underlierEvidence:proof}
  for(const f of ['countries','sectors'])if(ndx[f]?.length)out['IE00BM8R0J59'][f]={asOf:ndx.asOf,sourceUrl:ndx.source.url,sourceUrls:[ndx.source.url,proof.sourceUrl],basis:'index',compatibility:'nasdaq100-equity-underlier-'+f,
   method:'Nasdaq-100 equity underlier identified by the QYLD issuer; index composition published by Amundi; covered-call payoff and substitute basket excluded',
   rows:ndx[f].map(([name,weightPct])=>({name,weightPct}))}
 }
 return out
}
