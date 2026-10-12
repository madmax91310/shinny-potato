const euro = amount => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount) + '€'
export function buildTweetText(profile) {
  const nameWithPreposition = /^[AEÉÈÊIÎOÔUÙY]/i.test(profile.name) ? `d’${profile.name}` : `de ${profile.name}`
  return `${profile.emoji} ${profile.name} (profil fictif), ${profile.age} ans, ${profile.family}, ${profile.job} ${profile.location}, gagne ${profile.variable ? 'en moyenne ' : ''}${euro(profile.income)} net et investit ${euro(profile.monthly)} par mois en DCA sur...\n\n${profile.lines.map(line => `${line.emoji} ${euro(line.amount)} ${line.label}`).join('\n')}\n\nQue pensez-vous du DCA ${nameWithPreposition} ? 👇`
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
