import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import {ASSETS as PORTFOLIO_ASSETS} from '../src/data/portfolio-assets.js'
import * as history from '../src/data/market-history.js'
import * as anniversary from '../src/pages/tweet-midi/data/marketHistory.js'
import { references as exposureReferences } from '../src/pages/dca-profiles/records.js'
import INDEX_HISTORY from '../src/data/anniversary-index-history.json' with {type:'json'}
import { ASSETS as PERFORMANCE_ASSETS, MARKET_ASSETS, getAnnualReturnStartYears, getAnnualReturns, performanceBasis } from '../src/pages/tweet-midi/data/performanceHistory.js'
import { ETFS, CATEGORY_EMOJI } from '../src/data/etf-cards.js'
import { ETF_PUBLICATION_DATA } from '../src/data/etf-publication-data.js'
import { instrumentOption } from '../src/data/asset-selection.js'

export function annualProjection() {
 const assets=Object.fromEntries(Object.entries(PERFORMANCE_ASSETS).map(([id,{points:_points,anniversaryPoints:_anniversaryPoints,...asset}])=>[id,{...asset,historyId:id}]))
 const market=MARKET_ASSETS.map(({points:_points,...asset})=>({...asset,ticker:PERFORMANCE_ASSETS[asset.id].ticker,historyId:asset.id}))
 const years=Object.fromEntries(Object.keys(PERFORMANCE_ASSETS).map(id=>[id,getAnnualReturnStartYears(id)]))
 const returns=Object.fromEntries(Object.keys(PERFORMANCE_ASSETS).map(id=>[id,Object.fromEntries(years[id].map(y=>[y,getAnnualReturns(id,y)[0]]))]))
 const basis=Object.fromEntries(Object.keys(PERFORMANCE_ASSETS).map(id=>[id,performanceBasis(id)]))
 return {assets,market,years,returns,basis,latestYear:new Date().getUTCFullYear()}
}
export function anniversaryProjection() {
 const strip = ({points:_points,anniversaryPoints:_raw,...asset}) => asset
 const all = [...anniversary.MARKET_ASSETS, ...anniversary.ANNIVERSAIRE_ELIGIBLE_ASSETS]
 const assets = Object.fromEntries(all.map(asset => [asset.id, {...strip(asset), historyId:asset.id}]))
 const bounds = Object.fromEntries(all.map(asset => [asset.id, [anniversary.getAssetMinDate(asset.id),anniversary.getAssetMaxDate(asset.id)]]))
 const unqualifiedMonths=Object.fromEntries(all.map(asset=>[asset.id,anniversary.MARKET_ASSETS.find(a=>a.id===asset.id)??asset]).map(([id,asset])=>[id,asset.points.filter(p=>asset.anniversaryExcludedMonths?.includes(p.date)||!qualifyHistoryWindow(asset,p.date,p.date).qualified).map(p=>p.date)]).filter(([,months])=>months.length));
 return { assets, bounds, unqualifiedMonths, eligible:anniversary.ANNIVERSAIRE_ELIGIBLE_ASSETS.map(a=>assets[a.id]), excluded:anniversary.ANNIVERSAIRE_EXCLUDED_ASSETS.map(a=>assets[a.id]) }
}
export function projectSelectedData(){
 let base='/'
 const records=[]
 function add(folder,id,data){const content=JSON.stringify(data),hash=createHash('sha256').update(content).digest('hex').slice(0,20),fileName=`data/${folder}/${hash}.json`;records.push({id,content,fileName});return fileName}
 const portfolioUrls=Object.fromEntries(PORTFOLIO_ASSETS.filter(a=>a.manualOnly && /^(?:equity-|manual-)/.test(a.id)).map(asset=>[asset.id,add('portfolio',asset.id,asset)]))
 const historyUrls=Object.fromEntries(Object.entries(history.ASSETS).map(([id,asset])=>[id,add('history',id,asset)]))
 for(const [id,record] of Object.entries(INDEX_HISTORY)) {
  if(!historyUrls[id]) historyUrls[id]=add('history',id,{...record,points:record.points.map(([date,price])=>({date,price}))})
 }
 // A reference without countries, sectors or equity sleeve (metals, crypto) is complete inline: no chunk, no fetch.
 const inlineExposures=Object.keys(exposureReferences).filter(id=>!['countries','sectors','equitySleeve'].some(field=>exposureReferences[id][field]))
 const exposureUrls=Object.fromEntries(Object.entries(exposureReferences).filter(([id])=>!inlineExposures.includes(id)).map(([id,record])=>[id,add('exposures',id,record)]))
 const exposureCatalogUrl=add('exposure-catalog','catalog',exposureReferences)
 const exposureIndex=Object.fromEntries(Object.entries(exposureReferences).map(([id,{countries:_c,sectors:_s,equitySleeve:_e,...record}])=>[id,record]))
 const anniversaryData=anniversaryProjection()
 const sheetUrls=Object.fromEntries(ETFS.map(etf=>[etf.id,add('etf-sheets',etf.id,{etf,publication:ETF_PUBLICATION_DATA[etf.isin]??null})]))
 const projection=annualProjection()
 const index=Object.fromEntries(Object.entries(history.ASSETS).map(([id,{points,anniversaryPoints:_anniversaryPoints,...asset}])=>[id,{...asset,historyPending:true,points:[points[0],points.at(-1)]}]))
 const anniversarySource=readFileSync(new URL('../src/pages/tweet-midi/data/marketHistory.js',import.meta.url),'utf8')
 const source=readFileSync(new URL('../src/data/market-history.js',import.meta.url),'utf8')
 const calculatorCode=Object.entries(history).filter(([key])=>key!=='BASELINE_ASSETS').map(([key,value])=>{
  if(key==='ASSETS')return `export const ASSETS=${JSON.stringify(index)};`
  if(typeof value==='function')return source.match(new RegExp(`export function ${key}\\([\\s\\S]*?\\n}`))[0]
  return `export const ${key}=${value instanceof Set?`new Set(${JSON.stringify([...value])})`:JSON.stringify(value)};`
 }).join('\n')+`\nimport {loadHistoryRecord} from './history-browser.js';export async function ensureCalculatorAsset(id){const asset=ASSETS[id];if(!asset)throw Error('Historique introuvable');if(asset.historyPending){const record=await loadHistoryRecord(id);Object.assign(asset,record);delete asset.historyPending}return asset}`

 const annualModules=new Map([['market',projection.market],['bounds',{years:projection.years,basis:projection.basis,latestYear:projection.latestYear}],['returns',projection.returns]].map(([id,data])=>['virtual:selected-annual-'+id,'export default '+JSON.stringify(data)+';']))
 const annualCode=`import market from 'virtual:selected-annual-market';import bounds from 'virtual:selected-annual-bounds';import returns from 'virtual:selected-annual-returns';const data={market,returns,...bounds};export const MARKET_ASSETS=data.market,ASSETS=Object.fromEntries(data.market.map(a=>[a.id,a])),MONTHS_FULL=${JSON.stringify(history.MONTHS_FULL)};export const getAnnualReturnStartYears=id=>[...data.years[id]];export function getAnnualReturns(id,start){const out=[];for(let y=start;y<data.latestYear;y++){const r=data.returns[id]?.[y];if(!r)break;out.push({...r})}return out}export const performanceBasis=id=>data.basis[id];`
 function loader(urls){return `const urls=${JSON.stringify(urls)},cache=new Map();export function loadRecord(id){if(!urls[id])return Promise.reject(Error('Données introuvables'));if(!cache.has(id))cache.set(id,fetch(${JSON.stringify(base)}+urls[id]).then(r=>{if(!r.ok)throw Error('Chargement impossible');return r.json()}).catch(e=>{cache.delete(id);throw e}));return cache.get(id)}`}
 return {name:'project-selected-data',enforce:'pre',resolveId(id){if(annualModules.has(id))return {id:'\0'+id,moduleSideEffects:false}},load(id){id=typeof id==='string'?id:id.id;return annualModules.get(id.replace(/^\0/,''))},configResolved(c){base=c.base},
  configureServer(server){server.middlewares.use((req,res,next)=>{const r=records.find(r=>base+r.fileName===req.url?.split('?')[0]);if(!r)return next();res.setHeader('Content-Type','application/json; charset=utf-8');res.end(r.content)})},
  generateBundle(){for(const r of records)this.emitFile({type:'asset',fileName:r.fileName,source:r.content})},
  transform(code,id){const path=id.replaceAll('\\','/').split('?')[0]
   if(path.endsWith('/src/data/portfolio-asset-loader.js')) return {code:loader(portfolioUrls)+`\nimport {getAsset} from './portfolio-assets.js';export async function ensurePortfolioAssets(ids){return Promise.all(ids.map(async id=>{const asset=getAsset(id);if(!asset)throw Error('Actif introuvable');if(asset.historyPending){const record=await loadRecord(id);if(record.id!==id || record.isin!==asset.isin)throw Error('Identité de l’actif incorrecte');Object.assign(asset,record);delete asset.historyPending}return asset}))}`,map:null}
   if(path.endsWith('/src/pages/dca-profiles/records.js')) return {code:loader({...exposureUrls,__catalog:exposureCatalogUrl})+`
export const references=${JSON.stringify(exposureIndex)};export async function loadExposureCatalog(){return loadRecord('__catalog')};const ready=new Set(${JSON.stringify(inlineExposures)});export const exposureRecords={isReady:id=>!references[id]||ready.has(id),load:async id=>{if(!references[id]||ready.has(id))return references[id];const record=await loadRecord(id);Object.assign(references[id],record);ready.add(id);return record}};`,map:null}
   if(path.endsWith('/src/pages/tweet-midi/data/anniversaryHistory.js')) {
    const functions=['getValidYearsBackOptions','ymForYearsBack','fmtYm'].map(key=>anniversarySource.match(new RegExp('export function '+key+'\\([\\s\\S]*?\\n}'))[0]).join('\n')
    return {code:`import {interpolatePrice,ymIndex} from '../../investment-calculator/math.js';import {requireHistoryWindow} from '../../../data/history-window-quality.js';import {loadHistoryRecord} from '../../../data/history-browser.js';const data=${JSON.stringify(anniversaryData)},loaded=new Map();export const ASSETS=data.assets,ANNIVERSAIRE_ELIGIBLE_ASSETS=data.eligible,ANNIVERSAIRE_EXCLUDED_ASSETS=data.excluded,MONTHS_FULL=${JSON.stringify(history.MONTHS_FULL)};const getAssetMinDate=id=>data.bounds[id][0],getAssetMaxDate=id=>data.bounds[id][1],isQualifiedMonth=(id,ym)=>!data.unqualifiedMonths[id]?.includes(ym);export const anniversaryRecords={isReady:id=>loaded.has(id),load:async id=>{const record=await loadHistoryRecord(id);loaded.set(id,record);return record}};export function getHistoricalPrice(id,ym){const record=loaded.get(id);if(!record)throw Error('Historique non chargé');const date=ymIndex(ym)<ymIndex(getAssetMinDate(id))?getAssetMinDate(id):ym;if(record.anniversaryExcludedMonths?.includes(date))throw Error('Valeur liquidative historique non qualifiée pour '+date);requireHistoryWindow(record,date,date);return interpolatePrice(record.anniversaryPoints??record.points,date)};${functions}`,map:null}
   }
   if(path.endsWith('/src/data/history-parameters.js'))return {code:Object.entries(history).filter(([key])=>['LIVRET_A','INFLATION','LATEST_YM','MONTHS_FULL','MONTHS_SHORT','INCONSISTENT_MONTHLY_DATA_IDS'].includes(key)).map(([key,value])=>`export const ${key}=${value instanceof Set?`new Set(${JSON.stringify([...value])})`:JSON.stringify(value)};`).join('\n'),map:null}
   if(path.endsWith('/src/data/calculator-history.js'))return {code:calculatorCode,map:null}
   if(path.endsWith('/src/pages/tweet-midi/data/performanceHistory.js'))return {code:annualCode,map:null}
   if(path.endsWith('/src/data/history-browser.js'))return {code:loader(historyUrls)+'\nexport {loadRecord as loadHistoryRecord};',map:null}
   if(path.endsWith('/src/pages/etf-sheets/records.js')){
    const options=ETFS.map(instrumentOption).map(({id,name,isin,category,label,group,detail,search,badges})=>({id,name,isin,category,label,group,detail,search,badges}))
    return {code:loader(sheetUrls)+`\nexport const OPTIONS=${JSON.stringify(options)},ETFS=OPTIONS.map(item=>({...item})),CATEGORY_EMOJI=${JSON.stringify(CATEGORY_EMOJI)},ETF_PUBLICATION_DATA={};const pending=new Map(),ready=new Set(),errors=new Map();export async function loadSheetRecord(id){const record=await loadRecord(id);const current=ETFS.find(e=>e.id===id);Object.assign(current,record.etf);ETF_PUBLICATION_DATA[current.isin]=record.publication;ready.add(id);return record}export function readSheetRecord(id){if(errors.has(id))throw errors.get(id);if(ready.has(id))return ETFS.find(e=>e.id===id);if(!pending.has(id))pending.set(id,loadSheetRecord(id).then(()=>pending.delete(id),error=>{pending.delete(id);errors.set(id,error);throw error}));throw pending.get(id)}`,map:null}
   }
  }
 }
}
