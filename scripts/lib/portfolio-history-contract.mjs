import {HISTORICAL_YEARS, latestCommonYears} from '../../src/data/annual-window.js'
import {hasCompleteAutomaticWindow} from '../../src/pages/portfolio-generator/performance.js'

// Structural audit, not an admission rule. A dated short manual window does
// not manufacture the six complete years still required by the Auto engine.
export function portfolioHistoryContract(asset) {
  const values = asset.r
  if (!Array.isArray(values) || values.length !== HISTORICAL_YEARS.length ||
      values.some(value => value !== null && (!Number.isFinite(value) || value < -100))) return 'invalid'
  if (values.every(Number.isFinite)) return 'complete'
  const calendar = asset.calendarReturns
  if (!calendar || HISTORICAL_YEARS.some((year, i) =>
    Number.isFinite(values[i]) ? calendar[year] !== values[i] : Number.isFinite(calendar[year]))) return 'invalid'
  // After a year change the current six-year window may be complete while the
  // fixed 2020–2025 archive still has a pre-launch null. Use the real engine.
  if (hasCompleteAutomaticWindow(asset)) return 'complete-current'
  const first = values.findIndex(Number.isFinite), last = values.findLastIndex(Number.isFinite)
  // Keep only the actual consecutive window, including older manual windows.
  // Missing ends are not invented; freshness is checked separately. Internal
  // holes or an absent/inconsistent dated calendar must never be hidden.
  if (first < 0 || values.slice(first, last + 1).some(value => !Number.isFinite(value)) ||
      latestCommonYears([calendar], {minimum: 3}).length < 3) return 'invalid'
  return 'partial-manual'
}
