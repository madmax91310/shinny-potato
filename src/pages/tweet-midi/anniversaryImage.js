import { currencySymbol } from '../../lib/investment-series.js'
import { downloadPublicationBlob } from '../../design-system/downloadBlob.js'
import { resolveAnniversaryLevel } from '../../data/anniversary-levels.js'
import { MONTHS_FULL } from '../../data/history-parameters.js'
import { getHistoricalPrice, ymForYearsBack, fmtYm, anniversaryRecords } from './data/anniversaryHistory.js'
import { getMarketAsset, MODES, TODAY } from './engines/anniversaire.js'
import { ANNIVERSARY_ART, drawContainedMark } from './anniversaryArt.js'

import { loadPosterFonts, loadPosterArt, posterText, posterRule } from './anniversaryPoster.js'

const W = 1600, H = 2000
const number = n => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)
const percentage = n => `${n >= 0 ? '+' : '−'}${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(n))} %`
function snapshot(item, raw, assetId) {
  const observation = resolveAnniversaryLevel(assetId, raw)
  if (!observation) throw new Error('Saisir un niveau actuel valide avant de télécharger l’image')
  const asset = getMarketAsset(assetId), art = ANNIVERSARY_ART[assetId]
  if (!asset || !art) throw new Error('Actif sans visuel vérifié')
  const date = ymForYearsBack(item.yearsBack, TODAY)
  return { assetId, asset, art, past: getHistoricalPrice(assetId, date), current: observation.value, currentLabel: observation.label, dateLabel: fmtYm(date, { monthLabels: MONTHS_FULL }) }
}
const level = (value, snap) => `${number(value)} ${snap.art.unit || currencySymbol(snap.asset.currency)}`

function panel(ctx, snap, images, { x = 0, scale = 1, period = true, yearsBack } = {}) {
  ctx.save(); ctx.translate(x,0); ctx.scale(scale,scale)
  const { art, past, current, dateLabel } = snap
  ctx.drawImage(images.scene,0,0,W,H)
  if (!images.embedded) {
    if (images.mark) {
      // A light plaque preserves dark official marks without recolouring them.
      ctx.save(); ctx.fillStyle = '#f6f1e6'; ctx.shadowColor = '#64a6ca'; ctx.shadowBlur = 35
      ctx.beginPath(); ctx.roundRect(180,260,1240,690,45); ctx.fill(); ctx.restore()
      drawContainedMark(ctx, images.mark, { width: Math.min(1080, art.markMaxWidth || 1080), height: Math.min(530, art.markMaxHeight || 530) })
    } else {
      posterText(ctx, art.indexTitle || art.title, W/2, 515, 150, { width: 1260, metal: 'silver' })
    }
  }
  const metal = images.silver ? 'silver' : 'gold'
  const isEse = art.posterFundIdentity
  const title = art.title
  posterText(ctx,title,W/2,isEse ? 840 : art.subtitle ? 900 : 935,215,{width:1430,metal:images.silver ? 'silver' : 'ivory'})
  if (isEse) {
    posterText(ctx,art.subtitle,W/2,1075,63,{width:1400})
    posterText(ctx,snap.asset.isin,W/2,1140,40,{spacing:6,width:1400,relief:false})
  } else if (art.subtitle) posterText(ctx,art.subtitle,W/2,1100,60,{width:1400})
  posterRule(ctx,330,isEse ? 1055 : 1125,1270,isEse ? 1055 : 1125,images.silver)
  const change = (current / past - 1) * 100
  posterText(ctx,percentage(change),W/2,1180,300,{width:1450,metal:change < 0 ? 'negative' : metal})
  if (period) posterText(ctx,`EN ${yearsBack} AN${yearsBack > 1 ? 'S' : ''}`,W/2,1500,130,{width:1400})
  posterRule(ctx,280,1640,1320,1640,images.silver)
  posterRule(ctx,800,1680,800,1905,images.silver)
  posterText(ctx,dateLabel.toUpperCase(),425,1695,48,{width:680,spacing:2,weight:400,relief:false})
  // Editorial label requested for every asset. Observation dates, freshness and
  // the dated text/input stay in the data model; this does not redate a quote.
  posterText(ctx,"AUJOURD’HUI",1175,1695,48,{width:680,spacing:2,weight:400,relief:false})
  posterRule(ctx,290,1760,560,1760,images.silver); posterRule(ctx,1040,1760,1310,1760,images.silver)
  posterText(ctx,level(past,snap),425,1790,128,{width:690,metal:'gold'})
  posterText(ctx,level(current,snap),1175,1790,128,{width:690,metal:'gold'})
  ctx.restore()
}

export async function renderAnniversaryImage(item, currentRaw, currentRawB = '') {
  const comparative = item.mode === MODES.COMPARATIF
  await Promise.all((comparative ? [item.assetIdA,item.assetIdB] : [item.assetId]).map(id=>anniversaryRecords.load(id)))
  const snapshots = [snapshot(item,currentRaw,comparative ? item.assetIdA : item.assetId)]
  if (comparative) snapshots.push(snapshot(item,currentRawB,item.assetIdB))
  const images = await Promise.all(snapshots.map(snap => loadPosterArt(snap.assetId, snap.art)))
  await loadPosterFonts()
  const canvas = document.createElement('canvas')
  const scale = comparative ? .75 : 1
  canvas.width = comparative ? 2400 : W; canvas.height = comparative ? 1500 : H
  const ctx = canvas.getContext('2d')
  snapshots.forEach((snap,i) => panel(ctx,snap,images[i],{x:i * W * scale,scale,period:!comparative,yearsBack:item.yearsBack}))
  if (comparative) posterRule(ctx,1200,150,1200,1400)
  posterText(ctx,'ÉPARGNANT LIBRE',canvas.width/2,53 * scale,48 * scale,{width:canvas.width-200,spacing:8 * scale,weight:400,relief:false})
  if (comparative) posterText(ctx,`EN ${item.yearsBack} AN${item.yearsBack > 1 ? 'S' : ''}`,canvas.width/2,1500 * scale,100 * scale,{spacing:3,width:1000})
  // Retain licensed source attribution, with a single account signature overall.
  const credits = [...new Set(snapshots.map(snap => snap.asset.sourceCredit).filter(Boolean))]
  const creditLines = credits.flatMap(credit => credit.replace(' · Calculs Épargnant Libre','').split('\n'))
  const creditTop = Math.min(1935, 1970 - (creditLines.length - 1) * 29)
  creditLines.forEach((line,i) => {
    posterText(ctx,line,canvas.width/2,(creditTop+i*29)*scale,24*scale,{width:canvas.width-120,weight:400,relief:false})
  })
  return canvas
}

export async function downloadAnniversaryImage(item, currentRaw, currentRawB) {
  const canvas = await renderAnniversaryImage(item,currentRaw,currentRawB)
  const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png'))
  if (!blob) throw new Error('Export PNG impossible')
  downloadPublicationBlob(blob, `il-y-a-${item.yearsBack}-ans-${item.mode === MODES.COMPARATIF ? `${item.assetIdA}-${item.assetIdB}` : item.assetId}.png`)
}
