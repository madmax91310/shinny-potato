# Qui a vraiment gagné ?

Route : `/classements-performances`. Accès depuis l’accueil et Comparer et simuler.

## Fonctionnement livré

- 22 catégories, de 2 à 6 actifs ou portefeuilles. Recherche manuelle dans les historiques mensuels ou les calendriers annuels officiels, en banques distinctes.
- Année civile, grille de dix années maximum, ou période libre entre deux clôtures mensuelles. Rendement cumulé ou annualisé. Les calendriers annuels exigent décembre à décembre et toutes les années intermédiaires.
- Texte éditable et PNG issus du même calcul. Fréquences de première place sur fenêtres de 12, 36, 60 ou 120 mois lorsque des cotations mensuelles existent.
- 23 extensions mensuelles validées : plusieurs indices et actions couvrent décembre 2005 à septembre 2026, soit vingt années civiles complètes. L’historique d’un fonds exact commence après sa cotation effective ; aucun prix d’indice n’est ajouté avant sa création. Meta commence après son introduction.
- 165 parts avec calendriers NAV officiels, dont 14 éligibles PEA. Les projections sont reconstruites avant chaque build depuis les sources partagées. Les années partielles et rendements glissants ne deviennent jamais des années civiles.
- Régions en MSCI Net Return cohérent (World, USA, Europe, Japon, émergents), World/ACWI sur vingt ans, World/ACWI/IMI, et World/ACWI/FTSE All-World en Gross Return. Les variantes nettes et brutes ne sont pas mélangées.
- Devise d’origine, EUR ou USD, via les références BCE mensuelles depuis janvier 1999. Conversion disponible aussi pour les calendriers annuels sur leurs bornes de décembre. Conversion sans couverture de change ; absence de change = erreur explicite.
- Comparaison actions/or/obligations/Bitcoin en devise commune. L’or est un ETC précis, distinct de la moyenne mensuelle historique non comparable.
- De deux à six allocations personnalisées, chacune de une à six lignes ; poids positifs totalisant exactement 100 %. Sans flux, rééquilibrage absent, en décembre, ou à chaque clôture mensuelle. Une grille annuelle garde la dérive des poids depuis son début. Chaque fenêtre glissante repart des poids cibles.

## Sources et limites de couverture

`collect_ranking_sources.py` reprend les validations quotidiennes/mensuelles de `refresh_monthly_history.py` : identité du titre, devise, ajustement, fréquence, concordance des clôtures et absence de trous. Les réponses validées ont leurs preuves et empreintes dans `scripts/source-snapshots/ranking-histories.json`. Une collecte ne peut raccourcir la couverture ni changer une convention. Une source échouée conserve ses données antérieures.

L’ETF corporate euro a une divergence fournisseur en décembre 2010 : cette observation n’est pas publiée ; la série validée commence en janvier 2011. Les autres fonds gardent leurs dates réelles. Le FTSE All-World officiel dispose ici de cinq années civiles 2021–2025 et d’une série mensuelle plus courte (octobre 2024–septembre 2026) ; on ne reconstitue pas vingt ans à partir d’un proxy. Les indices peuvent intégrer des périodes rétropolées avant leur lancement, explicitement signalées dans la méthode.

Le collecteur vérifie l’enveloppe XML BCE, les observations dupliquées/futures, les taux positifs, la continuité des mois et la proximité de la dernière observation avec la clôture. Aucune interpolation. Les cotations des fonds incluent leurs frais ; courtage, coûts de rééquilibrage et fiscalité ne sont pas simulés. Les performances passées ne sont pas des probabilités futures.

## Actualisation et validation

La collecte est raccordée au workflow mensuel les 2, 4, 8 et 16, avec reprises quotidiennes des sources échouées ou en retard. Les projections annuelles sont régénérées avant `dev` et `build`. Les fichiers actifs, preuves et états sont publiés par la procédure existante de commit des données validées.

- `python -m unittest discover -s scripts -p test_ranking_sources.py` : change BCE, mois complets, taux invalides, doublons, identité et régression.
- `node scripts/test-performance-rankings.mjs` : toutes les années des catégories, change exact, conventions net/brut, calendriers NAV, poids et rééquilibrage, dérive sur plusieurs années, fenêtres glissantes.
- `node scripts/playwright-performance-rankings.mjs` : sélection, calendriers, conversions, allocations, erreurs de poids, PNG et vues ordinateur/mobile.
- Build et budgets : accueil toujours sous 300 kB JS, route chargée à la demande. Budget total de la route relevé à 1,85 Mo pour les séries longues, calendriers et changes ; chaque fichier reste sous 500 kB.

## Roadmap suivante

1. Approfondir FTSE uniquement si une source officielle complète permet de qualifier davantage d’années et de clôtures mensuelles.
2. Sauvegarder les sélections et les allocations réutilisées, avec leur règle de rééquilibrage.
3. Ajouter des variantes de visuels et un historique des sujets déjà publiés.
