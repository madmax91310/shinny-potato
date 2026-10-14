# Fiabilité des données et des publications — 14 octobre 2026

Les collecteurs, validations de compositions et relevés 13F déjà intégrés ne sont pas dupliqués. Les audits locaux ont vérifié 197 ISIN pour les frais partagés, 156 fiches ETF, 40 compositions dans le comparateur et 18 présentations investisseurs.

## Écarts corrigés

- Un encours ou une composition courante consultés récemment pouvaient rester considérés comme actuels malgré une photographie ancienne. Leur échéance de revue est maintenant bornée par la date de valeur plus trois mois, conformément à la cadence existante. Les dates de valeur invalides/futures sont signalées ; les archives historiques et dates d’entrée en vigueur des frais restent distinctes.
- Un workflow globalement réussi mais contenant des erreurs de champs apparaissait en échec dans le bilan sans figurer dans le détail. Les deux vues appliquent désormais la même qualification. Une collecte sans date de fin valide ou datée dans le futur ne peut être verte.
- Certaines photographies d’indices affichaient « undefined » : leur libellé utilise désormais la date documentée, ou la clé de l’archive.
- Le calcul annualisé refuse les années discontinues, en cours et les rendements impossibles inférieurs à −100 %. Une perte totale reste −100 %. Les allocations vides, négatives, non numériques ou dont la somme diffère de 100 % ne produisent plus de performances numériques.
- Le PNG du générateur précise « Performances annuelles simulées », « hors courtage et fiscalité » et ne mentionne le change BCE que pour les rendements USD convertis. Texte et image réutilisent le même calcul.

## Validation

Tests de fraîcheur, dates, erreurs partielles, projections du catalogue, changement d’année, calculs et génération des portefeuilles ; audits ETF, indices, investisseurs et contenu ; compilation et budgets. Les tests navigateur existants contrôlent les échecs partiels et les conventions sur tous les exports du générateur, avec détection des textes coupés et chevauchements. Ils sont exécutés sur GitHub avant fusion : le téléchargement Chromium local est indisponible.

Cette revue ne certifie pas les chiffres non publiés par les sources. Les réserves existantes restent qualifiées, et les dernières données fiables gardent leur date.
