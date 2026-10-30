import { validateProfile, prepareProfile, pct } from './engine.js'
// Sort copies at publication time so manual editor rows keep their identity and focus.
export const sortHoldings = lines => lines.filter(line => line.weight > 0).sort((a,b) => b.weight-a.weight)
export const sortContributions = lines => lines.filter(line => line.amount > 0).sort((a,b) => b.amount-a.amount)
export const compactEuro = n => `${n.toLocaleString('fr-FR', {useGrouping:false, maximumFractionDigits:2})}€`
export function incomeLabel(profile) {
  if (/retrait/i.test(profile.job || '')) return 'Retraite'
  return profile.variable || /libéral|libérale|à son compte|indépendant|gérant|associé|entrepreneur/i.test(profile.job || '') ? 'Revenu moyen' : 'Salaire'
}
export function buildTweetText(input) {
  const profile = input.lines.every(l => Number.isFinite(l.weight)) ? input : prepareProfile(input)
  const a = {errors:validateProfile(profile),monthly:profile.imageOnly?0:profile.lines.reduce((sum,line)=>sum+line.amount,0)}
  if (a.errors.length) return ''
  const intro = `${profile.emoji || '👤'} ${[profile.name,profile.age && `${profile.age} ans`,profile.job].filter(Boolean).join(', ')}`
  const income = profile.income ? `💸 ${incomeLabel(profile)} : ${compactEuro(profile.income)}/mois` : ''
  const held = sortHoldings(profile.lines).map(l=>`${l.emoji || '•'} ${pct(l.weight)} ${l.label}`).join('\n')
  if(profile.imageOnly)return `📊 Voilà la répartition de ce portefeuille :\n\n${held}\n\nPas un conseil financier`
  const flows = sortContributions(profile.lines).map(l=>`→ ${compactEuro(l.amount)} sur ${l.label}`).join('\n')
  const ending = /^[AEÉÈÊIÎOÔUÙY]/i.test(profile.name) ? `d’${profile.name}` : `de ${profile.name}`
  const scope = profile.scope && profile.scope!=='Portefeuille investi' ? ` (${profile.scope})` : ''
  return `${[intro,income,`📊 DCA de ${compactEuro(a.monthly)} par mois`].filter(Boolean).join('\n')}\n\n💼 Son portefeuille${scope} :\n\n${held}\n\n${a.monthly?'Chaque mois, '+(profile.emoji?.includes('👩')?'elle':profile.emoji?'il':'la personne')+' investit :':'Aucun versement mensuel prévu.'}${flows?'\n'+flows:''}\n\nQue pensez-vous du DCA ${ending} ? 👇\n\nPas un conseil financier`
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
