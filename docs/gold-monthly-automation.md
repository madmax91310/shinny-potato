# Actualisation mensuelle de l’or

La série active est `src/data/worldbank-gold-monthly.json`, importée par le registre
commun et sa provenance. Les 141 valeurs initiales de janvier 2015 à septembre 2026
sont identiques à la capture manuelle du 3 octobre. Le fichier source complet est
validé à chaque exécution ; les corrections mineures du fournisseur sont conservées,
sans raccord avec une autre source.

## Source et droits

- Catalogue précis : https://datacatalog.worldbank.org/search/dataset/0038238/commodity-prices-history-and-projections
- Licence du jeu : CC BY 4.0, avec les conditions additionnelles Banque mondiale.
- Conditions : https://www.worldbank.org/ext/en/legal/terms-conditions/datasets
- Téléchargement officiel : https://www.worldbank.org/en/research/commodity-markets

Le fichier est découvert sur la page officielle, pour supporter les changements
d’identifiant du document sans deviner une URL. Seuls des liens HTTPS vers le classeur
mensuel de `thedocs.worldbank.org` sont acceptés. Aucun compte ni clé API.

La mesure est la moyenne mensuelle en USD par once troy, pas une clôture ni le rendement
d’un ETF or. Le fournisseur indique un passage du London afternoon fixing aux cours
spot moyens en juin 2025. La description et les fournisseurs exacts sont conservés
dans le JSON ; une nouvelle modification de méthode bloque l’actualisation jusqu’à
revue. Ce comportement ne retire aucune donnée active.

Les tweets, PNG et vidéos concernés portent le crédit Banque mondiale/Pink Sheet,
la licence et l’indication des calculs. Les publications sans or restent identiques.

## Exécution

`update-gold-monthly.yml` s’exécute du 3 au 10 de chaque mois à 07:15 UTC, après la
publication normalement prévue le deuxième jour ouvré. Il peut aussi être lancé
manuellement. Les PR testent une collecte réelle, sans pousser de commit.

Les validations portent sur l’identité du classeur, l’unité, la date de publication,
les nombres, chaque mois depuis janvier 2015, les doublons et l’absence de régression.
Une révision historique supérieure à 10 % ou un changement de méthode bloque la
mise à jour. Un fichier identique n’entraîne aucun commit, aucune modification de
date de contrôle, aucun déploiement. Une publication encore en retard conserve les
derniers mois disponibles et l’indique dans les logs.

Une nouvelle capture validée est écrite atomiquement, auditée, puis commitée. Un
push concurrent provoque un rebase et un nouvel audit, jamais un push forcé. Le
workflow Pages valide et publie le commit exact seulement si la capture change.
La borne générale des outils suit les données ; chaque calcul reste borné au dernier
mois réellement disponible pour son actif.

Le service de données et les dépendances sont gratuits. Les exécutions utilisent
les quotas GitHub Actions existants, sans achat ni nouveau réglage de facturation.

## Contrôles

```bash
pip install -r scripts/requirements-gold.txt
python -m unittest discover -s scripts -p 'test_gold_monthly.py'
python scripts/update_gold_monthly.py
node scripts/audit-calculator-series.mjs
node scripts/test-gold-consumers.mjs
```

Les tests synthétiques couvrent les nouveaux mois, corrections, données manquantes,
doublons, unités erronées et conservation de l’existant en cas d’échec. Un test dans
une copie temporaire vérifie que le prochain mois atteint les consommateurs et leur
provenance, sans modifier les fichiers actifs.
