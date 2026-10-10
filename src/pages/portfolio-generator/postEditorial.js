import { assetEditorial } from './asset-editorial.js'
import { allocationAngle } from './allocationEditorial.js'
import { shortAssetName } from '../../data/asset-selection.js'

export const portfolioPostName = asset => shortAssetName(asset.name)

const percent = value => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} %`
const equityKinds = new Set(['world-developed', 'world-all', 'world-imi', 'world-ex-us', 'us', 'us-equal', 'us-small', 'nasdaq', 'europe', 'country', 'region', 'small', 'factor', 'theme', 'emerging', 'dividend', 'property', 'options', 'leverage'])
const kind = asset => assetEditorial(asset).kind
const total = (rows, kinds) => rows.filter(row => kinds.includes(kind(row))).reduce((sum, row) => sum + row.pct, 0)
const label = asset => assetEditorial(asset).label
const toLabel = asset => label(asset).replace(/^le /, 'au ').replace(/^les /, 'aux ').replace(/^/, /^(le |les )/.test(label(asset)) ? '' : 'à ')
const join = words => words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} et ${words.at(-1)}`

// Public copy follows the actual selection, including replacements and saved history.
// The detailed roles and provenance remain in the application, outside the post.
export function portfolioPostEditorial(selection) {
  const rows = selection.filter(row => row.pct > 0).slice().sort((a, b) => b.pct - a.pct)
  if (!rows.length) return { hooks: ['', '', ''], thesis: '' }
  const top = rows[0]
  const world = rows.find(row => ['world-developed', 'world-all', 'world-imi'].includes(kind(row)))
  const crypto = total(rows, ['bitcoin', 'ethereum'])
  const cryptoName = total(rows, ['bitcoin']) && total(rows, ['ethereum']) ? 'la crypto' : total(rows, ['bitcoin']) ? 'Bitcoin' : 'Ethereum'
  const leverage = total(rows, ['leverage'])
  const equities = rows.filter(row => equityKinds.has(kind(row))).reduce((sum, row) => sum + row.pct, 0)
  const gold = total(rows, ['gold'])
  const emerging = total(rows, ['emerging'])
  const small = total(rows, ['small', 'us-small'])
  const property = total(rows, ['property', 'property-private'])
  const options = total(rows, ['options'])
  const dividends = total(rows, ['dividend'])
  const euros = total(rows, ['euros'])
  const money = total(rows, ['money'])
  const bonds = total(rows, ['bond', 'short-bond', 'long-bond', 'em-bond', 'high-yield'])
  const inflation = total(rows, ['inflation'])
  const themes = rows.filter(row => kind(row) === 'theme')
  const factors = rows.filter(row => kind(row) === 'factor')
  const exUs = total(rows, ['world-ex-us'])
  const us = total(rows, ['us', 'us-equal', 'us-small', 'nasdaq', 'leverage'])
  const europe = rows.filter(row => ['europe'].includes(kind(row)) || ['tech_europe', 'smallcap_europe', 'basic_resources_pea'].includes(row.id))
  let openings, transition, thesis
  if (rows.length === 1) {
    openings = [`Un seul placement pour tout le portefeuille : que retrouve-t-on dans ${label(top)} ?`, `Tout le portefeuille sur ${label(top)}. Qu’est-ce que ce choix implique ?`, `Multiplier les lignes n’est pas obligatoire. Mais que détient-on avec ${label(top)} comme seul placement ?`]
    transition = `Ce portefeuille illustratif consacre ${percent(top.pct)} à cette ligne. Voici ses performances 👇`
    thesis = `Avec une seule ligne, je regarde surtout ce qu’elle contient : toute l’allocation repose sur ${label(top)}. ${assetEditorial(top).text}`
  } else if (crypto) {
    openings = leverage
      ? [`${cryptoName === 'la crypto' ? 'La crypto' : cryptoName} et des ETF à levier dans le même portefeuille : quelle place laisser aux autres placements ?`, `Associer ${cryptoName} à du levier, c’est cumuler deux expositions qui peuvent beaucoup bouger. À quoi ressemble la répartition ?`, `Un portefeuille avec ${cryptoName} et du levier peut vite devenir mouvementé. Comment celui-ci est-il construit ?`]
      : crypto === 100
        ? ['Bitcoin et Ethereum dans le même portefeuille : comment répartir les deux ?', 'Un portefeuille entièrement en crypto : quelle place donner à Bitcoin et à Ethereum ?', 'Deux cryptos, un portefeuille. Que change la répartition entre Bitcoin et Ethereum ?']
        : [`Tu veux une place pour ${cryptoName} dans ton portefeuille${euros || money || total(rows, ['short-bond']) ? ', mais aussi des placements moins mouvementés à côté' : ', sans lui consacrer toute l’allocation'} ?`, `${cryptoName === 'la crypto' ? 'La crypto' : cryptoName} représente ${percent(crypto)} de ce portefeuille. Que trouve-t-on à côté ?`, `Ajouter ${cryptoName} à un portefeuille, c’est aussi décider de ce qu’on garde autour. Comment celui-ci est-il réparti ?`]
    transition = 'Voici la répartition de ce portefeuille illustratif et ses performances 👇'
    const rest = join([equities && `${percent(equities)} d’actions`, euros && `${percent(euros)} de fonds euros`, money && `${percent(money)} de monétaire`, bonds && `${percent(bonds)} d’obligations`, gold && `${percent(gold)} d’or`, total(rows, ['silver']) && `${percent(total(rows, ['silver']))} d’argent`, total(rows, ['commodities']) && `${percent(total(rows, ['commodities']))} de matières premières`, inflation && `${percent(inflation)} d’obligations indexées`, total(rows, ['property-private']) && `${percent(total(rows, ['property-private']))} de SCPI`].filter(Boolean))
    thesis = `Ce que je regarde d’abord ici, c’est la place de ${cryptoName} : ${cryptoName === 'la crypto' ? 'la crypto' : cryptoName} représente ${percent(crypto)} du portefeuille.${rest ? ` À côté, on retrouve ${rest}.` : ''}`
    if (leverage) thesis += ' Le levier 2x est quotidien, pas une multiplication par deux du rendement sur plusieurs années.'
    thesis += crypto === 100 ? '\n\nToute l’allocation dépend de ces deux cryptos : leurs différences ne les empêchent pas de baisser ensemble.' : `\n\nUne baisse de moitié de la poche crypto retirerait ${percent(crypto / 2)} au portefeuille si les autres placements restaient inchangés.`
  } else if (leverage) {
    openings = ['Ajouter du levier à un portefeuille, ça peut amplifier les gains. Mais quelle place lui laisser quand les marchés baissent ?', 'Un ETF à levier à côté des autres placements : que change cette poche dans le portefeuille ?', `Ce portefeuille consacre ${percent(leverage)} aux ETF à levier. Comment le reste est-il réparti ?`]
    transition = 'Voici la répartition de ce portefeuille illustratif et ses performances 👇'
    thesis = `La poche que je surveillerais particulièrement ici, c’est le levier. Il occupe ${percent(leverage)} du portefeuille${world ? `, à côté de ${percent(world.pct)} sur ${label(world)}` : ''}. Le levier 2x est quotidien, pas une multiplication par deux du rendement sur plusieurs années.\n\nCette poche amplifie les mouvements de son indice à la hausse comme à la baisse. Son influence peut dépasser son poids dans l’allocation.`
  } else if (options || dividends || property) {
    const distributed = rows.some(row => row.distributing || row.id === 'scpi')
    openings = options
      ? ['Recevoir des primes d’options dans un portefeuille, ça demande d’accepter quoi en échange ?', 'Des options pour chercher des revenus, avec d’autres placements à côté : comment répartir le portefeuille ?', 'Un portefeuille qui vend des options ne profite pas de toute la hausse de son indice. Quelle place donner à cette stratégie ?']
      : distributed
        ? ['Recevoir des revenus de son portefeuille, ça peut passer par autre chose que les dividendes.', 'Pour recevoir des revenus, faut-il concentrer son portefeuille sur les actions à dividendes ?', 'Les dividendes ne sont pas la seule source de revenus d’un portefeuille. Comment répartir les autres placements ?']
        : ['Un ETF à dividendes ou immobilier ne dit pas, à lui seul, comment les revenus sont utilisés.', 'Dividendes ou immobilier dans un portefeuille : que trouve-t-on à côté ?', 'Choisir des actions pour leurs dividendes, c’est aussi choisir les entreprises qui vont composer le portefeuille.']
    transition = 'Voici les placements réunis dans ce portefeuille illustratif, leur répartition et leurs performances 👇'
    const sources = join([dividends && 'les actions à dividendes', property && 'l’immobilier', options && 'la vente d’options', bonds && 'les obligations', euros && 'le fonds euros'].filter(Boolean))
    thesis = `Pour comprendre d’où viennent les revenus, je regarde les placements réunis ici : ${sources}.`
    if (options) thesis += ` Les options représentent ${percent(options)} : une partie de la hausse possible est échangée contre des primes.`
    if (!distributed) thesis += ' Les parts capitalisantes réinvestissent leurs revenus dans le fonds.'
    if (property) thesis += `\n\nL’immobilier représente ${percent(property)} de l’allocation${total(rows, ['property-private']) && total(rows, ['property']) ? ', réparti entre sociétés cotées et SCPI' : ''}. Les revenus comme la valeur de ces placements peuvent baisser.`
    else thesis += '\n\nLes distributions peuvent diminuer et accompagner une baisse du capital.'
  } else if (themes.length) {
    const theme = themes[0]
    openings = [`Tu t’intéresses ${toLabel(theme)}. Mais quelle place donner à ce thème dans un portefeuille ?`, `Un portefeuille avec ${percent(theme.pct)} sur ${label(theme)} : quels placements mettre à côté ?`, `Croire au développement d’un secteur ne veut pas dire y consacrer tout son portefeuille. Comment répartir le reste ?`]
    transition = 'Voici un portefeuille illustratif construit autour de cette conviction, avec sa répartition et ses performances 👇'
    thesis = `Je regarde surtout le poids donné à cette conviction : ${percent(themes.reduce((sum, row) => sum + row.pct, 0))} du portefeuille est consacré ${themes.length > 1 ? 'à plusieurs thèmes' : toLabel(theme)}.${world ? ` ${label(world)[0].toUpperCase()}${label(world).slice(1)} complète cette conviction avec ${percent(world.pct)} de l’allocation.` : ''}\n\nCertaines entreprises peuvent déjà être présentes dans les autres ETF. Ajouter une ligne thématique peut donc renforcer leur poids, plutôt qu’ajouter uniquement de nouvelles sociétés.`
  } else if (world && (emerging || small || exUs || us || factors.length)) {
    const additions = join([emerging && 'des émergents', small && 'des petites entreprises', exUs && 'un ETF hors États-Unis', us && 'des actions américaines', factors.length && 'des filtres de sélection', gold && 'de l’or'].filter(Boolean))
    const base = kind(world) === 'world-developed' ? 'World' : kind(world) === 'world-imi' ? 'ACWI IMI' : /All-World/.test(world.name) ? 'All-World' : 'ACWI'
    openings = [`Quand j’ajoute un ETF à un portefeuille, j’aime comprendre ce qu’il apporte à côté des autres 👀`, `Un ETF ${base} couvre déjà beaucoup d’entreprises. Avant d’ajouter ${additions}, je regarde ce que ça change vraiment 👀`, `Quand je vois plusieurs ETF autour d’un ${base}, je me demande ce que chaque ligne apporte 👀`]
    transition = 'Voici un portefeuille illustratif, avec sa répartition et ses performances 👇'
    thesis = `Ce que je trouve intéressant ici, c’est qu’on garde ${percent(world.pct)} sur ${label(world)} tout en choisissant la place des autres lignes.`
    if (emerging || small) {
      const extra = join([emerging && 'Les émergents', small && `${emerging ? 'les' : 'Les'} petites entreprises`].filter(Boolean))
      const overlap = (emerging && kind(world) !== 'world-developed') || (small && kind(world) === 'world-imi')
      thesis += overlap ? ` ${extra} ont une ligne dédiée, mais sont ${emerging && small && kind(world) === 'world-all' ? 'en partie ' : ''}déjà présents dans la base mondiale. Leur poids est donc renforcé.` : ` ${extra} ont ${emerging && small ? 'chacun ' : ''}une ligne dédiée : leur poids est donc choisi séparément, plutôt que repris d’un indice mondial plus large.`
    }
    if (exUs) thesis += ' Le fonds hors États-Unis renforce les autres pays développés, sans ajouter les émergents.'
    if (us) thesis += ' Les entreprises américaines sont déjà présentes dans le fonds mondial : les lignes ajoutées renforcent cette exposition.'
    if (factors.length) thesis += ' Les filtres changent la sélection des actions ; les fonds peuvent détenir certaines des mêmes entreprises.'
  } else if (exUs && us) {
    openings = ['Un indice mondial fixe lui-même le poids des États-Unis. Et si tu voulais le choisir séparément ?', 'Grandes entreprises américaines, petites entreprises et autres pays développés : comment répartir ces marchés ?', 'Choisir soi-même la place des États-Unis dans un portefeuille, ça donne quoi ?']
    transition = 'Voici un portefeuille illustratif construit avec des lignes séparées, sa répartition et ses performances 👇'
    thesis = `Ce que je trouve intéressant ici, c’est de choisir directement la place des États-Unis. Les lignes américaines représentent ${percent(us)}, contre ${percent(exUs)} pour les autres pays développés. Leur poids est choisi directement, plutôt que repris d’un indice mondial.${!emerging ? ' Les marchés émergents ne sont pas inclus.' : ''}`
  } else if (europe.length && !world) {
    openings = ['Investir en Europe, ça peut passer par ses entreprises, mais aussi par ses emprunts.', 'Un portefeuille tourné vers l’Europe : quelle place donner aux actions et aux autres placements ?', 'Miser sur l’Europe ne se résume pas à choisir quelques actions françaises. À quoi ressemble ce portefeuille ?']
    transition = 'Voici la répartition de ce portefeuille illustratif et ses performances 👇'
    thesis = `Je regarde d’abord la place des actions européennes : elles représentent ${percent(europe.reduce((sum, row) => sum + row.pct, 0))} du portefeuille.${bonds ? ` Les obligations ajoutent ${percent(bonds)} d’emprunts, avec une sensibilité aux taux qui dépend de leurs échéances.` : ''}${total(rows, ['small']) ? ' Les petites entreprises ont leur propre ligne, à côté des grands groupes.' : ''}`
  } else if (inflation) {
    openings = ['Des obligations indexées et des métaux dans un portefeuille : est-ce suffisant pour faire face à l’inflation ?', 'Quand les prix montent, on pense souvent à l’or. Mais quelle place laisser aux autres placements ?', 'Chercher une exposition à l’inflation, c’est aussi accepter des placements dont les cours peuvent baisser.']
    transition = 'Voici la répartition de ce portefeuille illustratif et ses performances 👇'
    thesis = `Face à l’inflation, je regarde aussi ce qui peut faire baisser ces placements. Les obligations indexées représentent ${percent(inflation)} du portefeuille. Leurs paiements suivent l’inflation, mais leur cours dépend aussi des taux réels.${gold ? ` L’or occupe ${percent(gold)} de l’allocation et ne verse pas de revenu.` : ''}\n\nCes placements ne garantissent pas que la valeur du portefeuille suivra la hausse des prix.`
  } else if ((euros || money || bonds) && equities) {
    openings = ['Investir en Bourse sans y mettre toute son épargne : comment répartir le portefeuille ?', 'Quelle place laisser aux actions quand on veut garder d’autres placements à côté ?', 'Un portefeuille peut profiter des marchés sans être entièrement investi en actions. Comment celui-ci est-il construit ?']
    transition = 'Voici la répartition de ce portefeuille illustratif et ses performances 👇'
    thesis = `Le premier chiffre que je regarde ici, c’est la part investie en actions : ${percent(equities)} du portefeuille.`
    thesis += `${euros ? ` Le fonds euros occupe ${percent(euros)}, selon les conditions de garantie du contrat.` : ''}${money ? ` Le monétaire représente ${percent(money)} et suit les taux courts, sans garantie de dépôt.` : ''}${bonds ? ` Les obligations représentent ${percent(bonds)} et restent exposées aux taux et au risque de remboursement.` : ''}`
  } else {
    openings = [`${label(top)[0].toUpperCase()}${label(top).slice(1)} occupe la première place. Mais que trouve-t-on dans le reste du portefeuille ?`, 'Plusieurs placements dans un portefeuille, ça ne suffit pas à savoir ce qu’on détient. Qu’est-ce qui les relie ici ?', 'À quoi ressemble un portefeuille qui réunit ces placements plutôt qu’une seule ligne ?']
    transition = 'Voici sa répartition et ses performances, sur un exemple illustratif 👇'
    thesis = `Pour comprendre ce portefeuille, je regarde comment les lignes se complètent. ${allocationAngle(rows).logic}`
  }
  const globalCount = rows.filter(row => ['world-developed', 'world-all', 'world-imi'].includes(kind(row))).length
  if (globalCount > 1 && !thesis.includes('fonds mondiaux')) thesis += ' Les fonds mondiaux se recoupent : plusieurs lignes ne multiplient pas automatiquement la diversification.'
  if (bonds && !/obligations|emprunts/.test(thesis)) thesis += ` Les obligations représentent ${percent(bonds)} du portefeuille et restent sensibles aux taux et au risque de remboursement.`
  if (euros && !thesis.includes('fonds euros')) thesis += ` Le fonds euros représente ${percent(euros)}, selon les conditions de garantie du contrat.`
  if (money && !thesis.includes('monétaire')) thesis += ` Le monétaire occupe ${percent(money)} et suit les taux courts, sans garantie de dépôt.`
  if (gold && !/[Ll]’or|d’or/.test(thesis)) thesis += `\n\nL’or représente ${percent(gold)} de l’allocation.`
  if (equities >= 70 && !leverage && !crypto) thesis += `\n\nMais le chiffre que je garde en tête, c’est surtout les ${percent(equities)} d’actions : ${rows.length > 1 ? `avec ${rows.length} lignes, ` : ''}ce portefeuille reste largement dépendant des Bourses${gold ? ', même avec cette poche d’or' : ''}.`
  return { hooks: openings.map(opening => `${opening}\n\n${transition}`), thesis }
}
