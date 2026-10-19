import assert from 'node:assert/strict'
import { DEFAULT_THEMES, SAME_INDEX_THEMES, EXPOSURE_THEMES, DERIVED_THEMES, comparisonReady } from '../src/data/etf-themes.js'
import { ETFS, CATEGORY_ORDER, CATEGORY_EMOJI } from '../src/data/etf-cards.js'
import { benchmarkKey } from '../src/data/asset-selection.js'
import { getInstrumentPeaStatus } from '../src/data/instruments.js'
import { ETF_TER_BY_ISIN } from '../src/data/etf-ter.js'
import { exposureGroup } from '../src/data/asset-labels.js'

// Country tokens must not match « Index » or override an explicitly excluded country.
for (const [name, benchmark, expected] of [
  ['Xtrackers EURO STOXX 50', 'EURO STOXX 50 Index', 'Europe'],
  ['Vanguard S&P 500', 'S&P 500 Index', 'États-Unis'],
  ['Xtrackers MSCI World', 'MSCI Total Return Net World Index', 'Monde'],
  ['Xtrackers MSCI World ex USA', 'MSCI World ex USA Index', 'Monde'],
  ['iShares MSCI AC Far East ex-Japan', 'MSCI AC Far East ex Japan Index', 'Asie hors Japon'],
  ['ETF Japon', 'MSCI Japan Index', 'Japon'],
  ['ETF Inde', 'MSCI India Index', 'Émergents'],
  ['ETF émergents', 'MSCI Emerging Markets Index', 'Émergents'],
]) assert.equal(exposureGroup({name, benchmark}), expected, benchmark)

// Every ETF sheet whose fees, assets and published exposures are collected is reachable from the
// comparison tool; themes are unique; derived themes follow their stated rules (same index, PEA
// first, fees ascending). Counts come from the registries, never from a frozen number.
const ids = DEFAULT_THEMES.map(t => t.id), noms = DEFAULT_THEMES.map(t => t.nom)
assert.equal(new Set(ids).size, ids.length, 'identifiants de thème dupliqués')
assert.equal(new Set(noms).size, noms.length, `noms de thème dupliqués : ${noms.filter((n, i) => noms.indexOf(n) !== i).join(', ')}`)
for (const theme of DEFAULT_THEMES) {
  assert(theme.etfs.length >= 1 && theme.etfs.length <= 5, `${theme.id} : ${theme.etfs.length} parts`)
  for (const etf of theme.etfs) assert(etf.isin && etf.nom && etf.frais && etf.differenciateur, `${theme.id}/${etf.isin} : champs manquants`)
}
const covered = new Set(DEFAULT_THEMES.flatMap(t => t.etfs.map(e => e.isin)))
const uncovered = ETFS.filter(card => !covered.has(card.isin))
for (const card of uncovered) assert(!comparisonReady(card.isin), `${card.isin} : fiche prête mais absente du comparatif`)
for (const card of ETFS) if (comparisonReady(card.isin)) assert(covered.has(card.isin), `${card.isin} : fiche prête sans thème`)

for (const theme of SAME_INDEX_THEMES) {
  const keys = new Set(theme.etfs.map(e => benchmarkKey(e.isin).split('|hedge:')[0]))
  assert.equal(keys.size, 1, `${theme.id} : indices différents ${[...keys].join(' / ')}`)
  const pea = theme.etfs.map(e => getInstrumentPeaStatus(e.isin) === true)
  assert.deepEqual(pea, [...pea].sort((a, b) => Number(b) - Number(a)), `${theme.id} : PEA en tête`)
  for (const etf of theme.etfs) {
    const status = getInstrumentPeaStatus(etf.isin)
    assert(etf.differenciateur.includes(status === true ? 'éligible PEA' : status === false ? 'hors PEA' : 'non documentée'), `${theme.id}/${etf.isin} : mention PEA`)
  }
}
for (const theme of EXPOSURE_THEMES) {
  const fees = theme.etfs.map(e => Number(ETF_TER_BY_ISIN[e.isin]))
  assert.deepEqual(fees, [...fees].sort((a, b) => a - b), `${theme.id} : frais croissants`)
}
// A PEA-first list may cease to be globally sorted by fees; its published note must say so.
for (const theme of DEFAULT_THEMES.filter(t => t.derived === 'exposure')) {
  const fees = theme.etfs.map(e => Number(ETF_TER_BY_ISIN[e.isin]));
  if (fees.some((fee, i) => i > 0 && fee < fees[i - 1])) {
    assert(!theme.comparisonNote.includes('classés par frais croissants'), `${theme.id} : frais non croissants`);
    assert(theme.comparisonNote.includes('priorité au PEA'), `${theme.id} : priorité PEA explicitée`);
  }
}
assert(DERIVED_THEMES.length === SAME_INDEX_THEMES.length + EXPOSURE_THEMES.length)

// Every sheet category is declared, ordered and carries an emoji.
for (const card of ETFS) {
  assert(CATEGORY_ORDER.includes(card.category), `${card.isin} : catégorie « ${card.category} » hors de CATEGORY_ORDER`)
  assert(CATEGORY_EMOJI[card.category], `${card.category} : emoji absent`)
}
console.log(`${DEFAULT_THEMES.length} themes (${SAME_INDEX_THEMES.length} same-index, ${EXPOSURE_THEMES.length} exposure selections) cover ${covered.size} ISIN; ${uncovered.length} sheets stay out for incomplete observations: ${uncovered.map(c => c.isin).join(', ')}.`)
