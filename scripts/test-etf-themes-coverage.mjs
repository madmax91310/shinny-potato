import assert from 'node:assert/strict'
import { DEFAULT_THEMES, SAME_INDEX_THEMES, EXPOSURE_THEMES, DERIVED_THEMES, comparisonReady } from '../src/data/etf-themes.js'
import { ETFS, CATEGORY_ORDER, CATEGORY_EMOJI } from '../src/data/etf-cards.js'
import { benchmarkKey } from '../src/data/asset-selection.js'
import { getInstrumentPeaStatus } from '../src/data/instruments.js'
import { ETF_TER_BY_ISIN } from '../src/data/etf-ter.js'

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
assert(DERIVED_THEMES.length === SAME_INDEX_THEMES.length + EXPOSURE_THEMES.length)

// Every sheet category is declared, ordered and carries an emoji.
for (const card of ETFS) {
  assert(CATEGORY_ORDER.includes(card.category), `${card.isin} : catégorie « ${card.category} » hors de CATEGORY_ORDER`)
  assert(CATEGORY_EMOJI[card.category], `${card.category} : emoji absent`)
}
console.log(`${DEFAULT_THEMES.length} themes (${SAME_INDEX_THEMES.length} same-index, ${EXPOSURE_THEMES.length} exposure selections) cover ${covered.size} ISIN; ${uncovered.length} sheets stay out for incomplete observations: ${uncovered.map(c => c.isin).join(', ')}.`)
