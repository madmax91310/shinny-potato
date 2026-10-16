import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import * as history from '../src/data/market-history.js'
import { MARKET_ASSETS, getAnnualReturnStartYears, getAnnualReturns, performanceBasis } from '../src/pages/tweet-midi/data/marketHistory.js'
import { ETFS, CATEGORY_EMOJI } from '../src/data/etf-cards.js'
import { ETF_PUBLICATION_DATA } from '../src/data/etf-publication-data.js'
import { instrumentOption } from '../src/data/asset-selection.js'

export function annualProjection() {
 const assets=Object.fromEntries(Object.entries(history.ASSETS).map(([id,{points:_points,anniversaryPoints:_anniversaryPoints,...asset}])=>[id,{...asset,historyId:id}]))
 const market=MARKET_ASSETS.map(({points:_points,...asset})=>({...asset,ticker:history.ASSETS[asset.id].ticker,historyId:asset.id}))
 const years=Object.fromEntries(MARKET_ASSETS.map(a=>[a.id,getAnnualReturnStartYears(a.id)]))
 const returns=Object.fromEntries(MARKET_ASSETS.map(a=>[a.id,Object.fromEntries(years[a.id].map(y=>[y,getAnnualReturns(a.id,y)[0]]))]))
 const basis=Object.fromEntries(MARKET_ASSETS.map(a=>[a.id,performanceBasis(a.id)]))
 return {assets,market,years,returns,basis,latestYear:Number(history.LATEST_YM.slice(0,4))}
}
export function projectSelectedData(){
 let base='/'
 const records=[]
 function add(folder,id,data){const content=JSON.stringify(data),hash=createHash('sha256').update(content).digest('hex').slice(0,20),fileName=`data/${folder}/${hash}.json`;records.push({id,content,fileName});return fileName}
 const historyUrls=Object.fromEntries(Object.entries(history.ASSETS).map(([id,asset])=>[id,add('history',id,asset)]))
 const sheetUrls=Object.fromEntries(ETFS.map(etf=>[etf.id,add('etf-sheets',etf.id,{etf,publication:ETF_PUBLICATION_DATA[etf.isin]??null})]))
 const projection=annualProjection()
 const index=Object.fromEntries(Object.entries(history.ASSETS).map(([id,{points,anniversaryPoints:_anniversaryPoints,...asset}])=>[id,{...asset,historyPending:true,points:[points[0],points.at(-1)]}]))
 const source=readFileSync(new URL('../src/data/market-history.js',import.meta.url),'utf8')
 const calculatorCode=Object.entries(history).filter(([key])=>key!=='BASELINE_ASSETS').map(([key,value])=>{
  if(key==='ASSETS')return `export const ASSETS=${JSON.stringify(index)};`
  if(typeof value==='function')return source.match(new RegExp(`export function ${key}\\([\\s\\S]*?\\n}`))[0]
  return `export const ${key}=${value instanceof Set?`new Set(${JSON.stringify([...value])})`:JSON.stringify(value)};`
 }).join('\n')+`\nimport {loadHistoryRecord} from './history-browser.js';export async function ensureCalculatorAsset(id){const asset=ASSETS[id];if(!asset)throw Error('Historique introuvable');if(asset.historyPending){const record=await loadHistoryRecord(id);Object.assign(asset,record);delete asset.historyPending}return asset}`

 const annualCode=`const data=${JSON.stringify({...projection,assets:undefined})};export const MARKET_ASSETS=data.market,ASSETS=Object.fromEntries(data.market.map(a=>[a.id,a])),MONTHS_FULL=${JSON.stringify(history.MONTHS_FULL)};export const getAnnualReturnStartYears=id=>[...data.years[id]];export function getAnnualReturns(id,start){const out=[];for(let y=start;y<data.latestYear;y++){const r=data.returns[id]?.[y];if(!r)break;out.push({...r})}return out}export const performanceBasis=id=>data.basis[id];`
 function loader(urls){return `const urls=${JSON.stringify(urls)},cache=new Map();export function loadRecord(id){if(!urls[id])return Promise.reject(Error('Données introuvables'));if(!cache.has(id))cache.set(id,fetch(${JSON.stringify(base)}+urls[id]).then(r=>{if(!r.ok)throw Error('Chargement impossible');return r.json()}).catch(e=>{cache.delete(id);throw e}));return cache.get(id)}`}
 return {name:'project-selected-data',enforce:'pre',configResolved(c){base=c.base},
  configureServer(server){server.middlewares.use((req,res,next)=>{const r=records.find(r=>base+r.fileName===req.url?.split('?')[0]);if(!r)return next();res.setHeader('Content-Type','application/json; charset=utf-8');res.end(r.content)})},
  generateBundle(){for(const r of records)this.emitFile({type:'asset',fileName:r.fileName,source:r.content})},
  transform(code,id){const path=id.replaceAll('\\','/').split('?')[0]
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
