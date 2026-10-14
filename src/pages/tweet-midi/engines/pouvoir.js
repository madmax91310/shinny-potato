import { createFormatEngine } from '../engine.js'
export * from '../constants.js'
import { AMOUNT_PRESETS as PA_AMOUNT_PRESETS, YEAR_MIN as PA_YEAR_MIN, YEAR_MAX as PA_YEAR_MAX, POSTE_ORDER as PA_POSTE_ORDER } from '../../../data/purchasing-power.js'
import { buildTweetText as buildPouvoirAchatTweetText } from '../../purchasing-power/lib.js'
const engine = createFormatEngine({ PA_AMOUNT_PRESETS, PA_YEAR_MIN, PA_YEAR_MAX, PA_POSTE_ORDER, buildPouvoirAchatTweetText })
export const { ALL_ITEMS, poolForFormat, getSubjectsForFormat, getSecondaryOptionsForFormat, pickNext, pickForSelection, buildDilemmeText, getMarketAsset, buildAnniversaireText, buildPerformanceDepuisText, buildAnniversaireComparatifText, getPerformanceEntries, buildPerformanceDepuisComparatifText, buildPouvoirAchatText, buildTweetText } = engine
export default engine
