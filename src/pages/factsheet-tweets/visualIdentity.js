// Reviewed exposure illustrations. Abstract glass blocks never encode weights.
const identities = {
  'msci-world-momentum': ['world','Pays développés · filtre Momentum'],
  'msci-world-minimum-volatility-usd': ['world','Pays développés · volatilité minimale en USD'],
  'msci-world-sector-neutral-quality': ['world','Pays développés · filtre Quality'],
  'msci-world-enhanced-value': ['world','Pays développés · filtre Value'],
  'msci-em-ex-china': ['emerging','Marchés émergents hors Chine'],
  'acwi-imi': ['world','Développés, émergents et petites capitalisations'],
  'sp500-pea': ['sp500', 'Grandes entreprises américaines'],
  'sp500-equal-weight': ['sp500', 'Même univers, pondération égale'],
  'nasdaq-pea': ['nasdaq', 'Grandes entreprises du Nasdaq'],
  stoxx600: ['europe600', 'Entreprises européennes'],
  eurostoxx50: ['europe50', 'Grandes entreprises de la zone euro'],
  mscieurope: ['world', 'Marchés développés européens'],
  topix: ['japan', 'Marché japonais'], nikkei225: ['japan', '225 entreprises japonaises'],
  world: ['world', 'Marchés développés'], acwi: ['world', 'Marchés développés et émergents'],
  'ftse-all-world': ['world', 'Marchés développés et émergents'],
  'world-ex-usa': ['world', 'Marchés développés hors États-Unis'],
  'world-small-cap': ['world', 'Petites capitalisations des marchés développés'],
  'em-standard': ['emerging', 'Marchés émergents'],
  'em-esg': ['emerging', 'Marchés émergents · sélection ESG'],
  'russell-2000': ['small', 'Petites entreprises américaines'],
}
export const INDEX_RIBBON_ART = Object.freeze(identities)
const images = new Map()
export function getIndexArt(sheet) {
  const entry = identities[sheet.id]
  if (!entry) throw new Error(`Illustration d’indice non vérifiée : ${sheet.id}`)
  return { scene: entry[0], description: entry[1] }
}
export function loadIndexArt(sheet) {
  const { scene } = getIndexArt(sheet)
  if (!images.has(scene)) images.set(scene, (async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}asset-art/index-ribbon/${scene}.webp.b64`)
    if (!response.ok) throw new Error(`Illustration indisponible : ${scene}`)
    const image = new Image()
    image.src = `data:image/webp;base64,${(await response.text()).trim()}`
    await image.decode()
    return image
  })().catch(error => { images.delete(scene); throw error }))
  return images.get(scene)
}
