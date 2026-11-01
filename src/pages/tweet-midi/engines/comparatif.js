import { comparisonCurrencies } from '../comparisonPerformance.js'
import { getComparatifEtfTheme } from '../data/comparatifEtf.js'
import { createFormatEngine } from '../engine.js'
export * from '../constants.js'
import { COMPARATIF_ETF_SUBJECTS, getComparatifEtfText } from '../data/comparatifEtf.js'
const engine = createFormatEngine({ COMPARATIF_ETF_SUBJECTS, getComparatifEtfText })
export const { poolForFormat, getSubjectsForFormat, getSecondaryOptionsForFormat, pickNext, pickForSelection, buildDilemmeText, getMarketAsset, buildAnniversaireText, buildPerformanceDepuisText, buildAnniversaireComparatifText, getPerformanceEntries, buildPerformanceDepuisComparatifText, buildPouvoirAchatText, buildTweetText } = engine
engine.getPerformanceCurrencies = item => comparisonCurrencies(getComparatifEtfTheme(item.themeId)?.etfs.map(e => e.isin) ?? [])
export const ALL_ITEMS = /* @__PURE__ */ (() => engine.ALL_ITEMS)()
export default engine
