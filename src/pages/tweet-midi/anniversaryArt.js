import { ANNIVERSARY_INDEX_VARIANTS } from './data/indexVariants.js'
// Explicit identities: an issuer logo is never substituted for an index or fund.
// Sources and visual review: public/asset-art/README.md.
export const ANNIVERSARY_ART = Object.freeze({
  ...Object.fromEntries([
    ['cac40', 'CAC 40'], ['sp500', 'S&P 500'], ['stoxx600', 'STOXX EUROPE 600'],
    ['msciWorld', 'MSCI WORLD'], ['msciEmerging', 'MSCI EMERGING MARKETS'],
    ['msciWorldSmallCap', 'MSCI WORLD SMALL CAP'],
    ['msciAcwi','MSCI ACWI'], ['msciAcwiImi','MSCI ACWI IMI'], ['msciWorldExUsa','MSCI WORLD EX USA'],
  ].map(([id, title]) => [id, { title, subtitle: ANNIVERSARY_INDEX_VARIANTS[id], kind: 'illustration', unit: 'pts', indexTitle: title }])),
  bitcoin: { title: 'BITCOIN', mark: 'bitcoin.svg', kind: 'logo' },
  ethereum: { title: 'ETHEREUM', mark: 'ethereum.svg', kind: 'logo' },
  nasdaq100: { title: 'NASDAQ-100', mark: 'nasdaq.svg', kind: 'illustration', unit: 'pts' },
  soxx: { title: 'SEMI-CONDUCTEURS', subtitle: 'ETF SOXX', mark: 'chip.svg', kind: 'illustration' },
  or: { title: 'OR', subtitle: 'Once · moyenne mensuelle', scene: 'gold.webp', kind: 'illustration', unit: '$/oz' },
  silver: { title: 'ARGENT', subtitle: 'Futures COMEX · once', scene: 'silver.webp', kind: 'illustration', unit: '$/oz' },
  apple: { title: 'APPLE', mark: 'apple.svg', kind: 'logo', scene: 'approved/anniversary-apple.webp', embeddedMark: true },
  microsoft: { title: 'MICROSOFT', mark: 'microsoft.svg', kind: 'logo' },
  broadcom: { title: 'BROADCOM', mark: 'broadcom.svg', kind: 'logo' },
  tesla: { title: 'TESLA', mark: 'tesla.svg', kind: 'logo' },
  berkshire: { title: 'BERKSHIRE HATHAWAY', subtitle: 'Classe B', mark: 'holding.svg', kind: 'illustration' },
  asml: { title: 'ASML', subtitle: 'Amsterdam · EUR', mark: 'asml.svg', kind: 'logo' },
})

const imageCache = new Map()
let fontReady
const assetUrl = file => `${import.meta.env.BASE_URL}asset-art/${file}`
export function loadArtImage(file) {
  if (!imageCache.has(file)) {
    const pending = new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(`Le visuel ${file} n’a pas pu être chargé. Réessayer l’export.`))
      image.src = assetUrl(file)
    }).catch(error => { imageCache.delete(file); throw error })
    imageCache.set(file, pending)
  }
  return imageCache.get(file)
}
export function loadEditorialFont() {
  if (!fontReady) {
    fontReady = new FontFace('ExportEditorial', `url("${assetUrl('editorial.woff2')}")`, { weight: '500' }).load()
      .then(font => { document.fonts.add(font) })
      .catch(error => { fontReady = undefined; throw error })
  }
  return fontReady
}

// The downloaded SVG silhouette remains unchanged. Only the surface is shaded;
// reflections and extrusion are drawn from that same alpha mask.
export function drawTitaniumMark(ctx, image, x, y, width, height) {
  const w = Math.round(width), h = Math.round(height)
  const mask = document.createElement('canvas'); mask.width = w; mask.height = h
  const m = mask.getContext('2d')
  const ratio = Math.min(w / image.width, h / image.height)
  const iw = image.width * ratio, ih = image.height * ratio
  m.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih)
  const shade = (stops, offset = 0) => {
    const layer = document.createElement('canvas'); layer.width = w; layer.height = h
    const c = layer.getContext('2d'); c.drawImage(mask, 0, 0); c.globalCompositeOperation = 'source-in'
    const gradient = c.createLinearGradient(0, offset, w, h + offset)
    stops.forEach(([at, color]) => gradient.addColorStop(at, color))
    c.fillStyle = gradient; c.fillRect(0, 0, w, h); return layer
  }
  const edge = shade([[0,'#ede8dc'],[.25,'#77756f'],[.5,'#d8d5cc'],[.8,'#444643'],[1,'#a8a49b']])
  ctx.save()
  ctx.shadowColor = 'rgba(30,25,20,.3)'; ctx.shadowBlur = 26; ctx.shadowOffsetX = 17; ctx.shadowOffsetY = 22
  ctx.drawImage(edge, x + 13, y + 13); ctx.shadowColor = 'transparent'
  for (let depth = 12; depth >= 1; depth--) ctx.drawImage(edge, x + depth, y + depth)
  const highlight = shade([[0,'#fffff5'],[.32,'#f6f3e9'],[.6,'#9f9d95'],[1,'#ece8dc']])
  ctx.drawImage(highlight, x - 2, y - 2)
  const face = shade([[0,'#e7e4da'],[.23,'#b5b3ab'],[.4,'#f1ede1'],[.53,'#b7b4aa'],[.68,'#dfdbcf'],[.83,'#a5a39b'],[1,'#efeee8']])
  ctx.drawImage(face, x, y)
  // Fine, deterministic brushing clipped by the exact vector mask.
  const grain = document.createElement('canvas'); grain.width = w; grain.height = h
  const g = grain.getContext('2d'); g.drawImage(mask,0,0); g.globalCompositeOperation = 'source-in'
  g.fillStyle = '#fff'; g.fillRect(0,0,w,h); g.globalCompositeOperation = 'source-atop'
  for (let row = 0; row < h; row += 3) { g.fillStyle = row % 9 === 0 ? '#666' : '#ddd'; g.fillRect(0,row,w,1) }
  ctx.globalAlpha = .085; ctx.drawImage(grain,x,y); ctx.restore()
  ctx.save(); ctx.globalAlpha = .09
  ctx.translate(x, y + h + 24); ctx.scale(1,-.14)
  ctx.drawImage(face,0,0); ctx.restore()
}
