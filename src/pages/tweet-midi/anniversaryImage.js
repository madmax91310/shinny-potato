import { MONTHS_FULL } from '../../data/market-history.js'
import { getHistoricalPrice, ymForYearsBack, fmtYm } from './data/marketHistory.js'
import { getMarketAsset, MODES, TODAY } from './lib.js'
import { ANNIVERSARY_ART, loadArtImage, loadEditorialFont, drawTitaniumMark } from './anniversaryArt.js'

const W = 1600, H = 2000
const INK = '#191916', MUTED = '#47473f'
const valid = raw => raw !== '' && raw !== null && raw !== undefined && Number.isFinite(Number(raw)) && Number(raw) > 0
const number = n => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)
const percentage = n => `${n >= 0 ? '+' : '−'}${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(n))} %`
const font = (size, serif, weight) => `${weight} ${size}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`

function text(ctx, value, x, y, size, { width = W - 200, color = INK, serif = true, weight = 700, align = 'center', spacing = 0 } = {}) {
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color; ctx.letterSpacing = `${spacing}px`
  let actual = size
  while (actual > 16) {
    ctx.font = font(actual, serif, weight)
    if (ctx.measureText(value).width <= width) break
    actual -= 2
  }
  ctx.font = font(actual, serif, weight)
  if (ctx.measureText(value).width > width) throw new Error('Le niveau saisi est trop long pour l’image')
  ctx.fillText(value, x, y)
  ctx.letterSpacing = '0px'
}
function rule(ctx, x1, y1, x2, y2) {
  ctx.strokeStyle = 'rgba(47,45,39,.4)'; ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke()
}
function snapshot(item, raw, assetId) {
  if (!valid(raw)) throw new Error('Saisir un niveau actuel valide avant de télécharger l’image')
  const asset = getMarketAsset(assetId), art = ANNIVERSARY_ART[assetId]
  if (!asset || !art) throw new Error('Actif sans visuel vérifié')
  const date = ymForYearsBack(item.yearsBack, TODAY)
  return { asset, art, past: getHistoricalPrice(assetId, date), current: Number(raw), dateLabel: fmtYm(date, { monthLabels: MONTHS_FULL }) }
}
const level = (value, snap) => `${number(value)} ${snap.art.unit || (snap.asset.currency === 'USD' ? '$' : '€')}`

function panel(ctx, snap, images, { x = 0, scale = 1, period = true, yearsBack } = {}) {
  ctx.save(); ctx.translate(x,0); ctx.scale(scale,scale)
  const { art, past, current, dateLabel } = snap
  ctx.drawImage(images.scene,0,0,W,H)
  if (images.mark && !art.embeddedMark) {
    // Ground the mark just above the studio horizon; fit wide wordmarks separately.
    const wide = images.mark.width / images.mark.height > 2
    drawTitaniumMark(ctx, images.mark, wide ? 220 : 435, wide ? 365 : 240, wide ? 1160 : 730, wide ? 480 : 730)
  }
  if (art.indexTitle) {
    // Une identité typographique d’indice, sans lui attribuer le logo d’un émetteur.
    const mark = document.createElement('canvas'); mark.width = 1400; mark.height = 380;
    const m = mark.getContext('2d');
    text(m, art.indexTitle, 700, 75, 180, { width: 1360, serif: false, weight: 900 });
    drawTitaniumMark(ctx, mark, 100, 350, 1400, 480);
  }
  // Keep bright, even contrast behind figures without flattening the metal surface.
  const wash = ctx.createLinearGradient(0,1010,0,H)
  wash.addColorStop(0,'rgba(245,242,233,0)'); wash.addColorStop(.25,'rgba(245,242,233,.8)'); wash.addColorStop(1,'rgba(245,242,233,.94)')
  ctx.fillStyle = wash; ctx.fillRect(0,1010,W,H-1010)
  text(ctx,art.title,W/2,1045,200,{ width: 1420 })
  if (art.subtitle) text(ctx,art.subtitle,W/2,1250,42,{ serif:false,weight:700,color:MUTED,width:1420 })
  const change = (current / past - 1) * 100
  text(ctx,percentage(change),W/2,1320,230,{ width:1430, color:change < 0 ? '#752d28' : INK })
  if (period) text(ctx,`EN ${yearsBack} AN${yearsBack > 1 ? 'S' : ''}`,W/2,1590,52,{ spacing:5 })
  rule(ctx,100,1660,1500,1660); rule(ctx,800,1710,800,1860)
  text(ctx,dateLabel.toUpperCase(),440,1700,44,{ width:650,spacing:1.5 })
  text(ctx,'AUJOURD’HUI',1160,1700,44,{ width:650,spacing:1.5 })
  text(ctx,level(past,snap),440,1765,112,{ width:650 })
  text(ctx,level(current,snap),1160,1765,112,{ width:650 })
  ctx.restore()
}

export async function renderAnniversaryImage(item, currentRaw, currentRawB = '') {
  const comparative = item.mode === MODES.COMPARATIF
  const snapshots = [snapshot(item,currentRaw,comparative ? item.assetIdA : item.assetId)]
  if (comparative) snapshots.push(snapshot(item,currentRawB,item.assetIdB))
  const images = await Promise.all(snapshots.map(async snap => ({
    scene: await loadArtImage(snap.art.scene || 'titanium.webp'),
    mark: snap.art.mark ? await loadArtImage(snap.art.mark) : null,
  })))
  await loadEditorialFont()
  const canvas = document.createElement('canvas')
  const scale = comparative ? .75 : 1
  canvas.width = comparative ? 2400 : W; canvas.height = comparative ? 1500 : H
  const ctx = canvas.getContext('2d')
  snapshots.forEach((snap,i) => panel(ctx,snap,images[i],{x:i * W * scale,scale,period:!comparative,yearsBack:item.yearsBack}))
  if (comparative) rule(ctx,1200,150,1200,1400)
  text(ctx,'ÉPARGNANT LIBRE',canvas.width/2,53 * scale,31 * scale,{width:canvas.width-200,spacing:3 * scale})
  if (comparative) text(ctx,`EN ${item.yearsBack} AN${item.yearsBack > 1 ? 'S' : ''}`,canvas.width/2,1590 * scale,43 * scale,{spacing:3})
  // Retain licensed source attribution, with a single account signature overall.
  const credits = [...new Set(snapshots.map(snap => snap.asset.sourceCredit).filter(Boolean))]
  credits.flatMap(credit => credit.replace(' · Calculs Épargnant Libre','').split('\n')).forEach((line,i) => {
    text(ctx,line,canvas.width/2,(1910+i*32)*scale,23*scale,{width:canvas.width-120,serif:false,weight:400,color:MUTED})
  })
  return canvas
}

export async function downloadAnniversaryImage(item, currentRaw, currentRawB) {
  const canvas = await renderAnniversaryImage(item,currentRaw,currentRawB)
  const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png'))
  if (!blob) throw new Error('Export PNG impossible')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url
  link.download = `il-y-a-${item.yearsBack}-ans-${item.mode === MODES.COMPARATIF ? `${item.assetIdA}-${item.assetIdB}` : item.assetId}.png`
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url),1000)
}
