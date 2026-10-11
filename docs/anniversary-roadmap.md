# « Il y a X ans » — extension

La V1 (PR #489) couvrait 21 actifs. Le premier lot de 9 actions (PR #491) porte ce total à 30. Cette extension ajoute les 9 actions restantes et 9 indices, soit 48 actifs disponibles en modes simple et comparatif.

## Raccordements

- Premier lot : Nvidia, Amazon, Alphabet, Meta, LVMH, Air Liquide, Netflix, Visa et Coca-Cola.
- Second lot : Costco, McDonald’s, Intel, PayPal, Schneider Electric, Hermès, L’Oréal, Nestlé et SAP.
- MSCI : Europe, USA, India, Emerging Markets hors Chine, World Momentum, World Quality et World Value. Séries officielles Net Return en USD, dividendes nets réinvestis ; historiques mensuels depuis janvier 2015.
- FTSE Russell : Russell 2000, Gross Total Return en USD, depuis janvier 2015 ; FTSE All-World, Gross Total Return en USD, depuis octobre 2024.

Les actions utilisent les cours de clôture ajustés des fractionnements, hors réinvestissement des dividendes. Les indices utilisent leurs niveaux réels en points. Les libellés, les textes et les images précisent la variante et la devise.

## Actualisation

- Actions : collecte mensuelle et reprise quotidienne des échecs par le workflow existant.
- Indices : collecte des mois complets et reprise quotidienne ; chaque série ne propose que les anniversaires réellement couverts.
- Niveaux actuels : dernière séance terminée pour les actions, les MSCI et le Russell 2000. Le FTSE All-World utilise la dernière clôture mensuelle officielle.
- Une erreur de source conserve les dernières données validées et fait échouer le rapport de collecte. Une observation périmée ne devient pas un niveau actuel automatique.

Le classeur officiel FTSE All-World contient une fenêtre de deux ans. Les mises à jour conservent les mois déjà collectés pour élargir progressivement l’historique, sans ETF de substitution ni reconstruction. En octobre 2026, les options disponibles sont 1 et 2 ans.

## Validation et publication

Les contrôles automatisés couvrent les identités, les devises, les variantes, les dates, les mois manquants, les régressions et la reproduction des niveaux à partir des réponses archivées. Les tests des textes parcourent le pool complet ; les tests navigateur exportent chaque actif et des comparatifs, avec vérification des unités, ratios et débordements.

La publication suit les contrôles de la PR et le workflow GitHub Pages. L’état effectif de fusion et de déploiement est indiqué dans GitHub.

## Suite facultative

Obtenir une source officielle plus profonde pour le FTSE All-World afin de proposer immédiatement des anniversaires au-delà de deux ans. L’extension demandée est raccordée ; cette amélioration dépend de la disponibilité de données supplémentaires.
