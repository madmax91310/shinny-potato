// Reviewed exposure illustrations. Abstract glass blocks never encode weights.
const identities = {
 'msci-world-consumer-discretionary':['world','Pays développés · consommation discrétionnaire'],
 'msci-world-communication-services':['world','Pays développés · services de communication'],
  'msci-world-health-care': ['health', 'Pays développés · secteur santé'],
  'msci-world-financials': ['finance', 'Pays développés · secteur financier'],
  'msci-world-energy': ['energy', 'Pays développés · secteur énergie'],
  'world-islamic':['world','Pays développés · filtres de finance islamique'],
  'msci-world-materials':['world','Pays développés · matériaux'],
  'msci-world-utilities':['infrastructure','Pays développés · services publics'],
  'msci-world-industrials': ['infrastructure', 'Pays développés · secteur industriel'],
  'msci-world-consumer-staples': ['world', 'Pays développés · consommation de base'],
  'msci-em-imi': ['emerging', 'Marchés émergents · grandes, moyennes et petites capitalisations'],
  'ftse-all-world-high-dividend-yield': ['world', 'Développés et émergents · dividendes élevés'],
  'sp-global-dividend-aristocrats': ['world', 'Dividendes mondiaux · sélection Quality Income'],
  'msci-world-growth': ['world', 'Pays développés · filtre Growth'],
  'msci-usa': ['sp500', 'Grandes et moyennes entreprises américaines'],
  'msci-india': ['emerging', 'Grandes et moyennes entreprises indiennes'],
  'ftse-epra-nareit-developed-dividend-plus': ['property','Immobilier coté · pays développés · Dividend+'],
  'ftse-global-core-infrastructure': ['infrastructure','Infrastructures cotées · développés et émergents'],
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
  // Fiches dérivées du registre (lot 7, 18/10/2026) : scènes sans numéral uniquement,
  // le nom exact de l'indice, les pays et les lignes viennent du registre.
  'ftse-china-50': ['emerging', 'Grandes entreprises chinoises cotées à Hong Kong'],
  'ftse-em': ['emerging', 'Marchés émergents · grandes et moyennes capitalisations'],
  'msci-china': ['emerging', 'Grandes et moyennes entreprises chinoises'],
  'msci-china-a': ['emerging', 'Actions A chinoises · grandes et moyennes capitalisations'],
  'msci-em-asia-screened': ['emerging', 'Marchés émergents d’Asie · filtres d’exclusion'],
  'msci-em-emea-esg': ['emerging', 'Émergents Europe, Moyen-Orient et Afrique · sélection ESG'],
  'msci-em-latin-america': ['emerging', 'Marchés émergents d’Amérique latine'],
  'msci-em-latin-america-selection': ['emerging', 'Amérique latine · sélection plafonnée 20/35'],
  'msci-japan-imi': ['japan', 'Marché japonais · grandes, moyennes et petites capitalisations'],
  'msci-world-high-dividend-yield-advanced-select': ['world', 'Pays développés · dividendes élevés · sélection avancée'],
  'sp-euro-dividend-aristocrats': ['world', 'Zone euro · dividendes en hausse régulière'],
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
    const reused = ['property', 'infrastructure', 'health', 'finance', 'energy'].includes(scene)
    const response = await fetch(`${import.meta.env.BASE_URL}asset-art/${reused ? `etf-night/${scene}.webp` : `index-ribbon/${scene}.webp.b64`}`)
    if (!response.ok) throw new Error(`Illustration indisponible : ${scene}`)
    const image = new Image()
    const objectUrl = reused ? URL.createObjectURL(await response.blob()) : null
    image.src = objectUrl ?? `data:image/webp;base64,${(await response.text()).trim()}`
    try { await image.decode(); return image } finally { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  })().catch(error => { images.delete(scene); throw error }))
  return images.get(scene)
}
