import { ASSETS, MARKET_ASSETS, getAnnualReturnStartYears, getAnnualReturns, performanceBasis } from './data/performanceHistory.js'
import { historyOptionLabel } from '../../data/history-selection.js'
import { resolveAnniversaryLevel } from '../../data/anniversary-levels.js';
import { anniversaryResult, anniversaryClosing, anniversaryComparisonNote } from './anniversaryEditorial.js';
import { DILEMMES, SITUATIONS } from "./data/dilemmes.js";
import { FICHE_LEXIQUE_SUBJECTS, getFicheLexiqueText } from "./data/ficheLexique.js";
import { COMPARATIF_ETF_SUBJECTS, getComparatifEtfText } from "./data/comparatifEtf.js";
import { TERMES } from "../../data/financial-lexicon.js";
import { MONTHS_FULL } from '../../data/market-history.js';
import { fmtEUR, fmtPct } from "../investment-calculator/lib.js";
import {
  ANNIVERSAIRE_ELIGIBLE_ASSETS, getValidYearsBackOptions,
  getHistoricalPrice, ymForYearsBack, fmtYm,
} from "./data/marketHistory.js";
// Format "Pouvoir d'achat" : aucune donnée ni logique de calcul propre — réutilise entièrement le
// simulateur "Pouvoir d'achat" (montants, années, séries INSEE, calcul, punchlines) ; cette couche
// ne fait qu'exposer ces mêmes données/fonctions au système de pools/anti-répétition de Tweet Midi.
import {
  AMOUNT_PRESETS as PA_AMOUNT_PRESETS, YEAR_MIN as PA_YEAR_MIN, YEAR_MAX as PA_YEAR_MAX,
  POSTE_ORDER as PA_POSTE_ORDER,
} from "../../data/purchasing-power.js";
import { buildTweetText as buildPouvoirAchatTweetText } from "../purchasing-power/lib.js";

import { createFormatEngine } from './engine.js'
import comparisonEngine from './engines/comparatif.js'
import { FORMATS } from './constants.js'
export * from './constants.js'
const engine = createFormatEngine({ ASSETS, historyOptionLabel, resolveAnniversaryLevel, anniversaryResult, anniversaryClosing, anniversaryComparisonNote, DILEMMES, SITUATIONS, FICHE_LEXIQUE_SUBJECTS, getFicheLexiqueText, COMPARATIF_ETF_SUBJECTS, getComparatifEtfText, TERMES, MONTHS_FULL, fmtEUR, fmtPct, MARKET_ASSETS, ANNIVERSAIRE_ELIGIBLE_ASSETS, getValidYearsBackOptions, getHistoricalPrice, ymForYearsBack, fmtYm, getAnnualReturnStartYears, getAnnualReturns, performanceBasis, PA_AMOUNT_PRESETS, PA_YEAR_MIN, PA_YEAR_MAX, PA_POSTE_ORDER, buildPouvoirAchatTweetText })
export const { ALL_ITEMS, poolForFormat, getSubjectsForFormat, getSecondaryOptionsForFormat, pickNext, pickForSelection, buildDilemmeText, getMarketAsset, buildAnniversaireText, buildPerformanceDepuisText, buildAnniversaireComparatifText, getPerformanceEntries, buildPerformanceDepuisComparatifText, buildPouvoirAchatText, buildTweetText } = engine
const marketCurrencies = engine.getPerformanceCurrencies
engine.getPerformanceCurrencies = item => item.format === FORMATS.COMPARATIF_ETF
  ? comparisonEngine.getPerformanceCurrencies(item) : marketCurrencies(item)
export default engine
