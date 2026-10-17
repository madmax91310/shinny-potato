import {getAsset} from './portfolio-assets.js'
// Source modules already contain the complete records; the production build
// replaces this loader with selected-record fetches generated from those records.
export async function ensurePortfolioAssets(ids) {
 return ids.map(id=>{const asset=getAsset(id);if(!asset)throw Error('Actif introuvable');return asset})
}
