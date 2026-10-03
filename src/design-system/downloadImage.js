export function downloadImage(canvas, filename) {
  const link = document.createElement('a')
  link.href = typeof canvas === 'string' ? canvas : canvas.toDataURL('image/png')
  link.download = filename
  link.click()
}
