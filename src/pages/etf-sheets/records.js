import { ETFS, CATEGORY_EMOJI } from '../../data/etf-cards.js'
import { ETF_PUBLICATION_DATA } from '../../data/etf-publication-data.js'
import { instrumentOption } from '../../data/asset-selection.js'
export { ETFS, CATEGORY_EMOJI, ETF_PUBLICATION_DATA }
export const OPTIONS = ETFS.map(instrumentOption)
export function readSheetRecord(id) { return ETFS.find(etf=>etf.id===id) }
export async function loadSheetRecord(id) { return {etf:readSheetRecord(id),publication:ETF_PUBLICATION_DATA[readSheetRecord(id)?.isin]} }
