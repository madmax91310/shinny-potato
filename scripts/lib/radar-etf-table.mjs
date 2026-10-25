import { cleanText } from './purchasing-power-news.mjs'
const cells = row => [...row.matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map(m=>cleanText(m[1]))
const single = (value,pattern) => { const matches=[...value.matchAll(pattern)];return matches.length===1?matches[0][0]:null }
export function etfTableProducts(html) {
  const products=[],unparsed=[],excluded=[]
  let relevantRows=0
  for(const [,table] of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    const rows=[...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>m[1])
    const headerIndex=rows.findIndex(row=>cells(row).some(c=>/\bISIN\b/i.test(c))&&cells(row).some(c=>/^(ETF name|name|nom(?: de l[’']ETF)?|product name)$/i.test(c)))
    if(headerIndex<0)continue
    const headers=cells(rows[headerIndex]), index=pattern=>headers.findIndex(h=>pattern.test(h)), nameColumn=index(/^(ETF name|name|nom(?: de l[’']ETF)?|product name)$/i), isinColumn=index(/\bISIN\b/i)
    for(const row of rows.slice(headerIndex+1)) {
      const values=cells(row), name=values[nameColumn]??'', asset=values[index(/asset.*class|classe d.actif/i)]??''
      if(/\bET[CN]\b|\bETP\b/i.test(name+' '+asset)&&!/\bETF\b/i.test(asset)){excluded.push({name,reason:'ETP/ETC/ETN, distinct d’un fonds ETF UCITS'});continue}
      if(!/\bETF\b/i.test(name+' '+asset))continue
      relevantRows++
      const isin=single(values[isinColumn]??'',/\b[A-Z]{2}[A-Z0-9]{9}\d\b/g)
      if(values.length!==headers.length || /\b(?:rowspan|colspan)\s*=/i.test(row) || !isin || !/\bUCITS\b/i.test(name)) {unparsed.push({name:name||null,reason:!isin?'ISIN absent ou ambigu':!/\bUCITS\b/i.test(name)?'Nature UCITS non documentée':'Structure de ligne ambiguë'});continue}
      const field=pattern=>values[index(pattern)]??''
      const costs=field(/product costs|frais|TER|expense ratio|ongoing charge/i)
      const income=field(/use of profits|distribution|revenus/i)
      const fee=single(costs,/\b\d+(?:[.,]\d+)?\s*%/g)
      const management=/\bactive\b/i.test(asset)?'Active':/\bpassive\b/i.test(asset)?'Passive':null
      products.push({name,isin,instrumentType:'ETF UCITS',fees:fee,index:field(/^(index|benchmark|indice)$/i)||null,management,distribution:/\bAccumulating\b|capitalisation/i.test(income)?'Capitalisation':/\bDistributing\b|distribution/i.test(income)?'Distribution':null,pea:null,tradingDate:field(/first trading date|premiere cotation/i)||null,availability:null,evidence:headers.map((h,i)=>`${h}: ${values[i]}`).join(' · ')})
    }
  }
  return {products,extraction:{version:3,status:unparsed.length?'partial':'complete',relevantRows,parsedRows:products.length,unparsedRows:unparsed,excludedRows:excluded,reason:unparsed.length?`${unparsed.length} ligne(s) ETF non qualifiée(s) ; reprise bornée, aucune association devinée.`:null}}
}
// pdftotext -layout preserves rows whose long fund names wrap below the ISIN.
// Require the printed column header and exactly one ISIN per anchor line.
export function etfPdfTableProducts(text) {
  const lines=text.split(/\r?\n/),header=lines.findIndex(l=>/Nom de l.ETF|ETF Name/i.test(l)&&/ISIN/i.test(l)&&/frais|costs|TER/i.test(l))
  const products=[],unparsed=[]
  if(header<0)return {products,extraction:{version:3,status:'complete',relevantRows:0,parsedRows:0,unparsedRows:[],excludedRows:[],reason:null}}
  const section=lines.slice(header+1).join('\n').split(/Contact presse|A propos|À propos|Notes aux/i)[0]
  const rows=section.split(/\r?\n/)
  for(let i=0;i<rows.length;i++){
    const matches=[...rows[i].matchAll(/\b[A-Z]{2}[A-Z0-9]{9}\d\b/g)]
    if(!matches.length)continue
    if(matches.length!==1){unparsed.push({reason:'Plusieurs ISIN sur une ligne PDF ; association inconnue'});continue}
    const match=matches[0],parts=[rows[i].slice(0,match.index).trim()],evidence=[rows[i]]
    for(let j=i+1;j<rows.length&&rows[j].trim()&&!/\b[A-Z]{2}[A-Z0-9]{9}\d\b/.test(rows[j]);j++){
      if(/^\s*\*|^\s*Contact/i.test(rows[j]))break
      parts.push(rows[j].trim());evidence.push(rows[j])
      if(/\bUCITS\s+(?:Fund\s+)?ETF\b/i.test(parts.join(' ')))break
    }
    const name=parts.join(' ').replace(/\s+/g,' ').trim()
    if(!/\bUCITS\s+(?:Fund\s+)?ETF\b/i.test(name)||name.length>200){unparsed.push({name,reason:'Nom de fonds non associé de manière certaine dans le tableau PDF'});continue}
    products.push({name,isin:match[0],instrumentType:'ETF UCITS',fees:single(rows[i].slice(match.index+match[0].length),/\b\d+(?:[.,]\d+)?\s*%/g),feesBasis:lines[header].match(/frais de gestion/i)?'Frais de gestion et coûts administratifs cités ; ensemble des coûts à vérifier dans le DIC':null,index:null,management:null,distribution:null,pea:null,tradingDate:null,availability:null,evidence:lines[header].trim()+' · '+evidence.join(' ')})
  }
  return {products,extraction:{version:3,status:unparsed.length?'partial':'complete',relevantRows:products.length+unparsed.length,parsedRows:products.length,unparsedRows:unparsed,excludedRows:[],reason:unparsed.length?'Lignes PDF non associables : reprise nécessaire':null}}
}
