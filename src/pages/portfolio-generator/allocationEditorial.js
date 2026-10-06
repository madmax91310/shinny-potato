import { assetEditorial } from './asset-editorial.js'

const equityKinds = new Set(['world-developed','world-all','world-imi','world-ex-us','us','us-equal','us-small','nasdaq','europe','country','region','small','factor','theme','emerging','dividend','property','options','leverage'])
const total = (selection, kinds) => selection.filter(s => kinds.includes(assetEditorial(s).kind)).reduce((sum,s) => sum+s.pct,0)
const pct = value => `${new Intl.NumberFormat('fr-FR', {maximumFractionDigits:2}).format(value)} %`
const label = asset => assetEditorial(asset).label
const name = asset => label(asset).replace(/^(?:le |les |l’)/,'')

// Toutes les accroches partent de la sélection finale, jamais du profil demandé.
export function allocationAngle(selection) {
 const sorted = [...selection].filter(s=>s.pct>0).sort((a,b)=>b.pct-a.pct)
 const top = sorted[0]
 const crypto = total(sorted,['bitcoin','ethereum'])
 const lever = total(sorted,['leverage'])
 const equities = sorted.filter(s=>equityKinds.has(assetEditorial(s).kind)).reduce((sum,s)=>sum+s.pct,0)
 const eurosMoney = total(sorted,['euros','money'])
 const cashName = total(sorted,['euros']) && total(sorted,['money']) ? 'fonds euros et monétaire' : total(sorted,['euros']) ? 'fonds euros' : 'monétaire'
 const world = sorted.find(s=>['world-developed','world-all','world-imi'].includes(assetEditorial(s).kind))
 const us = total(sorted,['us','us-equal','us-small','nasdaq','leverage'])
 const exUs = total(sorted,['world-ex-us'])
 const line = s => `${pct(s.pct)} sur ${label(s)}`
 let fact, detail, logic
 if (sorted.length===1) {
  fact=`${pct(top.pct)} sur ${label(top)}`;detail='avec une seule ligne'
  logic=`Toute l’allocation repose sur ${label(top)}. Un seul support à suivre : son contenu détermine les expositions et les risques du portefeuille.`
 } else if (crypto && lever) {
  fact=`${pct(crypto)} de ${sorted.some(s=>assetEditorial(s).kind==='bitcoin') && sorted.some(s=>assetEditorial(s).kind==='ethereum') ? 'crypto' : sorted.some(s=>assetEditorial(s).kind==='bitcoin') ? 'Bitcoin' : 'Ethereum'} et ${pct(lever)} d’ETF à levier`;detail='qui cumule ces deux expositions'
  logic=`La crypto et le levier peuvent peser fortement sur les variations du portefeuille.${world ? ` ${name(world)} représente ${pct(world.pct)}, mais sa présence ne suffit pas à atténuer les mouvements des autres lignes.` : ''}`
 } else if (crypto) {
  const cryptoName = sorted.some(s=>assetEditorial(s).kind==='bitcoin') && sorted.some(s=>assetEditorial(s).kind==='ethereum') ? 'crypto' : sorted.some(s=>assetEditorial(s).kind==='bitcoin') ? 'Bitcoin' : 'Ethereum'
  fact=`${pct(crypto)} de ${cryptoName}${eurosMoney ? `, ${pct(eurosMoney)} en ${cashName}` : `, ${line(sorted.find(s=>!['bitcoin','ethereum'].includes(assetEditorial(s).kind)) ?? top)}`}`
  if (crypto===100) fact=`${pct(crypto)} en crypto, répartis entre Bitcoin et Ethereum`
  detail=crypto===100 ? 'entièrement en crypto' : 'qui fait une place à la crypto'
  logic=`La crypto représente ${pct(crypto)} de l’allocation. ${crypto<=15 ? 'Même cette part limitée peut se faire sentir lors d’une forte baisse.' : 'Ses mouvements peuvent peser fortement sur le résultat global.'}`
 } else if (lever) {
  fact=`${pct(lever)} d’ETF à levier${world ? ` à côté de ${pct(world.pct)} sur ${label(world)}` : `, ${line(top)}`}`;detail='avec des mouvements quotidiens amplifiés'
  logic=`Le levier occupe ${pct(lever)} du portefeuille. Ce poids ne suffit pas à mesurer son influence : cette ligne amplifie les mouvements quotidiens de son indice, à la hausse comme à la baisse.`
 } else if (equities<50 && equities>0 && eurosMoney>50) {
  fact=`${pct(equities)} en actions, ${pct(eurosMoney)} en ${cashName}`;detail='où la Bourse reste minoritaire'
  logic=`Les actions représentent ${pct(equities)} du portefeuille. Leur progression comme leurs baisses auront moins d’effet que si elles occupaient toute l’allocation. ${cashName==='fonds euros et monétaire' ? 'Le fonds euros et le monétaire ne répondent pas aux mêmes conditions de garantie.' : cashName==='fonds euros' ? 'Le fonds euros conserve les conditions de garantie du contrat.' : 'Le monétaire suit les taux courts et ne bénéficie pas d’une garantie de dépôt.'}`
 } else if (exUs && us) {
  fact=total(sorted,['us-small'])>=40 ? `${pct(total(sorted,['us-small']))} en petites entreprises américaines, ${pct(us)} en actions américaines au total` : `${pct(us)} en actions américaines, ${pct(exUs)} dans les autres pays développés`;detail='qui règle séparément la place des États-Unis'
  logic=`Les lignes américaines représentent ${pct(us)} du portefeuille, contre ${pct(exUs)} pour les autres pays développés. Leur poids est choisi directement, plutôt que repris d’un indice World.${!total(sorted,['emerging','world-all','world-imi']) ? ' Les marchés émergents ne sont pas inclus.' : ''}`
 } else {
  const themes=sorted.filter(s=>assetEditorial(s).kind==='theme')
  const small=total(sorted,['small','us-small'])
  const emerging=total(sorted,['emerging'])
  if (themes.length) {
   fact=line(themes[0]);detail=`qui assume une conviction ${themes.length>1 ? 'sur plusieurs thèmes' : 'sur ce thème'}`
   logic=`${pct(themes.reduce((sum,s)=>sum+s.pct,0))} du portefeuille est consacré à des thèmes précis. Croire à leur développement ne garantit pas de bons rendements : le prix des actions et les entreprises sélectionnées comptent aussi.`
  } else if (small && world) {
   fact=`${pct(small)} en petites entreprises à côté de ${pct(world.pct)} sur ${label(world)}`;detail='qui va au-delà des grands groupes'
   logic=assetEditorial(world).kind==='world-imi' ? 'L’ACWI IMI inclut déjà les petites capitalisations. La ligne dédiée aux petites entreprises développées renforce ce segment, avec ses risques de financement et de liquidité.' : 'Les petites entreprises élargissent la sélection au-delà des grandes et moyennes entreprises du fonds mondial. Elles ajoutent aussi leurs propres risques de financement et de liquidité.'
  } else if (emerging && world) {
   fact=`${pct(world.pct)} sur ${label(world)}, ${pct(emerging)} en marchés émergents`;detail='qui choisit leur poids séparément'
   logic=['world-all','world-imi'].includes(assetEditorial(world).kind) ? 'Le fonds mondial contient déjà des marchés émergents. La ligne dédiée renforce leur place, plutôt que de les ajouter pour la première fois.' : 'Les marchés émergents ajoutent des pays absents du World. Leur poids est ici choisi séparément.'
  } else {
   fact=line(top);detail=top.pct>50 ? 'où cette ligne est majoritaire' : 'construit autour de cette ligne'
   logic=`La ligne ${name(top)} représente ${pct(top.pct)} du portefeuille${top.pct>50 ? ' et constitue sa ligne majoritaire' : ' et constitue sa plus grosse ligne'}. ${line(sorted[1])} complète ce…746 tokens truncated…const lotOneRoles = { acwi_imi_spdr: 'Cette ligne réunit grandes, moyennes et petites entreprises des pays développés et émergents. Leur poids suit leur capitalisation.', world_ex_usa: 'Cette ligne retire les entreprises américaines des pays développés, sans ajouter les émergents ni les petites capitalisations.' }
Object.assign(roles, lotOneRoles)
const add = (ids, text) => ids.split(' ').forEach(id => { roles[id] = text })
add('gaming_vaneck', 'Une poche dédiée aux entreprises du jeu vidéo et de l’eSport, avec un panier concentré et un risque actions.')
add('medical_innovation_ishares', 'Une poche dédiée à l’innovation dans les soins, différente du secteur santé entier et sensible aux essais et autorisations.')
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
add('oblig_global_agg_eur_hedged', 'On prête à des emprunteurs dans le monde, avec une couverture vers l’euro qui ne supprime pas le risque de taux.')
add('sp500_equal_weight', 'On répartit autrement les entreprises du S&P 500, avec le même poids pour chacune à chaque rééquilibrage.')
add('world_ex_usa', 'Cette ligne investit dans les pays développés hors États-Unis, pour choisir séparément la place américaine.')

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
