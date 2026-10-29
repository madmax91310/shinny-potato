# Corrections du Générateur — 29 octobre 2026

Base : master `0532114f3e8172e1c3a314f7bfa9a78bb3ddac84`. Reprise autorisée dans la conversation de contrôle du générateur ; aucune PR ouverte de ce lot au relevé initial. #1029 (enregistrement ETF) et #1030 (calendriers SCPI) sont indépendantes de ces fichiers.

## Comportement livré

- Le rapprochement manuel ne choisit plus le seuil numériquement le plus proche. Il exige six années communes complètes et consécutives, applique le plancher historique et les plafonds cumulés de construction existants, puis retient la première construction compatible. Sans qualification, aucun palier n'est attribué. Les fonds mixtes sans décomposition qualifiée dans ce moteur restent sans rapprochement.
- Un historique d'indice ne complète pas les années manquantes d'une part. Les performances existantes par part, leurs conversions et restrictions financières sont conservées. Le mode automatique et ses recettes ne changent pas.
- L'aperçu et les actions correspondent au mode actif. Pendant l'édition manuelle, l'ancien résultat et ses actions disparaissent jusqu'à la nouvelle génération. Le retour en automatique retrouve le dernier résultat automatique ; les modèles génèrent leur propre résultat.
- La saisie et le calcul partagent la tolérance de total 100 % déjà utilisée par le moteur (1e-6). Un total décimal valide n'est plus refusé par une égalité flottante stricte ; un total réellement invalide reste refusé.
- −100 % est une perte observée, conservée dans la fenêtre commune et la capitalisation. Elle n'autorise plus à sélectionner une autre période qui l'exclut. La sélection annuelle est partagée : les Duels sont aussi contrôlés.
- Les trois variantes de publication utilisent les accroches de composition existantes, avec performance en tête, noms/poids, rendements et thèse conservés. La phrase d'avertissement supplémentaire est remplacée par la seule mention demandée « Pas un conseil. ». La méthode complète reste dans l'application.
- Le pied de PNG passe de 18 à 27 px pour sa convention ; la mention demandée dispose de sa propre ligne à 27 px. Les graphiques, noms, échelles et valeurs sont conservés, avec une extension verticale de 40 unités de mise en page.

## Validation

Compilation et budgets inchangés, manifeste des 41 fichiers publics et certificats de couverture : réussis. Lint sans erreur ; avertissements préexistants hors fichiers modifiés.

Tests éditoriaux (641 supports), modèles (10 allocations), All Weather, rollover annuel, recettes (422 constructions, 13 203 combinaisons exhaustives et 2 790 générations), contrôles/verrouillages/remplacements et régressions ciblées : réussis. Stress : zéro violation sur 9 300 portefeuilles. Duels : 55 duels, 640 supports et 500 générations contrôlés.

Canvas Chromium : 820 exports contrôlés (limites, noms, poids, rendements, échelles, découpe, chevauchements), téléchargement et changement d'image mobile, panne de fond et réessai. Exports représentatifs examinés visuellement.

La validation CI, la fusion et la preuve du site effectivement servi restent distinctes de ces vérifications locales. Aucun correctif des collecteurs, règle de supervision ou incident financier historique n'est annoncé résolu par ce lot.
