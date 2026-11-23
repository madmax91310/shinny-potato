// Run before the application loads to capture the lettering on the actual PNG
// canvas. Other canvases (including detailed exports) are outside this check.
export function observeInvestorCanvas() {
  const prototype = CanvasRenderingContext2D.prototype
  const fillText = prototype.fillText
  const toDataURL = HTMLCanvasElement.prototype.toDataURL
  const observed = new WeakMap()
  const linear = value => value / 255 <= .04045 ? value / 255 / 12.92 : ((value / 255 + .055) / 1.055) ** 2.4
  const luminance = rgb => .2126 * linear(rgb[0]) + .7152 * linear(rgb[1]) + .0722 * linear(rgb[2])
  prototype.fillText = function (text, x, y, ...rest) {
    const { canvas } = this
    if (canvas.width === 1080 && canvas.height === 1350) {
      const metrics = this.measureText(text)
      const left = Math.floor(x - metrics.actualBoundingBoxLeft)
      const top = Math.floor(y - metrics.actualBoundingBoxAscent)
      const right = Math.ceil(x + metrics.actualBoundingBoxRight)
      const bottom = Math.ceil(y + metrics.actualBoundingBoxDescent)
      const pixels = this.getImageData(left, top, Math.max(1, right - left), Math.max(1, bottom - top)).data
      const rgb = this.fillStyle.slice(1).match(/../g).map(pair => parseInt(pair, 16))
      const foreground = luminance(rgb)
      let underThreshold = 0
      for (let index = 0; index < pixels.length; index += 4) {
        const background = luminance(pixels.subarray(index, index + 3))
        if ((Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) < 4.5) underThreshold++
      }
      const boxes = observed.get(canvas) ?? []
      boxes.push({ text, left, top, right, bottom, size: Number(this.font.match(/([\d.]+)px/)?.[1]),
        lowContrastFraction: underThreshold / (pixels.length / 4) })
      observed.set(canvas, boxes)
    }
    return fillText.call(this, text, x, y, ...rest)
  }

  HTMLCanvasElement.prototype.toDataURL = function (...args) {
    const boxes = observed.get(this)
    if (boxes) window.investorCanvasLettering = boxes
    return toDataURL.apply(this, args)
  }
}
