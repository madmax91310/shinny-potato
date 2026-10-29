import {ASSETS} from '../../src/data/portfolio-assets.js'
import qualified from '../qualified-exposure-sources.json' with {type:'json'}

// Same scope for the producer and its field requirements. Fixed Income is
// verified against the exact share by collect_qualified_exposures.parse_page;
// admission to a portfolio model is a separate capability.
const bonds=new Set([
 ...ASSETS.filter(a=>a.cat==='obligataire'&&a.isin).map(a=>a.isin),
 ...qualified.instruments.filter(a=>(a.fundAssetClass??a.holdingsAssetClass)==='Fixed Income').map(a=>a.isin),
])
const commodities=new Set(ASSETS.filter(a=>a.cat==='matieres_premieres'&&a.isin).map(a=>a.isin))
export function outsideEquityClassification(isin,name='') {
 let classification=['FR0013346681','LU0290358497'].includes(isin)?'Monétaire':isin==='GB00B15KXQ89'?'Cuivre':null
 // Preserve existing product classification; no new fund-name inference.
 if(/physical.*gold|physical.*silver|physical.*platinum|physical.*palladium|physical.*bitcoin|ethereum|bitcoin etp/i.test(name))
  classification=/gold/i.test(name)?'Or':/silver/i.test(name)?'Argent':/platinum/i.test(name)?'Platine':/palladium/i.test(name)?'Palladium':/bitcoin/i.test(name)?'Bitcoin':'Ethereum'
 return classification??(commodities.has(isin)?'Matières premières':bonds.has(isin)?'Obligations':null)
}
