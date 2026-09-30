// Logo files in public/broker-logos are copies from the publishers' own sites.
// Trade Republic is a vector crop of page 1 of its official French customer agreement.
export const BROKER_LOGOS = {
  tr: { file: 'tr.svg', source: 'https://assets.traderepublic.com/assets/files/CA_FR-en-fr.pdf' },
  bourso: { file: 'bourso.svg', source: 'https://www.boursobank.com/' },
  ibkr: { file: 'ibkr.svg', source: 'https://www.interactivebrokers.ie/images/common/logos/ibkr/interactive-brokers.svg' },
  fortuneo: { file: 'fortuneo.svg', source: 'https://www.fortuneo.fr/', dark: true },
  xtb: { file: 'xtb.svg', source: 'https://xas-cdn.xtb.com/build/twigImages/svg-icons/logo/logo_xtb.svg' },
  caidf: { file: 'caidf.svg', source: 'https://www.credit-agricole.fr/content/dam/assetsca/cr882/commun/images/logo/logo-2025.svg' },
  bd: { file: 'bd.svg', source: 'https://groupe.boursedirect.fr/wp-content/uploads/2021/07/OFFICIEL_logo_Bourse_Direct.svg' },
  saxo: { file: 'saxo.svg', source: 'https://www.home.saxo/-/media/global/logos/saxo-2022/saxo-beinvested-logo-blue.svg' },
}

const W = 1600
const H = 900
const imageCache = new Map()

function logoImage(brokerId) {
  if (!BROKER_LOGOS[brokerId]) return Promise.reject(new Error(`Logo officiel absent : ${brokerId}`))
  if (!imageCache.has(brokerId)) {
    const img = new Image()
    const promise = new Promise((resolve, reject) => {
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Impossible de charger le logo officiel ${brokerId}`))
    })
    img.src = `${import.meta.env.BASE_URL}broker-logos/${BROKER_LOGOS[brokerId].file}`
    imageCache.set(brokerId, promise)
  }
  return imageCache.get(brokerId)
}

function lightning(ctx, startX, startY, endX, endY, color, seed) {
  const points = [{ x: startX, y: startY }]
  for (let i = 1; i < 8; i++) {
    const t = i / 8
    points.push({ x: startX + (endX - startX) * t + Math.sin(seed * 17 + i * 7) * 22, y: startY + (endY - startY) * t + Math.cos(seed * 9 + i * 13) * 19 })
  }
  points.push({ x: endX, y: endY })
  ctx.save()
  ctx.lineJoin = 'round'
  for (const [width, alpha, blur] of [[15, 0.15, 22], [5, 0.65, 9], [2, 0.95, 0]]) {
    ctx.beginPath()
    points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))
    ctx.strokeStyle = color
    ctx.globalAlpha = alpha
    ctx.lineWidth = width
    ctx.shadowColor = color
    ctx.shadowBlur = blur
    ctx.stroke()
  }
  ctx.restore()
}

function logoPlate(ctx, img, brokerId, x, y, w, h, tornOnRight) {
  const dark = BROKER_LOGOS[brokerId].dark
  ctx.save()
  ctx.shadowColor = '#000000aa'
  ctx.shadowBlur = 32
  ctx.shadowOffsetY = 16
  ctx.beginPath()
  const ragged = (t) => Math.sin(t * 13 + (tornOnRight ? 3 : 7)) * 12 + Math.cos(t * 39) * 5
  if (tornOnRight) {
    ctx.moveTo(x - 15, y)
    ctx.lineTo(x + w - 15, y)
    for (let i = 0; i <= 26; i++) ctx.lineTo(x + w + ragged(i / 26), y + h * i / 26)
    ctx.lineTo(x - 15, y + h)
  } else {
    ctx.moveTo(x + w + 15, y)
    ctx.lineTo(x + 15, y)
    for (let i = 0; i <= 26; i++) ctx.lineTo(x + ragged(i / 26), y + h * i / 26)
    ctx.lineTo(x + w + 15, y + h)
  }
  ctx.closePath()
  ctx.fillStyle = dark ? '#151c2c' : '#f8f7f3'
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.clip()
  for (let i = 0; i < 120; i++) {
    const px = x + ((i * 137.2) % w)
    const py = y + ((i * 81.7) % h)
    ctx.fillStyle = dark ? '#ffffff09' : '#07112609'
    ctx.fillRect(px, py, 2 + i % 4, 1)
  }
  const maxW = w - 140
  const maxH = h - 84
  const scale = Math.min(maxW / img.width, maxH / img.height)
  const drawW = img.width * scale
  const drawH = img.height * scale
  ctx.drawImage(img, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH)
  ctx.restore()
}

export async function drawBrokerVersus(canvas, leftId, rightId, isCurrent = () => true) {
  const [leftLogo, rightLogo] = await Promise.all([logoImage(leftId), logoImage(rightId)])
  if (!isCurrent()) return
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const background = ctx.createLinearGradient(0, 0, W, H)
  background.addColorStop(0, '#2a060a')
  background.addColorStop(0.48, '#5f0c10')
  background.addColorStop(0.52, '#051b4b')
  background.addColorStop(1, '#040c26')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(790, 475, 15, 790, 475, 650)
  glow.addColorStop(0, '#f9a32988')
  glow.addColorStop(0.23, '#d4202755')
  glow.addColorStop(1, '#00000000')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  for (let i = 0; i < 160; i++) {
    const a = i * 2.39996
    const dist = 160 + (i * 67.4) % 1000
    const cx = 790 + Math.cos(a) * dist
    const cy = 475 + Math.sin(a) * dist
    ctx.beginPath()
    ctx.moveTo(790 + Math.cos(a) * 105, 475 + Math.sin(a) * 105)
    ctx.lineTo(cx, cy)
    ctx.strokeStyle = cx < 790 ? '#ff3c4322' : '#4299ff26'
    ctx.lineWidth = i % 8 === 0 ? 3 : 1
    ctx.stroke()
  }
  lightning(ctx, 0, 255, 520, 360, '#ff555d', 1)
  lightning(ctx, 175, 900, 650, 555, '#ff555d', 2)
  lightning(ctx, 1600, 210, 1100, 385, '#81c9ff', 3)
  lightning(ctx, 1430, 900, 1040, 560, '#81c9ff', 4)

  ctx.save()
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 32
  ctx.fillStyle = '#040912'
  ctx.beginPath()
  ctx.moveTo(835, 0)
  for (let y = 0; y <= H; y += 30) ctx.lineTo(820 - y * .105 + Math.sin(y * .071) * 17, y)
  ctx.lineTo(915, H)
  for (let y = H; y >= 0; y -= 30) ctx.lineTo(845 - y * .06 + Math.cos(y * .063) * 12, y)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  logoPlate(ctx, leftLogo, leftId, 0, 325, 665, 295, true)
  logoPlate(ctx, rightLogo, rightId, 935, 325, 665, 295, false)

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'italic 900 248px Arial, sans-serif'
  ctx.lineWidth = 24
  ctx.strokeStyle = '#160305'
  ctx.shadowColor = '#f85816'
  ctx.shadowBlur = 55
  ctx.strokeText('VS', 800, 475)
  const metal = ctx.createLinearGradient(0, 345, 0, 590)
  metal.addColorStop(0, '#ffffff')
  metal.addColorStop(.43, '#c8d0d9')
  metal.addColorStop(.53, '#ffe2a3')
  metal.addColorStop(1, '#e04819')
  ctx.fillStyle = metal
  ctx.fillText('VS', 800, 475)
  ctx.restore()

  ctx.fillStyle = '#f5f5f7'
  ctx.textAlign = 'center'
  ctx.font = '700 28px Arial, sans-serif'
  ctx.fillText('DUEL DE COURTIERS', 800, 104)
  ctx.font = '700 24px Arial, sans-serif'
  ctx.fillText('ÉPARGNANT LIBRE', 800, 825)
  ctx.font = '17px Arial, sans-serif'
  ctx.fillStyle = '#ffffffb0'
  ctx.fillText('Comparatif indépendant · logos issus des sites officiels', 800, 855)
}
