import { createFormatEngine } from '../engine.js'
export * from '../constants.js'
import { DILEMMES, SITUATIONS } from '../data/dilemmes.js'
const engine = createFormatEngine({ DILEMMES, SITUATIONS })
export const { ALL_ITEMS, poolForFormat, getSubjectsForFormat, getSecondaryOptionsForFormat, pickNext, pickForSelection, buildDilemmeText, getMarketAsset, buildAnniversaireText, buildPerformanceDepuisText, buildAnniversaireComparatifText, getPerformanceEntries, buildPerformanceDepuisComparatifText, buildPouvoirAchatText, buildTweetText } = engine
export default engine
