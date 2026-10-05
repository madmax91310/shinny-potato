import { allocationHooks } from './allocationEditorial.js'
import { assetEditorial } from './asset-editorial.js'
import { shortAssetName } from '../../data/asset-selection.js'
import { SIMULATION_PROXIES } from '../../data/simulation-proxies.js'

const roles = {}
const lotOneRoles = { acwi_imi_spdr: 'Cette ligne réunit grandes, moyennes et petites entreprises des pays développés et émergents. Leur poids suit leur capitalisation.', world_ex_usa: 'Cette ligne retire les entreprises américaines des pays développés, sans ajouter les émergents ni les petites capitalisations.' }
Object.assign(roles, lotOneRoles)
const add = (ids, text) => ids.split(' ').forEach(id => { roles[id] = text })
add('msci_world msci_world_ishares msci_world_amundi_pea', 'Cette ligne investit dans plusieurs pays développés, sans avoir à choisir toi-même chaque entreprise.')
add('msci_acwi msci_acwi_ishares ftse_allworld_vanguard pea_global_amundi', 'Ce fonds réunit les actions des pays développés et émergents.')
add('sp500 sp500_ishares', 'On donne une place aux grandes entreprises américaines, au-delà de leurs activités à l’étranger.')
add('nasdaq100 nasdaq100_ishares', 'On renforce les grandes entreprises du Nasdaq, avec une forte place pour la technologie.')
add('actions_value', 'La sélection privilégie les actions moins chères selon les critères de l’indice, même si elles peuvent le rester longtemps.')
add('world_quality_ishares', 'La sélection privilégie la rentabilité, un endettement limité et des résultats réguliers, sans garantie de surperformance.')
add('world_momentum_ishares', 'Cette ligne permet de suivre les actions dont les cours progressent le plus récemment, en acceptant les retournements de tendance.')
add('world_minvol_ishares', 'Cette approche cherche à atténuer les variations de la poche actions, sans sortir de la Bourse.')
add('lqq', 'Cette ligne amplifie les mouvements quotidiens du Nasdaq avec un levier de deux, à la hausse comme à la baisse.')
add('cl2', 'Cette ligne amplifie les mouvements quotidiens du MSCI USA avec un levier de deux, à la hausse comme à la baisse.')
add('or or_wisdomtree or_ishares or_amundi', 'L’or apporte une autre exposition : son cours fait le résultat, sans revenu versé ni protection systématique contre les baisses.')
add('argent', 'Cette ligne ajoute un métal dont la demande dépend aussi de l’industrie, avec une dynamique différente de l’or.')
add('bitcoin bitcoin_wisdomtree bitcoin_etcgroup bitcoin_21shares', 'On fait une place à Bitcoin via un produit coté, en acceptant ses fortes variations.')
add('ethereum', 'Cette ligne investit dans Ethereum avec staking, en acceptant ses fortes variations et ses risques propres.')
add('fonds_euros', 'Une partie de l’épargne reste à l’écart des fluctuations des marchés, selon les conditions de garantie du contrat.')
add('monetaire_xeon', 'Cette ligne suit les taux courts en euros. Son rendement diminue quand ces taux baissent, sans garantie de dépôt.')
add('qyld_ucits', 'Cette approche cherche des distributions via les options : une partie de la hausse est échangée contre des primes.')
add('oblig_etat_eur_short', 'On prête aux États de la zone euro sur des échéances courtes pour limiter la sensibilité aux taux.')
add('oblig_etat_us', 'Ces obligations financent l’État américain. Leur résultat dépend notamment des taux et du dollar.')
add('oblig_etat_eur', 'Ces obligations financent les États de la zone euro. Une hausse des taux peut faire baisser leur cours.')
add('oblig_corp_ig oblig_corp_amundi oblig_corp_vanguard oblig_corp_spdr', 'Ces obligations financent des entreprises bien notées. Leur cours reste sensible aux taux et aux difficultés de remboursement.')
add('oblig_0_1_ishares', 'On prête aux États de la zone euro sur zéro à un an, sans garantie de capital.')
add('oblig_eur_long_ishares', 'Cette ligne permet de miser sur les obligations longues en euros, dont les cours réagissent fortement aux mouvements des taux.')
add('oblig_em_usd_ishares', 'Cette ligne permet de recevoir les intérêts d’emprunts émergents en dollars, en acceptant les risques de crédit et de change.')
add('oblig_em_local_ishares_acc', 'On prête aux États émergents dans leurs monnaies locales, avec les variations de change à assumer.')
add('oblig_global_agg_eur_hedged', 'Une exposition les emprunteurs dans le monde, avec une couverture vers l’euro qui ne supprime pas le risque de taux.')
add('sp500_equal_weight', 'On répartit autrement les entreprises du S&P 500, avec le même poids pour chacune à chaque rééquilibrage.')
add('world_ex_usa', 'Cette ligne investit dans les pays développés hors États-Unis et choisir séparément la place américaine.')

export function compactRole(asset, selection) {
  const kind = assetEditorial(asset).kind
  const kinds = new Set(selection.map(s => assetEditorial(s).kind))
  if (selection.length === 1) return `Toute l’épargne sur cette ligne. ${roles[asset.id] ?? assetEditorial(asset).text.split(/(?<=\.)\s/)[0]}`
  if (kind === 'emerging' && kinds.has('world-all')) return 'On renforce les marchés émergents déjà présents dans l’indice mondial, plutôt que les ajouter pour la première fois.'
  if (kind === 'emerging' && kinds.has('world-developed')) return `Pour ajouter les marchés que le World ne couvre pas${asset.id === 'msci_em' ? ', y compris leurs petites entreprises' : ''}.`
  if (kind === 'us' && (kinds.has('world-developed') || kinds.has('world-all'))) return 'On renforce les grandes entreprises américaines déjà présentes dans le fonds mondial.'
  if (['world-developed', 'world-all'].includes(kind) && selection.some(s => s.id === 'fonds_euros' && s.pct > asset.pct)) return 'On fait une place aux actions mondiales, tout en gardant davantage en fonds euros.'
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

export const compactHooks = allocationHooks

export function dataLabels(asset) {
 const note = (asset.confidenceNote ?? '').toLowerCase()
 const labels = []
 if (SIMULATION_PROXIES[asset.isin] || /simulation sur|simulation \d{4}|simulées|approxim|précède|ancienne méthode|autre part|part distribuante du même|provient de la part distribuante|convertis/.test(note)) labels.push('Historique reconstitué')
 if (/dollars|\busd\b/.test(note) && !/convertis.*euros/.test(note)) labels.push('Données en USD')
 if (/changé d’indice|indice modifié/.test(note)) labels.push('Indice modifié')
 return labels
}
