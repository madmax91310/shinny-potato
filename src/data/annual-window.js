// Select only complete, consecutive calendar years shared by every series.
// The clock bounds the observations; it never manufactures a missing return.
export const HISTORICAL_YEARS = Object.freeze([2020, 2021, 2022, 2023, 2024, 2025]);
export function calendarMap(values, years = HISTORICAL_YEARS) {
  return Object.fromEntries(years.flatMap((year, i) => Number.isFinite(values?.[i]) ? [[year, values[i]]] : []));
}
export function latestCommonYears(series, { length = 6, minimum = length, now = new Date() } = {}) {
  if (!series.length) return [];
  const lastComplete = now.getUTCFullYear() - 1;
  const common = Object.keys(series[0]).map(Number).filter(year => Number.isInteger(year) && year >= 2020 && year <= lastComplete &&
    series.every(row => Number.isFinite(row[year]) && row[year] > -100)).sort((a, b) => b - a);
  for (const end of common) {
    const years = [];
    for (let year = end; years.length < length && common.includes(year); year--) years.unshift(year);
    if (years.length >= minimum) return years;
  }
  return [];
}
export function performanceYears(perf) {
  return Object.keys(perf ?? {}).map(Number).filter(Number.isInteger).sort((a, b) => a - b);
}
