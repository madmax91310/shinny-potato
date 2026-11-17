# Sept nouveaux budgets — 15 novembre 2026

Demande : retirer Hélène, 76 ans, revoir les sept autres personnages et leurs questions, puis intégrer et publier le lot. Aucun des 70 profils antérieurs n’est supprimé ou réécrit.

## Revue individuelle

| Profil | Ressources | Dépenses | Versements | Solde | Points vérifiés et corrections |
|---|---:|---:|---:|---:|---|
| Morgane | 2 400 € | 1 650 € | 500 € | 250 € | Activité indépendante : le revenu disponible est après frais professionnels et prélèvements, sans calcul fiscal inventé. 80 % des encaissements sur quatre mois ; les huit mois creux demandent 11 440 €, financés par 12 000 € de trésorerie, séparés des 6 000 € de sécurité. |
| Lison et Dorian | 2 350 € | 1 790 € | 300 € | 260 € | Garde de l’enfant ajoutée à l’enveloppe enfant : 90 → 180 €. Enfant de deux ans, garde organisée sur place pendant les saisons. Six mois sans salaire coûtent 12 540 €, versements compris, pour 14 000 € disponibles hors réserve de sécurité de 4 000 €. Travaux : 600 + 200 × 12 = 3 000 €, distincts de l’entretien courant du van. |
| Solène | 3 600 € | 2 050 € | 1 100 € | 450 € | Repas à bord pris en charge, achats à terre seuls comptés ; entretien automobile, assurances et santé explicités. Salle de bains : 6 000 + 350 × 12 = 10 200 €. PEE de 14 000 €, dont 10 000 € en actions de l’employeur ; disponibilité non inventée. |
| Delphine | 2 500 € | 2 230 € | 220 € | 50 € | Périmètre personnel en garde alternée ; dépenses annuelles lissées. Aucun revenu du conjoint, pension ou aide supplémentaire supposé. Sécurité : 1 200 + 150 × 32 = 6 000 €. Questions : 50 € sur un ETF ou plusieurs et dépenses après séparation. |
| Patrice | 3 200 € | 3 300 € | 0 € | −100 € | Dépenses qu’il finance, dont l’aide à ses trois enfants étudiants. Ferme à vendre : 180 000 € bruts, non disponibles et non ajoutés au revenu. Dettes et frais à déduire avant arbitrage. Aucun revenu SCPI espéré utilisé pour équilibrer le mois. |
| Noémie | 4 400 € | 2 600 € | 1 317 € | 483 € | Résidente belge travaillant au Luxembourg ; budget individuel. Carburant ajouté aux frais auto : 150 € de carburant, 60 € d’assurance et 50 € d’entretien, soit 260 € hors crédit. Titres-restaurant exclus des revenus disponibles et courses présentées après leur utilisation. Bonus annuel de 10 000 à 12 000 € exclu des ressources mensuelles. Aucun PEA français ni Livret A supposé ; 267 € de retraite non présentés comme un plafond fiscal actuel. |
| Cédric | 2 800 € | 1 000 € | 1 000 € | 800 € | Mois bas à 2 000 € : solde nul chez ses parents. Futur logement corrigé : retirer les 350 € de logement/repas puis ajouter loyer 800 €, énergie/internet 120 €, assurance 20 €, courses 250 € = 1 840 €. Avec les mêmes versements, le manque serait 840 €, pas 570 €. Installation : 6 000 + 600 × 10 = 12 000 €. |

## Éditorial et provenance

Chaque texte suit la progression du budget de François : personne, budget, patrimoine disponible, projet et hésitation, puis deux questions distinctes. Les questions sont éditoriales, même lorsqu’elles adaptent un dilemme de la source. Elles ne deviennent jamais une question prétendument reçue de ce personnage.

Les faits effectivement trouvés, identités et autres champs créés, hypothèses de budget, couverture des dépenses et scénarios sont enregistrés dans `editorial-profiles-2026-11-15.json`. Ce fichier n’est pas une photographie de comptes réels. Le panneau interne présente les faits conservés et les créations séparément ; il ne propose pas une fausse « Photographie source ». La réponse de source précise « Source d’inspiration ».

Les sources d’inspiration ont été consultées pendant la préparation du lot ; leur date de publication d’origine est conservée. Aucune source nouvelle n’est attribuée aux 70 profils précédents. Les sources et leurs limites n’apparaissent pas automatiquement dans le tweet ou l’image.

## Architecture et non-régression

Le lot est ajouté après la collection antérieure. Les exports `BUDGET_REFERENCE_PROFILES` et `BUDGET_REFERENCE_PUBLICATION_CONTEXT` conservent la portée des audits historiques datés : leurs 70 identités, photographies, chiffres et preuves restent contrôlés avec leurs fixtures originales. Les tests généraux et ceux des nouveaux budgets contrôlent la banque active complète de 77 profils. Aucun seuil de contrôle n’est abaissé et aucune fixture historique n’est réécrite pour faire entrer des personnages créés dans une ancienne photographie.

Le schéma de stockage, les clés, migrations, sauvegardes, dates et statuts ne changent pas. Les nouveaux profils passent par les mêmes textes, filtres, personnalisation, copie et génération PNG que les anciens.

## Validation

- Tests budget locaux réussis : calculs indépendants en centimes, pourcentages, trésorerie saisonnière, projets, logement futur, questions, absence de mentions interdites et sauvegardes avec statuts datés.
- Recette navigateur dédiée ajoutée au portail CI : sept profils à 1440/390/320, trois modes d’image, dimensions 4:5 sans secours long pour les nouveaux profils, chaque ligne et montant, absence de débordement et de chevauchement, copie exacte, provenance et personnalisation après rechargement.
- Les 63 PNG de cette recette et son inventaire sont conservés comme artefact CI pour inspection. Leur succès ne sera annoncé qu’après l’exécution réelle.
- La première préparation complète des entrées du build passe. Le build Vite local a été interrompu par l’environnement ; Chromium local refuse sa socket de processus et le navigateur partagé ne permettait pas le contrôle au moment du développement. Le portail GitHub complet et la vérification du résultat publié restent nécessaires avant de déclarer la livraison terminée.

Limites : personnages et compléments autorisés, pas témoignages reçus ; coûts de garde, dépenses, fiscalités implicites des revenus disponibles et conditions de logement créés ne sont pas des déclarations de leurs sources. La vente de Patrice et l’installation de Cédric restent futures. Les sources limitées n’autorisent pas à certifier des situations réelles actuelles.
