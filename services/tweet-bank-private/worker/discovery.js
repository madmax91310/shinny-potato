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
  const haystack = normalizeText([tweet.text, tweet.category, tweetTitle(tweet), ...(tweet.formats || []), ...tweetThemes(tweet)].join(' '))
  return normalizeText(query).split(' ').filter(Boolean).every(word => haystack.includes(word))
}
export function publicationState(date, today) {
  if (!date) return 'never'
  return (Date.parse(today) - Date.parse(date)) / 86400000 < 45 ? 'cooldown' : 'recycle'
}
export function discoverTweets(tweets, filters = {}, today = new Date().toISOString().slice(0, 10)) {
  const results = tweets.filter(t => matchesTweet(t, filters.search) && (!filters.source || t.source === filters.source)
    && (!filters.category || t.category === filters.category) && (!filters.format || (t.formats || []).includes(filters.format))
    && (!filters.theme || tweetThemes(t).includes(filters.theme)) && (!filters.favorite || t.favorite)
    && (!filters.publication || publicationState(t.last_published, today) === filters.publication))
  return results.sort((a,b) => {
    let result = 0
    if (filters.sort === 'oldest-publication') result = (a.last_published || '').localeCompare(b.last_published || '')
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
