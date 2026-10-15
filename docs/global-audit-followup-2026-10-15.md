# Suite de l’audit global — 15 octobre 2026

Périmètre demandé : axes 1 à 7. L’axe 8 (sauvegarde/synchronisation) et l’analyse entreprise sont exclus. Les noms des ETF restent strictement identiques aux noms du catalogue, en anglais lorsqu’ils y sont en anglais. Les visuels, structures des tweets et pondérations automatiques des profils restent conservés.

## Livraison

| Axe | Changements | Limites explicites |
| --- | --- | --- |
| 1. Calculs communs | Taux annuels effectifs, frais proportionnels et versements en fin de mois partagés par Impact des frais et Patrimoine. | Projections déterministes, sans prévision de marché. Les anciens résultats d’Impact des frais changent du fait de la convention corrigée. |
| 2. Français et variété | Domiciliation, réplication, pays et secteurs traduits ; observations de concentration précisent la première position ; exemples pédagogiques et métriques spécialisées disponibles. | Aucun nom de produit traduit. Les métriques dépendent des données qualifiées disponibles. |
| 3. Chargement | Projections de données dérivées à la construction, tables spécialisées séparées, export PNG ETF chargé à la demande. | Fiches ETF : environ 1,21 Mo de JavaScript initial contre 2,13 Mo ; environ 267 ko compressés contre 459 ko. Les budgets existants ne sont pas relevés. |
| 4. Expositions | Pays/secteurs pondérés dans Générateur et Duels, avec couverture du portefeuille, dates, périmètres fonds/indice et sources. | Pas de renormalisation des positions absentes ni de fausse reconstitution historique ; photographies incompatibles séparées. Pas d’inférence des entreprises détenues en commun. |
| 5. Réserves | Nouvelle vérification des collectes officielles courtiers et assurance-vie ; accès et clauses restent distincts. | Sept courtiers revalidés ; Bourse Direct conservé en réserve après erreurs HTTP 502. Six contrats courants relus, ancienne version Avenir 2 remplacée par Avenir 2 Plus dans la collecte. Pas de levée des réserves contractuelles ni de nouvelle valeur appliquée sans preuve. |
| 6. Revue | Vérifications regroupées par entité, catégorie et ensemble de sources ; tri par urgence puis nombre d’outils concernés ; actions précises et accès à tous les champs. | Les lignes individuelles et leur historique restent accessibles. |
| 7. Interface | Première grappe Unicode complète pour les icônes ; suppression d’un nombre d’indices figé ; contrôles mobile. | Aucun ajout de synchronisation. |

## Améliorations par famille

- ETF et comparatifs : duration, rendement actuariel, distributions ou PER selon les observations qualifiées, datées et accompagnées d’une interprétation adaptée.
- Historique : fenêtres mensuelles glissantes de 1, 3, 5 ou 10 ans ; minimum/maximum annualisé et baisse depuis un sommet mensuel ; points manquants jamais interpolés. Calculateur et formats de marché partagent le composant. Ces fenêtres se chevauchent et ne sont pas des probabilités.
- Fiches pratiques : exemples explicitement fictifs pour les risques, frais et interprétations de données.
- Investisseurs : lecture des archives trimestrielles produites par le collecteur existant, avec vérification du gestionnaire et de la période. En l’absence de plusieurs trimestres disponibles, l’interface l’indique ; aucune trajectoire inventée.
- Radar : libellés pays/secteurs français, angle interprétable avant/après, ordre de priorité facultatif pour frais/conditions/sujets économiques.
- Patrimoine : base fiscale initiale facultative et capacité future de versement saisie par poche. L’excédent reste en espèces. La capacité n’est pas reconstituée après retrait ; les plafonds communs doivent être répartis par l’utilisateur entre poches. Ce n’est pas un moteur juridique automatique PEA/PEL/assurance-vie.
- Assurance-vie/SCPI : conservation des détails de frais, conditions et liquidité déjà sourcés ; les réserves sont rendues plus faciles à examiner par le regroupement des contrôles.

## Validation

`test-global-audit.mjs` contrôle la cohérence entre simulateurs, la base fiscale, la capacité restante, les graphèmes, les noms des 167 ETF, les fenêtres mensuelles et les périmètres des expositions. Son mode navigateur couvre les deux outils de portefeuille, les historiques, les regroupements de revue, les archives et cinq pages mobiles. Ajout aux contrôles CI.

Les contrôles existants de frais (2 880 variantes), patrimoine, données, projections de registres, compositions, fiches et exports sont conservés. Les contrôles Chromium de revue, radar et patrimoine passent. Le build respecte les budgets initiaux.
