import { createFormatEngine } from '../engine.js'
export * from '../constants.js'
import { ASSETS, MONTHS_FULL } from '../../../data/market-history.js'
import { historyOptionLabel } from '../../../data/history-selection.js'
import { fmtEUR, fmtPct } from '../../../lib/format-currency.js'
import * as history from '../data/marketHistory.js'

const engine = createFormatEngine({ ASSETS, MONTHS_FULL, historyOptionLabel, fmtEUR, fmtPct, ...history, ANNIVERSAIRE_ELIGIBLE_ASSETS: [] })
export const { ALL_ITEMS, poolForFormat, getSubjectsForFormat, getSecondaryOptionsForFormat, pickNext, pickForSelection, buildDilemmeText, getMarketAsset, buildAnniversaireText, buildPerformanceDepuisText, buildAnniversaireComparatifText, getPerformanceEntries, buildPerformanceDepuisComparatifText, buildPouvoirAchatText, buildTweetText } = engine
export default engine
