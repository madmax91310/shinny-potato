# Interface et raccordements — 16 octobre 2026

1. Fiabilité : livré par #701, revérifié sans divergence de réplication. Les valeurs collectées restent distinctes des descriptions françaises ; les tests couvrent les libellés génériques et les sous-méthodes.
2. Sélection : deux modes Rechercher et Parcourir dans AssetPicker, avec recherche multiterme insensible aux accents (nom, indice, ticker, ISIN), familles et filtre PEA documenté. Favoris partagés par ISIN, migration des anciens favoris et huit actifs récents persistants. Les accès rapides montrent seulement les supports disponibles dans l'outil courant. Actifs & expositions utilise également ce sélecteur ; les actifs déjà ajoutés restent exclus et la limite de positions reste respectée. Les modes s'appliquent aussi aux pages qui utilisaient déjà AssetPicker (fiches ETF, calculateur et formats concernés). Les sélecteurs ChoicePicker des duels et du DCA avancé seront harmonisés au lot 3.
3. Lisibilité : harmoniser les sélecteurs restants, compacter les lignes sélectionnées avec Modifier, supprimer les doubles recherches, affichage progressif des longues listes et sauvegarde de la composition simple.
4. Rapidité : charger les historiques et fiches détaillées par actif, différer le code du DCA avancé, corriger les imports différés inefficaces et resserrer les budgets.
5. Raccordements : qualifier les historiques mensuels manquants, compléter les présentations et comparatifs et préciser les séries exactes ou proxys.
6. Expositions : compléter les références qualifiables, approfondir les fonds de fonds et adapter les graphiques aux poids signés et aux actifs hors classification.
7. Nouveaux actifs : expositions distinctes, sources renouvelables et automatisation qualifiée avant ajout.
8. Validation et livraison : tests de calcul, parcours mobile/ordinateur, exports, raccordements et poids ; vérification du déploiement pour chaque lot livré.

Validation du lot 2 : compilation avec budgets inchangés, audit du catalogue et tests de caractéristiques, sélection et expositions. Nouveau test navigateur sur le build de production : recherche/familles/PEA, ajout d'actifs, favoris inter-outils et suppression, récents après rechargement, absence d'erreur JS et largeur mobile. Contrôles exécutés sur 390 et 1440 pixels. Les nouveaux contrôles rejoignent deploy-pages.yml.
