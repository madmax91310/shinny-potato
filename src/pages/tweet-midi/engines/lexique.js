import { createFormatEngine } from '../engine.js'
export * from '../constants.js'
import { FICHE_LEXIQUE_SUBJECTS, getFicheLexiqueText } from '../data/ficheLexique.js'
import { TERMES } from '../../../data/financial-lexicon.js'
const engine = createFormatEngine({ FICHE_LEXIQUE_SUBJECTS, getFicheLexiqueText, TERMES })
export const { ALL_ITEMS, poolForFormat, getSubjectsForFormat, getSecondaryOptionsForFormat, pickNext, pickForSelection, buildDilemmeText, getMarketAsset, buildAnniversaireText, buildPerformanceDepuisText, buildAnniversaireComparatifText, getPerformanceEntries, buildPerformanceDepuisComparatifText, buildPouvoirAchatText, buildTweetText } = engine
export default engine
