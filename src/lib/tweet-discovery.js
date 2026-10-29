export const THEMES = {
  ETF: /\betf|\bworld\b|\bstoxx|\bindice|\bindices/, PEA: /\bpea\b/,
  Budget: /budget|salaire|depens|livret|epargn/, Patrimoine: /patrimoine|portefeuille|capital/,
  Retraite: /retraite|retrait[eé]/, Bitcoin: /bitcoin|crypto|\bbtc\b/,
  Psychologie: /peur|panique|patience|discipline|hesit|psycholog|commencer|compare/,
  Immobilier: /immobil|logement|loyer|scpi/, Fiscalité: /fiscal|impot|taxe|flat tax|\bper\b/,
}
export function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/(\d)[\s\u00a0\u202f]+(?=\d)/g, '$1').replace(/[^a-z0-9]+/g, ' ').trim()
}
export function tweetThemes(tweet) {
  const text = normalizeText([tweet.text, tweet.category, tweet.title].filter(Boolean).join(' '))
  return Object.entries(THEMES).filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
}
export function tweetTitle(tweet) {
  if (tweet.title) return tweet.title
  const line = String(tweet.text || '').split('\n').find(part => part.trim())?.trim() || 'Tweet sans titre'
  return line.length <= 85 ? line : line.slice(0, 85).replace(/\s+\S*$/, '') + '…'
}
export function matchesTweet(tweet, query) {
  if (tweet.variants?.length) return tweet.variants.some(variant => matchesTweet(variant, query))
  const haystack = normalizeText([tweet.text, tweet.category, tweetTitle(tweet), ...(tweet.formats || []), ...tweetThemes(tweet)].join(' '))
  return normalizeText(query).split(' ').filter(Boolean).every(word => haystack.includes(word))
}
export function publicationState(date, today) {
  if (!date) return 'never'
  return (Date.parse(today) - Date.parse(date)) / 86400000 < 45 ? 'cooldown' : 'recycle'
}
export function discoverTweets(tweets, filters = {}, today = new Date().toISOString().slice(0, 10)) {
  const results = tweets.filter(t => matchesTweet(t, filters.search) && (!filters.source || (t.variants || [t]).some(v => v.source === filters.source))
    && (!filters.category || t.category === filters.category) && (!filters.format || (t.formats || []).includes(filters.format))
    && (!filters.theme || tweetThemes(t).includes(filters.theme)) && (!filters.favorite || t.favorite)
    && (!filters.publication || publicationState(t.latestPublication ?? t.last_published, today) === filters.publication))
  return results.sort((a,b) => {
    let result = 0
    if (filters.sort === 'oldest-publication') result = (a.latestPublication ?? a.last_published ?? '').localeCompare(b.latestPublication ?? b.last_published ?? '')
    else if (filters.sort === 'modified') result = (b.updated_at || '').localeCompare(a.updated_at || '')
    else result = (b.created_at || '').localeCompare(a.created_at || '')
    return result || String(a.id).localeCompare(String(b.id), 'fr', {numeric:true})
  })
}
export function archiveReady(tweet, today) {
  const policy = tweet.review || {}
  if (policy.kind === 'general') return true
  if (policy.kind === 'historical') return !!policy.checkedAt && policy.checkedAt <= today
  const age = (Date.parse(today) - Date.parse(policy.checkedAt)) / 86400000
  return policy.kind === 'reviewed' && Number.isFinite(age) && age >= 0 && age <= policy.maxAge
}

// Presentation only: never rewrite a saved text, ID, review date or preference.
// These are the editorial families reviewed in the bank audit, not a fuzzy deduper.
export function curateTweet(tweet) {
  const id = String(tweet.id).replace(/^archive:/, '')
  const titles = {
    '10': 'Premiers ETF : exemples sur PEA et CTO',
    '17': 'ETF PEA classés par exposition',
    '21': 'MSCI Europe, STOXX 600 et EURO STOXX 50',
    '27': 'Choisir un ETF MSCI World sur PEA',
    '32': 'MSCI World, ACWI et FTSE All-World',
    '37': 'ETF PEA : classement historique des performances',
    '39': 'Comment évolue la composition du MSCI World ?',
    '48': 'Sept ETF pour découvrir le PEA',
    '49': 'Vingt ETF pour quatorze thématiques',
    '50': 'ETF à dividendes : cinq approches',
    'guide:active-etfs': 'Comprendre les ETF actifs',
    'guide:leveraged-etfs': 'Comprendre les ETF à levier',
    'guide:commodities': 'Matières premières : ETF et ETC',
    'guide:covered-call': 'ETF covered call : revenus et contreparties',
    'guide:multi-asset': 'ETF multi-actifs : actions et obligations',
    'guide:gold-ways': 'Quatre façons d’investir dans l’or',
    'guide:sectoriels-thematiques-pea': 'ETF sectoriels et thématiques sur PEA',
  }
  const categories = {'8':'Simulation & chiffres','14':'Simulation & chiffres','18':'Bilan patrimoine','39':'Pédagogie','41':'Simulation & chiffres'}
  const familyTitles = {
    'salaire-lambda':'Un salaire ordinaire pour commencer à investir',
    'comparaison-portefeuilles':'Se comparer aux gros portefeuilles',
    'retraite-300':'Retraite : une projection avec 300 € par mois',
    'world-pea-cto':'World sur PEA ou CTO : simulation sur trente ans',
    'indices-monde':titles['32'], 'etf-thematiques':titles['49'],
  }
  const families = {
    '33':['salaire-lambda',0], '43':['salaire-lambda',1],
    '34':['comparaison-portefeuilles',0], '44':['comparaison-portefeuilles',1],
    '8':['retraite-300',0], '45':['retraite-300',1],
    'simulation:world-pea-cto-30-ans':['world-pea-cto',0], '41':['world-pea-cto',1],
    '32':['indices-monde',0], '49':['etf-thematiques',0],
  }
  const text = normalizeText(tweet.text)
  let family = families[id]
  let title = titles[id] || tweet.title
  // Only recognise the two audited copies; similar topics with different angles stay separate.
  if (!String(tweet.id).startsWith('archive:') && tweet.source === 'personal') {
    if (text.startsWith('msci world msci acwi ftse all world') && text.includes('comparatif complet')) family = ['indices-monde',2]
    if (text.startsWith('tu crois au developpement de l ia du nucleaire ou de la cybersecurite') && text.includes('20 etf pour explorer 14')) family = ['etf-thematiques',2]
    const ownTitles = [
      ['tu veux mettre 20 50 ou 100', 'Épargner pour son enfant'],
      ['tu veux investir dans des obligations', 'ETF obligataires : sept approches'],
      ['tu veux ouvrir une assurance vie', 'Comment choisir son assurance-vie'],
      ['tu veux investir dans l immobilier mais', 'Comparer quatre SCPI'],
      ['tu veux commencer a investir mais', 'Comprendre les grandes familles de placements'],
      ['pea assurance vie ou cto', 'PEA, assurance-vie et CTO : avantages et limites'],
      ['le s p 500 n est plus', 'S&P 500 : composition et concentration'],
      ['quels etf permettent de s exposer aux marches emergents', 'ETF émergents sur PEA'],
      ['arrete de chercher le meilleur etf', 'Choisir ses ETF selon son objectif'],
    ]
    title ||= ownTitles.find(([start]) => text.startsWith(start))?.[1]
  }
  return {...tweet, ...(title ? {title} : {}), category:categories[id] || tweet.category,
    ...(id === '18' ? {formats:[...new Set([...(tweet.formats || []),'Bilan de la semaine'])]} : {}),
    ...(family ? {variantGroup:family[0], title:familyTitles[family[0]], variantPriority:family[1]} : {})}
}

export function groupTweetVariants(tweets) {
  const groups = new Map()
  for (const raw of tweets) {
    const tweet = curateTweet(raw)
    const key = tweet.variantGroup ? 'family:' + tweet.variantGroup : 'tweet:' + tweet.id
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(tweet)
  }
  return [...groups.values()].map(variants => {
    variants.sort((a,b) => (b.variantPriority || 0) - (a.variantPriority || 0) || String(a.id).localeCompare(String(b.id)))
    const primary = variants[0]
    return {...primary, variants, favorite:variants.some(t => t.favorite),
      latestPublication:variants.map(t => t.last_published || '').sort().at(-1) || ''}
  })
}
