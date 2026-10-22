import {ASSETS} from '../src/data/market-history.js';
import {readFileSync} from 'node:fs';
import {AUTOMATED_ETF} from '../src/data/automated-etf.js';
import {INSTRUMENT_LISTINGS_BY_ISIN} from '../src/data/instrument-listings.js';
import {getInstrumentFacts} from '../src/data/instrument-facts.js';
import {getInstrumentName} from '../src/data/instruments.js';
const read=p=>JSON.parse(readFileSync(p));
const active=[...Object.values(read('src/data/automated-etf-monthly.json')),...Object.values(read('src/data/non-bond-monthly-records.json'))];
const suffix={XPAR:'.PA',XAMS:'.AS',XETR:'.DE',XLON:'.L',ETFP:'.MI',XSWX:'.SW'};
const pending=[];
const reviewIsins=new Set(process.argv.slice(2));
for(const isin of Object.keys(AUTOMATED_ETF)) {
 const prior=active.find(r=>r.isin===isin);
 if(!reviewIsins.has(isin)&&(prior||Object.values(ASSETS).some(r=>r.isin===isin)))continue;
 if(reviewIsins.size&&!reviewIsins.has(isin))continue;
 const listings=INSTRUMENT_LISTINGS_BY_ISIN[isin]?.filter(l=>suffix[l.mic]&&['USD','EUR'].includes(l.currency)&&l.evidenceId);
 if(!listings?.length)continue;
 for(const l of listings) {
 if(prior&&l.currency!==prior.currency)continue;
 for(const symbol of new Set([l.ticker+suffix[l.mic],...(l.symbol?.endsWith(suffix[l.mic])?[l.symbol]:[])])) {
 pending.push({id:prior?.id??'etf'+isin,label:getInstrumentName(isin),isin,ticker:l.ticker,mic:l.mic,currency:l.currency,parser:'yahoo',symbol,field:'adjclose',precision:6,consumerScope:'catalog',listingEvidenceId:l.evidenceId,instrumentType:getInstrumentFacts(isin).instrumentType??getInstrumentName(isin).match(/\b(ETC|ETP|ETN)\b/)?.[1]??'ETF',method:'Cours de la part exacte, ajustés des distributions et divisions ; dernière séance mensuelle recoupée avec la bougie mensuelle Yahoo',collectAnniversary:true,...(reviewIsins.has(isin)?{historyFloor:'1900-01'}:{})});
 }
 }
}
process.stdout.write(JSON.stringify(pending));
