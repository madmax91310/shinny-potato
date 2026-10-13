# Roadmap actifs : priorités 3 et 4

- Construction et matériaux européens : iShares DE000A0H08F7, indice exact STOXX Europe 600 Construction & Materials (Capped) TR. Nouvelle fiche, comparaison aux infrastructures mondiales, sélection et recette du générateur, duel dédié.
- Small caps émergentes : part distribuante IE00B3F81G20. Série IEMS à Londres en USD depuis janvier 2012.
- Mines de cuivre : part capitalisante IE0003Z9E2Y3. Série COPX à Milan en EUR depuis mars 2022, premier mois complet de cette cotation.
- Construction : série EXV8 à Xetra en EUR depuis janvier 2010.

Les trois séries arrivent dans Et si tu avais investi, Performance depuis et Il y a X ans. Les deux premiers utilisent les cours ajustés (distributions/divisions) ; Il y a X ans garde les cours non ajustés. Les clôtures quotidiennes sont actualisées par le workflow anniversaire existant. Les historiques utilisent le workflow mensuel existant avec reprise quotidienne des erreurs. Le connecteur officiel des expositions qualifiées actualise chaque jour la nouvelle fiche et la preuve de cotation émergente.

Les duels utilisent des années complètes communes, au minimum trois : les mines de cuivre n'ont que 2023–2025 à ce jour. Leur calendrier est dérivé automatiquement des cours ajustés mensuels et conserve la devise EUR et la mention « rendements de marché », distincte des tableaux NAV USD de Global X. Le petit fichier de calendrier est reconstruit avant le build et avant les contrôles du workflow mensuel ; il évite de charger toute la base mensuelle dans le duel.

## Qualification de la source émergente

La cotation EUNI à Xetra échoue au contrôle de fraîcheur de décembre 2025. La cotation officielle IEMS à Londres est utilisée à sa place, dans sa devise USD, sans conversion arbitraire.

Deux bougies mensuelles anciennes de Yahoo (mars 2013 et août 2015) diffèrent des dernières séances quotidiennes. Les fenêtres quotidiennes indépendantes de fin de mois recoupent la date, le cours brut et le cours ajusté. Les bougies rejetées et les URLs des fenêtres sont conservées dans les preuves.

Décembre 2025 n'a aucune cotation Yahoo après le 24 décembre. Cette séance est explicitement enregistrée comme séance cotée clairsemée ; le contrôle exige la date exacte, une bougie mensuelle concordante, une fenêtre quotidienne indépendante concordante, et un écart à la fin de mois d'au plus dix jours. Aucune extension globale du seuil de fraîcheur, interpolation ou substitution par l'indice. Un changement de date, cours, devise ou identité rejette la collecte et conserve la dernière version valide.

Les fenêtres Yahoo peuvent différer de quelques millionièmes sur les cours ajustés flottants. La comparaison applique une tolérance relative de 1e-7 et absolue de 1e-6, tout en exigeant la même date et en contrôlant les deux cours. Des régressions vérifient le rejet des divergences réelles, des dates non autorisées et des calendriers incomplets.
