// Optional real network acceptance, isolated from the production ledger. No launch.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {defaultConfig} from '../src/pages/ai-portfolios/data.js'
import {coverage,sourceFreshness} from '../src/pages/ai-portfolios/lib.js'
import {hydrateMarketSeries} from './ai-series-store.mjs'
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-final-network-')),folder=path.join(root,'data/ai-portfolios');fs.mkdirSync(folder,{recursive:true})
const original=fs.readFileSync('data/ai-portfolios/book.json'),market=JSON.parse(fs.readFileSync('data/ai-portfolios/market.json')),config=defaultConfig(),ids=[config.benchmark]
hydrateMarketSeries(market,process.cwd(),ids);market.series=Object.fromEntries(ids.map(id=>[id,market.series[id]]))
fs.writeFileSync(path.join(folder,'qualification.json'),JSON.stringify({candidates:market.universe.filter(a=>ids.includes(a.id))}));fs.writeFileSync(path.join(folder,'market.json'),JSON.stringify(market));fs.writeFileSync(path.join(folder,'book.json'),original)
const run=spawnSync('python3',['scripts/collect_ai_portfolios.py','--root',root,'--assets',ids.join(','),'--report',path.join(root,'observations.json')],{encoding:'utf8',timeout:240000,maxBuffer:4_000_000})
const saved=JSON.parse(fs.readFileSync(path.join(folder,'market.json')));hydrateMarketSeries(saved,root,ids)
const a=saved.universe.find(a=>a.id===config.benchmark),series=saved.series[a.id],currentReady=run.status===0&&coverage(a.id,saved,saved.asOf).ok&&sourceFreshness(saved).ok
const previousThrough=Object.keys(series.points).sort().at(-1)
// Historical validation uses an explicitly dated cutoff, never a fake current
// clock or a claim that a null latest bar is a published price.
const code=`import sys,json,datetime as dt
sys.path.insert(0,'scripts')
from collect_ai_portfolios import parse_prices,UTC
from market_transport import chart_response
from data_automation import get_json
from pathlib import Path
root=Path(sys.argv[1]);m=json.loads((root/'data/ai-portfolios/market.json').read_text());a=next(a for a in m['universe'] if a['id']==sys.argv[2]);prior=json.loads(sys.argv[3]);through=max(prior['points']);url='https://query2.finance.yahoo.com/v8/finance/chart/'+a['symbol']+'?range=6mo&interval=1d&events=div%2Csplits'
raw,actual=chart_response(url,get_json);series=parse_prices(raw,a,m['calendars'][a['calendar']],dt.datetime.now(UTC),prior,through=through);print(json.dumps({'source':actual,'through':max(series['points']),'anchor':series['anchorDate'],'count':len(series['points']),'responseSha256':series['responseSha256'],'currency':series['sourceCurrency'],'scale':series['priceScale'],'convention':series['convention']}))
`
const history=spawnSync('python3',['-c',code,root,a.id,JSON.stringify(series)],{encoding:'utf8',maxBuffer:4_000_000,timeout:120000});assert.equal(history.status,0,history.stderr);const historical=JSON.parse(history.stdout)
assert.equal(historical.through,previousThrough);assert.deepEqual(fs.readFileSync('data/ai-portfolios/book.json'),original)
const report={testedAt:new Date().toISOString(),scope:'Vraies requêtes réseau en racine temporaire. Historique contrôlé à sa vraie borne ; disponibilité actuelle distincte. Aucun portefeuille créé ni lancé.',root,asOf:saved.asOf,currentReady,currentError:currentReady?null:saved.status[a.id]?.error,asset:{id:a.id,name:a.name,isin:a.isin,symbol:series.symbol,currency:series.currency,timezone:series.timezone},historical,collection:saved.collection,fx:saved.status.ECB,productionBookSha256:createHash('sha256').update(original).digest('hex'),productionBookUnchanged:true}
fs.writeFileSync(path.join(root,'proof.json'),JSON.stringify(report,null,2));fs.writeFileSync('/tmp/ai-final-network-location.txt',root);console.log(JSON.stringify(report,null,2));if(!currentReady)process.exitCode=2
