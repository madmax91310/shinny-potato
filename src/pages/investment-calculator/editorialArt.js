import { loadInvestmentArt } from './emeraldArt.js'

// Asset illustrations are shared with the existing catalogue. Figures and
// charts are always drawn separately from the unchanged calculation result.
export async function loadInvestmentEditorialArt(id) {
  return loadInvestmentArt(id)
}

export function drawObsidianBackdrop(ctx, width, height) {
  ctx.fillStyle = '#0d0e10'; ctx.fillRect(0, 0, width, height)
  const light = ctx.createRadialGradient(width, 0, 0, width, 0, width * .85)
  light.addColorStop(0, '#b17b3430'); light.addColorStop(1, '#b17b3400')
  ctx.fillStyle = light; ctx.fillRect(0, 0, width, height)
  const lower = ctx.createRadialGradient(0, height, 0, 0, height, width * .7)
  lower.addColorStop(0, '#b17b3419'); lower.addColorStop(1, '#b17b3400')
  ctx.fillStyle = lower; ctx.fillRect(0, 0, width, height)
}

export function drawObsidianAsset(ctx, art, x, y, width, height) {
  const image = art.mark || art.scene || art.background
  if (!image) return
  ctx.save()
  ctx.shadowColor = '#00000080'; ctx.shadowBlur = 32; ctx.shadowOffsetY = 12
  const surface = ctx.createLinearGradient(x, y, x + width, y + height)
  surface.addColorStop(0, '#393124'); surface.addColorStop(.48, '#171719'); surface.addColorStop(1, '#24201b')
  ctx.fillStyle = surface; ctx.beginPath(); ctx.roundRect(x, y, width, height, 38); ctx.fill()
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
  ctx.strokeStyle = '#b994544f'; ctx.lineWidth = 2; ctx.stroke()
  ctx.beginPath(); ctx.roundRect(x + 12, y + 12, width - 24, height - 24, 28); ctx.clip()
  if (art.mark) {
    // Official marks retain their original colours and proportions.
    const ratio = Math.min((width - 100) / image.width, (height - 90) / image.height)
    const w = image.width * ratio, h = image.height * ratio
    ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h)
  } else {
    const ratio = Math.max(width / image.width, height / image.height)
    const w = image.width * ratio, h = image.height * ratio
    ctx.filter = 'grayscale(.5) sepia(.45)'
    ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h)
    ctx.filter = 'none'
    const shade = ctx.createLinearGradient(x, y, x, y + height)
    shade.addColorStop(0, '#0d0e1000'); shade.addColorStop(1, '#0d0e1070')
    ctx.fillStyle = shade; ctx.fillRect(x, y, width, height)
  }
  ctx.restore()
}
