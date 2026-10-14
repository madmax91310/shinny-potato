import { isComparisonEtc } from '../etf-tweets/lib/comparisonPolicy.js'
import { LIFESTRATEGY_RECORDS } from '../../data/lifestrategy.js'
import { startPublicationDownload } from '../../design-system/publicationActions.js'
import { loadEditorialFont } from './anniversaryArt.js'
import { getComparisonPerformance, getComparisonYears } from './comparisonPerformance.js'
import { getComparisonComposition as getComparisonImageComposition, COMPOSITION_LABELS, compositionEvidenceLabel } from '../etf-tweets/lib/comparisonComposition.js'
export { getComparisonComposition as getComparisonImageComposition } from '../etf-tweets/lib/comparisonComposition.js'
import { AUTOMATED_ETF } from '../../data/automated-etf.js'
import { getPreferredInstrumentListing } from '../../data/instrument-listings.js'
import { getInstrumentPeaStatus } from '../../data/instruments.js'
import { INSTRUMENT_FACTS_BY_ISIN } from '../../data/instrument-facts.js'

const W = 1800, PAD = 80, CARD_H = 2000, CARD_Y = 310, GAP = 65
const INK = '#182e2a', GREEN = '#126047', RED = '#ad3924', MUTED = '#53685a'
const PALETTE = [['#dbe9da', '#1f664e'], ['#eee0cc', '#a05d32'], ['#dde8ed', '#315578']]
const pct = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
function text(ctx, value, x, y, size, { width = W, color = INK, align = 'left', serif = false, weight = 700 } = {}) {
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  let fitted = size
  do { ctx.font = `${weight} ${fitted}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`; if (ctx.measureText(value).width <= width) break; fitted-- } while (fitted > 12)
  ctx.fillText(value, x, y)
}
function wrap(ctx, value, width, size, { serif = false, weight = 700 } = {}) {
  ctx.font = `${weight} ${size}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`
  const rows = []; let row = ''
  for (const word of value.split(/\s+/)) {
    const next = row ? `${row} ${word}` : word
    if (row && ctx.measureText(next).width > width) { rows.push(row); row = word } else row = next
  }
  if (row) rows.push(row)
  return rows
}
function lines(ctx, value, x, y, width, maxRows, startSize, options = {}) {
  let size = startSize, rows
  do { rows = wrap(ctx, value, width, size, options); if (rows.length <= maxRows) break; size-- } while (size > 16)
  rows.forEach((row, i) => text(ctx, row, x, y + i * (size + 7), size, { width, ...options }))
}
function rule(ctx, x, y, width) {
  ctx.fillStyle = '#bac0b8'; ctx.fillRect(x, y, width, 1.5)
}
function detail(fund) {
  return fund.differenciateur.replace(/(?:non[ -]éligible\s+|éligible\s+|hors\s+|en\s+)?\bPEA\b(?: selon [^,;]+)?|\bCTO\b/gi, '').replace(/\s+([,;])/g, '$1').replace(/[,;]\s*[,;]/g, ',').replace(/^[\s·,;:|–—-]+|[\s·,;:|–—-]+$/g, '').trim()
}
function rounded(ctx, x, y, width, height, color, radius = 24) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill()
}
function composition(ctx, fund, field, x, y, width, accent) {
  if (isComparisonEtc(fund)) {
    const currency = AUTOMATED_ETF[fund.isin]?.performance?.currency
    text(ctx, field === 'sectors' ? 'TYPE DE SUPPORT' : 'LECTURE DU RENDEMENT', x, y, 30, { width })
    lines(ctx, field === 'sectors' ? 'ETC sur une matière première. Ce produit n’est pas un ETF UCITS d’actions.' : `Rendement du produit${currency ? ' en '+currency : ''}, frais inclus. En euros, les variations du change comptent aussi.`, x, y + 52, width, 5, 29, { weight: 400, color: MUTED })
    return
  }
  const multi = LIFESTRATEGY_RECORDS[fund.isin]
  if (multi) {
    const observation = field === 'sectors' ? multi.assetAllocation : multi.holdings
    text(ctx, field === 'sectors' ? 'ACTIONS ET OBLIGATIONS' : 'FONDS SOUS-JACENTS', x, y, 30, { width })
    const entries = [...observation.rows].sort((a,b)=>b.weightPct-a.weightPct).slice(0,3)
    entries.forEach((entry,i)=>{
      const label = entry.name.replace(/^Vanguard /,'').replace(/ UCITS ETF.*$/,'')
      lines(ctx,label,x,y+52+i*70,width-120,2,27,{weight:400})
      text(ctx,`${entry.weightPct.toLocaleString('fr-FR')} %`,x+width,y+52+i*70,29,{align:'right',width:116})
    })
    if (field === 'countries' || multi.assetAllocation.asOf !== multi.holdings.asOf) text(ctx,`Fonds · ${observation.asOf.split('-').reverse().join('/')}`,x,y+(field === 'sectors' ? 260 : 225),27,{width,weight:400,color:MUTED})
    return
  }
  const { rows, asOf, isIndex } = getComparisonImageComposition(fund.isin, field)
  // A rate index has no geographic or sector allocation. Keep the same panels,
  // showing its existing benchmark and currency instead of an unavailable portfolio.
  const benchmark = INSTRUMENT_FACTS_BY_ISIN[fund.isin]?.benchmark
  if (!rows.length && /€STR/.test(benchmark ?? '')) {
    text(ctx, field === 'sectors' ? 'EXPOSITION SUIVIE' : 'DEVISE DE L’INDICE', x, y, 30, { width })
    lines(ctx, field === 'sectors' ? benchmark : `Euro · ${AUTOMATED_ETF[fund.isin].currency}`, x, y + 52, width, 3, 29, { weight: 400, color: MUTED })
    return
  }
  text(ctx, field === 'sectors' ? 'PRINCIPAUX SECTEURS' : 'PRINCIPAUX PAYS', x, y, 30, { width })
  if (!rows.length) { text(ctx, 'Non disponible', x, y + 52, 29, { width, weight: 400, color: MUTED }); return }
  rows.forEach(([label, value], i) => {
    const yy = y + 52 + i * (field === 'sectors' ? 120 : 70), valueW = 120
    lines(ctx, COMPOSITION_LABELS[label] ?? label, x, yy, width - valueW - 12, field === 'sectors' ? 3 : 2, 28, { weight: 400 })
    text(ctx, `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`, x + width, yy, 36, { align: 'right', width: valueW })
    if (field === 'sectors') {
      rounded(ctx, x, yy + 100, width, 9, '#c4d2c7', 4)
      rounded(ctx, x, yy + 100, width * Math.min(value / 100, 1), 9, accent, 4)
    }
  })
  // Each composition keeps its own date and fund/index scope inside the card.
  const countries = getComparisonImageComposition(fund.isin, 'countries')
  if (field === 'countries' || asOf !== countries.asOf || isIndex !== countries.isIndex) lines(ctx, compositionEvidenceLabel(getComparisonImageComposition(fund.isin, field)), x, y + (field === 'sectors' ? 410 : 225), width, 3, 25, { weight: 400, color: MUTED })
}
export function comparisonLayout(count) {
  const columns = count <= 3 ? Math.max(1, count) : 2
  const rows = Math.ceil(count / columns)
  return { columns, rows, compact: count >= 4, height: CARD_Y + rows * CARD_H + (rows - 1) * GAP + 280 }
}
// Shared rows make differences comparable without matching unrelated country labels.
function group(ctx, funds, years, y) {
  const labelW=300, start=PAD+labelW, colW=(W-2*PAD-labelW)/funds.length
  const sharedRow=(label,offset,values,{size=39,height=75}={})=>{
    text(ctx,label,PAD+16,y+offset+14,30,{width:labelW-35})
    values.forEach((value,i)=>lines(ctx,value,start+i*colW+24,y+offset+14,colW-48,Math.max(1,Math.floor(height/48)),size,{weight:400}))
    rule(ctx,PAD,y+offset+height,W-2*PAD)
  }
  funds.forEach((fund,i)=>{
    const x=start+i*colW,[paper,accent]=PALETTE[i%PALETTE.length],width=colW-48
    rounded(ctx,x+5,y,colW-10,235,paper,16)
    const name=fund.nom.replace(/ UCITS ETF S.*$/i,' · S').replace(/ UCITS ETF.*$/i,'').replace(/ ETF$/i,'')
    lines(ctx,name,x+24,y+26,width,3,42,{serif:true})
    const ticker=getPreferredInstrumentListing(fund.isin)?.ticker
    if(ticker)text(ctx,ticker,x+24,y+166,27,{width,color:accent})
    text(ctx,fund.isin,x+24,y+204,26,{width,weight:400})
  })
  sharedRow('Stratégie',250,funds.map(detail),{size:33,height:200})
  sharedRow('Enveloppe',460,funds.map(f=>getInstrumentPeaStatus(f.isin)===true?'PEA':'CTO'))
  sharedRow('Frais annuels',545,funds.map(f=>`${f.frais.replace(/\s*%$/,'')} %`),{size:65,height:100})
  funds.forEach((fund,i)=>{
    const rate=AUTOMATED_ETF[fund.isin]?.characteristics?.annualSwapRatePct
    if(fund.isCopperEtc && Number.isFinite(rate))lines(ctx,`Frais de gestion ; swap annuel : + ${rate.toLocaleString('fr-FR')} %`,start+i*colW+24,y+655,colW-48,2,25,{weight:400,color:MUTED})
  })
  rounded(ctx,PAD,y+740,W-2*PAD,58,'#e5e9da',10)
  text(ctx,'PERFORMANCES ANNUELLES',PAD+20,y+754,31,{width:W-2*PAD-40,serif:true})
  const series=funds.map(f=>getComparisonPerformance(f.isin,years))
  series.forEach((performance,i)=>{
    const x=start+i*colW+24,width=colW-48
    text(ctx,performance?`ETF · ${performance.currency}`:'Historique',x,y+817,29,{width,color:MUTED})
    if(!performance || !years.length)lines(ctx,'Historique annuel non disponible',x,y+882,width,3,29,{weight:400,color:MUTED})
  })
  years.forEach((year,j)=>{
    const yy=y+875+j*88
    text(ctx,String(year),PAD+20,yy,36,{width:labelW-40})
    series.forEach((performance,i)=>{
      if(!performance)return
      const observation=performance.rows.find(row=>row.year===year)
      text(ctx,observation?pct(observation.pct):'N/D',start+(i+1)*colW-25,yy,49,{width:colW-50,align:'right',color: observation?.pct < 0 ? RED : GREEN})
    })
    rule(ctx,PAD,yy+66,W-2*PAD)
  })
  funds.forEach((fund,i)=>{
    const x=start+i*colW+24,width=colW-48,accent=PALETTE[i%PALETTE.length][1]
    composition(ctx,fund,'sectors',x,y+1165,width,accent)
    composition(ctx,fund,'countries',x,y+1640,width,accent)
  })
}
export async function renderComparatifEtfImage(theme) {
  if (!theme?.etfs?.length) throw new Error('Sélection ETF vide')
  await loadEditorialFont()
  const layout=comparisonLayout(theme.etfs.length),years=getComparisonYears(theme.etfs.map(f=>f.isin))
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=layout.height
  const ctx=canvas.getContext('2d');ctx.fillStyle='#f8f7f0';ctx.fillRect(0,0,W,canvas.height)
  text(ctx,'ÉPARGNANT LIBRE',W/2,45,32,{align:'center'})
  lines(ctx,`${theme.nom} :`,W/2,110,W-2*PAD,2,70,{align:'center',serif:true,weight:400})
  for(let row=0;row<layout.rows;row++)group(ctx,theme.etfs.slice(row*layout.columns,(row+1)*layout.columns),years,CARD_Y+row*(CARD_H+GAP))
  const takeaway=theme.cloture?.trim()
  if(takeaway){
    rounded(ctx,PAD,canvas.height-245,W-2*PAD,150,'#e5e9da',18)
    lines(ctx,takeaway,PAD+35,canvas.height-220,W-2*PAD-70,3,32,{serif:true,weight:400})
  }
  text(ctx,theme.etfs.every(f=>LIFESTRATEGY_RECORDS[f.isin])?'Actions et obligations peuvent baisser.':'Pas un conseil financier',W/2,canvas.height-55,28,{align:'center',weight:400,color:MUTED})
  return canvas
}
export async function downloadComparatifEtfImage(theme) {
  const canvas = await renderComparatifEtfImage(theme)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Échec de la génération du PNG')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `comparatif-etf-${theme.id}.png`
  document.body.append(link); startPublicationDownload(link); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
