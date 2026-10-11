# Fiches pratiques

44 sujets définis dans `src/data/practical-sheet-topics.js`. Les fiches réutilisent les registres partagés ETF, cotations, PEA, indices, assurance-vie, paramètres fiscaux et taux du Livret A. Les comparatifs affichent la part exacte (ticker + ISIN), le périmètre d’encours et les dates individuelles. Les performances ne sont affichées que pour des années complètes communes, sur les parts exactes, en EUR, revenus réinvestis.

Les documents officiels complémentaires sont configurés dans `practical-sheet-sources.json`. `collect_practical_sheets.py --apply --output rapport.json` contrôle chaque source indépendamment (sections explicatives des pages de produits, sans les cours et encours quotidiens), extrait les identifiants exacts des supports et le tarif spécifique aux ETC du contrat confirmé. Il conserve l’observation précédente et sa date de contrôle quand la collecte échoue. Une absence dans une liste d’ETF ne prouve jamais qu’un ETC est inaccessible.

Le workflow `update-practical-sheets.yml` s’exécute quotidiennement à 09:15 UTC après intégration sur master. Chaque changement de document marque `reviewRequired` et bloque les exports des fiches concernées ; les autres fiches restent disponibles. Les réserves apparaissent dans Données à revoir et le rapport Actions. Pour lever une réserve : lire le document officiel, vérifier/modifier toutes les fiches qui citent cette source, puis mettre `reviewRequired` à false dans son observation. Le collecteur ne transforme pas un changement de texte en une nouvelle règle fiscale.

Vérification locale :

```
node scripts/test-practical-sheets.mjs
python -m unittest discover -s scripts -p test_practical_sheets.py
npm run audit:data-catalog
npm run audit:data-review
npm run build
```

Les simulations reposent sur des hypothèses affichées et modifiables ; elles ne prévoient pas les rendements. L’amortissement d’un changement d’ETF utilise un capital constant et exclut la fiscalité. Les explications restent des contenus éditoriaux revus humainement, distincts des valeurs numériques collectées.
