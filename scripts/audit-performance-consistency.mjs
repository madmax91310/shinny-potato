#!/usr/bin/env node
// Compare les performances 2023-2025 des mêmes parts (ISIN) entre Comparateur d'indices et
// Générateur de portefeuilles. Une note générale de méthode ne suffit pas à valider un écart.
import { FAMILIES } from '../src/pages/index-comparator/data.js'
import { ASSETS } from '../src/data/portfolio-assets.js'
import { readFileSync } from 'node:fs'

const MAX_UNEXPLAINED_GAP = 0.1 // point de pourcentage : seuls les arrondis d'affichage restent tolérés
// Les perfFunds n'ont pas de champ ISIN : rattachement explicite à la part citée dans le tweet.
// Chaque clé est validée ci-dessous contre les fonds réellement affichés.
import { COMPARATOR_ISIN_BY_FAMILY_KEY as FUND_ISINS } from '../src/data/instrument-comparator-returns.js'

// Comparer des séries différentes d'un même ISIN exige une explication dans les deux outils.
const DIFFERENT_BASIS = {}
// Parts dont les deux outils utilisent la même série émetteur : écart toléré nul,
// même si une divergence inférieure à 1 point passerait le seuil général.
const EXACT_ISSUERS = new Set(['IE00BK5BQT80', 'IE00BKM4GZ66', 'IE00BYYHSQ67'])

const assetsByIsin = new Map()
for (const asset of ASSETS) {
  if (!asset.isin || !Array.isArray(asset.r) || asset.r.length !== 6) continue
  const siblings = assetsByIsin.get(asset.isin) ?? []
  siblings.push(asset)
  assetsByIsin.set(asset.isin, siblings)
}

let compared = 0
let documented = 0
let smallGaps = 0
let failures = 0
let notShared = 0
const unmatchedFunds = []
const comparatorSource = readFileSync(new URL('../src/pages/index-comparator/data.js', import.meta.url), 'utf8')

for (const family of FAMILIES) {
  const mappings = FUND_ISINS[family.id]
  if (!mappings) { console.error('Famille sans mapping : ' + family.id); failures++; continue }
  const visibleIsins = new Set(family.etfGroups.flatMap(group => group.funds.map(fund => fund.isin)))
  for (const perf of family.perfFunds ?? []) {
    const isin = mappings[perf.key]
    if (!isin || !visibleIsins.has(isin)) {
      console.error('Performance non rattachée à une part affichée : ' + family.id + '/' + perf.key + ' (' + (isin ?? 'sans ISIN') + ')')
      failures++
      continue
    }
    if (![perf.y2023, perf.y2024, perf.y2025].every(Number.isFinite)) continue
    const siblings = assetsByIsin.get(isin)
    if (!siblings) {
      notShared++
      unmatchedFunds.push({ family: family.id, isin, key: perf.key, years: [perf.y2023, perf.y2024, perf.y2025] })
      // Une part sans série indépendante peut néanmoins être contrôlée par sa fiche
      // émetteur. Le marqueur individuel évite qu'une mise à jour efface sa provenance.
      const row = comparatorSource.indexOf(`{ key: '${perf.key}', label: '${perf.label}'`)
      const preceding = row < 0 ? '' : comparatorSource.slice(Math.max(0, row - 600), row).split(/\n\s*\{ key: /).at(-1)
      if (!/(Vérifié|Corrigé) le 25\/09\/2026/.test(preceding) || !/https:\/\//.test(preceding) || !/confiance/i.test(preceding)) {
        console.error('Source émetteur/date/confiance manquantes : ' + family.id + '/' + perf.key)
        failures++
      }
      continue
    }
    for (const asset of siblings) {
      compared++
      const gaps = [2023, 2024, 2025].map((year, i) => ({ year, gap: Math.abs(perf['y' + year] - asset.r[i + 3]) }))
      const large = gaps.filter(x => x.gap > (EXACT_ISSUERS.has(isin) ? 0.001 : MAX_UNEXPLAINED_GAP))
      if (!large.length) {
        if (gaps.some(x => x.gap > 0.01)) {
          smallGaps++
          console.log('[ARRONDI < 0,1 pt] ' + isin + ' (' + family.id + '/' + asset.id + ') : ' + gaps.map(x => x.year + ' ' + x.gap.toFixed(2) + ' pt').join(', '))
        }
        continue
      }
      const basis = DIFFERENT_BASIS[isin]
      const visibleUSD = /en \$|en dollars/i.test(family.perfMethodNote ?? '')
      const visibleEURProxy = /indice.*euros|euros.*indice/i.test(asset.confidenceNote ?? '')
      if (basis && visibleUSD && visibleEURProxy) {
        documented++
        console.log('[PROXY DOCUMENTÉ] ' + isin + ' (' + family.id + '/' + asset.id + ') : ' + basis)
      } else {
        failures++
        console.error('[ÉCART NON EXPLIQUÉ] ' + isin + ' (' + family.id + '/' + asset.id + ') : ' + gaps.map(x => x.year + ' ' + x.gap.toFixed(2) + ' pt').join(', '))
      }
    }
  }
  const activeKeys = new Set((family.perfFunds ?? []).map(x => x.key))
  for (const key of Object.keys(mappings)) if (!activeKeys.has(key)) {
    console.error('Mapping obsolète : ' + family.id + '/' + key)
    failures++
  }
}

console.log('\n' + compared + ' comparaisons ISIN (y compris les groupes multi-ETF), ' + notShared + ' parts sans correspondance dans le Générateur.')
if (unmatchedFunds.length) {
  console.log('Parts du comparateur sans série indépendante dans le Générateur (source émetteur datée en commentaire) :')
  for (const fund of unmatchedFunds) console.log(`  ${fund.family}/${fund.key} · ${fund.isin} · 2023–2025 ${fund.years.join(' / ')}`)
}
console.log(smallGaps + ' écart(s) inférieur(s) à 0,1 point à surveiller ; ' + documented + ' proxy(s) explicités dans les deux outils ; ' + failures + ' échec(s).')
if (failures) process.exitCode = 1
