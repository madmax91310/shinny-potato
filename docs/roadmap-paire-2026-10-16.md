# Roadmap paire — lot préparé le 16 octobre 2026

Statut : implémenté et vérifié localement. Publication du code et des données sur le dépôt public madmax91310/shinny-potato autorisée le 16 octobre 2026 ; fusion et déploiement à confirmer par les contrôles GitHub.

## 2. DCA, portefeuille et recouvrement

- 440 supports uniques par ISIN, 50 positions maximum ; 100 profils préparés conservés.
- 404 supports disposent individuellement d’une couverture géographique et sectorielle suffisante. Ce nombre ne garantit pas la compatibilité des méthodes entre tous les supports.
- 80 compositions complètes : 69 iShares, 10 DWS et 1 SSGA.
- Analyse des détentions directes et indirectes par ISIN, concentration top 5/top 10, recherche des titres, contributions des supports et recouvrements par paire.
- Analyse de l’allocation actuelle, des versements mensuels et de l’allocation après versements à prix constants ; comparaison de deux allocations avec contrôle des méthodes et des dates.
- Page de présentation, carte d’accueil et panneau d’analyse retravaillés ; nouveau visuel exportable du recouvrement, avec identité facultative, dates et couverture explicites. Les formats DCA précédents sont conservés.
- Migration des quatre anciens identifiants de titres vers leurs identifiants canoniques lors de la restauration des sauvegardes.

Limites : 36 supports restent partiellement couverts ou non couverts sur au moins une ventilation. Les ADR TSMC et AstraZeneca ne sont pas assimilés aux actions locales. Les données partielles ne deviennent jamais une composition exhaustive ; les méthodes incompatibles restent séparées. LifeStrategy affiche sa ventilation publiée par classe d’actifs, sans prétendre disposer d’une analyse intégrale de ses sous-fonds.

## 4. Les trois outils historiques

20 nouveaux historiques mensuels automatiques : Home Depot, Lowe’s, Starbucks, Colgate-Palmolive, Mondelez, Stryker, Union Pacific, Lockheed Martin, Republic Services, ADP, Analog Devices, Newmont, Eaton, Trane, Regeneron, Vertex, Zoetis, MSCI, FactSet et Cadence.

Le lot porte à 89 les historiques actions de cette collecte raccordés aux trois outils. Les 20 collectes mensuelles et les 20 cotations ont réussi. Les contrôles vérifient les devises, la distinction entre prix d’anniversaire et séries ajustées ainsi que les dates réellement disponibles. Aucun anniversaire antérieur à la série n’est créé artificiellement.

## 6. Automatisation et surveillance

- Collecte des compositions complètes étendue à DWS et SSGA, avec vérification de la part et de la méthode de réplication.
- Refus des compositions incohérentes, incomplètes ou contenant des poids invalides ; aucune assimilation d’un fonds de fonds à une liste exhaustive de titres.
- État des collectes enregistré ; conservation de la dernière donnée datée en cas d’échec.
- Chargement des compositions par fichiers séparés, avec nouvelle tentative fonctionnelle après échec réseau.
- Audit des raccordements ajouté à la CI et rapport dans `portfolio-routing-status.json`.

## Vérification et suite

Tests DCA, calculs de recouvrement, 89 séries historiques et huit tests Python réussis. Les 420 rendus/parcours DCA et le nouveau parcours navigateur d’analyse ont réussi. Compilation avec budgets des routes validée ; lint sans erreur, deux avertissements préexistants.

Prochaine étape : fusion et déploiement autorisés vers le dépôt public, puis réception sur l’URL publiée. Poursuivre ensuite la qualification des 36 supports incomplets et la ventilation intégrale des fonds multi-actifs. Les catégories 1, 3 et 5 restent des lots distincts : générateur, investisseurs 13F, nouveaux ETF.
