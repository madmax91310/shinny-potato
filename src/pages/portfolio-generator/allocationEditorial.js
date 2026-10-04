import { assetEditorial } from './asset-editorial.js'

const equityKinds = new Set(['world-developed','world-all','world-ex-us','us','us-equal','us-small','nasdaq','europe','country','region','small','factor','theme','emerging','dividend','property','options','leverage'])
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
 const world = sorted.find(s=>['world-developed','world-all'].includes(assetEditorial(s).kind))
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
  logic=`Les lignes américaines représentent ${pct(us)} du portefeuille, contre ${pct(exUs)} pour les autres pays développés. Leur poids est choisi directement, plutôt que repris d’un indice World.${!total(sorted,['emerging','world-all']) ? ' Les marchés émergents ne sont pas inclus.' : ''}`
 } else {
  const themes=sorted.filter(s=>assetEditorial(s).kind==='theme')
  const small=total(sorted,['small','us-small'])
  const emerging=total(sorted,['emerging'])
  if (themes.length) {
   fact=line(themes[0]);detail=`qui assume une conviction ${themes.length>1 ? 'sur plusieurs thèmes' : 'sur ce thème'}`
   logic=`${pct(themes.reduce((sum,s)=>sum+s.pct,0))} du portefeuille est consacré à des thèmes précis. Croire à leur développement ne garantit pas de bons rendements : le prix des actions et les entreprises sélectionnées comptent aussi.`
  } else if (small && world) {
   fact=`${pct(small)} en petites entreprises à côté de ${pct(world.pct)} sur ${label(world)}`;detail='qui va au-delà des grands groupes'
   logic='Les petites entreprises élargissent la sélection au-delà des grandes et moyennes entreprises du fonds mondial. Elles ajoutent aussi leurs propres risques de financement et de liquidité.'
  } else if (emerging && world) {
   fact=`${pct(world.pct)} sur ${label(world)}, ${pct(emerging)} en marchés émergents`;detail='qui choisit leur poids séparément'
   logic=assetEditorial(world).kind==='world-all' ? 'Le fonds mondial contient déjà des marchés émergents. La ligne dédiée renforce leur place, plutôt que de les ajouter pour la première fois.' : 'Les marchés émergents ajoutent des pays absents du World. Leur poids est ici choisi séparément.'
  } else {
   fact=line(top);detail=top.pct>50 ? 'où cette ligne est majoritaire' : 'construit autour de cette ligne'
   logic=`${name(top)} occupe ${pct(top.pct)} du portefeuille${top.pct>50 ? ' et constitue sa ligne majoritaire' : ' et constitue sa plus grosse ligne'}. ${line(sorted[1])} complète ce choix.`
  }
 }
 const sharedUs = world && sorted.some(s=>['us','nasdaq'].includes(assetEditorial(s).kind))
 if (sharedUs) logic+=' Les entreprises américaines sont déjà présentes dans le fonds mondial : la ligne ajoutée renforce cette exposition.'
 if (sorted.filter(s=>['world-developed','world-all'].includes(assetEditorial(s).kind)).length>1) logic+=' Les fonds mondiaux se recoupent : plusieurs lignes ne multiplient pas automatiquement la diversification.'
 if (equities===100) logic+=' Toute l’allocation est exposée aux actions ; aucune poche obligataire ou de fonds euros n’est présente.'
 return {fact,detail,logic}
}

export function allocationHooks(selection) {
 const {fact,detail}=allocationAngle(selection)
 return [
  `🧩 ${fact} : voici un exemple de portefeuille ${detail} 👇`,
  `🧩 Un exemple de portefeuille ${detail} : ${fact} 👇`,
  `🧩 ${fact}. Que change ce choix ? Regardons cet exemple de portefeuille 👇`,
 ]
}

export function allocationQuestions(selection) {
 const crypto=total(selection,['bitcoin','ethereum'])
 const lever=total(selection,['leverage'])
 const equities=selection.filter(s=>equityKinds.has(assetEditorial(s).kind)).reduce((sum,s)=>sum+s.pct,0)
 if (crypto && lever) return [
  'Tu garderais à la fois la crypto et le levier, ou tu choisirais une seule de ces deux expositions ?',
  `Entre les ${pct(crypto)} de crypto et les ${pct(lever)} de levier, quelle poche réduirais-tu en premier ?`,
 ]
 if (!crypto && !lever && equities>0 && equities<50 && total(selection,['euros','money'])>50) return [
  `Tu garderais les actions à ${pct(equities)}, ou tu leur donnerais davantage de place ?`,
  'Tu préférerais cette majorité hors actions, ou une allocation plus exposée à la Bourse ?',
 ]
 if (total(selection,['world-ex-us']) && total(selection,['us','us-equal','us-small','nasdaq'])) return [
  total(selection,['us-small'])>=40 ? 'Tu donnerais autant de place aux petites entreprises américaines, ou tu renforcerais les autres pays développés ?' : 'Pour tes actions, tu préférerais régler toi-même le poids des États-Unis ou suivre celui d’un indice mondial ?',
  'Tu garderais cette répartition entre les États-Unis et les autres pays développés, ou tu changerais leurs poids ?',
 ]
 return null
}
