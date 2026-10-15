import { analyzeProfile, prepareProfile, pct } from './engine.js'
export const compactEuro = n => `${n.toLocaleString('fr-FR', {useGrouping:false, maximumFractionDigits:2})}€`
export function incomeLabel(profile) {
  if (/retrait/i.test(profile.job || '')) return 'Retraite'
  return profile.variable || /libéral|libérale|à son compte|indépendant|gérant|associé|entrepreneur/i.test(profile.job || '') ? 'Revenu moyen' : 'Salaire'
}
export function portfolioComment(profile) {
  const held = profile.lines.filter(l => l.weight > 0).sort((a,b) => b.weight-a.weight)
  const assets = new Set(held.map(l => l.asset))
  if (assets.has('world') && assets.has('europe') && assets.has('emerging') && held.length===3 && held[0].asset==='world') {
    return 'Le World reste son placement principal. Son ETF Europe renforce une région déjà présente dans le World, tandis que les émergents ajoutent des marchés qui en sont absents.'
  }
  const largest=held[0]
  if(held.length===1) return `Son portefeuille est entièrement investi sur ${largest.label}.`
  const tied=held.filter(l=>Math.abs(l.weight-largest.weight)<.001)
  if(tied.length===held.length) return 'Chaque placement occupe la même place dans son portefeuille.'
  if(tied.length>1) return `${tied.map(l=>l.label).join(' et ')} occupent les premières places, avec ${pct(largest.weight)} chacun.`
  return `${largest.label} représente la plus grande part de son portefeuille, avec ${pct(largest.weight)}.`
}
export function buildTweetText(input) {
  const profile = input.lines.every(l => Number.isFinite(l.weight)) ? input : prepareProfile(input)
  const a = analyzeProfile(profile)
  if (a.errors.length) return ''
  const intro = `${profile.emoji || '👤'} ${[profile.name,profile.age && `${profile.age} ans`,profile.job].filter(Boolean).join(', ')}`
  const income = profile.income ? `💸 ${incomeLabel(profile)} : ${compactEuro(profile.income)}/mois` : ''
  const held = profile.lines.filter(l=>l.weight>0).map(l=>`${l.emoji || '•'} ${pct(l.weight)} ${l.label}`).join('\n')
  const flows = profile.lines.filter(l=>l.amount>0).map(l=>`→ ${compactEuro(l.amount)} sur ${l.label}`).join('\n')
  const ending = /^[AEÉÈÊIÎOÔUÙY]/i.test(profile.name) ? `d’${profile.name}` : `de ${profile.name}`
  const scope = profile.scope && profile.scope!=='Portefeuille investi' ? ` (${profile.scope})` : ''
  return `${[intro,income,`📊 DCA de ${compactEuro(a.monthly)} par mois`].filter(Boolean).join('\n')}\n\n💼 Son portefeuille${scope} :\n\n${held}\n\n${a.monthly?'Chaque mois, '+(profile.emoji?.includes('👩')?'elle':profile.emoji?'il':'la personne')+' investit :':'Aucun versement mensuel prévu.'}${flows?'\n'+flows:''}\n\n${portfolioComment(profile)}\n\nQue pensez-vous du DCA ${ending} ? 👇\n\nPas un conseil financier`
}
export function pickUnseenProfile(profiles, currentId, seen, random = Math.random) {
  let pool = profiles.filter(profile => profile.id !== currentId && !seen.has(profile.id))
  if (!pool.length) {
    seen.clear()
    seen.add(currentId)
    pool = profiles.filter(profile => profile.id !== currentId)
  }
  return pool[Math.floor(random() * pool.length)]
}
