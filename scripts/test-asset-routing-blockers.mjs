import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { INSTRUMENT_LISTINGS_BY_ISIN } from '../src/data/instrument-listings.js'

// Every asset presented in a sheet, a comparison or a DCA profile without an automatic history
// must carry an explicit cause in the routing audit: the collectors regenerate the audit, so the
// test checks the structure and the candidate declarations, never a frozen count.
const read = path => JSON.parse(readFileSync(path, 'utf8'))
// CI regenerates this report from the current data just before the test (audit-asset-tool-routing.mjs --write).
const routing = read('docs/asset-tool-routing.json')
const candidates = read('scripts/listing-candidates.json').candidates
const CODES = ['no-listing', 'listing-not-collectable', 'qualification-failed', 'collection-pending', 'history-short', 'curated-duel']
const SUFFIX = { XPAR:'.PA', XAMS:'.AS', XETR:'.DE', XLON:'.L', ETFP:'.MI', XSWX:'.SW' }
const EXCHANGES = { XPAR:'Euronext Paris', XAMS:'Euronext Amsterdam', XETR:'Xetra', XLON:'London Stock Exchange', ETFP:'Borsa Italiana', XSWX:'SIX Swiss Exchange' }

const presented = routing.rows.filter(r => r.generator === 'missing' && (r.sheet || r.comparison || r.dca))
assert.ok(presented.length > 0, 'the audit lists presented assets without automatic history')
for (const row of presented) {
  assert.ok(row.blocker, `${row.isin} : cause de blocage absente`)
  assert.ok(CODES.includes(row.blocker.code), `${row.isin} : code inconnu ${row.blocker.code}`)
  assert.ok(row.blocker.detail?.length > 0, `${row.isin} : détail vide`)
  if (row.blocker.code === 'no-listing') assert.equal((INSTRUMENT_LISTINGS_BY_ISIN[row.isin] ?? []).length, 0, `${row.isin} : cotation présente mais déclarée absente`)
  if (row.blocker.code === 'history-short') assert.ok(row.monthly.length > 0, `${row.isin} : historique court sans série`)
  if (row.blocker.code === 'collection-pending') assert.ok(row.historyCandidate, `${row.isin} : collecte en attente sans candidat historique`)
}
for (const row of routing.rows.filter(r => r.generator !== 'missing')) assert.equal(row.blocker, null, `${row.isin} : blocage sur un actif déjà raccordé`)
for (const code of CODES) assert.equal(routing.summary.blockers[code], routing.rows.filter(r => r.blocker?.code === code).length, `résumé ${code}`)

// Candidate rows: reachable by the metadata collector, well-formed, and never a copy of a verified row.
const seen = new Set()
for (const { isin, basis, rows } of candidates) {
  assert.ok(!seen.has(isin), `${isin} : déclaré deux fois`); seen.add(isin)
  assert.ok(AUTOMATED_ETF[isin], `${isin} : hors du périmètre du collecteur de métadonnées`)
  assert.ok(basis?.length > 10, `${isin} : base du relevé absente`)
  assert.ok(rows.length > 0, `${isin} : aucune ligne`)
  for (const row of rows) {
    assert.ok(SUFFIX[row.mic], `${isin} : place ${row.mic} non collectable`)
    assert.equal(row.exchange, EXCHANGES[row.mic], `${isin} : libellé de place ${row.exchange}`)
    assert.match(row.currency, /^[A-Z]{3}$/, `${isin} : devise ${row.currency}`)
    assert.match(row.ticker, /^[A-Z0-9]{2,8}$/, `${isin} : ticker ${row.ticker}`)
    assert.equal(row.symbol, row.ticker + SUFFIX[row.mic], `${isin} : symbole ${row.symbol}`)
    // A candidate the collector has since verified in an official document is the success path:
    // build-automation-targets.mjs drops it, so it never blocks a data refresh.
  }
}
console.log(`${presented.length} presented assets without automatic history carry a cause (${Object.entries(routing.summary.blockers).map(([k,v]) => `${k} ${v}`).join(', ')}); ${candidates.length} candidate declarations checked.`)
