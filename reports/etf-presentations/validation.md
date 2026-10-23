# Validation du 23 octobre 2026

| Contrôle exécuté | Résultat |
|---|---|
| `npm run build` | Réussi, y compris budgets de routes et couverture publiée. Les projections ont été régénérées. |
| `npm run lint` | Réussi ; avertissements préexistants hors de ce changement, aucune erreur. |
| `node scripts/test-etf-presentation-quality.mjs` | 258 fiches, couverture réconciliée, structure et mention finale, données de part/cotation, encours, garde-fous sur les collatéraux et années incomplètes. |
| `python3 -m unittest discover -s scripts -p test_ishares_metrics.py` | 5 tests réussis : comptage daté, absence non transformée en zéro, valeurs ou dates invalides refusées, absence ou donnée ancienne sans écrasement de la dernière observation. |
| `python3 -m unittest discover -s scripts -p test_etf_resilience.py` | 8 tests réussis. |
| `python3 -m unittest discover -s scripts -p test_presentation_etf.py` | 7 tests réussis. |
| `python3 -m unittest discover -s scripts -p test_issuer_refresh.py` | 15 tests réussis. |
| `python3 -m unittest discover -s scripts -p test_instrument_metadata.py` | 19 tests réussis. |
| `node scripts/test-presentation-etf.mjs` | Réussi : parts exactes, collecteurs actifs, historiques courts et cumuls distincts des années civiles. |
| `node scripts/test-etf-completeness.mjs` | Réussi : calcul annuel par part/cotation, conventions, périodes incomplètes et risques. |
| `npm run audit:etf-consistency` | 258 ISIN, aucune divergence de frais dans les consommateurs partagés. |
| `npm run audit:etf-annual-performance` | 258 fiches, 195 séries de six années complètes, aucune erreur. Les parts récentes ou les séries plus courtes ne sont pas complétées artificiellement. L’ancien test de comptage figé a été adapté au registre automatique. |
| `npm run audit:publishable-content` | 258 fiches ETF, aucune erreur ; cet audit structurel ne certifie pas les chiffres. |
| `npm run audit:data-catalog` | 1 571 fiches recherchables, 4 503 champs actifs ; provenance, consommateurs et export JSON contrôlés. |
| `npm run audit:instrument-listings` | 258 ISIN, 965 cotations documentées ; aucune erreur et régressions de preuves refusées. |
| `node scripts/playwright-etf-completeness.mjs` | Réussi sur mobile et ordinateur dans la Bibliothèque de données : recherche, identité exacte et devises distinctes. |
| `node scripts/playwright-etf-presentations.mjs` | Build servi par Vite preview. **258 sélections réelles, 258 aperçus et 258 copies comparées au moteur**. 10 familles sur ordinateur et mobile, **20 téléchargements PNG**, aucune erreur JavaScript, aucun débordement horizontal mobile. |

Le parcours utilise Chromium, 1 440 × 1 000 sur ordinateur et 390 × 844 sur mobile. Il exerce le sélecteur par ISIN, l’aperçu mobile, le vrai presse-papiers et le téléchargement. Il contrôle les identités et périmètres dessinés sur le canvas. Les familles comprennent World, émergents, blockchain, énergie, Quality, obligations longues, LifeStrategy, Brent, levier quotidien et covered call. Les [résultats détaillés](browser-results.json) identifient chaque fiche.

Le PNG blockchain et sa capture mobile ont aussi été inspectés visuellement. Le design existant est conservé. Une première recette a détecté un problème de lecture du domicile après séparation des caractéristiques ; il a été corrigé, le build et le parcours complet ont ensuite été relancés avec succès. Un premier script mobile tentait de capturer l’aperçu encore masqué par l’onglet Réglages : le test ouvre maintenant l’aperçu comme un utilisateur.

La collecte de revue a été menée avec les collecteurs existants sur tous les ISIN. Les erreurs et les champs non établis figurent dans `source-checks.json` et la matrice. Le succès d’un parseur ou d’un audit de code ne transforme pas une preuve secondaire en preuve officielle. Les champs sans confirmation complète restent bloqués. Aucun merge, déploiement, publication sur X ou envoi à des tiers n’a été réalisé.

Pour rejouer la recette : `npm ci`, `npx playwright install chromium`, `npm run build`, `npm run preview -- --port 4173`, puis `node scripts/playwright-etf-presentations.mjs` dans un autre terminal. Les artefacts PNG et captures sont écrits dans `/tmp/etf-presentation-browser` (variable `ETF_REVIEW_ARTIFACTS`). `node scripts/build-etf-presentation-review.mjs` reconstruit la matrice depuis les reçus conservés et les registres actifs ; il ne renouvelle pas les preuves réseau.
