#!/usr/bin/env node
// Repère les encours à rapprocher entre outils. Ce rapport ne remplace pas une
// fiche émetteur : des dates et devises différentes expliquent souvent l'écart.
import { ETFS } from '../src/pages/etf-sheets/data.js'
import { FAMILIES } from '../src/pages/index-comparator/data.js'
import { DEFAULT_THEMES } from '../src/pages/etf-tweets/data/themes.js'

const entries = [
  ...ETFS.map(x => ({ isin: x.isin, tool: 'Fiches ETF', raw: x.aum, date: x.lastVerified })),
  ...FAMILIES.flatMap(f => f.etfGroups.flatMap(g => g.funds.map(x => ({ isin: x.isin, tool: 'Comparateur', raw: x.aum, date: x.aum?.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] ?? 'non précisée' })))),
  ...DEFAULT_THEMES.flatMap(t => t.etfs.map(x => ({ isin: x.isin, tool: 'Tweets ETF', raw: x.encours, date: 'non précisée par ligne' }))),
]

function parse(raw) {
  const m = String(raw ?? '').replace(/\s/g, '').match(/~?(\d+(?:[,.]\d+)?)(Md|M)([€$])/)
  return m ? { millions: Number(m[1].replace(',', '.')) * (m[2] === 'Md' ? 1000 : 1), currency: m[3] } : null
}

const grouped = new Map()
for (const item of entries.filter(x => x.isin)) {
  if (!grouped.has(item.isin)) grouped.set(item.isin, [])
  grouped.get(item.isin).push(item)
}
let flagged = 0
let differentCurrencies = 0
for (const [isin, items] of grouped) {
  if (items.length < 2) continue
  const parsed = items.map(x => ({ ...x, value: parse(x.raw) })).filter(x => x.value)
  const currencies = new Set(parsed.map(x => x.value.currency))
  if (currencies.size > 1) differentCurrencies++
  for (const currency of currencies) {
    const same = parsed.filter(x => x.value.currency === currency)
    if (same.length < 2) continue
    const min = Math.min(...same.map(x => x.value.millions))
    const max = Math.max(...same.map(x => x.value.millions))
    if (max / min < 1.10) continue
    flagged++
    console.log(`${isin} · écart ${Math.round((max / min - 1) * 100)} % (${currency})`)
    same.forEach(x => console.log(`  ${x.tool} : ${x.raw} · date ${x.date}`))
  }
}
console.log(`${entries.length} mentions examinées ; ${flagged} ISIN avec un écart d'encours ≥ 10 % dans une même devise ; ${differentCurrencies} avec devises différentes.`)
console.log('Encours indicatifs : comparer des fiches émetteur à une même date avant toute correction. Les dates de fiche ne sont pas forcément les dates des encours.')
