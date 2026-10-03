import { assetEditorial } from './asset-editorial.js'
import { shortAssetName } from '../../data/asset-selection.js'
import { SIMULATION_PROXIES } from '../../data/simulation-proxies.js'

const roles = {}
const add = (ids, text) => ids.split(' ').forEach(id => { roles[id] = text })
add('msci_world msci_world_ishares msci_world_amundi_pea', 'Pour investir dans plusieurs pays développés, sans choisir toi-même les prochaines entreprises gagnantes.')
add('msci_acwi msci_acwi_ishares ftse_allworld_vanguard pea_global_amundi', 'Pour réunir les actions des pays développés et émergents dans une seule ligne.')
add('sp500 sp500_ishares', 'Pour donner une place aux grandes entreprises américaines, au-delà de leurs activités à l’étranger.')
add('nasdaq100 nasdaq100_ishares', 'Pour renforcer les grandes entreprises du Nasdaq, avec une forte place pour la technologie.')
add('actions_value', 'Pour privilégier les actions moins chères selon les critères de l’indice, même si elles peuvent le rester longtemps.')
add('world_quality_ishares', 'Pour privilégier la rentabilité, un endettement limité et des résultats réguliers, sans garantie de surperformance.')
add('world_momentum_ishares', 'Pour suivre les actions dont les cours progressent le plus récemment, en acceptant les retournements de tendance.')
add('world_minvol_ishares', 'Pour chercher à atténuer les variations de la poche actions, sans sortir de la Bourse.')
add('lqq', 'Pour amplifier les mouvements quotidiens du Nasdaq avec un levier de deux, à la hausse comme à la baisse.')
add('cl2', 'Pour amplifier les mouvements quotidiens du MSCI USA avec un levier de deux, à la hausse comme à la baisse.')
add('or or_wisdomtree or_ishares or_amundi', 'Pour diversifier avec l’or : son cours fait le résultat, sans revenu versé ni protection systématique contre les baisses.')
add('argent', 'Pour ajouter un métal dont la demande dépend aussi de l’industrie, avec une dynamique différente de l’or.')
add('bitcoin bitcoin_wisdomtree bitcoin_etcgroup bitcoin_21shares', 'Pour faire une place à Bitcoin via un produit coté, en acceptant ses fortes variations.')
add('ethereum', 'Pour investir dans Ethereum avec staking, en acceptant ses fortes variations et ses risques propres.')
add('fonds_euros', 'Pour garder une partie de l’épargne à l’écart des marchés, selon les conditions de garantie du contrat.')
add('monetaire_xeon', 'Pour suivre les taux courts en euros, avec un rendement qui baisse lorsqu’ils diminuent et sans garantie de dépôt.')
add('qyld_ucits', 'Pour chercher des distributions via les options : une partie de la hausse est échangée contre des primes.')
add('oblig_etat_eur_short', 'Pour prêter aux États de la zone euro sur des échéances courtes et limiter la sensibilité aux taux.')
add('oblig_0_1_ishares', 'Pour prêter aux États de la zone euro sur zéro à un an, sans garantie de capital.')
add('oblig_eur_long_ishares', 'Pour miser sur les obligations longues en euros, dont les cours réagissent fortement aux mouvements des taux.')
add('oblig_em_usd_ishares', 'Pour recevoir les intérêts d’emprunts émergents en dollars, en acceptant les risques de crédit et de change.')
add('oblig_em_local_ishares_acc', 'Pour prêter aux États émergents dans leurs monnaies locales, avec les variations de change à assumer.')
add('oblig_global_agg_eur_hedged', 'Pour diversifier les emprunteurs dans le monde, avec une couverture vers l’euro qui ne supprime pas le risque de taux.')
add('sp500_equal_weight', 'Pour répartir autrement les entreprises du S&P 500, avec le même poids pour chacune à chaque rééquilibrage.')
add('world_ex_usa', 'Pour investir dans les pays développés hors États-Unis et choisir séparément la place américaine.')

export function compactRole(asset, selection) {
  const kind = assetEditorial(asset).kind
  const kinds = new Set(selection.map(s => assetEditorial(s).kind))
  if (selection.length === 1) return `Toute l’épargne sur cette ligne. ${roles[asset.id] ?? assetEditorial(asset).text.split(/(?<=\.)\s/)[0]}`
  if (kind === 'emerging' && kinds.has('world-all')) return 'Pour renforcer les marchés émergents déjà présents dans l’indice mondial, plutôt que les ajouter pour la première fois.'
  if (kind === 'emerging' && kinds.has('world-developed')) return `Pour ajouter les marchés que le World ne couvre pas${asset.id === 'msci_em' ? ', y compris leurs petites entreprises' : ''}.`
  if (kind === 'us' && (kinds.has('world-developed') || kinds.has('world-all'))) return 'Pour renforcer les grandes entreprises américaines déjà présentes dans le fonds mondial.'
  if (['world-developed', 'world-all'].includes(kind) && selection.some(s => s.id === 'fonds_euros' && s.pct > asset.pct)) return 'Pour faire une place aux actions mondiales, tout en gardant davantage en fonds euros.'
  // Chaque exposition possède déjà son explication propre ; garder sa première
  // phrase entière pour les autres supports, sans couper arbitrairement le texte.
  return roles[asset.id] ?? assetEditorial(asset).text.split(/(?<=\.)\s/)[0]
}

const names = {
 'world-developed': 'MSCI World', 'gold': 'Or physique', 'bitcoin': 'Bitcoin', 'ethereum': 'Ethereum',
 'nasdaq': 'Nasdaq 100', 'us': 'S&P 500', 'us-equal': 'S&P 500 équipondéré', 'us-small': 'Russell 2000',
 'world-ex-us': 'World hors États-Unis',
}
export function portfolioAssetLabel(asset) {
 const info = assetEditorial(asset)
 let name = names[info.kind]
 if (info.kind === 'world-all') name = /All-World/.test(asset.name) ? 'FTSE All-World' : 'MSCI ACWI'
 if (asset.id === 'pea_global_amundi') name = 'PEA Global · ACWI'
 if (info.kind === 'factor') name = ({actions_value:'World Value',world_quality_ishares:'World Quality',world_momentum_ishares:'World Momentum',world_minvol_ishares:'World Min Volatility'})[asset.id]
 if (info.kind === 'leverage') name = asset.id === 'lqq' ? 'Nasdaq 100 ×2' : 'MSCI USA ×2'
 if (info.kind === 'emerging') name = asset.id === 'msci_em' ? 'Émergents IMI' : /FTSE/.test(asset.name) ? 'Émergents FTSE' : 'Marchés émergents'
 const issuer = asset.name.match(/Amundi|iShares|SPDR|WisdomTree|Vanguard|Xtrackers|Invesco|CoinShares|21Shares/i)?.[0]
 return name ? `${name}${issuer ? ` · ${issuer}` : ''}` : shortAssetName(asset.name)
}

export function compactHooks(selection) {
 const kinds = new Set(selection.map(s => assetEditorial(s).kind))
 const has = kind => kinds.has(kind)
 const lever = selection.find(s => assetEditorial(s).kind === 'leverage')
 const parts = []
 if (selection.length === 1) parts.push(assetEditorial(selection[0]).label)
 else {
  if (has('world-developed') || has('world-all') || has('world-ex-us')) parts.push('des actions mondiales')
  else if (selection.some(s => ['us','nasdaq','us-small','us-equal','europe','country','region','small','factor','theme','emerging'].includes(assetEditorial(s).kind))) parts.push('des actions')
  if (has('dividend')) parts.push('des actions à dividendes')
  if (has('euros')) parts.push('un fonds euros')
  if ([...kinds].some(k => /bond|inflation/.test(k))) parts.push('des obligations')
  if (has('gold')) parts.push('de l’or')
  if (has('bitcoin') || has('ethereum')) parts.push(has('bitcoin') && has('ethereum') ? 'des cryptos' : has('bitcoin') ? 'Bitcoin' : 'Ethereum')
  if (has('money')) parts.push('du monétaire')
  if (has('property') || has('property-private')) parts.push('de l’immobilier')
  if (has('options')) parts.push('une stratégie à options')
  if (has('silver') || has('commodities')) parts.push('des matières premières')
  if (lever) parts.push(lever.pct <= 15 ? 'une touche de levier' : 'du levier')
 }
 // Three identifying, short variants. No percentage or unsupported risk label.
 const visible = parts.length > 4 ? [...parts.slice(0, 3), lever ? parts.at(-1) : 'd’autres actifs'] : parts
 const joined = visible.length > 1 ? `${visible.slice(0,-1).join(', ')} et ${visible.at(-1)}` : visible[0]
 const title = joined[0].toUpperCase() + joined.slice(1)
 return [`🧩 Exemple de portefeuille : ${joined} 👇`, `🧩 Exemple de portefeuille : comment associer ${joined} ? 👇`, `🧩 Exemple de portefeuille : ${title}. Tu changerais quoi ? 👇`]
}

export function dataLabels(asset) {
 const note = (asset.confidenceNote ?? '').toLowerCase()
 const labels = []
 if (SIMULATION_PROXIES[asset.isin] || /simulation sur|simulation \d{4}|simulées|approxim|précède|ancienne méthode|autre part|part distribuante du même|provient de la part distribuante|convertis/.test(note)) labels.push('Historique reconstitué')
 if (/dollars|\busd\b/.test(note) && !/convertis.*euros/.test(note)) labels.push('Données en USD')
 if (/changé d’indice|indice modifié/.test(note)) labels.push('Indice modifié')
 return labels
}
