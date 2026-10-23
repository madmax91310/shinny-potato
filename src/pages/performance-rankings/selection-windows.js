import {commonCoverage,monthIndex} from './engine.js'
import {qualifyHistoryWindow} from '../../data/history-window-quality.js'

export function qualifiedYearWindow(years, minimum = 1, maximum = 6) {
 const runs=[]
 for(const year of [...new Set(years)].sort((a,b)=>a-b)) {
  const last=runs.at(-1)
  if(last?.at(-1)===year-1)last.push(year)
  else runs.push([year])
 }
 return runs.findLast(run=>run.length>=minimum)?.slice(-maximum)??[]
}

export function qualifiedMonthlyWindows(assets) {
 if(!assets.length||assets.some(a=>a.frequency==='annual'||!a.points?.length))return []
 const start=assets.map(a=>a.points[0].date).sort().at(-1),end=assets.map(a=>a.points.at(-1).date).sort()[0]
 const ranges=[]
 for(const {date}of assets[0].points) {
  if(date<start||date>end||assets.some(a=>!qualifyHistoryWindow(a,date,date).qualified))continue
  const previous=ranges.at(-1)
  if(previous&&monthIndex(date)===monthIndex(previous.end)+1){previous.end=date;previous.months++}
  else ranges.push({start:date,end:date,months:1})
 }
 return ranges.filter(r=>r.months>1&&assets.every(a=>qualifyHistoryWindow(a,r.start,r.end).qualified))
}

// A prepared selection may propose new dates; manual edits keep the requested dates.
export function selectionDates(assets) {
 const coverage=commonCoverage(assets)
 const years=qualifiedYearWindow(coverage.years,2).length?qualifiedYearWindow(coverage.years,2):qualifiedYearWindow(coverage.years)
 const range=coverage.frequency==='annual'?{start:`${years[0]-1}-12`,end:`${years.at(-1)}-12`}:qualifiedMonthlyWindows(assets).at(-1)
 if(!range)throw new Error('Aucune période continue qualifiée commune.')
 return {start:range.start,end:range.end,startYear:years[0],endYear:years.at(-1)}
}
