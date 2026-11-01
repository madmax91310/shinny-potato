import { createFormatEngine } from '../engine.js'
export * from '../constants.js'
import { FICHE_LEXIQUE_SUBJECTS, getFicheLexiqueText } from '../data/ficheLexique.js'
import { TERMES } from '../../../data/financial-lexicon.js'
const engine = createFormatEngine({ FICHE_LEXIQUE_SUBJECTS, getFicheLexiqueText, TERMES })
export const { poolForFormat, getSubjectsForFormat, getSecondaryOptionsForFormat, pickNext, pickForSelection, buildDilemmeText, getMarketAsset, buildAnniversaireText, buildPerformanceDepuisText, buildAnniversaireComparatifText, getPerformanceEntries, buildPerformanceDepuisComparatifText, buildPouvoirAchatText, buildTweetText } = engine
export const ALL_ITEMS = /* @__PURE__ */ (() => engine.ALL_ITEMS)()
export default engine
