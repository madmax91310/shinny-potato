import { createFormatEngine } from '../engine.js'
export * from '../constants.js'
import { ASSETS, MONTHS_FULL } from '../data/performanceHistory.js'
import { historyOptionLabel } from '../../../data/history-selection.js'
import { fmtEUR, fmtPct } from '../../../lib/format-currency.js'
import * as history from '../data/performanceHistory.js'

const engine = createFormatEngine({ ASSETS, MONTHS_FULL, historyOptionLabel, fmtEUR, fmtPct, ...history, ANNIVERSAIRE_ELIGIBLE_ASSETS: [] })
export const { poolForFormat, getSubjectsForFormat, getSecondaryOptionsForFormat, pickNext, pickForSelection, buildDilemmeText, getMarketAsset, buildAnniversaireText, buildPerformanceDepuisText, buildAnniversaireComparatifText, getPerformanceEntries, buildPerformanceDepuisComparatifText, buildPouvoirAchatText, buildTweetText } = engine
export const ALL_ITEMS = /* @__PURE__ */ (() => engine.ALL_ITEMS)()
export default engine

export { performanceBasis } from '../data/performanceHistory.js'
