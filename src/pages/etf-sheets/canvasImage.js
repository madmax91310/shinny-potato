// Génération de l'image de la fiche (canvas 2D) — reprise telle quelle de la
// session d'origine, juste recolorée en teal/navy pour matcher le design system.
import { CATEGORY_EMOJI } from './data'
import { buildFactRows } from './lib'

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/)
  const lines = []
  let current = ''
  words.forEach((word) => {
    const test = current ? current + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  })
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const IMG_FONTS = {
  kicker: "700 22px -apple-system, 'Segoe UI', Arial, sans-serif",
  name: "600 50px Georgia, 'Times New Roman', serif",
  ticker: "26px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  badge: "700 22px -apple-system, 'Segoe UI', Arial, sans-serif",
  fact: "32px -apple-system, 'Segoe UI', Arial, sans-serif",
  factMono: "30px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  footer: "24px -apple-system, 'Segoe UI', Arial, sans-serif",
}

export function renderETFImage(etf) {
  const SCALE = 2
  const W = 1080
  const PAD = 64
  const iconColW = 56
  const contentWidth = W - PAD * 2

  const dot = CATEGORY_EMOJI[etf.category] || '⚫'
  const tickerStr = '(' + etf.tickers.join(' / ') + ')'
  const factRows = buildFactRows(etf)

  const mcanvas = document.createElement('canvas')
  const mctx = mcanvas.getContext('2d')

  mctx.font = IMG_FONTS.name
  const nameLines = wrapText(mctx, dot + '  ' + etf.name, contentWidth)

  const factLineWraps = factRows.map((f) => {
    mctx.font = f.mono ? IMG_FONTS.factMono : IMG_FONTS.fact
    return wrapText(mctx, f.text, contentWidth - iconColW)
  })

  const kickerH = 30, gapAfterKicker = 22
  const nameLineH = 60, tickerLineH = 48
  const badgeH = etf.isNew ? 58 : 0
  const gapBeforeDivider = 30, dividerGap = 38
  const factLineH = 44, factRowGap = 24
  const gapBeforeFooterDivider = 6, footerDividerGap = 32, footerH = 30

  let y = PAD
  y += kickerH + gapAfterKicker
  y += nameLines.length * nameLineH
  y += tickerLineH
  if (etf.isNew) y += badgeH
  y += gapBeforeDivider + dividerGap
  factLineWraps.forEach((lines) => {
    y += Math.max(1, lines.length) * factLineH + factRowGap
  })
  y += gapBeforeFooterDivider + footerDividerGap
  y += footerH
  y += PAD

  const H = Math.ceil(y)

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)
  ctx.textBaseline = 'top'

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0f1e3d')
  bg.addColorStop(1, '#0a1122')
  ctx.fillStyle = bg
  roundRectPath(ctx, 0, 0, W, H, 28)
  ctx.fill()

  ctx.strokeStyle = 'rgba(45,212,191,0.35)'
  ctx.lineWidth = 2
  roundRectPath(ctx, 1, 1, W - 2, H - 2, 28)
  ctx.stroke()

  const cx = PAD
  let cy = PAD

  ctx.font = IMG_FONTS.kicker
  ctx.fillStyle = '#2dd4bf'
  ctx.fillText('📋 PRÉSENTATION D\'ETF', cx, cy)
  cy += kickerH + gapAfterKicker

  ctx.font = IMG_FONTS.name
  ctx.fillStyle = '#f1f5f9'
  nameLines.forEach((line) => {
    ctx.fillText(line, cx, cy)
    cy += nameLineH
  })

  ctx.font = IMG_FONTS.ticker
  ctx.fillStyle = '#5eead4'
  ctx.fillText(tickerStr, cx, cy)
  cy += tickerLineH

  if (etf.isNew) {
    const badgeText = '🆕 Nouveau'
    ctx.font = IMG_FONTS.badge
    const bw = ctx.measureText(badgeText).width + 34
    const bh = 42
    ctx.fillStyle = '#5eead4'
    roundRectPath(ctx, cx, cy, bw, bh, bh / 2)
    ctx.fill()
    ctx.fillStyle = '#052e2b'
    ctx.textBaseline = 'middle'
    ctx.fillText(badgeText, cx + 17, cy + bh / 2 + 1)
    ctx.textBaseline = 'top'
    cy += badgeH
  }

  cy += gapBeforeDivider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(W - PAD, cy)
  ctx.stroke()
  cy += dividerGap

  factRows.forEach((f, i) => {
    const lines = factLineWraps[i]
    ctx.font = IMG_FONTS.fact
    ctx.fillStyle = '#f1f5f9'
    ctx.fillText(f.icon, cx, cy)
    ctx.font = f.mono ? IMG_FONTS.factMono : IMG_FONTS.fact
    ctx.fillStyle = f.mono ? '#5eead4' : '#c7cde3'
    lines.forEach((line, li) => {
      ctx.fillText(line, cx + iconColW, cy + li * factLineH)
    })
    cy += Math.max(1, lines.length) * factLineH + factRowGap
  })

  cy += gapBeforeFooterDivider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(W - PAD, cy)
  ctx.stroke()
  cy += footerDividerGap

  ctx.font = IMG_FONTS.footer
  ctx.fillStyle = '#64748b'
  ctx.fillText('⚠️ Pas un conseil en investissement', cx, cy)

  return canvas
}
