// ETF Express weekly prose only. Unknown amounts remain visible for manual review.
const categories = {
 geography: ['US exposures','Developed markets','World','Emerging markets','Europe','India','China','Latin America','Developed Pacific','Japan','United States','Global','United Kingdom','Taiwan','South Korea'],
 sector: ['Financials','Consumer Staples','Health Care','Information Technology','Industrials','Real Estate','Consumer Discretionary','Materials','Energy','Utilities','Communication Services'],
 asset: ['Equity ETFs','Fixed Income ETFs','Commodity products','cryptocurrency products'],
}
const months=['January','February','March','April','May','June','July','August','September','October','November','December']
export function parseExpressReport(text) {
 if(typeof text!=='string'||text.length>50000)throw Error('Colle un bilan de 50 000 caractères maximum.')
 const rows=[],warnings=[],seen=new Set(),currencies=new Set()
 const normalized=text.replace(/[\u00a0\u202f]/g,' ')
 const explicitYear=normalized.match(/Week\s+\d+,?\s+(\d{4})/i)?.[1] || normalized.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+(\d{4})/i)?.[1]
 const date=normalized.match(/between\s+([A-Za-z]+)\s+(\d{1,2})\s+and\s+(?:([A-Za-z]+)\s+)?(\d{1,2})(?:,?\s+(\d{4}))?/i)
 const iso=(month,day,year)=>{const m=months.findIndex(s=>s.toLowerCase()===month.toLowerCase());if(m<0)return '';const d=`${year}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;return new Date(d).toISOString().slice(0,10)===d?d:''}
 const year=date?.[5]||explicitYear
 const start=date&&year?iso(date[1],date[2],year):'',end=date&&year?iso(date[3]||date[1],date[4],year):''
 for(const paragraph of normalized.split(/\n+|,?\s+while\s+|(?<=[.!?])\s+(?=[A-Z])/).map(s=>s.trim()).filter(Boolean)) {
  if(/%|\b(?:returns?|performance|AuM|assets under management|YTD)\b/i.test(paragraph)){continue}
  const positive=/\b(?:inflows?|attracted|gathered)\b/i.test(paragraph),negative=/\b(?:outflows?|withdrawals?)\b/i.test(paragraph)
  const hasAmounts=/[€$]\s*\d/.test(paragraph)
  if(positive&&negative){if(hasAmounts)warnings.push('Entrées et sorties mélangées : '+paragraph);continue}
  const direction=negative?-1:positive?1:0
  if(!hasAmounts)continue
  let count=0
  for(const [group,names] of Object.entries(categories)) for(const label of names) {
   const re=new RegExp('\\b'+label+'\\b[^€$%]{0,90}?([€$])\\s*(\\d+(?:[.,]\\d+)?)\\s*(billion|million|bn|[BM])\\b','ig')
   for(const match of paragraph.matchAll(re)) {
    count++
    if(!direction){warnings.push('Sens du flux à vérifier : '+match[0]);continue}
    const key=group+label.toLowerCase()
    if(seen.has(key)){warnings.push('Flux répété : '+label);continue}
    seen.add(key)
    const currency=match[1]==='€'?'EUR':'USD';currencies.add(currency)
    const amount=Number(match[2].replace(',','.'))*(/^(billion|bn|b)$/i.test(match[3])?1e9:1e6)*direction
    rows.push({label,amount,group,currency,evidence:paragraph})
   }
  }
  if(count!==[...paragraph.matchAll(/[€$]\s*\d+(?:[.,]\d+)?/g)].length)warnings.push('Certains montants ne sont pas reconnus : '+paragraph)
 }
 if(currencies.size>1)warnings.push('Plusieurs devises : conserve une seule devise avant l’import.')
 if(!rows.length)warnings.push('Aucun flux reconnu. Colle le texte du bilan hebdomadaire ETF Express.')
 return {rows,warnings,start,end,scope:/European ETF activity/i.test(normalized)?'ETF du marché européen':'',currency:currencies.size===1?[...currencies][0]:null}
}
