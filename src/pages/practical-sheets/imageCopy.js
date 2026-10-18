// Presentation-only transformations. Figures and product observations stay in
// the shared registries; the tweet and its complete evidence are unchanged.
const TITLES = {
 merger: 'Un ETF fusionne ou change d’indice',
 'under-index': 'Un ETF monte moins que son indice',
 'personal-performance': 'Rendement du compte et rendement de l’ETF',
}
const LABELS = {
 'Ce que je vérifie': 'Points à vérifier',
 'Ce que je regarde': 'Frais concernés',
 'Quelles entreprises ou quels actifs vais-je suivre ?': 'Entreprises et actifs couverts par l’indice',
 'Puis-je supporter une baisse et attendre ?': 'Capacité à supporter une baisse et horizon de placement',
}
export function practicalValue(value) {
 return String(value ?? '').replace(/\bAccumulating\b/gi,'Capitalisant')
  .replace(/\bDistributing\b/gi,'Distribuant').replace(/^Capitalisation$/i,'Capitalisant')
}
const label = value => practicalValue(LABELS[value] ?? value)
export function imageCopy(sheet) {
 let rows=sheet.rows.map(row=>row.map(label))
 let columns=sheet.columns.map(value=>label(value).replace(/\s+UCITS ETF.*$/i,''))
 let tickers=columns.map(()=>''),subtitle='',caption=''
 if(sheet.mode==='funds' && sheet.funds?.length){
  columns=sheet.funds.map(f=>f.shortName.replace(/\s+CW8$/,''))
  tickers=sheet.funds.map(f=>f.ticker)
  const common=[]
  // A common family name describes the universe, not an assertion that the
  // currency and return variant of every benchmark is identical.
  const family=sheet.fundGroup==='world'?'MSCI World':sheet.fundGroup==='sp500'?'S&P 500':null
  if(family){common.push(family);rows=rows.filter(row=>row[0]!=='Indice')}
  common.push('PEA') // fundTable accepts only individually documented PEA shares.
  const incomes=sheet.funds.map(f=>practicalValue(f.distribution))
  if(incomes.every(value=>value===incomes[0])){
   common.push(incomes[0]==='Capitalisant'?'Revenus capitalisés':incomes[0]==='Distribuant'?'Revenus distribués':incomes[0])
   rows=rows.filter(row=>row[0]!=='Revenus')
  }
  subtitle=common.join(' · ')
  const aums=sheet.funds.map(f=>f.aum)
  const shared=aums.every(a=>a?.asOf && a.asOf===aums[0]?.asOf && a.scope===aums[0]?.scope)
  rows=rows.map(row=>row[0]!=='Encours'?row:[row[0],...row.slice(1).map(value=>{
   const [amount,...stamp]=value.split('\n')
   const compact=amount.replace(/ M EUR$/,' M€')
   return shared?compact:[compact,...stamp].join('\n')
  })])
  if(shared)caption=`Encours ${aums[0].scope==='fund'?'des fonds':'des parts'} au ${aums[0].asOf.split('-').reverse().join('/')}`
  rows.push(['ISIN',...sheet.funds.map(f=>f.isin)])
 }
 // Exact ISINs stay on one dedicated row rather than crowding product headers.
 const ids=rows.filter(row=>row[0]==='ISIN')
 rows=[...rows.filter(row=>row[0]!=='ISIN'),...ids]
 return {title:TITLES[sheet.id] ?? sheet.title.replace(/^Les ETF /,'ETF '),subtitle,columns,tickers,rows,caption}
}
