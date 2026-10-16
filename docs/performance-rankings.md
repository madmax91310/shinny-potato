# Qui a vraiment gagné ?

Route : `/classements-performances`. Outil ponctuel visible sur l’accueil et dans Comparer et simuler.

## Fonctionnement livré

- Quinze catégories définies par référence aux actifs partagés, sans duplication des prix : marchés mondiaux et européens, facteurs, secteurs européens et mondiaux, thématiques USD et EUR, dividendes, obligations, Small Cap Value, LifeStrategy, actions américaines et françaises, cryptomonnaies et matières premières via ETC.
- De deux à six actifs, présélections et recherche/parcours manuel. Les noms courts du visuel renvoient à des produits précis, identifiés dans les détails par leur nom complet, ISIN et cotation lorsqu’ils sont disponibles. Un ETF n’est pas présenté comme un indice.
- Une année civile, une grille de dix années maximum ou une période libre entre deux clôtures mensuelles. Rendement cumulé par défaut ; annualisation facultative sur la période libre.
- Texte modifiable, aperçu et export PNG issus du même résultat. Une modification de paramètres remplace un ancien brouillon pour éviter de publier un texte correspondant à un autre calcul.
- Fréquence de première place sur toutes les fenêtres communes de 12, 36, 60 ou 120 mois, avec nombre de fenêtres, bornes et avertissement sur leur chevauchement. Deux fenêtres au minimum. Toutes les premières places ex æquo sont comptées.
- Mises à jour héritées des collectes existantes : les dates, années disponibles et fenêtres glissantes sont dérivées des observations actives à chaque construction du site. Aucun nouveau collecteur ni prix saisi à la main.

## Règles de calcul

Une année Y exige décembre Y−1 et décembre Y. Les valeurs sont des rendements de clôture à clôture, sans interpolation, extrapolation, remplissage de mois manquants ni substitution d’un autre actif.

Une sélection doit partager devise et convention : cours ajustés avec revenus réinvestis, indices Net Return, indices Gross Return ou crypto au comptant. Les moyennes mensuelles d’or, le CAC 40 hors dividendes et les prix de futures non comparables sont exclus du sélecteur. Les ETC de matières premières restent identifiés comme produits dérivés des prix de leurs contrats, pas comme cours spot.

La devise est celle de la série réellement utilisée ; aucune conversion mensuelle n’est simulée. Les cours des ETF incluent les frais du fonds. Frais du courtier et fiscalité exclus. Les indicateurs décrivent les historiques sélectionnés, sans prédire de performance.

## Validation

- `node scripts/test-performance-rankings.mjs` : toutes les années complètes de toutes les catégories, bornes exactes, devise/convention, séries discontinues, annualisation, égalités, fenêtres glissantes et propagation d’un nouveau mois.
- `node scripts/playwright-performance-rankings.mjs` : catégories, temporalités, saisie manuelle, invalidation, export PNG et interfaces ordinateur/mobile. Intégré aux vérifications navigateur du déploiement.
- Compilation et budgets de chargement : route chargée à la demande ; les historiques ne sont pas ajoutés au chargement initial de l’accueil.

## Roadmap restante

1. **Plus de profondeur** : compléter les clôtures antérieures au premier mois des séries existantes, puis étendre les historiques exacts vers 15–20 ans. Raccorder les calendriers annuels officiels sans série mensuelle, dans un mode annuel explicitement distinct des cotations.
2. **Grandes régions et indices mondiaux** : harmoniser les variantes de dividendes et raccorder les historiques exacts World/ACWI/All-World, Japon et émergents. Aucun mélange de NR/GR ou proxy implicite.
3. **EUR/USD pour les périodes libres** : collecter les changes de fin de mois, avec tests des bornes ; distinguer conversion en euros et couverture de change.
4. **Confrontations entre classes d’actifs** : actions, or, obligations et Bitcoin après raccordement de clôtures comparables et d’une devise commune.
5. **Allocations personnalisées** : portefeuilles pondérés avec règle explicite de rééquilibrage, puis comparaison entre allocations. Les LifeStrategy actuels restent des ETF réels.
6. **Confort éditorial** : sauvegarde de sélections et variantes de visuels, historique des sujets déjà générés et liens depuis les autres outils.
