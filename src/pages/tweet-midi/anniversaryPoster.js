import { loadArtImage } from '../../lib/art-resources.js'

const ROOT = 'anniversary-sculptural/'
// These four textless plates derive from the user's approved posters. No
// financial number is baked into them; every label remains a Canvas value.
const PLATES = Object.freeze({ bitcoin: 'bitcoin', microsoft: 'microsoft', or: 'gold', sp500: 'america', etfFR0011550185: 'america', etfFR0011550185Nav: 'america' })
let fontsReady
export function loadPosterFonts() {
  if (!fontsReady) fontsReady = Promise.all([['AnniversaryPoster', 'poster-bold.otf', '700'], ['AnniversaryMasthead', 'poster-regular.otf', '400']].map(async ([name, file, weight]) => {
    const face = await new FontFace(name, `url("${import.meta.env.BASE_URL}asset-art/${ROOT}${file}")`, { weight }).load()
    document.fonts.add(face)
  })).catch(error => { fontsReady = undefined; throw error })
  return fontsReady
}
export async function loadPosterArt(assetId, art) {
  const plate = PLATES[assetId]
  return {
    scene: await loadArtImage(`${ROOT}${plate || 'stage'}.webp`),
    embedded: Boolean(plate),
    silver: assetId === 'microsoft',
    mark: !plate && art.mark ? await loadArtImage(art.mark).catch(() => null) : null,
  }
}

export function posterText(ctx, value, x, y, size, { width = 1400, weight = 700, spacing = 0, metal = 'ivory', relief = true } = {}) {
  ctx.save()
  ctx.textBaseline = 'top'; ctx.textAlign = 'center'; ctx.letterSpacing = `${spacing}px`
  const family = weight === 400 ? 'AnniversaryMasthead' : 'AnniversaryPoster'
  while (size > 16) {
    ctx.font = `${weight} ${size}px ${family}, Georgia, serif`
    if (ctx.measureText(value).width <= width) break
    size -= 2
  }
  if (ctx.measureText(value).width > width) throw new Error('Le niveau saisi est trop long pour l’image')
  const height = size * .94
  const gradient = ctx.createLinearGradient(0, y, 0, y + height)
  const colors = metal === 'gold' ? ['#fff7c9', '#ffe295', '#fff9df', '#d39835', '#ffde7c', '#a35b14']
    : metal === 'silver' ? ['#ffffff', '#d7e4ef', '#ffffff', '#8798ac', '#e2f4ff', '#76a7cc']
      : metal === 'negative' ? ['#fff0e5', '#ffba9c', '#fff2df', '#bd6352', '#ffcab1', '#87443c']
        : ['#ffffff', '#e5dfd0', '#fffdf4', '#9a9182', '#eee8dc', '#a29989']
  colors.forEach((color, index) => gradient.addColorStop(index / (colors.length - 1), color))
  if (relief) {
    ctx.lineWidth = Math.max(1, size * .009); ctx.lineJoin = 'round'
    ctx.strokeStyle = metal === 'silver' ? '#183a55' : '#54300f'
    for (let offset = Math.min(9, size * .035); offset > 0; offset -= 1) ctx.strokeText(value, x + offset * .35, y + offset)
    ctx.strokeStyle = metal === 'gold' ? '#ffebae' : '#f4f2e8'
    ctx.lineWidth = Math.max(.8, size * .005)
    ctx.strokeText(value, x, y)
    ctx.shadowColor = metal === 'silver' ? '#087bc9' : '#ae590e'
    ctx.shadowBlur = Math.min(18, size * .05); ctx.shadowOffsetY = 4
  }
  ctx.fillStyle = relief ? gradient : '#f5efdf'
  ctx.fillText(value, x, y)
  ctx.restore()
}

export function posterRule(ctx, x1, y1, x2, y2, silver = false) {
  ctx.save()
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
  gradient.addColorStop(0, 'transparent'); gradient.addColorStop(.4, silver ? '#4dafe8' : '#c68c3d')
  gradient.addColorStop(.5, '#fff1c7'); gradient.addColorStop(.6, silver ? '#4dafe8' : '#c68c3d'); gradient.addColorStop(1, 'transparent')
  ctx.strokeStyle = gradient; ctx.lineWidth = 2
  ctx.shadowColor = silver ? '#168ee5' : '#dc871e'; ctx.shadowBlur = 12
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  ctx.restore()
}
