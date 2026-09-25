import { CATALOG, buildCustomDuel } from './lib.js'

const ids = new Set(CATALOG.map((asset) => asset.id))
const available = (choices) => choices.filter((id) => ids.has(id))
const pick = (choices) => available(choices)[Math.floor(Math.random() * available(choices).length)]
const row = (id, pct) => ({ id, pct })

const cores = ['msci_world_ishares', 'msci_acwi_ishares', 'ftse_allworld_vanguard', 'sp500', 'sp500_ishares']
const themes = ['sect_energy_spdr', 'sect_tech_world_ishares', 'world_quality_ishares', 'world_momentum_ishares', 'sect_robotique', 'sect_luxury_amundi', 'sect_water_amundi', 'sect_ai_lg']
const stocks = ['action_visa', 'action_microsoft', 'action_apple', 'action_nvidia', 'action_cocacola', 'action_amazon', 'action_meta']
const diversifiers = ['or', 'or_ishares', 'foncieres_etf', 'argent_indicatif', 'spot_bitcoin', 'scpi']

function different(pool, except) { return pick(pool.filter((id) => id !== except)) }

const formats = [
  () => {
    const coreA = pick(cores)
    const coreB = different(cores, coreA)
    const actionA = pick(stocks)
    const actionB = different(stocks, actionA)
    const shared = available(stocks.filter((id) => id !== actionA && id !== actionB)).sort(() => Math.random() - .5).slice(0, 2)
    return { title: 'Deux cœurs, trois actions', left: [row(coreA, 70), row(actionA, 10), ...shared.map((id) => row(id, 10))],
      right: [row(coreB, 70), row(actionB, 10), ...shared.map((id) => row(id, 10))] }
  },
  () => {
    const a = pick(themes)
    const b = different(themes, a)
    return { title: 'Deux visions du marché', left: [row(pick(cores), 60), row(a, 25), row(pick(['or', 'or_ishares', 'foncieres_etf']), 15)],
      right: [row(pick(cores), 60), row(b, 25), row(pick(['spot_bitcoin', 'argent_indicatif', 'scpi']), 15)] }
  },
  () => {
    const a = pick(diversifiers)
    const b = different(diversifiers, a)
    const commonCore = pick(cores)
    const commonTheme = pick(themes)
    return { title: 'Quel actif pour diversifier ?', left: [row(commonCore, 60), row(commonTheme, 25), row(a, 15)],
      right: [row(commonCore, 60), row(commonTheme, 25), row(b, 15)] }
  },
  () => {
    const coreA = pick(cores)
    const coreB = different(cores, coreA)
    return { title: 'Actions ou actifs réels ?', left: [row(coreA, 55), row(pick(themes), 25), row(pick(stocks), 10), row(pick(['or', 'foncieres_etf']), 10)],
      right: [row(coreB, 55), row(pick(themes), 25), row(pick(['spot_bitcoin', 'scpi']), 10), row(pick(['argent_indicatif', 'or_ishares']), 10)] }
  },
]

export function generateDuel(previousId = '') {
  for (let attempt = 0; attempt < 80; attempt++) {
    const definition = formats[Math.floor(Math.random() * formats.length)]()
    const signature = [...definition.left, ...definition.right].map((line) => `${line.id}:${line.pct}`).join('|')
    const id = `genere-${[...signature].reduce((hash, char) => Math.imul(hash, 31) + char.charCodeAt(0) | 0, 0).toString(36).replace('-', 'n')}`
    if (id === previousId) continue
    try {
      const duel = buildCustomDuel({ ...definition, id, hook: `${definition.title} : lequel aurais-tu choisi ?` })
      if (duel.years.every((year) => Math.abs(duel.a.annual[year] - duel.b.annual[year]) < .001)) continue
      return duel
    } catch { /* Une série partielle peut écarter une combinaison. */ }
  }
  throw new Error('Aucune combinaison complète disponible.')
}
