# Fiabilité des données réelles — 3 octobre 2026

Périmètre : usage personnel, sans chantier commercial ni conversion de devises. Aucun support, historique annuel ou format de tweet supprimé.

## Corrections

- **Pouvoir d’achat** : les taux annuels décrivent désormais exclusivement les années achevées, jusqu’à 2025. L’arrivée utilise les indices INSEE définitifs d’août 2026, base 100 = moyenne 2025 : ensemble 103,35 ; alimentation 101,69 ; énergie 115,60. L’historique est composé jusqu’à la moyenne 2025 puis raccordé par `indice / 100`. Les anciens glissements annuels de juillet (1 % alimentaire, 12,6 % énergie) ne servent plus de variation depuis la moyenne 2025. La valeur générale 2026 de 1 % n’avait pas de justification pour une moyenne annuelle inachevée et a été remplacée par cette observation séparée.
- **Inflation du calculateur / repères Tweet Midi** : variations mensuelles INSEE publiées de janvier 2017 à septembre 2026, au lieu d’une moyenne annuelle répartie sur douze mois. Les taux publiés sont arrondis au dixième ; septembre est provisoire, consigné dans la capture. L’approximation historique par moyenne annuelle reste utilisée en 2015–2016, sans suppression de période. Un futur mois sans observation échoue au contrôle au lieu de produire une inflation de zéro implicitement.
- **Livret A** : taux réglementaires datés depuis janvier 2015, intérêt simple pendant l’année puis capitalisation en décembre. Convention explicite : versements en fin de mois, rémunération à partir du mois suivant, deux quinzaines par mois complet ; valeur incluant les intérêts courus. Simulation sans retraits ni plafond, pas une reproduction de n’importe quel relevé bancaire. Les taux moyens arrondis et la capitalisation mensuelle artificielle ont été remplacés.
- **Or** : ajout de septembre 2026 à 4 319 USD/once, moyenne mensuelle spot Banque mondiale. Les 140 points antérieurs sont strictement identiques au nouveau classeur. Recoupement indépendant dans le PDF Pink Sheet d’octobre, ligne Gold, page 2. Aucune clôture de fin de mois substituée à une moyenne.
- **Textes et PNG** : les mentions génériques d’année estimée du pouvoir d’achat cèdent la place à une date d’observation courte. L’IRL conserve son propre repère T2 2026 et indique le trimestre de départ. Les libellés alimentation/IPC ont été corrigés (regroupement conjoncturel alimentation ; IPC général tabac inclus). Correction de l’arrondi monétaire au demi-euro après calcul flottant.

## Sources conservées

- INSEE résultats définitifs août : https://www.insee.fr/fr/statistiques/9051406
- INSEE septembre et tableau mensuel depuis 2017 : https://www.insee.fr/fr/statistiques/9056956
- Banque de France, règles du Livret A : https://www.banque-france.fr/fr/a-votre-service/particuliers/connaitre-pratiques-bancaires-assurance/epargne/livret-a
- Rapports Banque de France 2015, 2018, 2020, 2022 et 2025 : liens individuels dans `market-history.js`.
- Banque mondiale, classeur mis à jour le 2 octobre : https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx
- Banque mondiale, recoupement PDF : https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Pink-Sheet-October-2026.pdf

Les captures JSON portent les valeurs, dates, périmètres et empreintes des fichiers Banque mondiale. L’ancien relevé de septembre reste archivé.

## Données conservées après contrôle de cohérence

La revue des 48 fiches ETF du 2 octobre et ses preuves restent la référence pour encours, positions, caractéristiques et performances. Les contrôles croisés des registres passent ; aucune nouvelle certification externe de chaque valeur n’est prétendue ici. Les encours de fonds et de parts restent distincts. Les historiques d’indice et proxies documentés ne deviennent pas des rendements de fonds.

Les neuf réserves courtiers et les archives non recertifiées restent ouvertes dans le suivi interne : aucune nouvelle preuve ne permet de les transformer en affirmations. L’IRL 148,37 (T2 2026) et le SMIC 1 867,02 euros (juin 2026) sont corroborés par les publications INSEE et le texte officiel, sans changement de valeur. Cette livraison ne supprime pas les limites de provenance déjà documentées.

## Validation

- 19 commandes d’audit de données, vérifications exhaustives Tweet Midi et fiches d’indices.
- Tests numériques : raccord des indices, taux changeant en février/août, DCA, capitalisation de décembre, baisse mensuelle des prix, couverture des 64 combinaisons année/poste et exclusion d’une fausse moyenne annuelle 2026.
- Tests calculateur : 141 mois d’or contre la capture, calcul des quantités et comparatifs vidéo ; cas de source arrêtée en août conservé comme fixture pour tester l’absence d’extrapolation.
- Build de production et limites des bundles ; tests réels Chromium des 17 outils, avec vérification du nouveau point d’or et génération de trois tweets/PNG de pouvoir d’achat.

Travail préparé sur branche dédiée ; déploiement séparé.
