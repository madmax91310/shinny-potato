import {readFileSync,writeFileSync} from 'node:fs'
import { monthlyCalendarReturns } from './monthly-return-projection.mjs'
// Market-price returns stay distinct from the issuer's NAV tables.
const records={...JSON.parse(readFileSync(new URL('../src/data/automated-etf-monthly.json',import.meta.url))),...JSON.parse(readFileSync(new URL('../src/data/non-bond-monthly-records.json',import.meta.url)))}
const result={}
for(const record of Object.values(records)) {
 if(!record.isin || record.consumerScope!=='catalog')continue
 if(record.field!=='adjclose'||!record.listingEvidenceId||!record.sourceUrls?.length||!/^[a-f0-9]{64}$/.test(record.responseSha256??''))continue
 if(!['EUR','USD'].includes(record.currency) || !/adjust|ajust/i.test(record.method ?? ''))continue
 const years=monthlyCalendarReturns(record)
 result[record.isin]={isin:record.isin,currency:record.currency,years,calendarReturns:years,values:Array.from({length:6},(_,i)=>years[2020+i]??null),source:record.sourceUrls[0],sourceUrls:record.sourceUrls,checkedAt:record.checkedAt,listingEvidenceId:record.listingEvidenceId,basis:'market-price',method:record.method,responseSha256:record.responseSha256,note:`Cours de la part exacte en ${record.currency}, ajustés des distributions et divisions ; années civiles complètes uniquement. Ces rendements de marché diffèrent des rendements NAV de l’émetteur.`}
}
writeFileSync(new URL('../src/data/monthly-duel-returns.json',import.meta.url),JSON.stringify(result,null,2)+'\n')
