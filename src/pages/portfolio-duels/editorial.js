const money = value => `${new Intl.NumberFormat('fr-FR', {maximumFractionDigits:0}).format(Math.round(value))} €`
const percent = value => `${new Intl.NumberFormat('fr-FR', {minimumFractionDigits:1,maximumFractionDigits:1}).format(Math.abs(value))} %`
const move = value => `${value<0 ? 'perd' : 'gagne'} ${percent(value)}`
const topics = {
 'sp500-pondere-ou-equal': ['Les géants du S&P 500 ou le même poids pour chaque entreprise', 'Tu laisserais les plus grosses entreprises peser davantage, ou tu répartirais à poids égaux ?'],
 'world-ou-exusa': ['World seul ou 30 % de pays développés hors États-Unis à côté', 'Tu réduirais toi-même la place des États-Unis, ou tu garderais la répartition du World ?'],
 'pea-global-ou-deux-lignes': ['ACWI en une ligne ou World avec 15 % de marchés émergents', 'Tu choisirais toi-même le poids des émergents, ou tu suivrais celui de l’ACWI ?'],
 'world-small-us': ['World seul ou 20 % de petites entreprises américaines à côté', 'Tu ajouterais les petites entreprises américaines, ou tu garderais ton World seul ?'],
 'em-bond-local-usd': ['Obligations émergentes en dollars ou dans les monnaies locales', 'Pour tes obligations émergentes, tu choisirais une exposition au dollar ou aux monnaies locales ?'],
 'oblig-courtes-longues': ['70 % de World et 30 % d’obligations : échéances courtes ou longues', 'Pour accompagner tes actions, tu choisirais des obligations courtes ou tu accepterais les variations des obligations longues ?'],
 'world-avec-world_momentum_ishares': ['World seul ou 20 % consacrés aux actions dont les cours ont récemment le plus progressé', 'Tu renforcerais les gagnantes récentes, ou tu garderais la répartition du World ?'],
 'world-avec-strat_dividendes': ['World seul ou 20 % sur les entreprises sélectionnées pour la régularité de leurs dividendes', 'Tu privilégierais cet historique de dividendes, ou tu garderais un World sans ce filtre ?'],
 'world-avec-high_dividend': ['World seul ou 20 % sur les actions à dividendes élevés', 'Un dividende élevé te ferait-il renforcer ces entreprises à côté de ton World ?'],
 'world-avec-quality_dividend': ['World seul ou 20 % combinant dividendes et critères de qualité', 'Pour compléter ton World, tu sélectionnerais les dividendes avec des critères de qualité, ou tu garderais une seule ligne ?'],
 'world-avec-monetaire_xeon': ['World seul ou 40 % de monétaire à côté', 'Tu aurais préféré rester entièrement en actions, ou accepter ce compromis avec 40 % de monétaire ?'],
 'world-avec-oblig_0_1_ishares': ['World seul ou 40 % d’obligations d’État proches de leur remboursement', 'Tu garderais 100 % d’actions, ou tu réserverais 40 % à des obligations très courtes ?'],
 'world-avec-oblig_global_agg_eur_hedged': ['World seul ou 40 % d’obligations mondiales avec couverture vers l’euro', 'Tu ajouterais ces obligations mondiales à ton World, ou tu resterais entièrement en actions ?'],
 'sect_tech_world_ishares-contre-sect_financieres': ['90 % de World dans les deux cas : technologie mondiale ou financières américaines pour les 10 % restants', 'Tu renforcerais les entreprises technologiques ou les financières américaines ?'],
 'sect_financieres-contre-financieres_monde': ['10 % de financières à côté du World : seulement américaines ou issues de plusieurs pays développés', 'Pour cette poche financière, tu resterais aux États-Unis ou tu élargirais aux autres pays développés ?'],
 'semiconducteurs_monde-contre-blockchain_ishares': ['90 % de World, puis 10 % de semi-conducteurs ou d’entreprises liées à la blockchain', 'Pour tes 10 % thématiques, tu choisirais les semi-conducteurs ou les entreprises liées à la blockchain ?'],
 'world-em-ou-acwi': ['80 % de World et 20 % d’émergents ou un seul fonds ACWI', 'Tu fixerais les émergents à 20 %, ou tu suivrais leur poids dans l’ACWI ?'],
 'world-ou-acwi': ['World sans émergents ou ACWI avec émergents', 'Pour ta ligne mondiale, tu choisirais les pays développés seuls ou tu inclurais aussi les émergents ?'],
 'acwi-ou-allworld': ['MSCI ACWI ou FTSE All-World pour ta seule ligne actions', 'Tu choisirais l’ACWI ou l’All-World, et quel critère compterait au-delà de cette performance passée ?'],
 'sp500-europe-ou-acwi': ['80 % de S&P 500 et 20 % d’Europe ou une seule ligne ACWI', 'Tu réglerais toi-même le poids des États-Unis et de l’Europe, ou tu choisirais l’ACWI avec les autres marchés ?'],
 'world-stoxx-ou-acwi': ['World avec 20 % d’Europe en plus ou ACWI avec les émergents', 'Tu renforcerais l’Europe déjà présente dans le World, ou tu choisirais l’ACWI pour inclure les émergents ?'],
 'usa-europe-sante-ou-acwi-tech': ['S&P 500 avec Europe et santé ou ACWI avec 20 % de technologie', 'Tu choisirais la répartition USA, Europe et santé, ou la base ACWI renforcée en technologie ?'],
 'allworld-cyber-ou-world-em': ['All-World avec 10 % de cybersécurité ou World avec 20 % d’émergents', 'Tu consacrerais une poche à la cybersécurité, ou tu choisirais toi-même le poids des émergents ?'],
 'world-smallcap-ou-acwi': ['World avec 20 % de petites entreprises développées ou ACWI avec les émergents', 'Pour élargir les entreprises de ton World, tu ajouterais les petites capitalisations ou les marchés émergents ?'],
 'world-em-energie-ou-allworld-tech': ['World, émergents et énergie ou All-World avec technologie', 'Tu renforcerais les entreprises de l’énergie ou celles de la technologie dans ta poche mondiale ?'],
 'world-value-ou-world-quality': ['Actions peu chères ou entreprises sélectionnées pour leur solidité financière', 'Pour compléter ton World, tu privilégierais le prix des actions, les critères de qualité, ou tu garderais une seule ligne ?'],
 'sp500-japon-ou-acwi-inde': ['S&P 500 avec 20 % de Japon ou ACWI avec 20 % d’Inde', 'Tu choisirais la base américaine avec le Japon, ou l’ACWI avec davantage d’Inde ?'],
 'world-energie-propre-ou-allworld-infrastructure': ['World avec énergies propres ou All-World avec infrastructures', 'Tu choisirais les énergies propres à côté du World ou les infrastructures à côté de l’All-World ?'],
}

export function duelEditorial(duel) {
 const {a,b,years}=duel
 const gap=Math.abs(b.final-a.final)
 const same=Math.abs(b.final-a.final)<.5
 const topic=topics[duel.id]
 const describe=p=>p.assets.map(s=>`${s.pct} % de ${s.label}`).join(' et ')
 const soloWorld=p=>p.assets.length===1 && p.assets[0].exposure==='world'
 const sameBase=a.assets[0].id===b.assets[0].id && a.assets[0].pct===b.assets[0].pct
 const extra=p=>p.assets.slice(1).map(s=>`${s.pct} % de ${s.label.toLowerCase()}`).join(' et ')
 const hookQuestion=duel.hookQuestion ?? (soloWorld(a) && b.assets[0].exposure==='world'
  ? `Ajouter ${extra(b)} à un ETF World : bonne idée ?`
  : soloWorld(b) && a.assets[0].exposure==='world'
   ? `Ajouter ${extra(a)} à un ETF World : bonne idée ?`
   : sameBase && a.assets.length>1 && b.assets.length>1
    ? `Avec ${a.assets[0].pct} % de ${a.assets[0].label}, tu choisirais ${extra(a)} ou ${extra(b)} pour compléter ton portefeuille ?`
    : `${describe(a)} ou ${describe(b)} : quel portefeuille aurais-tu choisi ?`)
 const winner=b.final>a.final ? b : a
 const winnerSide=b.final>a.final ? 'B' : 'A'
 const winnerName=soloWorld(winner) ? 'le portefeuille 100 % World'
  : winner.name!==`Portefeuille ${winnerSide}` ? `le portefeuille « ${winner.name} »` : `le portefeuille ${winnerSide}`
 const result=same
  ? `Avec 10 000 € investis début ${years[0]}, les deux portefeuilles terminent fin ${years.at(-1)} avec le même capital à l’euro près.`
  : `Avec 10 000 € investis début ${years[0]}, ${winnerName} termine fin ${years.at(-1)} avec ${money(gap)} de plus.`
 const hook=`${hookQuestion}\n\n${result}\n\nVoici le détail du duel, année par année 👇`
 const year=years.reduce((best,y)=>Math.abs(a.annual[y]-b.annual[y])>Math.abs(a.annual[best]-b.annual[best])?y:best)
 const question=topic?.[1] ?? duel.closingQuestion ?? `Tu choisirais ${a.name} ou ${b.name}, et quelle différence d’exposition compte le plus pour toi ?`
 let conclusion=same ? 'Les deux portefeuilles terminent au même montant à l’euro près.' : gap<200 ? `Les capitaux finaux restent proches : ${money(gap)} d’écart sur cette période.` : `Le portefeuille ${b.final>a.final ? 'B' : 'A'} termine avec ${money(gap)} de plus sur cette période.`
 if (!years.every(y=>Math.abs(a.annual[y]-b.annual[y])<.001)) conclusion+=` En ${year}, l’écart annuel est le plus marqué : A ${move(a.annual[year])}, B ${move(b.annual[year])}.`
 return {hook,question,conclusion}
}
