import { analyzeProfile, prepareProfile, pct } from './engine.js'
export const compactEuro = n => `${n.toLocaleString('fr-FR', {useGrouping:false, maximumFractionDigits:2})}€`
export function incomeLabel(profile) {
  if (/retrait/i.test(profile.job || '')) return 'Retraite'
  return profile.variable || /libéral|libérale|à son compte|indépendant|gérant|associé|entrepreneur/i.test(profile.job || '') ? 'Revenu moyen' : 'Salaire'
}
export function portfolioComment(profile) {
  const held = profile.lines.filter(l => l.weight > 0).sort((a,b) => b.weight-a.weight)
  const assets = new Set(held.map(l => l.asset))
  const weight = key => held.find(l=>l.asset===key)?.weight || 0
  const core = held.find(l=>['world','acwi','allworld','sp500'].includes(l.asset))
  if(core && assets.has('nasdaq'))return 'Le Nasdaq renforce des entreprises déjà présentes dans son ETF principal. La place des grandes valeurs technologiques augmente donc aussi.'
  if(core && weight('btc')+weight('eth')>=15)return `Les cryptomonnaies représentent ${pct(weight('btc')+weight('eth'))} de son portefeuille. Cette poche peut peser sensiblement sur ses variations.`
  if(core && weight('semiconductors')>=18)return 'Les semi-conducteurs occupent une place importante. Plusieurs de ces entreprises sont aussi présentes dans son ETF principal.'
  if(core && weight('europe')>=28)return 'L’Europe occupe une place renforcée dans son portefeuille. Ce choix l’éloigne de la répartition géographique d’un indice mondial.'
  if(core && weight('gold')>=25)return `L’or représente ${pct(weight('gold'))} de son portefeuille. C’est un choix qui pèse dans la répartition, même si l’or ne verse aucun revenu.`
  if(core && weight('dividend')>=18)return 'Une partie du portefeuille privilégie les actions à dividendes. Les distributions ne garantissent pas un meilleur rendement total.'
  if(core && weight('reit')>=20)return 'L’immobilier coté occupe une place importante. Cette poche reste exposée aux variations de la Bourse.'
  if(core && weight('emerging')>=25)return 'Les marchés émergents ont un poids marqué dans son portefeuille. Leurs variations pèseront donc davantage sur le résultat.'
  if(core && weight('momentum')>=20)return 'Le complément Momentum privilégie les actions ayant récemment le mieux progressé. Il modifie la sélection sans ajouter une nouvelle classe d’actifs.'
  if(core && weight('quality')>=20)return 'Le complément Quality renforce une sélection d’entreprises déjà susceptibles de figurer dans son ETF principal.'
  if(core && weight('value')>=20)return 'Le complément Value donne plus de poids aux actions jugées moins chères selon les critères de l’indice.'
  const themes=['cybersecurity','healthcare','water','infrastructure','industrials','semiconductors']
  if(core && held.some(l=>themes.includes(l.asset)&&l.weight>=20))return 'Une conviction sectorielle occupe une place importante à côté de son ETF principal. Elle rend le portefeuille plus concentré sur ce thème.'
  const direct=held.filter(l=>['airliquide','total','nvidia','microsoft','apple','airbus','asml','novo','nintendo','schneider'].includes(l.asset))
  if(core && direct.reduce((s,l)=>s+l.weight,0)>=18)return `Les actions détenues en direct représentent ${pct(direct.reduce((s,l)=>s+l.weight,0))} du portefeuille. Le résultat dépend donc davantage de ces entreprises.`
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
  if(profile.imageOnly)return `📊 Voilà la répartition de ce portefeuille :\n\n${held}\n\n${portfolioComment(profile)}\n\nPas un conseil financier`
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
