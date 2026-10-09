// Projections mensuelles déterministes. Les versements ont lieu en fin de mois.
export const money = value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
export const percent = value => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} %`
const finite = (value, label, min, max) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${label} : valeur attendue entre ${min} et ${max}.`)
  return value
}
export function validatePlan(plan) {
  if (!plan || plan.version !== 1 || !['a', 'b'].includes(plan.active) || !['low', 'central', 'high'].includes(plan.scenario) || !['personal', 'compare'].includes(plan.mode)) throw new Error('Fichier de simulation non reconnu.')
  finite(plan.years, 'Durée', 1, 50)
  if (!Number.isInteger(plan.years)) throw new Error('La durée doit être un nombre entier d’années.')
  finite(plan.inflation, 'Inflation', -20, 30)
  for (const key of ['a', 'b']) {
    const portfolio = plan.portfolios?.[key]
    if (!portfolio || typeof portfolio.name !== 'string' || portfolio.name.length > 100 || !Array.isArray(portfolio.pockets) || portfolio.pockets.length > 30 || !Array.isArray(portfolio.events) || portfolio.events.length > 100) throw new Error('Patrimoine invalide (30 poches et 100 événements maximum).')
    const ids = new Set()
    for (const p of portfolio.pockets) {
      if (!p || typeof p.id !== 'string' || ids.has(p.id) || typeof p.name !== 'string' || p.name.length > 100 || !['livret-a', 'ldds', 'av', 'pea', 'cto', 'pel', 'other'].includes(p.envelope)) throw new Error('Poche invalide ou identifiant dupliqué.')
      ids.add(p.id)
      finite(p.initial, 'Capital', 0, 1e9); finite(p.monthly, 'Versement', 0, 1e7)
      finite(p.fee, 'Frais', 0, 30); finite(p.tax, 'Taxe hypothétique', 0, 100)
      finite(p.contributionGrowth, 'Hausse annuelle des versements', -100, 100)
      if (!['net', 'gross'].includes(p.rateMode)) throw new Error('Convention de rendement invalide.')
      for (const s of ['low', 'central', 'high']) finite(p.rates?.[s], 'Rendement', -99, 100)
      if (p.rates.low > p.rates.central || p.rates.central > p.rates.high) throw new Error(`${p.name} : les rendements doivent suivre l’ordre prudent ≤ central ≤ favorable.`)

    }
    for (const e of portfolio.events) {
      if (!ids.has(e.pocketId) || !['monthly', 'pause', 'withdrawal'].includes(e.type)) throw new Error('Événement sans poche valide.')
      finite(e.month, 'Mois de l’événement', 1, 600)
      if (!Number.isInteger(e.month)) throw new Error('Le mois doit être entier.')
      finite(e.amount, 'Montant de l’événement', 0, 1e9)
      finite(e.endMonth, 'Fin de l’événement', e.month, 600)
      if (!Number.isInteger(e.endMonth)) throw new Error('Le mois de fin doit être entier.')
    }
  }
  return plan
}
export function annualNetRate(pocket, scenario) {
  const rate = pocket.rates[scenario] / 100
  return pocket.rateMode === 'gross' ? (1 + rate) * (1 - pocket.fee / 100) - 1 : rate
}
export function project(portfolio, { years, inflation, scenario = 'central', ceilings = {} }) {
  const states = portfolio.pockets.map(p => ({ pocket: p, capital: p.initial, paid: p.initial, withdrawals: 0, basis: p.initial, monthly: p.monthly, monthlyRate: Math.pow(1 + annualNetRate(p, scenario), 1 / 12) - 1 }))
  let cash = 0, externalPaid = states.reduce((s, p) => s + p.capital, 0), withdrawn = 0, unmet = 0
  const warnings = new Set()
  if (portfolio.pockets.some(p => p.envelope === 'pea' || p.envelope === 'pel')) warnings.add('Les plafonds et conditions de versement du PEA et du PEL ne sont pas modélisés ; vérifie leur compatibilité avec tes versements.')
  const snapshot = month => {
    const pockets = states.map(s => {
      const tax = Math.max(0, s.capital - s.basis) * s.pocket.tax / 100
      return { id: s.pocket.id, name: s.pocket.name, envelope: s.pocket.envelope, capital: s.capital, paid: s.paid, withdrawals: s.withdrawals, tax, afterTax: s.capital - tax }
    })
    const capital = cash + pockets.reduce((s, p) => s + p.capital, 0)
    const tax = pockets.reduce((s, p) => s + p.tax, 0)
    return { year: month / 12, capital, real: capital / Math.pow(1 + inflation / 100, month / 12), paid: externalPaid, netPaid: externalPaid - withdrawn, gains: capital + withdrawn - externalPaid, withdrawn, cash, unmet, tax, afterTax: capital - tax, pockets }
  }
  const points = [snapshot(0)]
  for (let month = 1; month <= years * 12; month++) {
    // Accrue every pocket before testing an envelope's shared deposit ceiling.
    for (const s of states) s.capital *= 1 + s.monthlyRate
    for (const s of states) {
      const events = portfolio.events.filter(e => e.pocketId === s.pocket.id)
      if (month > 1 && (month - 1) % 12 === 0) s.monthly *= 1 + s.pocket.contributionGrowth / 100
      for (const e of events.filter(e => e.month === month && e.type === 'monthly')) s.monthly = e.amount
      for (const e of events.filter(e => e.month === month && e.type === 'withdrawal')) {
        const amount = Math.min(s.capital, e.amount)
        // Withdrawals redeem basis pro rata; taxes on these withdrawals are not simulated.
        s.basis *= s.capital > 0 ? 1 - amount / s.capital : 0
        s.capital -= amount; s.withdrawals += amount; withdrawn += amount; unmet += e.amount - amount
        if (e.amount > amount + 0.01) warnings.add('Un retrait dépasse le capital disponible : seule la somme disponible a été retirée.')
      }
    }
    for (const s of states) {
      const events = portfolio.events.filter(e => e.pocketId === s.pocket.id)
      const planned = events.some(e => e.type === 'pause' && month >= e.month && month <= e.endMonth) ? 0 : s.monthly
      const ceiling = ceilings[s.pocket.envelope]
      const room = ceiling == null ? Infinity : Math.max(0, ceiling - states.filter(other => other.pocket.envelope === s.pocket.envelope).reduce((sum, other) => sum + other.capital, 0))
      const deposit = Math.min(planned, room)
      s.capital += deposit; s.basis += deposit; s.paid += deposit; externalPaid += planned; cash += planned - deposit
      if (planned - deposit > 0.01) warnings.add('Versements au-delà du plafond des livrets : le surplus reste en espèces non rémunérées, incluses dans le total.')
    }
    if (month % 12 === 0) points.push(snapshot(month))
  }
  if (portfolio.events.some(e => e.type === 'withdrawal')) warnings.add('Les retraits sortent du patrimoine simulé. Leur fiscalité et les conditions de retrait des enveloppes ne sont pas calculées.')
  return { points, final: points.at(-1), warnings: [...warnings] }
}
export function envelopeAllocation(portfolio, result) {
  const groups = new Map()
  for (const p of portfolio.pockets) {
    const group = groups.get(p.envelope) ?? { envelope: p.envelope, initial: 0, monthly: 0, future: 0 }
    group.initial += p.initial; group.monthly += p.monthly
    group.future += result.final.pockets.find(row => row.id === p.id)?.capital ?? 0
    groups.set(p.envelope, group)
  }
  const initial = portfolio.pockets.reduce((s,p)=>s+p.initial,0)
  return [...groups.values()].map(row=>({ ...row, currentWeight: initial ? row.initial/initial*100 : 0, futureWeight: result.final.capital ? row.future/result.final.capital*100 : 0 }))
}
export function assumptions(portfolio, scenario) {
  return portfolio.pockets.map(p => `${p.name} : ${money(p.initial)} + ${money(p.monthly)}/mois · ${percent(p.rates[scenario])}/an ${p.rateMode === 'net' ? 'net de frais' : `avant ${percent(p.fee)} de frais`} ${p.contributionGrowth ? `· variation des versements ${percent(p.contributionGrowth)}/an` : ''}`)
}
export function buildTweet(plan, results) {
  const compare = plan.mode === 'compare', keys = compare ? ['a','b'] : [plan.active]
  const hook = compare ? `Deux répartitions de patrimoine, ${plan.years} ans devant soi. Qu’est-ce que ça change avec ces hypothèses ? 👇` : `Épargner chaque mois, c’est facile à visualiser. Mais à quoi pourrait ressembler ce patrimoine dans ${plan.years} ans ? 👇`
  const lines = [hook, '', `📊 Simulation illustrative · scénario ${ {low:'prudent', central:'central', high:'favorable'}[plan.scenario] }`, '']
  for (const key of keys) {
    const p = plan.portfolios[key], r = results[key].final
    lines.push(`${key === 'a' ? '🅰️' : '🅱️'} ${p.name}`, ...assumptions(p, plan.scenario), '', `💰 Capital projeté : ${money(r.capital)}`, `💵 Capital initial + versements : ${money(r.paid)}`, `📈 Gains/pertes simulés : ${money(r.gains)}`, `🛒 Pouvoir d’achat estimé : ${money(r.real)} avec ${percent(plan.inflation)} d’inflation/an`)
    if (r.withdrawn) lines.push(`🏠 Retraits cumulés : ${money(r.withdrawn)}`)
    if (r.cash) lines.push(`Dont ${money(r.cash)} en espèces non rémunérées (plafonds des livrets).`)
    if (p.events.length) lines.push('📅 Événements :', ...p.events.map(e => { const name = p.pockets.find(x=>x.id===e.pocketId)?.name; return e.type === 'pause' ? `${name} : pause des versements du mois ${e.month} au mois ${e.endMonth}` : `${name} : ${e.type === 'withdrawal' ? 'retrait' : 'nouveau versement mensuel'} de ${money(e.amount)} ${e.type === 'withdrawal' && e.month % 12 === 0 ? `après ${e.month / 12} an${e.month === 12 ? '' : 's'}` : `au mois ${e.month}`}` }))
    lines.push('')
  }
  if (compare) lines.push(`↔️ Écart de capital simulé : ${money(Math.abs(results.a.final.capital - results.b.final.capital))}.`, 'Les capitaux, versements et hypothèses de chaque scénario sont indiqués ci-dessus.', '')
  lines.push('Rendements constants hypothétiques, versements en fin de mois, revenus réinvestis. Capital avant fiscalité ; pouvoir d’achat en euros d’aujourd’hui. Le résultat réel dépendra notamment des marchés et des taux.')
  const warnings = [...new Set(keys.flatMap(k => results[k].warnings))]
  if (warnings.length) lines.push('', ...warnings)
  return lines.join('\n')
}
