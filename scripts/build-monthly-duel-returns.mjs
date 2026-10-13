import {readFileSync,writeFileSync} from 'node:fs'
// Keep market-price returns distinct from the issuer's NAV tables.
const records=JSON.parse(readFileSync(new URL('../src/data/automated-etf-monthly.json',import.meta.url)))
const record=records.etfCopperMiners
const result={}
if(record){
 const points=new Map(record.points),years={}
 for(const [month,price]of record.points){
  if(!month.endsWith('-12'))continue
  const year=Number(month.slice(0,4)),previous=points.get(`${year-1}-12`)
  if(previous)years[year]=(price/previous-1)*100
 }
 result[record.isin]={isin:record.isin,currency:record.currency,years,calendarReturns:years,values:Array.from({length:6},(_,i)=>years[2020+i]??null),source:record.sourceUrls[0],sourceUrls:record.sourceUrls,checkedAt:record.checkedAt,basis:'market-price',method:record.method,responseSha256:record.responseSha256,note:'Cours de la part COPX à Milan en EUR, ajustés des distributions et divisions ; années civiles complètes uniquement. Ces rendements de marché diffèrent des rendements NAV de l’émetteur.'}
}
writeFileSync(new URL('../src/data/monthly-duel-returns.json',import.meta.url),JSON.stringify(result,null,2)+'\n')
