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

