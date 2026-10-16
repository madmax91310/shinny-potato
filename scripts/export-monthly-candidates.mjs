import {ASSETS} from '../src/data/market-history.js';
import {readFileSync} from 'node:fs';
import {AUTOMATED_ETF} from '../src/data/automated-etf.js';
import {INSTRUMENT_LISTINGS_BY_ISIN} from '../src/data/instrument-listings.js';
import {getInstrumentName} from '../src/data/instruments.js';
const read=p=>JSON.parse(readFileSync(p));
const active=[...Object.values(read('src/data/automated-etf-monthly.json')),...Object.values(read('src/data/non-bond-monthly-records.json'))];
const suffix={XPAR:'.PA',XAMS:'.AS',XETR:'.DE',XLON:'.L',ETFP:'.MI',XSWX:'.SW'};
const pending=[];
for(const isin of Object.keys(AUTOMATED_ETF)) {
 if(active.some(r=>r.isin===isin)||Object.values(ASSETS).some(r=>r.isin===isin))continue;
 const listings=INSTRUMENT_LISTINGS_BY_ISIN[isin]?.filter(l=>suffix[l.mic]&&['USD','EUR'].includes(l.currency)&&l.evidenceId);
 if(!listings?.length)continue;
 for(const l of listings) {
 pending.push({id:'etf'+isin,label:getInstrumentName(isin),isin,ticker:l.ticker,mic:l.mic,currency:l.currency,parser:'yahoo',symbol:l.ticker+suffix[l.mic],field:'adjclose',precision:6,consumerScope:'catalog',listingEvidenceId:l.evidenceId,instrumentType:'ETF',method:'Cours de la part exacte, ajustés des distributions et divisions ; dernière séance mensuelle recoupée avec la bougie mensuelle Yahoo',collectAnniversary:true});
 }
}
process.stdout.write(JSON.stringify(pending));
