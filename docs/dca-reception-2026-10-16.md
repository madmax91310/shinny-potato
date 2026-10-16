# DCA et portefeuille : réception et entretien — 16 octobre 2026

Les deux parcours conservent leurs textes et visuels. Le catalogue régénéré inclut désormais 444 supports, dont 235 entrées actions issues des derniers ajouts communs.

## Modifications
- Quatre profils existants utilisent Walmart, Adobe, Deere et LVMH, sans changer leurs budgets, poids, nombre de lignes ni la répartition 50/50 des profils. Le commentaire de concentration reconnaît toutes les actions du catalogue.
- Une observation récente de principales positions prend priorité sur une composition complète plus ancienne ; elle reste explicitement partielle.
- Les compositions peuvent être rechargées après un échec réseau. Changer de supports efface les anciennes compositions pendant le chargement.
- Quatre compositions intégrales physiques DWS rejoignent les 69 iShares : S&P 500 Equal Weight, World Health Care, World Materials et World Utilities. Elles sont mises à jour par la collecte quotidienne existante, séparément des top 10 éditoriaux. Collecte réelle : 73/73, sans erreur.
- Identité exacte et réplication physique vérifiées. Fonds de fonds refusés ; pas de ventilation sous-jacente déduite. Le calcul conserve ses limites de dates, couverture et ISIN.

## Validation
Compilation, budgets et cinq suites DCA réussis ; tests des documents officiels et des listes complètes DWS réussis. Test navigateur complété avec interruption réseau et reprise ; son exécution est requise en CI avant fusion, Chromium ne s’installant pas localement.

L’extension ne signifie pas que tous les émetteurs ont une composition intégrale : les autres restent partiels. La réception publiée dépend du déploiement du commit fusionné.
