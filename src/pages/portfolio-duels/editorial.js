const money = value => `${new Intl.NumberFormat('fr-FR', {maximumFractionDigits:0}).format(Math.round(value))} €`
const percent = value => `${new Intl.NumberFormat('fr-FR', {minimumFractionDigits:1,maximumFractionDigits:1}).format(Math.abs(value))} %`
const move = value => `${value<0 ? 'perd' : 'gagne'} ${percent(value)}`
const topics = {
 'em-bond-local-usd': ['Obligations émergentes en dollars ou dans les monnaies locales', 'Pour tes obligations émergentes, tu choisirais une exposition au dollar ou aux monnaies locales ?'],
 'oblig-courtes-longues': ['70 % de World et 30 % d’obligations : échéances courtes ou longues', 'Pour accompagner tes actions, tu choisirais des obligations courtes ou tu accepterais les variations des obligations longues ?'],
 'sect_tech_world_ishares-contre-sect_financieres': ['90 % de World dans les deux cas : technologie mondiale ou financières américaines pour les 10 % restants', 'Tu renforcerais les entreprises technologiques ou les financières américaines ?'],
 'sect_financieres-contre-financieres_monde': ['10 % de financières à côté du World : seulement américaines ou issues de plusieurs pays développés', 'Pour cette poche financière, tu resterais aux États-Unis ou tu élargirais aux autres pays développés ?'],
 'semiconducteurs_monde-contre-blockchain_ishares': ['90 % de World, puis 10 % de semi-conducteurs ou d’entreprises liées à la blockchain', 'Pour tes 10 % thématiques, tu choisirais les semi-conducteurs ou les entreprises liées à la blockchain ?'],
 'usa-europe-sante-ou-acwi-tech': ['S&P 500 avec Europe et santé ou ACWI avec 20 % de technologie', 'Tu choisirais la répartition USA, Europe et santé, ou la base ACWI renforcée en technologie ?'],
 'allworld-cyber-ou-world-em': ['All-World avec 10 % de cybersécurité ou World avec 20 % d’émergents', 'Tu consacrerais une poche à la cybersécurité, ou tu choisirais toi-même le poids des émergents ?'],
 'world-em-energie-ou-allworld-tech': ['World, émergents et énergie ou All-World avec technologie', 'Tu renforcerais les entreprises de l’énergie ou celles de la technologie dans ta poche mondiale ?'],
 'world-value-ou-world-quality': ['Actions peu chères ou entreprises sélectionnées pour leur solidité financière', 'Pour compléter ton World, tu privilégierais le prix des actions, les critères de qualité ?'],
 'sp500-japon-ou-acwi-inde': ['S&P 500 avec 20 % de Japon ou ACWI avec 20 % d’Inde', 'Tu choisirais la base américaine avec le Japon, ou l’ACWI avec davantage d’Inde ?'],
 'world-energie-propre-ou-allworld-infrastructure': ['World avec énergies propres ou All-World avec infrastructures', 'Tu choisirais les énergies propres à côté du World ou les infrastructures à côté de l’All-World ?'],
}

export function duelEditorial(duel) {
 const {a,b,years}=duel
 const gap=Math.abs(b.final-a.final)
 const same=Math.abs(b.final-a.final)<.5
 const topic=topics[duel.id]
 const hookLabels = {
  world: 'World', gold: 'or physique',
  smallcap: 'petites entreprises des pays développés', 'us-small': 'petites entreprises américaines',
  minvol: 'World à faible volatilité', cash: 'monétaire en euros',
  shortbond: 'obligations d’État à très courte échéance', longbond: 'obligations d’État à longue échéance',
  globalbond: 'obligations mondiales couvertes en euros',
  value: 'World Value', quality: 'World Quality', momentum: 'World Momentum',
 }
 const label=asset=>hookLabels[asset.exposure] ?? asset.label
 const allocation=asset=>`${asset.pct} % ${/^[aeiouéèêîôœ]/i.test(label(asset)) ? 'd’' : 'de '}${label(asset)}`
 const describe=portfolio=>portfolio.assets.map(allocation).join(' et ')
 const soloWorld=portfolio=>portfolio.assets.length===1 && portfolio.assets[0].exposure==='world'
 const sameBase=a.assets[0].id===b.assets[0].id && a.assets[0].pct===b.assets[0].pct
 const extra=portfolio=>portfolio.assets.slice(1).map(allocation).join(' et ')
 const solo=soloWorld(a) ? a : soloWorld(b) ? b : null
 const mixed=solo===a ? b : a
 let hookQuestion
 if (solo && mixed.assets.length>1 && mixed.assets[0].exposure==='world') {
  // Le montant et la comparaison sont explicites avant de présenter les résultats.
  hookQuestion=`Avec 10 000 € investis, aurais-tu gagné davantage avec un ETF World seul ou avec ${describe(mixed)} ?`
 } else if (sameBase && a.assets.length>1 && b.assets.length>1) {
  hookQuestion=`Avec 10 000 € investis et ${allocation(a.assets[0])} dans les deux cas, aurais-tu gagné davantage avec ${extra(a)} ou ${extra(b)} ?`
 } else if (a.assets.length===1 && b.assets.length===1) {
  hookQuestion=`Avec 10 000 € investis, quel ETF t’aurait rapporté le plus : ${label(a.assets[0])} ou ${label(b.assets[0])} ?`
 } else {
  hookQuestion=`Avec 10 000 € investis, lequel de ces portefeuilles t’aurait rapporté le plus : ${describe(a)} ou ${describe(b)} ?`
 }
 const hook=`${hookQuestion}\n\nVoici la comparaison entre début ${years[0]} et fin ${years.at(-1)}, sans versement supplémentaire 👇`
 const year=years.reduce((best,y)=>Math.abs(a.annual[y]-b.annual[y])>Math.abs(a.annual[best]-b.annual[best])?y:best)
 const question=topic?.[1] ?? duel.closingQuestion ?? `Tu choisirais ${a.name} ou ${b.name}, et qu’est-ce qui ferait pencher ton choix ?`
 const equalAnnual=years.every(y=>Math.abs(a.annual[y]-b.annual[y])<.001)
 let conclusion
 if (same) {
  conclusion='À l’euro près, les deux portefeuilles arrivent au même montant.'
  if (!equalAnnual) conclusion+=' Leurs résultats annuels diffèrent : arriver au même montant ne signifie pas avoir traversé les mêmes variations.'
 } else if (gap<200) {
  conclusion=`Sur cette période, les deux portefeuilles arrivent presque au même résultat. Avec seulement ${money(gap)} d’écart, je regarderais aussi leurs frais, leur composition et les baisses traversées pour les départager.`
 } else if (solo && mixed.assets.length===2 && mixed.assets[0].exposure==='world' && ['smallcap','us-small'].includes(mixed.assets[1].exposure)) {
  const small=mixed.assets[1].exposure==='us-small' ? 'Les petites entreprises américaines' : 'Les petites entreprises des pays développés'
  const count=({3:'trois',4:'quatre',5:'cinq',6:'six'})[years.length] ?? years.length
  const wins=mixed.final>solo.final
  conclusion=`${small} sont absentes du MSCI World, donc je comprends qu’on veuille les ajouter à son portefeuille.\n\n${wins ? 'Sur' : 'Mais sur'} ces ${count} années, le portefeuille qui en contient termine avec ${money(gap)} de ${wins ? 'plus' : 'moins'}.`
  const first=years[0]
  if (mixed.annual[first]>solo.annual[first]+.001 && years.slice(1).every(y=>mixed.annual[y]<solo.annual[y]-.001)) {
   conclusion+=` Il fait ${mixed.annual[first]-solo.annual[first]<1 ? 'légèrement ' : ''}mieux en ${first}, puis moins bien que le World seul chaque année suivante.`
  } else if (years.every(y=>mixed.annual[y]<solo.annual[y]-.001)) {
   conclusion+=' Il fait moins bien que le World seul chacune des années comparées.'
  } else if (years.every(y=>mixed.annual[y]>solo.annual[y]+.001)) {
   conclusion+=' Il fait mieux que le World seul chacune des années comparées.'
  }
 } else if (solo && mixed.assets.length===2 && mixed.assets[0].exposure==='world' && mixed.assets[1].exposure==='nasdaq' && mixed.final>solo.final && mixed.worst<solo.worst && mixed.worst<0 && solo.worst<0 && mixed.worstYear===solo.worstYear) {
  conclusion=`Avec la poche Nasdaq, le portefeuille termine avec ${money(gap)} de plus sur cette période, mais elle accentue aussi la baisse en ${mixed.worstYear} : ${move(mixed.worst).replace('perd','le portefeuille perd')}, contre ${percent(solo.worst)} pour le World seul. Je regarde aussi cette baisse avant de renforcer des entreprises déjà présentes dans le World.`
 } else {
  conclusion=`Sur cette période, le portefeuille ${b.final>a.final ? 'B' : 'A'} termine avec ${money(gap)} de plus.`
  if (!equalAnnual) conclusion+=` En ${year}, A ${move(a.annual[year])}, et B ${move(b.annual[year])}.`
 }
 return {hook,question,conclusion}
}
