import {readFileSync,writeFileSync} from 'node:fs'
import { monthlyCalendarReturns } from './monthly-return-projection.mjs'
import { DISTINCT_ASSET_ISINS } from '../src/data/distinct-asset-selections.js'
// Market-price returns stay distinct from the issuer's NAV tables.
const records={...JSON.parse(readFileSync(new URL('../src/data/automated-etf-monthly.json',import.meta.url))),...JSON.parse(readFileSync(new URL('../src/data/non-bond-monthly-records.json',import.meta.url)))}
const wanted=new Set(DISTINCT_ASSET_ISINS.filter(isin=>!['IE00BYZK4552','IE00BF4RFH31','IE00BF0M2Z96','IE00B0M63284'].includes(isin)))
const result={}
for(const record of Object.values(records)) {
 if(!wanted.has(record.isin) || record.consumerScope!=='catalog')continue
 if(!['EUR','USD'].includes(record.currency) || !/adjust|ajust/i.test(record.method ?? ''))continue
 const years=monthlyCalendarReturns(record)
 result[record.isin]={isin:record.isin,currency:record.currency,years,calendarReturns:years,values:Array.from({length:6},(_,i)=>years[2020+i]??null),source:record.sourceUrls[0],sourceUrls:record.sourceUrls,checkedAt:record.checkedAt,basis:'market-price',method:record.method,responseSha256:record.responseSha256,note:`Cours de la part exacte en ${record.currency}, ajustés des distributions et divisions ; années civiles complètes uniquement. Ces rendements de marché diffèrent des rendements NAV de l’émetteur.`}
}
writeFileSync(new URL('../src/data/monthly-duel-returns.json',import.meta.url),JSON.stringify(result,null,2)+'\n')
