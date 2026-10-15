import { analyzeProfile, prepareProfile, observation, euro, pct } from './engine.js'
export function buildTweetText(input) {
  const profile = input.lines.every(l => Number.isFinite(l.weight)) ? input : prepareProfile(input)
  const a = analyzeProfile(profile)
  if (a.errors.length) return ''
  const intro = profile.mode === 'participant' ? `📊 Le portefeuille de ${profile.name}` : `📊 ${profile.name} — portefeuille et versements`
  const context = [profile.age && `${profile.age} ans`, profile.job, profile.location].filter(Boolean).join(', ')
  const income = profile.income ? `Revenu net ${profile.variable ? 'moyen ' : ''}: ${euro(profile.income)} / mois.` : ''
  const held = profile.lines.filter(l=>l.weight>0).map(l=>`${l.emoji} ${pct(l.weight)} · ${l.label}`).join('\n')
  const flows = profile.lines.filter(l=>l.amount>0).map(l=>`${l.emoji} ${euro(l.amount)} · ${l.label}`).join('\n')
  const exposureText = ['countries','sectors'].flatMap(field=> {
    const g=[...a[field].groups].sort((x,y)=>y.coverage-x.coverage)[0]
    if(!g)return []
    return [`${field==='countries'?'🌍 Pays':'🏭 Secteurs'} — photographie du ${g.asOf}, couvrant ${pct(g.coverage)} du portefeuille : ${g.rows.slice(0,2).map(r=>`${r.name} ${pct(r.weight)}`).join(' · ')}. Poids rapportés au portefeuille total.`]
  }).join('\n')
  const sourceNote = profile.lines.some(l=>l.isin) ? '\nExpositions calculées sur les supports identifiés dans le détail de l’outil.' : ''
  return `${intro}\n${[context,income].filter(Boolean).join('\n')}\n\n💼 ${profile.scope}\n${held}\n\n🔁 ${euro(a.monthly)} investis par mois\n${flows || 'Aucun versement prévu.'}\n\n🔎 ${observation(profile,a)}\n${a.monthly ? 'L’évolution réelle dépend aussi des marchés ; les versements ne donnent pas le montant du capital.\n' : ''}${exposureText ? `\n${exposureText}` : ''}${sourceNote}\n\n💬 Et chez vous, les versements suivent-ils la répartition du portefeuille ?\n\nPas un conseil financier`.replace(/\n{3,}/g,'\n\n')
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
