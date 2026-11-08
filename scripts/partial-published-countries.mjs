// An exact issuer top-five table can feed a partial donut, never a full allocation
// or a securities-overlap gate. The live producer remains its sole source.
export function partialPublishedCountries(isin,record,now=new Date()){
 if(isin!=='IE0003R87OG3'||record?.provider!=='Avantis')return null
 const q=record.fieldQualification?.countries,e=q?.evidence
 if(q?.status!=='not-published'||e?.scope!=='top-five-countries'||e.rows?.length!==5
  ||q.sourceUrl!=='https://res.americancentury.com/docs/avantis-global-small-cap-value-ucits-etf-fact-sheet.pdf'
  ||!/^[a-f0-9]{64}$/.test(q.sha256??'')||!/^\d{4}-\d{2}-\d{2}$/.test(q.asOf??''))return null
 const date=Date.parse(q.asOf+'T00:00:00Z')
 const checked=Date.parse(q.checkedAt+'T00:00:00Z')
 if(!/^\d{4}-\d{2}-\d{2}$/.test(q.checkedAt??'')||!Number.isFinite(checked)||new Date(checked).toISOString().slice(0,10)!==q.checkedAt||checked<date||checked>now.getTime())return null
 if(!Number.isFinite(date)||new Date(date).toISOString().slice(0,10)!==q.asOf||date>now.getTime())return null
 if(e.rows.some(r=>typeof r.name!=='string'||!r.name||!Number.isFinite(r.weightPct)||r.weightPct<=0||r.weightPct>100)
  ||new Set(e.rows.map(r=>r.name)).size!==5)return null
 const total=e.rows.reduce((n,r)=>n+r.weightPct,0)
 if(!(total>0&&total<100)||!Number.isFinite(e.coveragePct)||Math.abs(total-e.coveragePct)>1e-9)return null
 return {rows:e.rows.map(r=>({...r})),asOf:q.asOf,checkedAt:q.checkedAt,sourceUrl:q.sourceUrl,sha256:q.sha256,
  basis:'fund',complete:false,scope:'top-five-countries',coveragePct:e.coveragePct,
  compatibility:'avantis-published-top-five-countries:'+isin,
  method:'Five published issuer countries, original fund percentages; remainder unallocated, no renormalisation'}
}
