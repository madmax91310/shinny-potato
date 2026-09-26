import { SHEETS } from '../src/pages/factsheet-tweets/data.js'
import { buildFactsheetTweet } from '../src/pages/factsheet-tweets/lib.js'

if (SHEETS.length !== 11) throw new Error('Onze sujets attendus')
for (const sheet of SHEETS) {
  const text = buildFactsheetTweet(sheet)
  const countries = sheet.countries.reduce((sum, [, weight]) => sum + weight, 0)
  const sectors = sheet.sectors.reduce((sum, [, weight]) => sum + weight, 0)
  if (countries > 100.15 || countries < 79) throw new Error(`${sheet.id}: pays incohérents : ${countries}`)
  if (sectors > 100.15 || sectors < 50) throw new Error(`${sheet.id}: secteurs incohérents : ${sectors}`)
  if (!sheet.source.every((source) => source.url.startsWith('https://'))) throw new Error(`${sheet.id}: source absente`)
  if (!sheet.snapshot || !sheet.performance.date || !sheet.performance.detail) throw new Error(`${sheet.id}: dates ou méthode absentes`)
  if (!sheet.returns?.length || sheet.returns.some(([year, value]) => year < 2021 || year > 2025 || !Number.isFinite(value))) throw new Error(`${sheet.id}: rendements incomplets`)
  if (sheet.performance.kind === 'ETF' && (!sheet.isin || !text.includes(`performances de l’ETF ${sheet.isin}`))) throw new Error(`${sheet.id}: confusion indice/ETF`)
  if (sheet.performance.kind === 'indice' && text.includes('performances de l’ETF')) throw new Error(`${sheet.id}: fausse attribution des rendements`)
  if (!text.includes(sheet.insight) || !text.includes(sheet.takeaway)) throw new Error(`${sheet.id}: texte incomplet`)
  console.log(`${sheet.id}: pays ${countries.toFixed(2)} %, secteurs ${sectors.toFixed(2)} %, ${text.length} caractères`)
}
