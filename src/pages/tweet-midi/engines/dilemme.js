import { createFormatEngine } from '../engine.js'
export * from '../constants.js'
import { DILEMMES, SITUATIONS } from '../data/dilemmes.js'
const engine = createFormatEngine({ DILEMMES, SITUATIONS })
export const { poolForFormat, getSubjectsForFormat, getSecondaryOptionsForFormat, pickNext, pickForSelection, buildDilemmeText, getMarketAsset, buildAnniversaireText, buildPerformanceDepuisText, buildAnniversaireComparatifText, getPerformanceEntries, buildPerformanceDepuisComparatifText, buildPouvoirAchatText, buildTweetText } = engine
export const ALL_ITEMS = /* @__PURE__ */ (() => engine.ALL_ITEMS)()
export default engine
