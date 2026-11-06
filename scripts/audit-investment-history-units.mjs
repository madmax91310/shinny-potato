// Alerts are investigation candidates, never financial corrections or price estimates.
import {pathToFileURL} from 'node:url'
import {writeFileSync} from 'node:fs'
export function inspectSeries(points,{threshold=1.8}={}){
 const alerts=[],seen=new Set();let repeated=0
 for(let i=0;i<points.length;i++){
  const p=points[i],v=Array.isArray(p)?p[1]:p.price,date=Array.isArray(p)?p[0]:p.date
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(date)||seen.has(date)||!Number.isFinite(v)||v<=0)alerts.push({kind:'invalid-observation',month:date})
  seen.add(date);if(!i)continue
  const b=points[i-1],prior=Array.isArray(b)?b[1]:b.price,from=Array.isArray(b)?b[0]:b.date,ratio=v/prior
  if(ratio>threshold||ratio<1/threshold)alerts.push({kind:ratio>10||ratio<.1?'scale-break':'large-variation',from,to:date,before:prior,after:v,ratio})
  if(i+1<points.length){const q=points[i+1],next=Array.isArray(q)?q[1]:q.price
   if((ratio>5&&v/next>5)||(ratio<.2&&v/next<.2))alerts.push({kind:'isolated-scale-point',month:date,before:prior,value:v,after:next})
  }
  repeated=v===prior?repeated+1:0
  if(repeated===2)alerts.push({kind:'repeated-prices',from:Array.isArray(points[i-2])?points[i-2][0]:points[i-2].date,to:date,value:v})
 }
 return alerts
}
export async function audit(){
 const {ASSETS,ASSET_ORDER}=await import('../src/data/market-history.js')
 const {qualifyHistoryWindow}=await import('../src/data/history-window-quality.js')
 const assets=ASSET_ORDER.map(id=>{
  const a=ASSETS[id],alerts=inspectSeries(a.points).map(alert=>({...alert,field:'performance-level',qualification:qualifyHistoryWindow(a,alert.from??alert.month,alert.to??alert.month)}))
  if(a.anniversaryPoints)alerts.push(...inspectSeries(a.anniversaryPoints).map(alert=>({...alert,field:'historical-price',qualification:qualifyHistoryWindow(a,alert.from??alert.month,alert.to??alert.month)})))
  const factors=a.anniversaryPoints?.map((p,i)=>a.points[i]?.date===p.date?a.points[i].price/p.price:null)
  for(let i=1;i<(factors?.length??0);i++)if(factors[i]&&factors[i-1]&&(factors[i]/factors[i-1]>10||factors[i]/factors[i-1]<.1))alerts.push({kind:'adjustment-convention-change',from:a.points[i-1].date,to:a.points[i].date,ratio:factors[i]/factors[i-1],field:'performance/historical-price'})
  return {id,isin:a.isin??null,label:a.label,currency:a.currency,convention:a.historyConvention??a.priceMethod??a.variant??a.methodNote,sourceUrls:a.sourceUrls??[],first:a.points[0].date,last:a.points.at(-1).date,observations:a.points.length,alerts}
 })
 return {generatedAt:new Date().toISOString(),scope:'Actual ASSET_ORDER selector; both performance and historical-price series; existing financial restrictions preserved',detection:'Monthly ratio outside [1/1.8,1.8], scale factor >10, isolated factor >5, three identical consecutive prices, invalid observations and adjustment convention changes. These thresholds do not prove an error.',financialValidation:'Separate exact-share primary-source evidence and review required. No automated smoothing, interpolation, rescaling or exclusion.',summary:{assets:assets.length,observations:assets.reduce((n,a)=>n+a.observations,0),assetsWithAlerts:assets.filter(a=>a.alerts.length).length,alerts:assets.reduce((n,a)=>n+a.alerts.length,0)},assets}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const report=await audit();if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary))}
