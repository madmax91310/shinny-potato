import fs from 'node:fs'
import path from 'node:path'
export function hydrateMarketSeries(market,root,ids){
 const wanted=new Set(ids),files=new Map()
 for(const a of market.universe)if(wanted.has(a.id)&&a.seriesFile&&!market.series[a.id]){const f=path.join(root,'data/ai-portfolios',a.seriesFile);if(!files.has(f))files.set(f,JSON.parse(fs.readFileSync(f)));if(files.get(f)[a.id])market.series[a.id]=files.get(f)[a.id]}
 return market
}
export function requiredSeries(book,proposal){
 return [...new Set([...book.competitions.flatMap(c=>[c.config.benchmark,...c.decisions.flatMap(d=>[...Object.keys(d.weights??{}),...Object.keys(d.amounts??{}),...(d.execution?.trades??[]).map(t=>t.id)])]),...Object.keys(proposal?.operation?.decision?.weights??{}),...Object.keys(proposal?.operation?.decision?.amounts??{})])]
}
// Runtime catalogue keeps every status; exhaustive source certificates remain in dedicated exports.
const UI_FIELDS=new Set(['qualifiedSymbol','evidenceId','id','instrumentId','isin','name','company','companyId','cik','shareType','shareClass','family','ticker','symbol','mic','currency','sourceCurrency','observedSourceCurrency','priceScale','timezone','calendar','instrumentType','ucits','leveraged','region','exposure','status','reason','selectionBlock','discoveryBlock','permanentExclusion','lastAttempt','lastSuccess','coverageFrom','coverageThrough','seriesFile','sourceUrl','checkedAt','country','listingCountry','calendarThrough','operatingMic','segmentMic','sourceRetrievedAt','responseSha256','dailySourceUrl','sourceId','earliestQualificationDate'])
export function publicMarket(market,retainedIds=[]){
 const retained=new Set(retainedIds)
 const universe=market.universe.filter(a=>!a.permanentExclusion||retained.has(a.id))
 // Non-investable products remain in the complete downloadable inventory, without
 // making every phone parse tens of thousands of warrants just to open a portfolio.
 const inventoryCounts={instruments:new Set(market.universe.map(a=>a.instrumentId??a.id)).size,listings:market.universe.length,permanentExcluded:market.universe.filter(a=>a.permanentExclusion).length}
 return {...market,inventoryCounts,universe:universe.map(a=>Object.fromEntries(Object.entries(a).filter(([key])=>UI_FIELDS.has(key))))}
}
