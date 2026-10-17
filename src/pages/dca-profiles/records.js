import legacy from './exposures.json' with {type:'json'}
import extra0 from './exposures-extra-0.json' with {type:'json'}
import extra1 from './exposures-extra-1.json' with {type:'json'}
import extra2 from './exposures-extra-2.json' with {type:'json'}
export const references = {...legacy,...extra0,...extra1,...extra2}
export const exposureRecords = { isReady:() => true, load:async () => {} }

export async function loadExposureCatalog() { return references }
