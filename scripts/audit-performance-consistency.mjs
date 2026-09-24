#!/usr/bin/env node
// Compare les performances 2023-2025 des mêmes parts (ISIN) entre Comparateur d'indices et
// Générateur de portefeuilles. Une note générale de méthode ne suffit pas à valider un écart.
import { FAMILIES } from '../src/pages/index-comparator/data.js'
import { ASSETS } from '../src/pages/portfolio-generator/data.js'

const MAX_UNEXPLAINED_GAP = 0.1 // point de pourcentage : seuls les arrondis d'affichage restent tolérés
// Les perfFunds n'ont pas de champ ISIN : rattachement explicite à la part citée dans le tweet.
// Chaque clé est validée ci-dessous contre les fonds réellement affichés.
const FUND_ISINS = {
  europe: { msci_europe: 'FR0013412038', stoxx600: 'FR0011550193', eurostoxx50: 'IE00B53L3W79' },
  monde: { msci_world: 'LU1681043599', acwi: 'FR0014017NX3', ftse_aw: 'IE00BK5BQT80' },
  usa: { sp500: 'FR0011871128', nasdaq100: 'FR0011871110', msci_usa: 'IE00B52SFT06' },
  'emergents-pea': { paeem_pea: 'FR0013412020', paasi: 'FR0013412012', palat: 'FR0013412004', pinr: 'FR0011869320', plem: 'FR0011440478' },
  'emergents-cto': { msci_em: 'IE00BKM4GZ66', ftse_em: 'IE00BK5BR733', em_exchina: 'IE00BMG6Z448' },
  style: { value: 'IE00BP3QZB59', quality: 'IE00BP3QZ601' },
  'dividendes-cto': { high_div: 'IE00B8GKDB10', quality_div: 'IE00BYYHSQ67', aristocrats: 'IE00B9CQXS71' },
  'dividendes-pea': { eudv: 'IE00B5M1WJ87' },
  chine: { msci_china: 'IE00BJ5JPG56', amundi_pea_chine: 'FR0011871078', ftse_china50: 'IE00B02KXK85', msci_china_a: 'IE00BQT3WG13' },
  japon: { nikkei: 'LU2196470426', topix: 'FR0013411980', msci_japan: 'IE00B4L5YX21' },
}

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
  console.log('Parts du comparateur sans série indépendante dans le Générateur (contrôle externe à prévoir) :')
  for (const fund of unmatchedFunds) console.log(`  ${fund.family}/${fund.key} · ${fund.isin} · 2023–2025 ${fund.years.join(' / ')}`)
}
console.log(smallGaps + ' écart(s) inférieur(s) à 0,1 point à surveiller ; ' + documented + ' proxy(s) explicités dans les deux outils ; ' + failures + ' échec(s).')
if (failures) process.exitCode = 1
