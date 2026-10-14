import { createFormatEngine } from '../engine.js'
export * from '../constants.js'
import { COMPARATIF_ETF_SUBJECTS, getComparatifEtfText } from '../data/comparatifEtf.js'
const engine = createFormatEngine({ COMPARATIF_ETF_SUBJECTS, getComparatifEtfText })
export const { ALL_ITEMS, poolForFormat, getSubjectsForFormat, getSecondaryOptionsForFormat, pickNext, pickForSelection, buildDilemmeText, getMarketAsset, buildAnniversaireText, buildPerformanceDepuisText, buildAnniversaireComparatifText, getPerformanceEntries, buildPerformanceDepuisComparatifText, buildPouvoirAchatText, buildTweetText } = engine
export default engine
