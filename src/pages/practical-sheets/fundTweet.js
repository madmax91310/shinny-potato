// Product identities and dated figures come from buildSheet's shared registries.
// Keep publication copy separate from the factual comparison image and source controls.
const COLORS = ['🟢', '🔵', '🟣']
const format = (value, digits = 0) => value.toLocaleString('fr-FR', {maximumFractionDigits: digits}).replace(/\u202f/g, ' ')
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? value.split('-').reverse().join('/') : 'date non publiée'
const capitalising = value => /^capitalis/i.test(value)

const HOOKS = {
 'world-pea': '🌍 Il existe de nombreux ETF World sur PEA. Sur quels critères les choisir ? 👇',
 'same-world': '🌍 Deux ETF suivent le MSCI World sur PEA. Sur quels critères les départager ? 👇',
 'sp500-pea': '🇺🇸 Plusieurs ETF suivent le S&P 500 sur PEA. Sur quels critères les choisir ? 👇',
 'europe-pea': '🇪🇺 Il existe plusieurs ETF Europe sur PEA. Comment choisir selon les pays et les entreprises couverts ? 👇',
 'em-pea': '🌍 Plusieurs ETF émergents sont disponibles sur PEA. Comment savoir lequel correspond à l’exposition recherchée ? 👇',
}

function exposure(fund) {
 const index = fund.index
 if (/STOXX Europe 600/i.test(index)) return 'STOXX Europe 600 : grandes, moyennes et petites entreprises européennes, y compris hors zone euro.'
 if (/EURO STOXX 50/i.test(index)) return 'Euro STOXX 50 : 50 grandes entreprises de la zone euro. Un panier plus concentré, sans le Royaume-Uni ni la Suisse.'
 if (/MSCI Europe/i.test(index)) return 'MSCI Europe : grandes et moyennes entreprises des pays développés européens, dont le Royaume-Uni et la Suisse.'
 if (/MSCI EM ex-Egypt ESG Broad CTB Select/i.test(index)) return 'Marchés émergents de plusieurs régions, hors Égypte, avec des critères ESG et climatiques. Ce panier diffère du MSCI Emerging Markets classique.'
 if (/MSCI EM Asia Screened Select ex Thermal Coal/i.test(index)) return 'Marchés émergents d’Asie, avec des exclusions dont le charbon thermique. Les marchés émergents des autres régions ne sont pas couverts.'
 return `Indice suivi : ${index}. Vérifie son périmètre et ses critères de sélection avant de comparer les frais.`
}

function products(sheet) {
 return sheet.funds.map((fund, i) => {
  const aum = fund.aum
  const unit = {EUR: '€', USD: '$', GBP: '£'}[aum?.currency] ?? (aum ? ` ${aum.currency}` : '')
  const size = aum ? `${format(aum.amount / 1e6)} M${unit} au ${date(aum.asOf)}${aum.scope === 'fund' ? ' (fonds)' : ''}` : 'Non publié'
  const policy = capitalising(fund.distribution) ? 'capitalisation' : fund.distribution
  return [`${COLORS[i]} ${fund.name}${fund.ticker ? ` — ${fund.ticker}` : ''}`, `🆔 ISIN : ${fund.isin}`, `💸 Frais annuels : ${fund.terLabel} %`, `💼 Encours : ${size}`, `💰 Dividendes : ${policy}`].join('\n')
 })
}

function holdings(sheet) {
 const funds = sheet.funds
 if (sheet.fundGroup === 'world' || sheet.fundGroup === 'sp500') {
  const basket = sheet.fundGroup === 'world'
   ? 'Les ETF présentés suivent le MSCI World : les grandes et moyennes entreprises des pays développés, sans les pays émergents.'
   : 'Les ETF présentés suivent le S&P 500 : un panier d’environ 500 grandes entreprises américaines.'
  const distribution = funds.every(fund => capitalising(fund.distribution))
   ? 'Ils sont aussi tous capitalisants : les dividendes sont réinvestis dans le fonds. L’exposition et le traitement des dividendes ne permettent donc pas de les départager.'
   : 'Vérifie le traitement des dividendes de chaque part : un ETF capitalisant les réinvestit dans le fonds ; un ETF distribuant les verse sur ton compte.'
  return `🏢 Ce que tu achètes\n\n${basket}\n\n${distribution}`
 }
 return `🏢 Ce que tu achètes\n\n${funds.map(fund => `${fund.shortName} : ${exposure(fund)}`).join('\n\n')}\n\nChoisis d’abord l’exposition qui correspond à ton objectif. Des frais plus faibles ne compensent pas un panier d’entreprises qui ne correspond pas à ce que tu recherches.`
}

function fees(sheet) {
 const costs = sheet.funds.map(fund => `${fund.shortName} : environ ${format(10000 * fund.terPct / 100, 2)} € par an`).join('\n')
 return `💶 Les frais annuels\n\nPour 10 000 € investis :\n${costs}\n\nCes frais sont intégrés à la valeur de l’ETF. Sur la durée, ils pèsent sur la performance et s’ajoutent aux éventuels frais d’achat de ton courtier.`
}

function income(sheet) {
 if (['world', 'sp500'].includes(sheet.fundGroup) && sheet.funds.every(fund => capitalising(fund.distribution))) return null
 const explanation = sheet.funds.every(fund => capitalising(fund.distribution))
  ? 'Les parts présentées sont capitalisantes : les dividendes sont réinvestis dans le fonds. Ce critère ne les départage donc pas.'
  : 'Un ETF capitalisant réinvestit les dividendes dans le fonds. Un ETF distribuant les verse sur ton compte. Choisis selon que tu souhaites accumuler du capital ou recevoir des revenus. Quand la politique de la part n’est pas confirmée ici, vérifie son DIC avec l’ISIN exact.'
 return `💰 Les dividendes\n\n${explanation}`
}

export function buildFundTweet(sheet) {
 const count = sheet.funds.length === 2 ? 'deux' : 'trois'
 const performance = sheet.rows.filter(row => /^\d{4} · EUR$/.test(row[0]))
 return [HOOKS[sheet.id], '🔖 Sauvegarde ce tweet', `Prenons l’exemple de ces ${count} ETF :`, ...products(sheet), holdings(sheet), fees(sheet), income(sheet),
  '💼 L’encours\n\nUn encours élevé indique que l’ETF a attiré beaucoup de capitaux. C’est un critère utile pour sa pérennité : un fonds qui reste trop petit peut être fermé ou fusionné par son gestionnaire.',
  '🛒 Le prix d’une part\n\nPour investir régulièrement de petites sommes, regarde combien coûte une part.\n\nSi ton courtier propose uniquement des parts entières, une part à plusieurs centaines d’euros peut t’obliger à regrouper tes achats. Une part moins chère permet d’ajuster plus facilement le montant investi à ton budget.',
  '📈 La tracking difference\n\nElle mesure l’écart entre la performance de l’ETF et celle de son indice.\n\nCompare-la sur une même période, dans la même devise et avec le même traitement des dividendes. Elle permet de vérifier si les frais plus faibles se traduisent réellement par une performance plus proche de l’indice.',
  performance.length ? `📊 Performances annuelles en euros\n\n${sheet.funds.map((fund, i) => `${fund.shortName}\n${performance.map(row => `${row[0].split(' · ')[0]} : ${row[i + 1]}`).join('\n')}`).join('\n\n')}\n\nRevenus réinvestis et frais des fonds inclus.${['europe', 'em'].includes(sheet.fundGroup) ? ' Les indices suivis peuvent différer : ces rendements ne mesurent pas à eux seuls la qualité de réplication.' : ''}` : null,
  sheet.fundGroup === 'world' ? '💬 Tu as choisi lequel pour ton PEA, et qu’est-ce qui a fait la différence ?' : '💬 Quel critère compte le plus pour toi dans le choix de ton ETF ?',
 ].filter(Boolean).join('\n\n')
}
