# Collecte des encours et renouvellement annuel

Les pages WisdomTree Gold, Bitcoin, Copper, Defence, Quantum et Dividend Growth sont raccordées aux encours datés. L’URL Bitcoin utilise la rubrique officielle digital-assets. Lorsqu’une page est accessible, sa photographie reste distincte du document PDF : les calendriers annuels de la part sont toujours récupérés dans la fiche courante, même si le HTML fonctionne. Le repli PDF conserve les derniers encours si l’accès HTML échoue.

CoinShares Bitcoin et Ethereum : le connecteur redécouvre les scripts publics et leur configuration de widgets à chaque collecte, vérifie les widgets d’identité et statistiques du même ISIN, puis utilise AUM USD et Rate Date. Les dates updated/stale du cache ne datent pas la valorisation. Les rendements crypto de référence des PDF ne remplacent pas la performance de la part. Ni identifiant privé ni clé payante n’est nécessaire.

La source BCE officielle EUR/USD quotidienne est collectée les 3 et 16 du mois avec le lot ETF. Le dernier taux de décembre de chaque année complète est vérifié : devise, unicité, années couvertes et proximité de fin d’année. Une erreur conserve le fichier validé précédent et est signalée par le workflow.

## Fenêtres actuelles

- Générateur : dernière période commune de six années calendaires complètes, pas antérieure à 2020 ; les calculs, pires/meilleures années, graphiques et tweets partagent ses clés annuelles.
- Duels : dernière période commune de trois à six années consécutives complètes. Les rendements en USD nécessitent aussi les deux taux BCE annuels de conversion vers EUR. Sans nouveau change ou rendement, la période précédente demeure disponible.
- Fiches ETF : les six dernières années autour du dernier millésime publié, avec des cases non disponibles pour les années absentes ; jamais d’extrapolation avant lancement.
- Comparatifs ETF/indices : dernière période commune publiée, avec les mêmes libellés annuels dans le tweet et l’image. Les conventions et devises restent propres à chaque série.
- Les registres d’observations conservent les anciennes années lorsque les nouveaux documents ne les republient plus. Les getters historiques et les photographies archivées restent à période fixe.
- Une série proxy ne se mélange pas aux premières années de la part récente. Le proxy documenté reste utilisé jusqu’à disponibilité d’une fenêtre réelle complète ; la référence ACWI peut se prolonger depuis sa part de référence qualifiée.

Les nouveaux millésimes ne nécessitent aucune modification de code. Les collecteurs ne réclament plus indéfiniment les années 2020–2025 lorsqu’elles quittent une fiche.

## Limites conservées

Les trois BNP (FR0011550185, FR0011550193, IE000QDFFK00) restent désactivés : le composant officiel Fundsheet, y compris les bundles sans paramètre de version, renvoie HTTP 502. Aucun document ancien n’a été raccordé comme source courante. Le point de roadmap concernant ces trois instruments n’est donc pas terminé.

Une indisponibilité HTML WisdomTree peut encore empêcher l’actualisation d’un encours : le PDF n’en publie pas. Les fonds euros, SCPI et autres séries manuelles gardent leur période vérifiée ; un portefeuille qui en contient ne bascule pas sur une année absente. Les sources défaillantes nécessitent une réparation lorsque leur format change. Les caractéristiques PEA, cotations et règles fiscales restent dans leurs registres de revue existants.

## Validation

Fixtures réduites de réponses officielles CoinShares, tables HTML WisdomTree et observations BCE datées ; contrôles des identités, dates de valorisation et devises. Le test de renouvellement simule 2027, vérifie les calculs et libellés 2021–2026, les comparaisons communes avec un actif en retard, la conservation des archives et le blocage d’un duel lorsque le change manque. Aucun rendement fictif n’est écrit dans la base.
