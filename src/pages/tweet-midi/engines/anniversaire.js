import { createFormatEngine } from '../engine.js'
export * from '../constants.js'
import { ASSETS, MONTHS_FULL } from '../data/anniversaryHistory.js'
import { historyOptionLabel } from '../../../data/history-selection.js'
import { fmtEUR, fmtPct } from '../../../lib/format-currency.js'
import * as history from '../data/anniversaryHistory.js'
import { resolveAnniversaryLevel } from '../../../data/anniversary-levels.js'
import { anniversaryResult, anniversaryClosing, anniversaryComparisonNote } from '../anniversaryEditorial.js'
const engine = createFormatEngine({ ASSETS, MONTHS_FULL, historyOptionLabel, fmtEUR, fmtPct, ...history, resolveAnniversaryLevel, anniversaryResult, anniversaryClosing, anniversaryComparisonNote, MARKET_ASSETS: [] })
export const { poolForFormat, getSubjectsForFormat, getSecondaryOptionsForFormat, pickNext, pickForSelection, buildDilemmeText, getMarketAsset, buildAnniversaireText, buildPerformanceDepuisText, buildAnniversaireComparatifText, getPerformanceEntries, buildPerformanceDepuisComparatifText, buildPouvoirAchatText, buildTweetText } = engine
export const ALL_ITEMS = /* @__PURE__ */ (() => engine.ALL_ITEMS)()
export default engine
