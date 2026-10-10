import { SHEETS } from '../src/data/index-factsheets.js'
import { buildFactsheetTweet } from '../src/pages/factsheet-tweets/lib.js'
import assert from 'node:assert/strict'

if (SHEETS.length !== 24) throw new Error('Vingt-quatre sujets attendus')
for (const sheet of SHEETS) {
  const text = buildFactsheetTweet(sheet)
  const countries = sheet.countries.reduce((sum, [, weight]) => sum + weight, 0)
  const sectors = sheet.sectors.reduce((sum, [, weight]) => sum + weight, 0)
  if (countries > 100.15 || countries < 79) throw new Error(`${sheet.id}: pays incohérents : ${countries}`)
  if (sectors > 100.15 || sectors < 50 && !sheet.methodologyPanels) throw new Error(`${sheet.id}: secteurs incohérents : ${sectors}`)
  if (!sheet.source.every((source) => source.url.startsWith('https://'))) throw new Error(`${sheet.id}: source absente`)
  if (!sheet.snapshot || !sheet.performance.date || !sheet.performance.detail) throw new Error(`${sheet.id}: dates ou méthode absentes`)
  if (!sheet.returns?.length || sheet.returns.some(([year, value]) => year < 2021 || year > 2025 || !Number.isFinite(value))) throw new Error(`${sheet.id}: rendements incomplets`)
  if (sheet.performance.kind === 'ETF' && (!sheet.isin || !text.includes(`performances de l’ETF ${sheet.isin}`))) throw new Error(`${sheet.id}: confusion indice/ETF`)
  if (sheet.performance.kind === 'indice' && text.includes('performances de l’ETF')) throw new Error(`${sheet.id}: fausse attribution des rendements`)
  if (/undefined|NaN/.test(text) || !/\bje\b|j[’']|m[’']|\bmon\b|\bme\b/i.test(text)) throw new Error(`${sheet.id}: regard personnel ou texte absent`)
  for (const [year, value] of sheet.returns) {
    const display = `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
    assert(text.includes(`${year} : ${display}`), `${sheet.id}: rendement altéré`)
  }
  for (const [, method] of sheet.methodologyPanels ?? []) assert(text.includes(method), `${sheet.id}: méthode perdue`)
  if (sheet.performance.historyNote) assert(text.includes(sheet.performance.historyNote.replace('Les poids sont ceux de l’indice au 31 août 2026 ; les rendements', 'Les rendements')), `${sheet.id}: changement d’indice masqué`)
  console.log(`${sheet.id}: pays ${countries.toFixed(2)} %, secteurs ${sectors.toFixed(2)} %, ${text.length} caractères`)
}

// Les chiffres, le tri et le commentaire doivent suivre une nouvelle composition.
const world = SHEETS.find(sheet => sheet.id === 'world')
const refreshed = buildFactsheetTweet({ ...world, constituents: 800,
  countries: [['🇯🇵 Japon', 65], ['🇺🇸 États-Unis', 35]],
  sectors: [['🏥 Santé', 60], ['💻 Technologie', 40]],
  holdings: [['ALPHABET C', 8], ['APPLE', 3], ['ALPHABET A', 12], ['NVIDIA', 1]],
})
assert.match(refreshed, /800 titres/)
assert.match(refreshed, /Japon représente 65 %/)
assert.doesNotMatch(refreshed, /73 €|72,94|plus d’un millier|27,85|17,89/)
assert.match(refreshed, /santé arrive en tête avec 60 %.*technologie à 40 %/)
assert.match(refreshed, /quatre lignes représentent 24 %/)
assert.match(buildFactsheetTweet({ ...world, holdings: [['APPLE', 1]] }), /Cette première ligne représente 1 %/)
assert.doesNotMatch(buildFactsheetTweet({ ...world, holdings: [], sectors: [], countries: [] }), /undefined|NaN|premières lignes :|quelques grandes entreprises/)
assert.doesNotMatch(buildFactsheetTweet({ ...SHEETS.find(s => s.id === 'acwi'), countries: [['🇯🇵 Japon', 60], ['🇺🇸 États-Unis', 40]] }), /majorité américaine/)
assert.doesNotMatch(buildFactsheetTweet({ ...SHEETS.find(s => s.id === 'em-standard'), countries: [['🇮🇳 Inde', 100]] }), /place cumulée de Taïwan/)
console.log('Mises à jour : poids, classement, catégories d’actions et absence de positions vérifiés.')
