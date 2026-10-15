# Automatisation et raccordements ETF — 15 octobre 2026

Après intégration des chantiers parallèles, le catalogue contient 209 instruments, pas 202. Une collecte passée ne certifie pas la fraîcheur présente. Les compteurs distinguent les champs applicables, non publiés, en attente et non résolus. Les alertes opérationnelles existantes restent la référence pour les pannes.

## Livré

- Santé Xtrackers IE00BM67HK77 et Amundi New Energy FR0010524777 : raccordement au générateur avec six années exactes, texte dédié, classification sectorielle et plafonds existants. Huit constructions supplémentaires ; 355 au total après intégration des autres chantiers.
- Tableau de couverture de tous les instruments dans le suivi ETF de la Bibliothèque de données, recherche par nom/ISIN et filtre des lacunes. Le suivi des 35 références reste disponible.
- Calendriers émetteurs et observations glissantes distingués des rendements calculés sur cotations exactes. Les calculs utilisent des cours ajustés et exigent décembre précédent et les douze mois de l’année close, une identité de cotation et les sources. Aucun cours brut, mois absent, année en cours ni conversion implicite.
- 71 cotations ont un calendrier calculable. Cela fournit notamment des performances annuelles pour Avantis Small Cap Value (EUR), Global X Copper Miners (EUR) et Silver Miners (USD), sans remplacer leur calendrier NAV émetteur absent. 193 calendriers émetteurs, 196 instruments avec au moins une des deux formes de calendrier. Les séries récentes restent courtes.
- Projection recalculée à chaque build/publication depuis les données communes : pas de copie manuelle des rendements.

## Sources vérifiées réellement

Les sept collectes WisdomTree et trois BNP configurées ont réussi sans collectionErrors lors du contrôle du 15 octobre. Encours WisdomTree au 14 octobre, BNP au 30 septembre. Les mécanismes de secours et la conservation des dernières valeurs existent déjà ; aucun assouplissement des validations n’est nécessaire pour ces réponses.

La page QYLD exacte a été relue. Elle donne deux poids différents pour AAPL, AMZN, GOOG, GOOGL, META, MSFT, NVDA et TSLA dans sa section des principales positions. Les performances de la part distribuante et la composition économique complète restent non qualifiées. Ne pas utiliser le panier de substitution ou une autre part pour combler ces absences.

## Limites et roadmap

1. QYLD : qualifier une source officielle distincte pour la part IE00BM8R0J59, ses performances total return et la composition de l’indice économique exact ; débloquer seulement après réconciliation.
2. LifeStrategy : trouver une ventilation complète ou qualifier un calcul traversant tous les fonds sous-jacents. Les ventilations de la seule poche actions ne couvrent pas le fonds entier.
3. Avantis : obtenir les pays complets ; Silver Miners : obtenir une classification sectorielle publiée. Conserver les champs manquants tant que les sources restent partielles.
4. Parts récentes : le contrôle quotidien existant attend neuf premiers calendriers en 2027 au plus tôt et trois en 2028. Aucun objectif artificiel de 206 calendriers aujourd’hui.
5. Générateur : Communication iShares, Clean Energy L&G et Avantis restent exclus du moteur à six années. Ils sont déjà exploitables dans d’autres outils avec leurs historiques réels ; l’adaptation à des fenêtres communes plus courtes doit être un chantier distinct.
6. Nouveaux actifs : sélectionner seulement les expositions absentes du catalogue et qualifiables, après ces limites ; aucun doublon proposé comme nouveauté.

## Validation

Tests des calculs annuels (mois manquant, doublon, cours brut, année incomplète, identité absente, devise), comptes applicables, classification de risque, 11 347 combinaisons et 2 790 générations déterministes, verrouillage/remplacements et build avec budgets. Test navigateur mobile/ordinateur ajouté à la CI : lancement Chromium local bloqué par socket Operation not permitted.

## Intégration des autres chantiers

Les trois nouveaux instruments et le vérificateur d’exposition de master sont conservés, ainsi que le cinquième groupe du catalogue et les liens vers les outils raccordés. Le suivi est recalculé sur les 209 instruments. Les limites non publiées restent inchangées.
