// Image copy stays factual; first-person editorial wording belongs to the tweet.
const TAKEAWAYS = {
 'pea-cto': 'Les frais dépendent du courtier. L’imposition dépend de l’enveloppe et du type de revenu.',
 'av-per': 'La fiscalité du PER dépend des versements déduits ou non et des modalités de sortie.',
 'europe-pea': 'Europe large et zone euro couvrent des périmètres différents.',
 'europe-indices': 'Les pays couverts et la concentration complètent le nombre de titres.',
 'diversification': 'Le nombre d’ETF ne mesure pas la diversification du portefeuille entier.',
 'cap-dist': 'Les performances se comparent à méthode identique, revenus réinvestis.',
 'gold-physical': 'La structure juridique de l’ETC détermine les droits sur le métal. Un ETC n’est pas un ETF d’actions.',
 'livret-euro': 'La disponibilité immédiate et les modalités de rachat du contrat sont distinctes.',
 'pea-provider': 'Les frais et les services dépendent de l’établissement et des opérations réalisées.',
 'before-etf': 'Le DIC décrit les caractéristiques, les frais et les risques du produit.',
 'transfer-pea': 'Le transfert du plan conserve son antériorité fiscale. Un retrait suivi d’une ouverture est une autre opération.',
 'broker-fees': 'Le coût total dépend des opérations réalisées et des conditions du barème.',
 'merger': 'L’avis officiel de l’émetteur précise les changements et leurs modalités.',
 'same-world': 'La part exacte et le coût total comptent ; le TER ne résume pas tout.',
 'under-index': 'La devise, les revenus et la période doivent être alignés avant d’évaluer le suivi de l’indice.',
 'dividend-gain': 'Le résultat inclut la valeur du placement et les revenus cumulés, au-delà du taux de distribution.',
}
const TITLES = {
 merger: 'Un ETF fusionne ou change d’indice',
 'under-index': 'Un ETF monte moins que son indice',
 'personal-performance': 'Rendement du compte et rendement de l’ETF',
}
const LABELS = {
 'Ce que je vérifie': 'Points à vérifier',
 'Ce que je regarde': 'Frais concernés',
 'Quelles entreprises ou quels actifs vais-je suivre ?': 'Entreprises et actifs couverts par l’indice',
 'Puis-je supporter une baisse et attendre ?': 'Capacité à supporter une baisse et horizon de placement',
}
export function imageCopy(sheet) {
 return {
  title: TITLES[sheet.id] ?? sheet.title,
  subtitle: sheet.id === 'pea-cto' ? 'Supports accessibles, plafond de versement et fiscalité' : [...new Set(sheet.rows.map(row => row[0]))].slice(0,3).join(' · '),
  takeawayTitle: sheet.id === 'pea-cto' ? 'Frais et fiscalité' : 'À retenir',
  takeaway: TAKEAWAYS[sheet.id] ?? sheet.takeaway,
  columns: sheet.columns.map(value => LABELS[value] ?? value),
  rows: sheet.rows.map(row => row.map(value => LABELS[value] ?? value)),
 }
}
